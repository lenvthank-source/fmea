import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { CreateWorkElementDto } from './dto/create-work-element.dto';

@Injectable()
export class PfdService {
  constructor(private prisma: PrismaService) {}

  private async verifyRevisionAccess(tenantId: string, revisionId: string) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: { document: true },
    });

    if (!revision) {
      throw new NotFoundException('Document revision not found');
    }

    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this document revision');
    }

    return revision;
  }

  private async verifyStepAccess(tenantId: string, stepId: string) {
    const step = await this.prisma.processStep.findUnique({
      where: { id: stepId },
      include: {
        revision: {
          include: { document: true },
        },
      },
    });

    if (!step) {
      throw new NotFoundException('Process step not found');
    }

    if (step.revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this process step');
    }

    return step;
  }

  async findAllSteps(tenantId: string, revisionId: string) {
    await this.verifyRevisionAccess(tenantId, revisionId);

    return this.prisma.processStep.findMany({
      where: { revisionId },
      include: {
        workElements: {
          orderBy: { sequenceOrder: 'asc' },
        },
      },
      orderBy: { sequenceOrder: 'asc' },
    });
  }

  async createStep(tenantId: string, revisionId: string, dto: CreateStepDto) {
    const revision = await this.verifyRevisionAccess(tenantId, revisionId);

    // Resolve or create a default ProcessItem for the project
    let processItemId = dto.processItemId;
    if (!processItemId) {
      let processItem = await this.prisma.processItem.findFirst({
        where: { projectId: revision.document.projectId, tenantId },
      });

      if (!processItem) {
        processItem = await this.prisma.processItem.create({
          data: {
            tenantId,
            projectId: revision.document.projectId,
            name: 'Process Flow Items',
            description: 'Default process flow structure container',
          },
        });
      }
      processItemId = processItem.id;
    }

    // Get next sequence order
    const stepCount = await this.prisma.processStep.count({
      where: { revisionId },
    });

    return this.prisma.processStep.create({
      data: {
        revisionId,
        processItemId,
        stepNumber: dto.stepNumber,
        name: dto.name,
        stepType: dto.stepType,
        inputs: dto.inputs,
        outputs: dto.outputs,
        resources: dto.resources,
        sequenceOrder: stepCount + 1,
      },
    });
  }

  async updateStep(tenantId: string, stepId: string, dto: UpdateStepDto) {
    await this.verifyStepAccess(tenantId, stepId);

    return this.prisma.processStep.update({
      where: { id: stepId },
      data: {
        stepNumber: dto.stepNumber,
        name: dto.name,
        stepType: dto.stepType,
        inputs: dto.inputs,
        outputs: dto.outputs,
        resources: dto.resources,
      },
    });
  }

  async removeStep(tenantId: string, stepId: string) {
    const step = await this.verifyStepAccess(tenantId, stepId);

    // Safety check: Prevent deletion if FMEA rows or Control Plan rows are linked
    // Note: Since FMEA is not fully populated yet, we will check if the relations exist in DB.
    const fmeaCount = await this.prisma.pfmeaRow.count({
      where: { processStepId: stepId },
    });

    const cpCount = await this.prisma.controlPlanRow.count({
      where: { processStepId: stepId },
    });

    if (fmeaCount > 0 || cpCount > 0) {
      throw new BadRequestException(
        'Cannot delete step: Associated FMEA rows or Control Plan items already exist. Please delete those analysis rows first to maintain document integrity.',
      );
    }

    return this.prisma.processStep.delete({
      where: { id: stepId },
    });
  }

  async reorderSteps(tenantId: string, revisionId: string, orderedStepIds: string[]) {
    await this.verifyRevisionAccess(tenantId, revisionId);

    // Perform reorder within transaction
    return this.prisma.$transaction(
      orderedStepIds.map((id, index) =>
        this.prisma.processStep.update({
          where: { id },
          data: { sequenceOrder: index + 1 },
        }),
      ),
    );
  }

  async createWorkElement(tenantId: string, stepId: string, dto: CreateWorkElementDto) {
    await this.verifyStepAccess(tenantId, stepId);

    const elementCount = await this.prisma.workElement.count({
      where: { processStepId: stepId },
    });

    return this.prisma.workElement.create({
      data: {
        processStepId: stepId,
        name: dto.name,
        description: dto.description,
        sequenceOrder: elementCount + 1,
      },
    });
  }

  async removeWorkElement(tenantId: string, elementId: string) {
    const element = await this.prisma.workElement.findUnique({
      where: { id: elementId },
      include: {
        processStep: {
          include: {
            revision: {
              include: { document: true },
            },
          },
        },
      },
    });

    if (!element) {
      throw new NotFoundException('Work element not found');
    }

    if (element.processStep.revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this work element');
    }

    return this.prisma.workElement.delete({
      where: { id: elementId },
    });
  }
}
