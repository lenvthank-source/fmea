import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { RevisionGuard } from '../../common/revision-guard';
import { SavePfdGraphDto } from './dto/save-pfd-graph.dto';
import { validatePfdGraph } from './pfd-graph';
import type { PfdGraph } from './pfd-graph';
import { Prisma } from '@prisma/client';
import { assertEngineeringRevisionAccess } from '../../common/engineering-access';
import symbols from './pfd-symbols.json';

@Injectable()
export class PfdService {
  constructor(
    private prisma: PrismaService,
    private revisionGuard: RevisionGuard,
  ) {}

  private async invalidateGraph(
    tx: Prisma.TransactionClient,
    tenantId: string,
    revisionId: string,
    removedStepId?: string,
  ) {
    const revision = await tx.documentRevision.findFirst({
      where: {
        id: revisionId,
        document: { tenantId },
        status: 'draft',
        lockedAt: null,
      },
      select: { pfdGraph: true, pfdGraphVersion: true },
    });
    if (!revision)
      throw new ConflictException(
        'The revision changed or was locked. Reload before editing.',
      );
    const graph = revision.pfdGraph as unknown as PfdGraph | null;
    const data: Prisma.DocumentRevisionUpdateManyMutationInput = {
      pfdGraphVersion: { increment: 1 },
    };
    if (graph && [1, 2].includes(graph.schemaVersion)) {
      const nodes = graph.nodes.filter(
        (n) => !removedStepId || n.stepId !== removedStepId,
      );
      const ids = new Set(nodes.map((n) => n.id));
      data.pfdGraph = {
        ...graph,
        reviewStatus: 'draft',
        nodes,
        edges: graph.edges.filter(
          (e) => ids.has(e.source) && ids.has(e.target),
        ),
      } as unknown as Prisma.InputJsonValue;
    }
    const changed = await tx.documentRevision.updateMany({
      where: {
        id: revisionId,
        document: { tenantId },
        status: 'draft',
        lockedAt: null,
        pfdGraphVersion: revision.pfdGraphVersion,
      },
      data,
    });
    if (changed.count !== 1)
      throw new ConflictException(
        'The process flow changed. Reload before editing.',
      );
  }

  private async access(
    db: PrismaService | Prisma.TransactionClient,
    tenantId: string,
    userId: string | undefined,
    revisionId: string,
    write: boolean,
    graphOnly = false,
  ) {
    if (!userId) throw new ForbiddenException('Authenticated actor required');
    const revision = await assertEngineeringRevisionAccess(
      db,
      { tenantId, userId },
      revisionId,
      graphOnly ? 'PFD' : undefined,
      write,
    );
    if (!graphOnly && !['PFD', 'PFMEA'].includes(revision.document.type))
      throw new BadRequestException(
        'Process operations require a PFD or PFMEA revision',
      );
    return revision;
  }

  private validateSymbols(
    dto: {
      manufacturingSymbolId?: string | null;
      engineeringSymbolId?: string | null;
    },
    stepType?: string,
  ) {
    if (!dto || typeof dto !== 'object')
      throw new BadRequestException('Expected an operation object');
    const input = dto as Partial<CreateStepDto>;
    if (
      input.stepType !== undefined &&
      (!input.stepType ||
        !symbols.some(
          (s) =>
            s.kind === 'manufacturing' &&
            s.activityTypes?.includes(input.stepType!),
        ))
    )
      throw new BadRequestException('Unknown manufacturing activity type');
    if (
      input.name !== undefined &&
      (typeof input.name !== 'string' || input.name.length > 255)
    )
      throw new BadRequestException(
        'Operation name must be text of at most 255 characters',
      );
    if (
      input.stepNumber !== undefined &&
      (typeof input.stepNumber !== 'string' ||
        !input.stepNumber.trim() ||
        input.stepNumber.length > 20)
    )
      throw new BadRequestException(
        'Operation number must be nonempty text of at most 20 characters',
      );
    if (
      dto.manufacturingSymbolId != null &&
      !symbols.some(
        (s) => s.id === dto.manufacturingSymbolId && s.kind === 'manufacturing',
      )
    )
      throw new BadRequestException('Unknown manufacturing symbol');
    if (
      dto.manufacturingSymbolId != null &&
      stepType &&
      !symbols.some(
        (s) =>
          s.id === dto.manufacturingSymbolId &&
          s.kind === 'manufacturing' &&
          s.activityTypes?.includes(stepType),
      )
    )
      throw new BadRequestException(
        'Manufacturing symbol must match the operation activity type',
      );
    if (
      dto.engineeringSymbolId != null &&
      !symbols.some(
        (s) => s.id === dto.engineeringSymbolId && s.kind === 'engineering',
      )
    )
      throw new BadRequestException('Unknown engineering symbol');
  }

  async assertActorAccess(
    user: { tenantId: string; sub?: string; isGuest?: boolean },
    id: string,
    write: boolean,
    byStep = false,
  ) {
    const revisionId = byStep
      ? (await this.verifyStepAccess(user.tenantId, id)).revisionId
      : id;
    const revision = await this.access(
      this.prisma,
      user.tenantId,
      user.sub,
      revisionId,
      false,
    );
    if (write && !revision.writable)
      throw new ForbiddenException('This revision is read only');
    return Boolean(revision.writable);
  }

  async getGraph(tenantId: string, revisionId: string, userId?: string) {
    const revision = await this.access(
      this.prisma,
      tenantId,
      userId,
      revisionId,
      false,
      true,
    );
    return {
      graph: revision.pfdGraph,
      version: revision.pfdGraphVersion,
      writable: revision.writable,
    };
  }

  async saveGraph(
    tenantId: string,
    revisionId: string,
    dto: SavePfdGraphDto,
    userId?: string,
  ) {
    if (!Number.isInteger(dto.version) || dto.version < 0)
      throw new BadRequestException('Expected a non-negative graph version');
    return this.prisma.$transaction(
      async (tx) => {
        await this.access(tx, tenantId, userId, revisionId, true, true);
        const steps = await tx.processStep.findMany({
          where: { revisionId, revision: { document: { tenantId } } },
          select: { id: true, stepType: true },
        });
        const errors = validatePfdGraph(dto.graph, steps);
        if (errors.length) throw new BadRequestException(errors.join('; '));
        const saved = await tx.documentRevision.updateMany({
          where: {
            id: revisionId,
            document: { tenantId },
            status: 'draft',
            lockedAt: null,
            pfdGraphVersion: dto.version,
          },
          data: {
            pfdGraph: dto.graph as unknown as Prisma.InputJsonValue,
            pfdGraphVersion: { increment: 1 },
          },
        });
        if (saved.count !== 1)
          throw new ConflictException(
            'The process flow changed or was locked. Reload before saving.',
          );
        return { graph: dto.graph, version: dto.version + 1, writable: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async verifyStepAccess(tenantId: string, stepId: string) {
    const step = await this.prisma.processStep.findFirst({
      where: { id: stepId, revision: { document: { tenantId } } },
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
      throw new ForbiddenException(
        'You do not have access to this process step',
      );
    }

    return step;
  }

  async findAllSteps(tenantId: string, revisionId: string, userId?: string) {
    await this.access(this.prisma, tenantId, userId, revisionId, false);

    return this.prisma.processStep.findMany({
      where: { revisionId },
      orderBy: { sequenceOrder: 'asc' },
    });
  }

  async createStep(
    tenantId: string,
    revisionId: string,
    dto: CreateStepDto,
    userId?: string,
  ) {
    this.validateSymbols(dto, dto.stepType || 'operation');
    return this.prisma.$transaction(
      async (tx) => {
        const revision = await this.access(
          tx,
          tenantId,
          userId,
          revisionId,
          true,
        );
        // Resolve or create a default ProcessItem for the project
        let processItemId = dto.processItemId;
        if (
          processItemId &&
          !(await tx.processItem.findFirst({
            where: {
              id: processItemId,
              tenantId,
              projectId: revision.document.projectId,
            },
          }))
        ) {
          throw new BadRequestException(
            'Process item must belong to this program and tenant',
          );
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
        const lastStep = await tx.processStep.findFirst({
          where: { revisionId, revision: { document: { tenantId } } },
          orderBy: { sequenceOrder: 'desc' },
          select: { sequenceOrder: true },
        });

        // Get all step numbers in this revision to compute a unique auto-incrementing stepNumber
        const existingSteps = await tx.processStep.findMany({
          where: { revisionId },
          select: { stepNumber: true },
        });
        const stepNumbers = existingSteps.map((s) => s.stepNumber);

        let calculatedStepNumber = dto.stepNumber;
        if (calculatedStepNumber && stepNumbers.includes(calculatedStepNumber))
          throw new BadRequestException(
            'Operation number already exists in this revision',
          );
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
            manufacturingSymbolId: dto.manufacturingSymbolId,
            engineeringSymbolId: dto.engineeringSymbolId,
            inputs: dto.inputs,
            outputs: dto.outputs,
            resources: dto.resources,
            sequenceOrder: (lastStep?.sequenceOrder || 0) + 1,

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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async updateStep(
    tenantId: string,
    stepId: string,
    dto: UpdateStepDto,
    userId?: string,
  ) {
    this.validateSymbols(dto);
    const before = await this.verifyStepAccess(tenantId, stepId);
    return this.prisma.$transaction(
      async (tx) => {
        await this.access(tx, tenantId, userId, before.revisionId, true);
        const step = await tx.processStep.findFirstOrThrow({
          where: {
            id: stepId,
            revisionId: before.revisionId,
            revision: { document: { tenantId } },
          },
        });
        this.validateSymbols(
          {
            manufacturingSymbolId:
              dto.manufacturingSymbolId === undefined
                ? step.manufacturingSymbolId
                : dto.manufacturingSymbolId,
            engineeringSymbolId: dto.engineeringSymbolId,
          },
          dto.stepType || step.stepType,
        );
        if (dto.stepNumber && dto.stepNumber !== step.stepNumber) {
          const existing = await tx.processStep.findFirst({
            where: {
              revisionId: step.revisionId,
              stepNumber: dto.stepNumber,
              id: { not: stepId },
            },
          });
          if (existing) {
            throw new BadRequestException(
              `Step number '${dto.stepNumber}' already exists in this process flow.`,
            );
          }
        }

        const updatedStep = await tx.processStep.update({
          where: { id: stepId },
          data: {
            stepNumber: dto.stepNumber,
            name: dto.name,
            stepType: dto.stepType,
            manufacturingSymbolId: dto.manufacturingSymbolId,
            engineeringSymbolId: dto.engineeringSymbolId,
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
          const downstreamWhere = {
            linkedPfdStepId: stepId,
            revision: {
              document: {
                tenantId,
                projectId: before.revision.document.projectId,
              },
              status: 'draft',
              lockedAt: null,
            },
          };
          const downstream = await tx.processStep.findMany({
            where: downstreamWhere,
            select: { revisionId: true },
          });
          for (const revisionId of [
            ...new Set(downstream.map((row) => row.revisionId)),
          ].sort())
            await this.access(tx, tenantId, userId, revisionId, true);
          await tx.processStep.updateMany({
            where: downstreamWhere,
            data: {
              stepNumber: updatedStep.stepNumber,
              name: updatedStep.name,
              machinesEquipmentDocs: updatedStep.machinesEquipmentDocs || [],
            },
          });
          for (const revisionId of new Set(
            downstream.map((row) => row.revisionId),
          )) {
            if (revisionId !== step.revisionId)
              await this.invalidateGraph(tx, tenantId, revisionId);
          }
        }

        await this.invalidateGraph(tx, tenantId, step.revisionId);
        return updatedStep;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async removeStep(tenantId: string, stepId: string, userId?: string) {
    const step = await this.verifyStepAccess(tenantId, stepId);
    return this.prisma.$transaction(
      async (tx) => {
        await this.access(tx, tenantId, userId, step.revisionId, true);
        // Validate dependencies before any mutation, including downstream orphan flags.
        const [fmeaCount, cpCount] = await Promise.all([
          tx.pfmeaRow.count({ where: { processStepId: stepId } }),
          tx.operationVersionBinding.count({ where: { processStepId: stepId } }),
        ]);
        if (fmeaCount > 0 || cpCount > 0)
          throw new BadRequestException(
            'Cannot delete step: Associated FMEA rows or Control Plan items already exist. Please delete those analysis rows first to maintain document integrity.',
          );
        if (!step.linkedPfdStepId) {
          const where = {
            linkedPfdStepId: stepId,
            revision: {
              document: {
                tenantId,
                projectId: step.revision.document.projectId,
              },
              status: 'draft',
              lockedAt: null,
            },
          };
          const downstream = await tx.processStep.findMany({
            where,
            select: { revisionId: true },
          });
          for (const revisionId of [
            ...new Set(downstream.map((row) => row.revisionId)),
          ].sort())
            await this.access(tx, tenantId, userId, revisionId, true);
          await tx.processStep.updateMany({
            where,
            data: { isOrphaned: true },
          });
          for (const revisionId of new Set(
            downstream.map((row) => row.revisionId),
          )) {
            if (revisionId !== step.revisionId)
              await this.invalidateGraph(tx, tenantId, revisionId);
          }
        }
        const deleted = await tx.processStep.delete({ where: { id: stepId } });
        await this.invalidateGraph(tx, tenantId, step.revisionId, stepId);
        return deleted;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async importSteps(
    tenantId: string,
    targetRevisionId: string,
    sourceRevisionId: string,
    userId?: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const targetRevision = await this.access(
          tx,
          tenantId,
          userId,
          targetRevisionId,
          true,
        );
        const sourceRevision = await this.access(
          tx,
          tenantId,
          userId,
          sourceRevisionId,
          false,
          true,
        );
        if (
          targetRevisionId === sourceRevisionId ||
          sourceRevision.document.projectId !==
            targetRevision.document.projectId
        )
          throw new BadRequestException(
            'Import requires another PFD revision in the same program',
          );
        const sourceSteps = await tx.processStep.findMany({
          where: { revisionId: sourceRevisionId },
          orderBy: { sequenceOrder: 'asc' },
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

        const targetSteps = await tx.processStep.findMany({
          where: {
            revisionId: targetRevisionId,
            revision: { document: { tenantId } },
          },
          select: {
            id: true,
            stepNumber: true,
            linkedPfdStepId: true,
            sequenceOrder: true,
          },
        });
        const stepIds = new Map<string, string>();
        let sequenceOrder = Math.max(
          0,
          ...targetSteps.map((step) => step.sequenceOrder),
        );
        let importedCount = 0;
        for (const src of sourceSteps) {
          const existing = await tx.processStep.findFirst({
            where: { revisionId: targetRevisionId, linkedPfdStepId: src.id },
          });

          if (existing) stepIds.set(src.id, existing.id);
          if (!existing) {
            if (targetSteps.some((step) => step.stepNumber === src.stepNumber))
              throw new BadRequestException(
                `Operation number ${src.stepNumber} already exists; resolve it before importing`,
              );
            const created = await tx.processStep.create({
              data: {
                revisionId: targetRevisionId,
                processItemId: processItem.id,
                stepNumber: src.stepNumber,
                name: src.name,
                stepType: src.stepType,
                manufacturingSymbolId: src.manufacturingSymbolId,
                engineeringSymbolId: src.engineeringSymbolId,
                sequenceOrder: ++sequenceOrder,
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
            stepIds.set(src.id, created.id);
            importedCount++;
          }
        }

        if (
          importedCount &&
          targetSteps.length === 0 &&
          !targetRevision.pfdGraph &&
          targetRevision.document.type === 'PFD' &&
          sourceRevision.pfdGraph
        ) {
          const graph = sourceRevision.pfdGraph as unknown as PfdGraph;
          if ([1, 2].includes(graph.schemaVersion)) {
            const mapped = {
              ...graph,
              reviewStatus: 'draft',
              nodes: graph.nodes.map((node) =>
                node.kind === 'step'
                  ? { ...node, stepId: stepIds.get(node.stepId || '') }
                  : node,
              ),
            };
            const errors = validatePfdGraph(
              mapped,
              sourceSteps.map((step) => ({
                id: stepIds.get(step.id)!,
                stepType: step.stepType,
              })),
            );
            if (errors.length)
              throw new BadRequestException(
                `Source routing cannot be imported: ${errors.join('; ')}`,
              );
            await tx.documentRevision.updateMany({
              where: {
                id: targetRevisionId,
                document: { tenantId },
                status: 'draft',
                lockedAt: null,
              },
              data: { pfdGraph: mapped as unknown as Prisma.InputJsonValue },
            });
          }
        }
        if (importedCount)
          await this.invalidateGraph(tx, tenantId, targetRevisionId);
        return { importedCount };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async reorderSteps(
    tenantId: string,
    revisionId: string,
    orderedStepIds: string[],
    userId?: string,
  ) {
    if (
      !Array.isArray(orderedStepIds) ||
      orderedStepIds.some((id) => typeof id !== 'string')
    )
      throw new BadRequestException('Expected operation identifiers');
    return this.prisma.$transaction(
      async (tx) => {
        await this.access(tx, tenantId, userId, revisionId, true);
        const steps = await tx.processStep.findMany({
          where: { revisionId, revision: { document: { tenantId } } },
          select: { id: true },
        });
        if (
          new Set(orderedStepIds).size !== orderedStepIds.length ||
          steps.length !== orderedStepIds.length ||
          steps.some((s) => !orderedStepIds.includes(s.id))
        )
          throw new BadRequestException(
            'Reordering must contain each operation in this revision exactly once',
          );
        const changed = [];
        for (const [index, id] of orderedStepIds.entries())
          changed.push(
            await tx.processStep.update({
              where: { id },
              data: { sequenceOrder: index + 1 },
            }),
          );
        await this.invalidateGraph(tx, tenantId, revisionId);
        return changed;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async createStepsBatch(
    tenantId: string,
    revisionId: string,
    dtos: CreateStepDto[],
    userId?: string,
  ) {
    if (!Array.isArray(dtos) || dtos.length > 5000)
      throw new BadRequestException('Expected at most 5000 operations');
    dtos.forEach((dto) =>
      this.validateSymbols(dto, dto.stepType || 'operation'),
    );
    return this.prisma.$transaction(
      async (tx) => {
        const revision = await this.access(
          tx,
          tenantId,
          userId,
          revisionId,
          true,
        );
        for (const dto of dtos)
          if (
            dto.processItemId &&
            !(await tx.processItem.findFirst({
              where: {
                id: dto.processItemId,
                tenantId,
                projectId: revision.document.projectId,
              },
            }))
          )
            throw new BadRequestException(
              'Process item must belong to this program and tenant',
            );
        // Resolve or create a default ProcessItem for the project
        let processItemId: string | undefined;
        const firstDto = dtos[0];
        if (firstDto?.processItemId) {
          if (
            !(await tx.processItem.findFirst({
              where: {
                id: firstDto.processItemId,
                tenantId,
                projectId: revision.document.projectId,
              },
            }))
          )
            throw new BadRequestException(
              'Process item must belong to this program and tenant',
            );
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
        const existingStepNumbers = new Set(
          existingSteps.map((s) => s.stepNumber),
        );
        let maxSequenceOrder =
          existingSteps.length > 0
            ? Math.max(...existingSteps.map((s) => s.sequenceOrder))
            : 0;

        // Compute base prefix and max numeric value for step numbers
        let prefix = 'OP';
        let maxVal = 0;
        for (const num of existingSteps.map((s) => s.stepNumber)) {
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
          if (stepNumber && existingStepNumbers.has(stepNumber))
            throw new BadRequestException(
              `Operation number '${stepNumber}' already exists`,
            );
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
              processItemId: dto.processItemId || processItemId,
              stepNumber,
              name: dto.name || '',
              stepType: dto.stepType || 'operation',
              manufacturingSymbolId: dto.manufacturingSymbolId,
              engineeringSymbolId: dto.engineeringSymbolId,
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
        if (createdSteps.length)
          await this.invalidateGraph(tx, tenantId, revisionId);
        return createdSteps;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
