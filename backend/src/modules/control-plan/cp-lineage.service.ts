import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';
import {
  CpDocumentV2,
  CpOperationV2,
  CpCharacteristicV2,
  CpControlV2,
  CpResourceV2,
} from './control-plan-document';

export interface RecordLineageRelationDto {
  groupId: string;
  predecessorIds: string[];
  successorIds: string[];
  kind: 'split' | 'merge' | 'replacement';
  reason?: string;
  actorId: string;
}

@Injectable()
export class CpLineageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves or binds an operation version to a logical lineage.
   * If the step already has a binding, returns its existing lineage.
   * If unbound, creates a new lineage for this step record without guessing from names.
   */
  async getOrCreateLineage(
    tenantId: string,
    projectId: string,
    sourceRevisionId: string,
    processStepId: string,
    createdById?: string,
    client?: Prisma.TransactionClient,
  ): Promise<{ lineageId: string; bindingId: string; isNew: boolean }> {
    const db = client ?? this.prisma;

    const existingBinding = await db.operationVersionBinding.findUnique({
      where: { processStepId },
    });

    if (existingBinding) {
      if (existingBinding.tenantId !== tenantId || existingBinding.projectId !== projectId) {
        throw new ConflictException('Cross-tenant or cross-project lineage binding violation.');
      }
      return {
        lineageId: existingBinding.lineageId,
        bindingId: existingBinding.id,
        isNew: false,
      };
    }

    const lineage = await db.operationLineage.create({
      data: {
        tenantId,
        projectId,
        createdById,
      },
    });

    const binding = await db.operationVersionBinding.create({
      data: {
        tenantId,
        projectId,
        lineageId: lineage.id,
        sourceRevisionId,
        processStepId,
        actorId: createdById,
      },
    });

    return {
      lineageId: lineage.id,
      bindingId: binding.id,
      isNew: true,
    };
  }

  /**
   * Records explicit acyclic split, merge, or replacement relations between lineages.
   */
  async recordLineageRelation(
    tenantId: string,
    projectId: string,
    dto: RecordLineageRelationDto,
    client?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = client ?? this.prisma;

    if (!dto.predecessorIds.length || !dto.successorIds.length) {
      throw new BadRequestException('Split/merge relations require at least one predecessor and successor.');
    }

    // Acyclic check: no overlap between predecessor and successor sets
    const predSet = new Set(dto.predecessorIds);
    for (const succ of dto.successorIds) {
      if (predSet.has(succ)) {
        throw new BadRequestException(`Cycle detected: lineage ${succ} cannot be both predecessor and successor.`);
      }
    }

    // Verify all lineages belong to the same tenant and project
    const allIds = Array.from(new Set([...dto.predecessorIds, ...dto.successorIds]));
    const lineages = await db.operationLineage.findMany({
      where: {
        id: { in: allIds },
        tenantId,
        projectId,
      },
    });

    if (lineages.length !== allIds.length) {
      throw new BadRequestException('One or more lineages do not exist in the specified project scope.');
    }

    for (const pred of dto.predecessorIds) {
      for (const succ of dto.successorIds) {
        await db.operationLineageRelation.create({
          data: {
            tenantId,
            projectId,
            groupId: dto.groupId,
            predecessorId: pred,
            successorId: succ,
            kind: dto.kind,
            actorId: dto.actorId,
            reason: dto.reason,
          },
        });
      }
    }
  }

  /**
   * Binds cloned steps to existing or new lineages during PFD cloning / replication.
   * - Same project: preserves the existing lineage across the new process step.
   * - Cross project: creates a new target lineage, mapping source lineage -> target lineage.
   */
  async cloneOperationLineages(
    tenantId: string,
    sourceProjectId: string,
    targetProjectId: string,
    processStepMap: Map<string, string>, // sourceStepId -> targetStepId
    targetRevisionId: string,
    actorId: string,
    client: Prisma.TransactionClient,
  ): Promise<Map<string, string>> {
    const isSameProject = sourceProjectId === targetProjectId;
    const lineageMap = new Map<string, string>(); // sourceLineageId -> targetLineageId

    const sourceStepIds = Array.from(processStepMap.keys());
    if (!sourceStepIds.length) return lineageMap;

    const sourceBindings = await client.operationVersionBinding.findMany({
      where: {
        processStepId: { in: sourceStepIds },
        tenantId,
        projectId: sourceProjectId,
      },
    });

    const bindingByStep = new Map(sourceBindings.map((b) => [b.processStepId, b]));

    for (const [sourceStepId, targetStepId] of processStepMap.entries()) {
      let sourceLineageId = bindingByStep.get(sourceStepId)?.lineageId;

      // If source step was previously unbound, ensure a lineage exists for it
      if (!sourceLineageId) {
        const created = await client.operationLineage.create({
          data: {
            tenantId,
            projectId: sourceProjectId,
            createdById: actorId,
          },
        });
        sourceLineageId = created.id;
        await client.operationVersionBinding.create({
          data: {
            tenantId,
            projectId: sourceProjectId,
            lineageId: sourceLineageId,
            sourceRevisionId: targetRevisionId,
            processStepId: sourceStepId,
            actorId,
          },
        });
      }

      let targetLineageId: string;
      if (isSameProject) {
        // Same project retains identical logical lineage
        targetLineageId = sourceLineageId;
      } else {
        // Cross project requires a fresh project-scoped lineage
        if (!lineageMap.has(sourceLineageId)) {
          const targetLineage = await client.operationLineage.create({
            data: {
              tenantId,
              projectId: targetProjectId,
              createdById: actorId,
            },
          });
          lineageMap.set(sourceLineageId, targetLineage.id);
        }
        targetLineageId = lineageMap.get(sourceLineageId)!;
      }

      await client.operationVersionBinding.create({
        data: {
          tenantId,
          projectId: targetProjectId,
          lineageId: targetLineageId,
          sourceRevisionId: targetRevisionId,
          processStepId: targetStepId,
          actorId,
          reason: isSameProject ? 'PFD revision clone' : 'Project replication',
        },
      });
    }

    return lineageMap;
  }

  /**
   * Typed V2 clone / fork adapter:
   * Generates fresh nested UUIDs for operations, characteristics, controls, and resources.
   * Retains logical lineage and resets review/approval state for new draft revisions.
   */
  cloneV2ControlPlan(
    doc: CpDocumentV2,
    options: {
      resetReviews?: boolean;
      targetProjectLineageMap?: Map<string, string>;
    } = {},
  ): CpDocumentV2 {
    const cloned: CpDocumentV2 = {
      schemaVersion: 2,
      config: structuredClone(doc.config),
      header: structuredClone(doc.header),
      sourceBaselines: structuredClone(doc.sourceBaselines),
      operations: [],
      sourceExclusions: structuredClone(doc.sourceExclusions ?? []),
      legacyUnmappedContent: structuredClone(doc.legacyUnmappedContent ?? []),
    };

    for (const op of doc.operations) {
      const newOpId = randomUUID();
      const mappedLineageId = op.lineageId
        ? options.targetProjectLineageMap?.get(op.lineageId) ?? op.lineageId
        : null;

      const newResources: CpResourceV2[] = op.resources.map((r) => ({
        id: randomUUID(),
        kind: r.kind,
        text: r.text,
        controlledReference: r.controlledReference,
        sources: r.sources ? structuredClone(r.sources) : undefined,
      }));

      const newCharacteristics: CpCharacteristicV2[] = op.characteristics.map((c) => {
        const newCharId = randomUUID();
        const newControls: CpControlV2[] = c.controls.map((ctrl) => ({
          id: randomUUID(),
          controlType: ctrl.controlType,
          method: ctrl.method,
          evaluationMethod: ctrl.evaluationMethod,
          measurementEquipment: ctrl.measurementEquipment,
          executionRule: structuredClone(ctrl.executionRule),
          reaction: structuredClone(ctrl.reaction),
          responsibility: ctrl.responsibility,
          recordReference: ctrl.recordReference,
          implementation: options.resetReviews ? undefined : structuredClone(ctrl.implementation),
          sourceBindings: ctrl.sourceBindings ? structuredClone(ctrl.sourceBindings) : undefined,
          legacyFields: ctrl.legacyFields ? structuredClone(ctrl.legacyFields) : undefined,
        }));

        return {
          id: newCharId,
          number: c.number,
          kind: c.kind,
          name: c.name,
          description: c.description,
          criteria: structuredClone(c.criteria),
          classification: c.classification,
          sources: c.sources ? structuredClone(c.sources) : undefined,
          controls: newControls,
        };
      });

      const newOp: CpOperationV2 = {
        id: newOpId,
        lineageId: mappedLineageId,
        order: op.order,
        number: op.number,
        name: op.name,
        sourceBindings: op.sourceBindings ? structuredClone(op.sourceBindings) : undefined,
        resources: newResources,
        applicability: options.resetReviews ? '' : op.applicability,
        characteristics: newCharacteristics,
      };

      cloned.operations.push(newOp);
    }

    return cloned;
  }
}
