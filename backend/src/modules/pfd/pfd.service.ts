import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { RevisionGuard } from '../../common/revision-guard';
import { SavePfdGraphDto } from './dto/save-pfd-graph.dto';
import { validatePfdGraph } from './pfd-graph';
import type { PfdGraph } from './pfd-graph';
import { Prisma } from '@prisma/client';

@Injectable()
export class PfdService {
  constructor(
    private prisma: PrismaService,
    private revisionGuard: RevisionGuard,
  ) {}

  private async invalidateGraph(tx: Prisma.TransactionClient, tenantId: string, revisionId: string, removedStepId?: string) {
    const revision = await tx.documentRevision.findFirst({
      where: { id: revisionId, document: { tenantId }, status: 'draft', lockedAt: null },
      select: { pfdGraph: true, pfdGraphVersion: true },
    });
    if (!revision) throw new ConflictException('The revision changed or was locked. Reload before editing.');
    const graph = revision.pfdGraph as unknown as PfdGraph | null;
    const data: Prisma.DocumentRevisionUpdateManyMutationInput = { pfdGraphVersion: { increment: 1 } };
    if (graph?.schemaVersion === 1) {
      const nodes = graph.nodes.filter(n => !removedStepId || n.stepId !== removedStepId);
      const ids = new Set(nodes.map(n => n.id));
      data.pfdGraph = { ...graph, reviewStatus: 'draft', nodes, edges: graph.edges.filter(e => ids.has(e.source) && ids.has(e.target)) } as unknown as Prisma.InputJsonValue;
    }
    const changed = await tx.documentRevision.updateMany({
      where: { id: revisionId, document: { tenantId }, status: 'draft', lockedAt: null, pfdGraphVersion: revision.pfdGraphVersion }, data,
    });
    if (changed.count !== 1) throw new ConflictException('The process flow changed. Reload before editing.');
  }

  async assertActorAccess(user: { tenantId: string; sub?: string; isGuest?: boolean }, id: string, write: boolean, byStep = false) {
    const revision = byStep
      ? (await this.verifyStepAccess(user.tenantId, id)).revision
      : await this.verifyRevisionAccess(user.tenantId, id);
    if (!user.isGuest) return true;
    const project = await this.prisma.project.findFirst({ where: { id: revision.document.projectId, tenantId: user.tenantId } });
    const settings = project?.uiSettings as { isDemo?: boolean } | null;
    const reference = settings?.isDemo || project?.id === 'c439cfbe-548a-4e25-a37c-0194652b8526';
    const ownActive = project && project.createdById === user.sub && project.status !== 'archived' && project.createdAt.getTime() > Date.now() - 24 * 60 * 60 * 1000;
    if ((write && (reference || !ownActive)) || (!write && !reference && !ownActive)) {
      throw new ForbiddenException(write ? 'Trial sessions may edit only their own active trial project. Reference projects are read-only.' : 'This program is not available in your trial workspace.');
    }
    return Boolean(ownActive && !reference);
  }

  async getGraph(tenantId: string, revisionId: string) {
    const revision = await this.verifyRevisionAccess(tenantId, revisionId);
    return { graph: revision.pfdGraph, version: revision.pfdGraphVersion, writable: revision.status === 'draft' && !revision.lockedAt };
  }

  async saveGraph(tenantId: string, revisionId: string, dto: SavePfdGraphDto) {
    await this.verifyRevisionAccess(tenantId, revisionId);
    await this.revisionGuard.assertRevisionWritable(tenantId, revisionId);
    return this.prisma.$transaction(async tx => {
      const steps = await tx.processStep.findMany({ where: { revisionId, revision: { document: { tenantId } } }, select: { id: true, stepType: true } });
      const errors = validatePfdGraph(dto.graph, steps);
      if (errors.length) throw new BadRequestException(errors.join('; '));
      const saved = await tx.documentRevision.updateMany({
        where: { id: revisionId, document: { tenantId }, status: 'draft', lockedAt: null, pfdGraphVersion: dto.version },
        data: { pfdGraph: dto.graph as unknown as Prisma.InputJsonValue, pfdGraphVersion: { increment: 1 } },
      });
      if (saved.count !== 1) throw new ConflictException('The process flow changed or was locked. Reload before saving.');
      return { graph: dto.graph, version: dto.version + 1, writable: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

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
    await this.revisionGuard.assertRevisionWritable(tenantId, revisionId);

    return this.prisma.$transaction(async tx => {
    // Resolve or create a default ProcessItem for the project
    let processItemId = dto.processItemId;
    if (processItemId && !await tx.processItem.findFirst({ where: { id: processItemId, tenantId, projectId: revision.document.projectId } })) {
      throw new BadRequestException('Process item must belong to this program and tenant');
    }
    if (!processItemId) {
      let processItem = await tx.processItem.findFirst({
        where: { projectId: revision.document.projectId, tenantId },
      });

      if (!processItem) {
        processItem = await tx.processItem.create({
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
    const stepCount = await tx.processStep.count({
      where: { revisionId },
    });

    // Get all step numbers in this revision to compute a unique auto-incrementing stepNumber
    const existingSteps = await tx.processStep.findMany({
      where: { revisionId },
      select: { stepNumber: true },
    });
    const stepNumbers = existingSteps.map((s) => s.stepNumber);

    let calculatedStepNumber = dto.stepNumber;
    if (calculatedStepNumber && stepNumbers.includes(calculatedStepNumber)) throw new BadRequestException('Operation number already exists in this revision');
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

    const created = await tx.processStep.create({
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
    await this.invalidateGraph(tx, tenantId, revisionId);
    return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async updateStep(tenantId: string, stepId: string, dto: UpdateStepDto) {
    await this.revisionGuard.assertRevisionWritableByStep(tenantId, stepId);
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

    return this.prisma.$transaction(async tx => {
    const updatedStep = await tx.processStep.update({
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
      const downstreamWhere = { linkedPfdStepId: stepId, revision: { document: { tenantId }, status: 'draft', lockedAt: null } };
      const downstream = await tx.processStep.findMany({ where: downstreamWhere, select: { revisionId: true } });
      await tx.processStep.updateMany({
        where: downstreamWhere,
        data: {
          stepNumber: updatedStep.stepNumber,
          name: updatedStep.name,
          machinesEquipmentDocs: updatedStep.machinesEquipmentDocs || [],
        },
      });
      for (const revisionId of new Set(downstream.map(row => row.revisionId))) {
        if (revisionId !== step.revisionId) await this.invalidateGraph(tx, tenantId, revisionId);
      }
    }

    await this.invalidateGraph(tx, tenantId, step.revisionId);
    return updatedStep;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async removeStep(tenantId: string, stepId: string) {
    await this.revisionGuard.assertRevisionWritableByStep(tenantId, stepId);
    const step = await this.verifyStepAccess(tenantId, stepId);
    return this.prisma.$transaction(async tx => {
      // Validate dependencies before any mutation, including downstream orphan flags.
      const [fmeaCount, cpCount] = await Promise.all([
        tx.pfmeaRow.count({ where: { processStepId: stepId } }),
        tx.controlPlanRow.count({ where: { processStepId: stepId } }),
      ]);
      if (fmeaCount > 0 || cpCount > 0) throw new BadRequestException(
        'Cannot delete step: Associated FMEA rows or Control Plan items already exist. Please delete those analysis rows first to maintain document integrity.',
      );
      if (!step.linkedPfdStepId) {
        const where = { linkedPfdStepId: stepId, revision: { document: { tenantId }, status: 'draft', lockedAt: null } };
        const downstream = await tx.processStep.findMany({ where, select: { revisionId: true } });
        await tx.processStep.updateMany({ where, data: { isOrphaned: true } });
        for (const revisionId of new Set(downstream.map(row => row.revisionId))) {
          if (revisionId !== step.revisionId) await this.invalidateGraph(tx, tenantId, revisionId);
        }
      }
      const deleted = await tx.processStep.delete({ where: { id: stepId } });
      await this.invalidateGraph(tx, tenantId, step.revisionId, stepId);
      return deleted;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async importSteps(tenantId: string, targetRevisionId: string, sourceRevisionId: string) {
    await this.revisionGuard.assertRevisionWritable(tenantId, targetRevisionId);
    await this.verifyRevisionAccess(tenantId, sourceRevisionId);

    return this.prisma.$transaction(async tx => {
    const sourceSteps = await tx.processStep.findMany({
      where: { revisionId: sourceRevisionId },
      orderBy: { sequenceOrder: 'asc' },
    });

    const targetRevision = await tx.documentRevision.findUnique({
      where: { id: targetRevisionId },
      include: { document: true },
    });

    let processItem = await tx.processItem.findFirst({
      where: { projectId: targetRevision!.document.projectId, tenantId },
    });

    if (!processItem) {
      processItem = await tx.processItem.create({
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
      const existing = await tx.processStep.findFirst({
        where: { revisionId: targetRevisionId, linkedPfdStepId: src.id },
      });

      if (!existing) {
        await tx.processStep.create({
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

    if (importedCount) await this.invalidateGraph(tx, tenantId, targetRevisionId);
    return { importedCount };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async reorderSteps(tenantId: string, revisionId: string, orderedStepIds: string[]) {
    await this.revisionGuard.assertRevisionWritable(tenantId, revisionId);

    const steps = await this.prisma.processStep.findMany({ where: { revisionId, revision: { document: { tenantId } } }, select: { id: true } });
    if (new Set(orderedStepIds).size !== orderedStepIds.length || steps.length !== orderedStepIds.length || steps.some(s => !orderedStepIds.includes(s.id))) {
      throw new BadRequestException('Reordering must contain each operation in this revision exactly once');
    }

    return this.prisma.$transaction(
      orderedStepIds.map((id, index) =>
        this.prisma.processStep.update({
          where: { id },
          data: { sequenceOrder: index + 1 },
        }),
      ),
    );
  }

  async createStepsBatch(tenantId: string, revisionId: string, dtos: CreateStepDto[]) {
    await this.revisionGuard.assertRevisionWritable(tenantId, revisionId);
    const revision = await this.verifyRevisionAccess(tenantId, revisionId);

    return this.prisma.$transaction(async (tx) => {
    // Resolve or create a default ProcessItem for the project
    let processItemId: string | undefined;
    const firstDto = dtos[0];
    if (firstDto?.processItemId) {
      if (!await tx.processItem.findFirst({ where: { id: firstDto.processItemId, tenantId, projectId: revision.document.projectId } })) throw new BadRequestException('Process item must belong to this program and tenant');
      processItemId = firstDto.processItemId;
    } else {
      let processItem = await tx.processItem.findFirst({
        where: { projectId: revision.document.projectId, tenantId },
      });
      if (!processItem) {
        processItem = await tx.processItem.create({
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

    // Get existing steps to calculate sequence orders and step numbers
    const existingSteps = await tx.processStep.findMany({
      where: { revisionId },
      orderBy: { sequenceOrder: 'asc' },
      select: { stepNumber: true, sequenceOrder: true },
    });
    const existingStepNumbers = new Set(existingSteps.map(s => s.stepNumber));
    let maxSequenceOrder = existingSteps.length > 0 ? Math.max(...existingSteps.map(s => s.sequenceOrder)) : 0;

    // Compute base prefix and max numeric value for step numbers
    let prefix = 'OP';
    let maxVal = 0;
    for (const num of existingSteps.map(s => s.stepNumber)) {
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

      const createdSteps: any[] = [];
      let sequenceOrder = maxSequenceOrder;
      let nextVal = maxVal;

      for (const dto of dtos) {
        // Determine step number
        let stepNumber = dto.stepNumber;
        if (stepNumber && existingStepNumbers.has(stepNumber)) throw new BadRequestException(`Operation number '${stepNumber}' already exists`);
        if (!stepNumber) {
          nextVal += 10;
          if (nextVal === 10 && maxVal === 0 && existingSteps.length > 0) {
            nextVal = (existingSteps.length + 1) * 10;
          }
          stepNumber = `${prefix}${nextVal}`;
          while (existingStepNumbers.has(stepNumber)) {
            nextVal += 10;
            stepNumber = `${prefix}${nextVal}`;
          }
        }
        existingStepNumbers.add(stepNumber);

        sequenceOrder++;

        const step = await tx.processStep.create({
          data: {
            revisionId,
            processItemId,
            stepNumber,
            name: dto.name || '',
            stepType: dto.stepType || 'operation',
            inputs: dto.inputs,
            outputs: dto.outputs,
            resources: dto.resources,
            sequenceOrder,

            incomingVariation: dto.incomingVariation || [],
            specialCharacteristics: dto.specialCharacteristics,
            flowIcons: dto.flowIcons || {},
            machinesEquipmentDocs: dto.machinesEquipmentDocs || [],
            desiredOutcome: dto.desiredOutcome || dto.outputs,
            processCharacteristics: dto.processCharacteristics,
          },
        });
        createdSteps.push(step);
      }
      if (createdSteps.length) await this.invalidateGraph(tx, tenantId, revisionId);
      return createdSteps;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
