import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash, randomUUID } from 'crypto';
import { CpPdfService } from './cp-pdf.service';
import { CpDocumentV2 } from './control-plan-document';
import { acquireSourceFence } from '../../common/source-fence';

const CP_PACKAGE_MAX_BYTES = 50 * 1024 * 1024; // 50 MiB resource limit

export interface CreateApprovalIntentDto {
  expectedVersion: number;
  validationRunId: string;
  comment?: string;
  actorName?: string;
}

@Injectable()
export class CpApprovalPackageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: CpPdfService,
  ) {}

  /**
   * Records a password-confirmed approval intent and creates a queued approval package.
   */
  async recordApprovalIntent(
    tenantId: string,
    cpRevisionId: string,
    actorId: string,
    dto: CreateApprovalIntentDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        // Coarse source fence (tenantId first, then tx)
        await acquireSourceFence(tenantId, tx);

        const revision = await tx.documentRevision.findUnique({
          where: { id: cpRevisionId },
          include: { document: { include: { project: true } } },
        });

        if (!revision || revision.document.tenantId !== tenantId) {
          throw new NotFoundException('Revision not found.');
        }

        if (revision.document.project?.status === 'archived') {
          throw new ForbiddenException('Archived engineering projects are read only');
        }

        if (revision.lockedAt) {
          throw new ConflictException('Revision is already locked and approved.');
        }

        // Segregation check: revision author cannot approve
        if (revision.createdById === actorId) {
          const user = await tx.user.findUnique({
            where: { id: actorId },
            include: { userRoles: { include: { role: true } } },
          });
          const isAdmin = user?.userRoles.some((ur) => ur.role.name === 'Admin');
          if (!isAdmin) {
            throw new ForbiddenException(
              'Segregation of duties violation: revision author cannot act as approver.',
            );
          }
        }

        const canonical = await tx.controlPlanDocument.findUnique({
          where: { revisionId: cpRevisionId },
        });

        if (!canonical) {
          throw new NotFoundException('Control plan document not found.');
        }

        if (canonical.version !== dto.expectedVersion) {
          throw new ConflictException(
            'Control plan changed. Reload and revalidate before approving.',
          );
        }

        const validationRun = await tx.cpValidationRun.findUnique({
          where: { id: dto.validationRunId },
        });

        if (!validationRun || validationRun.cpRevisionId !== cpRevisionId) {
          throw new BadRequestException('Invalid validation run.');
        }

        const findings = validationRun.findings as any[];
        const blockers = Array.isArray(findings)
          ? findings.filter((f) => f.category === 'blocker')
          : [];
        if (blockers.length > 0) {
          throw new BadRequestException(
            `Cannot approve: validation run has ${blockers.length} unresolved blockers.`,
          );
        }

        const doc = canonical.data as unknown as CpDocumentV2;
        const snapshotHash = createHash('sha256')
          .update(JSON.stringify(doc))
          .digest('hex');

        const now = new Date();

        const pkg = await tx.cpApprovalPackage.create({
          data: {
            tenantId,
            projectId: revision.document.projectId,
            revisionId: cpRevisionId,
            expectedVersion: dto.expectedVersion,
            frozenSnapshot: doc as unknown as Prisma.InputJsonValue,
            frozenSnapshotHash: snapshotHash,
            profileRevisionId: validationRun.profileRevisionId,
            validationRunId: validationRun.id,
            intentActorId: actorId,
            intentComment: dto.comment?.trim(),
            intentDecisionAt: now,
            state: 'queued',
          },
        });

        return {
          packageId: pkg.id,
          state: pkg.state,
          intentDecisionAt: now,
        };
      },
      { isolationLevel: 'Serializable', timeout: 30000 },
    );
  }

  /**
   * Processes a queued package: renders PDF artifact, saves manifest, and updates status to ready.
   */
  async processPackage(packageId: string, actorName = 'Engineering Approver') {
    // 1. Claim package with atomic lease CAS
    const leaseToken = randomUUID();
    const leaseExpiresAt = new Date(Date.now() + 120 * 1000);

    const claimed = await this.prisma.cpApprovalPackage.updateMany({
      where: {
        id: packageId,
        state: 'queued',
      },
      data: {
        state: 'rendering',
        leaseToken,
        leaseExpiresAt,
        attempts: { increment: 1 },
      },
    });

    if (claimed.count === 0) {
      const existing = await this.prisma.cpApprovalPackage.findUnique({
        where: { id: packageId },
      });
      return existing;
    }

    const pkg = await this.prisma.cpApprovalPackage.findUniqueOrThrow({
      where: { id: packageId },
    });

    try {
      const doc = pkg.frozenSnapshot as unknown as CpDocumentV2;

      // Render full approved PDF
      const pdfBuffer = await this.pdfService.renderControlPlanPdf(doc, {
        scope: 'full',
        approvedStamp: {
          approvedAt: pkg.intentDecisionAt,
          approverName: actorName,
          packageId: pkg.id,
        },
      });

      if (pdfBuffer.length > CP_PACKAGE_MAX_BYTES) {
        throw new BadRequestException(
          `Rendered PDF exceeds package budget of ${CP_PACKAGE_MAX_BYTES} bytes.`,
        );
      }

      const pdfHash = createHash('sha256').update(pdfBuffer).digest('hex');

      // Save PDF artifact
      await this.prisma.cpArtifact.create({
        data: {
          tenantId: pkg.tenantId,
          projectId: pkg.projectId,
          packageId: pkg.id,
          kind: 'approved_full_pdf',
          mimeType: 'application/pdf',
          fileName: `control-plan-${doc.header.controlPlanNumber || 'approved'}.pdf`,
          content: pdfBuffer,
          size: pdfBuffer.length,
          sha256: pdfHash,
          rendererVersion: '1.0.0',
        },
      });

      // Save manifest artifact
      const manifest = {
        packageId: pkg.id,
        revisionId: pkg.revisionId,
        snapshotHash: pkg.frozenSnapshotHash,
        intentActorId: pkg.intentActorId,
        intentDecisionAt: pkg.intentDecisionAt,
        pdfHash,
        pdfSizeBytes: pdfBuffer.length,
        finalizedAt: new Date(),
      };
      const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');

      await this.prisma.cpArtifact.create({
        data: {
          tenantId: pkg.tenantId,
          projectId: pkg.projectId,
          packageId: pkg.id,
          kind: 'approval_manifest',
          mimeType: 'application/json',
          fileName: 'manifest.json',
          content: manifestBuffer,
          size: manifestBuffer.length,
          sha256: createHash('sha256').update(manifestBuffer).digest('hex'),
          rendererVersion: '1.0.0',
        },
      });

      // Update state to ready
      return await this.prisma.cpApprovalPackage.update({
        where: { id: packageId },
        data: {
          state: 'ready',
          leaseToken: null,
          leaseExpiresAt: null,
        },
      });
    } catch (err) {
      await this.prisma.cpApprovalPackage.update({
        where: { id: packageId },
        data: {
          state: 'failed',
          lastError: err instanceof Error ? err.message : String(err),
          leaseToken: null,
          leaseExpiresAt: null,
        },
      });
      throw err;
    }
  }

  /**
   * Finalizes the approved package: locks the revision, records the Approval entity,
   * and attaches cpApprovalPackageId.
   */
  async finalizePackage(tenantId: string, packageId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        // Coarse source fence (tenantId first, then tx)
        await acquireSourceFence(tenantId, tx);

        const pkg = await tx.cpApprovalPackage.findUniqueOrThrow({
          where: { id: packageId },
        });

        if (pkg.tenantId !== tenantId) {
          throw new ForbiddenException('Tenant access mismatch.');
        }

        if (pkg.state === 'finalized') {
          return pkg; // Idempotent
        }

        if (pkg.state !== 'ready') {
          throw new ConflictException(`Cannot finalize package in state '${pkg.state}'.`);
        }

        const revision = await tx.documentRevision.findUniqueOrThrow({
          where: { id: pkg.revisionId },
        });

        if (revision.lockedAt) {
          throw new ConflictException('Revision is already locked.');
        }

        const now = new Date();

        // 1. Mark package finalized
        const finalizedPkg = await tx.cpApprovalPackage.update({
          where: { id: packageId },
          data: {
            state: 'finalized',
            finalizedAt: now,
          },
        });

        // 2. Lock and approve revision
        await tx.documentRevision.update({
          where: { id: pkg.revisionId },
          data: {
            status: 'approved',
            approvedAt: pkg.intentDecisionAt,
            lockedAt: now,
            cpApprovalPackageId: packageId,
          },
        });

        // 3. Create Approval record
        await tx.approval.create({
          data: {
            revisionId: pkg.revisionId,
            approverId: pkg.intentActorId,
            role: 'approver',
            decision: 'approved',
            comment: pkg.intentComment,
            decidedAt: pkg.intentDecisionAt,
          },
        });

        // 4. Audit log
        await tx.auditLog.create({
          data: {
            tenantId,
            userId: pkg.intentActorId,
            entityType: 'document_revision',
            entityId: pkg.revisionId,
            action: 'approve',
            newValue: {
              status: 'approved',
              packageId,
              approvedAt: pkg.intentDecisionAt,
            },
          },
        });

        return finalizedPkg;
      },
      { isolationLevel: 'Serializable', timeout: 30000 },
    );
  }

  /**
   * Convenience workflow method that takes an intent and executes processing + finalization.
   */
  async executeApprovalWorkflow(
    tenantId: string,
    cpRevisionId: string,
    actorId: string,
    dto: CreateApprovalIntentDto,
  ) {
    const { packageId } = await this.recordApprovalIntent(
      tenantId,
      cpRevisionId,
      actorId,
      dto,
    );

    await this.processPackage(packageId, dto.actorName);
    return await this.finalizePackage(tenantId, packageId);
  }

  /**
   * Retrieves package metadata (no raw artifact bytes).
   */
  async getPackage(tenantId: string, packageId: string) {
    const pkg = await this.prisma.cpApprovalPackage.findUnique({
      where: { id: packageId },
      include: {
        artifacts: {
          select: {
            id: true,
            kind: true,
            mimeType: true,
            fileName: true,
            size: true,
            sha256: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pkg || pkg.tenantId !== tenantId) {
      throw new NotFoundException('Approval package not found.');
    }

    return pkg;
  }

  /**
   * Retrieves artifact bytes for authorized downloads.
   */
  async getArtifact(
    tenantId: string,
    packageId: string,
    artifactId: string,
  ): Promise<{ name: string; mimeType: string; data: Buffer }> {
    const artifact = await this.prisma.cpArtifact.findUnique({
      where: { id: artifactId },
    });

    if (
      !artifact ||
      artifact.tenantId !== tenantId ||
      artifact.packageId !== packageId
    ) {
      throw new NotFoundException('Artifact not found.');
    }

    return {
      name: artifact.fileName,
      mimeType: artifact.mimeType,
      data: Buffer.from(artifact.content),
    };
  }
}
