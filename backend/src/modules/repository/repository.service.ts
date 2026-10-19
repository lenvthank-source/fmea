import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RevisionGuard } from '../../common/revision-guard';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateWorkElementPackageDto,
  UpdateWorkElementPackageDto,
  RejectWorkElementPackageDto,
  ImportWorkElementPackageDto,
} from './repository.dto';

@Injectable()
export class RepositoryService {
  constructor(
    private prisma: PrismaService,
    private revisionGuard: RevisionGuard,
  ) {}

  /**
   * Submit a new work element package for review (status = 'pending')
   */
  async submitPackage(dto: CreateWorkElementPackageDto, user: any) {
    if (
      user?.isGuest ||
      (user?.email && user.email.toLowerCase().startsWith('guest'))
    ) {
      throw new ForbiddenException(
        'Guest accounts have read-only access to repository packages',
      );
    }

    const userId = user?.sub || user?.id || user?.userId;
    if (!userId) {
      throw new BadRequestException(
        'User ID is missing from authentication token',
      );
    }

    const isAdmin =
      (user.roles || []).includes('Admin') ||
      (user.permissions || []).includes('admin.config') ||
      (user.permissions || []).includes('admin.users');

    if (
      dto.sourceProjectId &&
      !(await this.prisma.project.findFirst({
        where: { id: dto.sourceProjectId, tenantId: user.tenantId },
      }))
    )
      throw new BadRequestException('Source project not found');

    const status = isAdmin ? 'approved' : 'pending';
    const reviewedById = isAdmin ? userId : null;
    const reviewedAt = isAdmin ? new Date() : null;

    return this.prisma.workElementPackage.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        packageData: dto.packageData,
        status,
        contributorId: userId,
        contributorName: user.name || user.email || 'Unknown User',
        contributorTenantId: user.tenantId,
        sourceProjectId: dto.sourceProjectId || null,
        reviewedById,
        reviewedAt,
      },
    });
  }

  /**
   * List approved packages (visible to all)
   */
  async listApproved() {
    return this.prisma.workElementPackage.findMany({
      where: { status: 'approved' },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * List pending packages for admin review
   */
  async listPendingForAdmin(user: any) {
    return this.prisma.workElementPackage.findMany({
      where: { status: 'pending', contributorTenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * List packages submitted by the current user
   */
  async listMySubmissions(userId: string, tenantId: string) {
    return this.prisma.workElementPackage.findMany({
      where: { contributorId: userId, contributorTenantId: tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single package details
   */
  async getPackageById(id: string, user: any, requireManagement = false) {
    const pkg = await this.prisma.workElementPackage.findUnique({
      where: { id },
    });
    if (
      !pkg ||
      (!requireManagement &&
        pkg.status !== 'approved' &&
        !(
          pkg.contributorTenantId === user?.tenantId &&
          (pkg.contributorId === (user?.sub || user?.id || user?.userId) ||
            user?.permissions?.includes('admin.config'))
        )) ||
      (requireManagement &&
        (pkg.contributorTenantId !== user?.tenantId ||
          !user?.permissions?.includes('admin.config')))
    ) {
      throw new NotFoundException(`Work element package ${id} not found`);
    }
    return pkg;
  }

  /**
   * Approve a pending package (Admin only)
   */
  async approvePackage(id: string, adminUser: any) {
    await this.getPackageById(id, adminUser, true);
    const adminId =
      adminUser?.sub || adminUser?.id || adminUser?.userId || null;

    return this.prisma.workElementPackage.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });
  }

  /**
   * Reject a pending package (Admin only)
   */
  async rejectPackage(
    id: string,
    dto: RejectWorkElementPackageDto,
    adminUser: any,
  ) {
    await this.getPackageById(id, adminUser, true);
    const adminId =
      adminUser?.sub || adminUser?.id || adminUser?.userId || null;

    return this.prisma.workElementPackage.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason.trim(),
      },
    });
  }

  /**
   * Update package (Admin only)
   */
  async updatePackage(id: string, dto: UpdateWorkElementPackageDto, user: any) {
    await this.getPackageById(id, user, true);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined)
      data.description = dto.description.trim() || null;
    if (dto.packageData !== undefined) data.packageData = dto.packageData;

    return this.prisma.workElementPackage.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete package (Admin only)
   */
  async deletePackage(id: string, user: any) {
    await this.getPackageById(id, user, true);
    return this.prisma.workElementPackage.delete({
      where: { id },
    });
  }

  private async assertProjectImportAccess(revisionId: string, user: any) {
    const revision = await this.prisma.documentRevision.findFirst({
      where: { id: revisionId, document: { tenantId: user.tenantId } },
      include: { document: { include: { project: true } } },
    });
    const project = revision?.document?.project;
    if (!project || project.status !== 'active')
      throw new NotFoundException('Active destination project not found');
    const settings = (project.uiSettings || {}) as Record<string, unknown>;
    if (
      settings.isDemo ||
      project.id === 'c439cfbe-548a-4e25-a37c-0194652b8526'
    )
      throw new ForbiddenException('Reference projects are read-only');
    if (user.isGuest) {
      const userId = user.sub || user.id || user.userId;
      const expires = settings.expiresAt
        ? new Date(String(settings.expiresAt)).getTime()
        : new Date(project.createdAt).getTime() + 24 * 60 * 60 * 1000;
      if (
        project.createdById !== userId ||
        !Number.isFinite(expires) ||
        expires <= Date.now()
      )
        throw new ForbiddenException('Trial project is unavailable or expired');
    }
    // Registered project collaboration follows current tenant-scoped ProjectService access.
  }

  /**
   * Deep-copy an approved package into a PFMEA process step
   */
  async importPackage(
    packageId: string,
    dto: ImportWorkElementPackageDto,
    user: any,
  ) {
    const pkg = await this.getPackageById(packageId, user);
    if (pkg.status !== 'approved') {
      throw new BadRequestException(
        'Only approved packages can be imported into PFMEA',
      );
    }

    await this.revisionGuard.assertRevisionWritable(
      user.tenantId,
      dto.revisionId,
    );

    // Find the step - try the given revision first
    let step = await this.prisma.processStep.findFirst({
      where: { id: dto.processStepId, revisionId: dto.revisionId },
    });

    // If not found, or if it's a PFMEA shadow revision, find the PFD master revision
    if (!step) {
      throw new NotFoundException(
        `Process step ${dto.processStepId} not found in revision ${dto.revisionId}`,
      );
    }

    // Find the PFD master step (linkedPfdStepId is null for master)
    let masterStep = step;
    if (step.linkedPfdStepId) {
      const foundMaster = await this.prisma.processStep.findUnique({
        where: { id: step.linkedPfdStepId },
      });
      if (!foundMaster)
        throw new BadRequestException('Linked process step not found');
      await this.revisionGuard.assertRevisionWritableByStep(
        user.tenantId,
        foundMaster.id,
      );
      await this.assertProjectImportAccess(foundMaster.revisionId, user);
      masterStep = foundMaster;
    }

    // Use the master step for work element tracking
    const targetStep = masterStep;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Append package name to machinesEquipmentDocs on MASTER step
      let currentWe: string[] = [];
      if (targetStep.machinesEquipmentDocs) {
        if (Array.isArray(targetStep.machinesEquipmentDocs)) {
          currentWe = [...(targetStep.machinesEquipmentDocs as string[])];
        } else if (typeof targetStep.machinesEquipmentDocs === 'string') {
          try {
            currentWe = JSON.parse(targetStep.machinesEquipmentDocs as string);
          } catch {
            currentWe = [targetStep.machinesEquipmentDocs as string];
          }
        }
      }

      if (!currentWe.includes(pkg.name)) {
        currentWe.push(pkg.name);
        await tx.processStep.update({
          where: { id: targetStep.id },
          data: { machinesEquipmentDocs: currentWe },
        });
      }

      // Also update the shadow step if different
      if (step.id !== targetStep.id) {
        let shadowWe: string[] = [];
        if (Array.isArray(step.machinesEquipmentDocs)) {
          shadowWe = [...(step.machinesEquipmentDocs as string[])];
        } else if (typeof step.machinesEquipmentDocs === 'string') {
          try {
            shadowWe = JSON.parse(step.machinesEquipmentDocs as string);
          } catch {
            shadowWe = [step.machinesEquipmentDocs as string];
          }
        }
        if (!shadowWe.includes(pkg.name)) {
          shadowWe.push(pkg.name);
          await tx.processStep.update({
            where: { id: step.id },
            data: { machinesEquipmentDocs: shadowWe },
          });
        }
      }

      // 2. Extract functions & failures from packageData
      const pkgData = (pkg.packageData as any) || {};
      const functions = pkgData.functions || [];
      if (
        !Array.isArray(functions) ||
        functions.some(
          (fn: any) =>
            !fn ||
            typeof fn !== 'object' ||
            ((fn.failures ?? fn.causes) !== undefined &&
              !Array.isArray(fn.failures ?? fn.causes)),
        )
      )
        throw new BadRequestException('Malformed package structure');

      const parentId = `${step.id}::${pkg.name}`;

      const rev = await tx.documentRevision.findUnique({
        where: { id: dto.revisionId },
        select: { document: { select: { projectId: true } } },
      });
      const projectId = rev?.document?.projectId || '';

      const createdFunctions: any[] = [];
      const createdFailures: any[] = [];

      for (const fn of functions) {
        // Create StructureFunction
        const sf = await tx.structureFunction.create({
          data: {
            tenantId: user.tenantId,
            projectId: projectId,
            parentType: 'work_element',
            parentId: parentId,
            narration: fn.name || fn.narration || 'Unnamed Function',
            location: 'your_plant',
          },
        });
        createdFunctions.push(sf);

        // Create nested failures (causes)
        const causes = fn.failures ?? fn.causes;
        if (Array.isArray(causes)) {
          for (const fail of causes) {
            if (!fail || typeof fail !== 'object')
              throw new BadRequestException('Malformed failure cause');
            const failRec = await tx.structureFailure.create({
              data: {
                functionId: sf.id,
                role: 'cause',
                narration: fail.name || fail.narration || 'Unnamed Failure',
                severityRating: fail.severity || fail.severityRating || null,
                occurrenceRating:
                  fail.occurrence || fail.occurrenceRating || null,
                detectionRating: fail.detection || fail.detectionRating || null,
                currentControlPrevention:
                  fail.preventionControl ||
                  fail.currentControlPrevention ||
                  null,
                currentControlDetection:
                  fail.detectionControl || fail.currentControlDetection || null,
                filterCode: fail.filterCode || null,
              },
            });
            createdFailures.push(failRec);
          }
        }
      }

      return {
        importedPackage: pkg.name,
        createdWorkElement: pkg.name,
        createdFunctionsCount: createdFunctions.length,
        createdFailuresCount: createdFailures.length,
      };
    });
  }
}
