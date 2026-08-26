import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RevisionGuard {
  constructor(private prisma: PrismaService) {}

  async assertRevisionWritable(tenantId: string, revisionId: string): Promise<void> {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      select: { id: true, status: true, lockedAt: true, document: { select: { tenantId: true } } },
    });

    if (!revision) {
      throw new BadRequestException('Revision not found');
    }

    // Tenant isolation
    if (revision.document?.tenantId !== tenantId) {
      throw new BadRequestException('Revision not found');
    }

    // Check if revision is locked
    if (revision.lockedAt !== null) {
      throw new BadRequestException('Cannot modify a locked revision');
    }

    // Check if revision is not in draft status
    if (revision.status !== 'draft') {
      throw new BadRequestException('Can only modify revisions in draft status');
    }
  }

  async assertRevisionWritableByStep(tenantId: string, stepId: string): Promise<void> {
    const step = await this.prisma.processStep.findUnique({
      where: { id: stepId },
      select: { revisionId: true, revision: { select: { status: true, lockedAt: true, document: { select: { tenantId: true } } } } },
    });

    if (!step) {
      throw new BadRequestException('Process step not found');
    }

    // Tenant isolation
    if (step.revision?.document?.tenantId !== tenantId) {
      throw new BadRequestException('Process step not found');
    }

    // Check if revision is locked
    if (step.revision?.lockedAt !== null) {
      throw new BadRequestException('Cannot modify a locked revision');
    }

    // Check if revision is not in draft status
    if (step.revision?.status !== 'draft') {
      throw new BadRequestException('Can only modify steps in draft revisions');
    }
  }

  async assertRevisionWritableByRow(tenantId: string, rowId: string): Promise<void> {
    const row = await this.prisma.pfmeaRow.findUnique({
      where: { id: rowId },
      select: { revisionId: true, revision: { select: { status: true, lockedAt: true, document: { select: { tenantId: true } } } } },
    });

    if (!row) {
      throw new BadRequestException('PFMEA row not found');
    }

    if (row.revision?.document?.tenantId !== tenantId) {
      throw new BadRequestException('PFMEA row not found');
    }

    if (row.revision?.lockedAt !== null) {
      throw new BadRequestException('Cannot modify a locked revision');
    }

    if (row.revision?.status !== 'draft') {
      throw new BadRequestException('Can only modify rows in draft revisions');
    }
  }

  async assertRevisionWritableByControlPlanRow(tenantId: string, rowId: string): Promise<void> {
    const row = await this.prisma.controlPlanRow.findUnique({
      where: { id: rowId },
      select: { revisionId: true, revision: { select: { status: true, lockedAt: true, document: { select: { tenantId: true } } } } },
    });

    if (!row) {
      throw new BadRequestException('Control plan row not found');
    }

    if (row.revision?.document?.tenantId !== tenantId) {
      throw new BadRequestException('Control plan row not found');
    }

    if (row.revision?.lockedAt !== null) {
      throw new BadRequestException('Cannot modify a locked revision');
    }

    if (row.revision?.status !== 'draft') {
      throw new BadRequestException('Can only modify rows in draft revisions');
    }
  }
}