import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';

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

    // Get all step numbers in this revision to compute a unique auto-incrementing stepNumber
    const existingSteps = await this.prisma.processStep.findMany({
      where: { revisionId },
      select: { stepNumber: true },
    });
    const stepNumbers = existingSteps.map((s) => s.stepNumber);

    let calculatedStepNumber = dto.stepNumber;
    if (!calculatedStepNumber) {
      let maxVal = 0;
      let prefix = 'OP';
      for (const num of stepNumbers) {
        const match = num.match(/(\D*)(\d+)/);
        if (match) {
          const p = match[1];
          const val = parseInt(match[2], 10);
          if (val > maxVal) {
            maxVal = val;
            if (p) prefix = p;
          }
        }
      }
      let nextVal = maxVal + 10;
      if (nextVal === 10 && maxVal === 0 && stepNumbers.length > 0) {
        nextVal = (stepNumbers.length + 1) * 10;
      }
      calculatedStepNumber = `${prefix}${nextVal}`;
      while (stepNumbers.includes(calculatedStepNumber)) {
        nextVal += 10;
        calculatedStepNumber = `${prefix}${nextVal}`;
      }
    }

    return this.prisma.processStep.create({
      data: {
        revisionId,
        processItemId,
        stepNumber: calculatedStepNumber,
        name: dto.name || '',
        stepType: dto.stepType || 'operation',
        inputs: dto.inputs,
        outputs: dto.outputs,
        resources: dto.resources,
        sequenceOrder: stepCount + 1,

        incomingVariation: dto.incomingVariation || [],
        specialCharacteristics: dto.specialCharacteristics,
        flowIcons: dto.flowIcons || {},
        machinesEquipmentDocs: dto.machinesEquipmentDocs || [],
        desiredOutcome: dto.desiredOutcome || dto.outputs,
        processCharacteristics: dto.processCharacteristics,
      },
    });
  }

  async updateStep(tenantId: string, stepId: string, dto: UpdateStepDto) {
    const step = await this.verifyStepAccess(tenantId, stepId);

    if (dto.stepNumber && dto.stepNumber !== step.stepNumber) {
      const existing = await this.prisma.processStep.findFirst({
        where: {
          revisionId: step.revisionId,
          stepNumber: dto.stepNumber,
          id: { not: stepId },
        },
      });
      if (existing) {
        throw new BadRequestException(`Step number '${dto.stepNumber}' already exists in this process flow.`);
      }
    }

    const updatedStep = await this.prisma.processStep.update({
      where: { id: stepId },
      data: {
        stepNumber: dto.stepNumber,
        name: dto.name,
        stepType: dto.stepType,
        inputs: dto.inputs,
        outputs: dto.outputs,
        resources: dto.resources,
        incomingVariation: dto.incomingVariation,
        specialCharacteristics: dto.specialCharacteristics,
        flowIcons: dto.flowIcons,
        machinesEquipmentDocs: dto.machinesEquipmentDocs,
        desiredOutcome: dto.desiredOutcome,
        processCharacteristics: dto.processCharacteristics,
      },
    });

    // If this is a master PFD step, sync the updates to downstream PFMEA / Control Plan steps
    if (!updatedStep.linkedPfdStepId) {
      await this.prisma.processStep.updateMany({
        where: { linkedPfdStepId: stepId },
        data: {
          stepNumber: updatedStep.stepNumber,
          name: updatedStep.name,
          machinesEquipmentDocs: updatedStep.machinesEquipmentDocs || [],
        },
      });
    }

    return updatedStep;
  }

  async removeStep(tenantId: string, stepId: string) {
    const step = await this.verifyStepAccess(tenantId, stepId);

    // If it's a master PFD step, mark downstream steps as orphaned instead of cascade deleting them
    if (!step.linkedPfdStepId) {
      await this.prisma.processStep.updateMany({
        where: { linkedPfdStepId: stepId },
        data: { isOrphaned: true },
      });
    }

    // Safety check: Prevent deletion if FMEA rows or Control Plan rows are linked to this specific step record
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

  async importSteps(tenantId: string, targetRevisionId: string, sourceRevisionId: string) {
    await this.verifyRevisionAccess(tenantId, targetRevisionId);
    await this.verifyRevisionAccess(tenantId, sourceRevisionId);

    const sourceSteps = await this.prisma.processStep.findMany({
      where: { revisionId: sourceRevisionId },
      orderBy: { sequenceOrder: 'asc' },
    });

    const targetRevision = await this.prisma.documentRevision.findUnique({
      where: { id: targetRevisionId },
      include: { document: true },
    });

    let processItem = await this.prisma.processItem.findFirst({
      where: { projectId: targetRevision!.document.projectId, tenantId },
    });

    if (!processItem) {
      processItem = await this.prisma.processItem.create({
        data: {
          tenantId,
          projectId: targetRevision!.document.projectId,
          name: 'Process Flow Items',
          description: 'Default process flow structure container',
        },
      });
    }

    let importedCount = 0;
    for (const src of sourceSteps) {
      const existing = await this.prisma.processStep.findFirst({
        where: { revisionId: targetRevisionId, linkedPfdStepId: src.id },
      });

      if (!existing) {
        await this.prisma.processStep.create({
          data: {
            revisionId: targetRevisionId,
            processItemId: processItem.id,
            stepNumber: src.stepNumber,
            name: src.name,
            stepType: src.stepType,
            sequenceOrder: src.sequenceOrder,
            inputs: src.inputs,
            outputs: src.outputs,
            resources: src.resources,
            incomingVariation: src.incomingVariation || [],
            specialCharacteristics: src.specialCharacteristics,
            flowIcons: src.flowIcons || {},
            machinesEquipmentDocs: src.machinesEquipmentDocs || [],
            desiredOutcome: src.desiredOutcome,
            processCharacteristics: src.processCharacteristics,
            linkedPfdStepId: src.id,
            isOrphaned: false,
          },
        });
        importedCount++;
      }
    }

    return { importedCount };
  }

  async reorderSteps(tenantId: string, revisionId: string, orderedStepIds: string[]) {
    await this.verifyRevisionAccess(tenantId, revisionId);

    return this.prisma.$transaction(
      orderedStepIds.map((id, index) =>
        this.prisma.processStep.update({
          where: { id },
          data: { sequenceOrder: index + 1 },
        }),
      ),
    );
  }
}
