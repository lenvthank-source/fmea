import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { assertEngineeringRevisionAccess } from '../../common/engineering-access';
import {
  normalizeCpDocument,
  controlPlanReadiness,
  blankCpLine,
  emptyCpDocument,
  validateCpDocument,
  previewCp,
  applyCpChanges,
  fingerprint,
  sourceFields,
} from './control-plan-document';
import type { CpDocument, CpLine } from './control-plan-document';
import type { Prisma } from '@prisma/client';
const CP_TRANSACTION_OPTIONS = {
  isolationLevel: 'Serializable' as const,
  timeout: 30000,
  maxWait: 10000,
};
export interface CpActor {
  tenantId: string;
  userId: string;
  isGuest?: boolean;
}
@Injectable()
export class ControlPlanDocumentService {
  constructor(private readonly prisma: PrismaService) {}
  private async transaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(work, CP_TRANSACTION_OPTIONS);
    } catch (error) {
      if (
        ['P2034', 'P2002'].includes(String((error as { code?: string }).code))
      )
        throw new ConflictException(
          'Document or revision changed concurrently. Reload and retry.',
        );
      if ((error as { code?: string }).code === 'P2028')
        throw new ServiceUnavailableException(
          'Control-plan save did not finish before the transaction ended. Keep your local edits and reload the saved revision version before retrying.',
        );
      throw error;
    }
  }
  private equipment(value: unknown): string {
    return Array.isArray(value)
      ? value
          .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
          .join('; ')
      : typeof value === 'string'
        ? value
        : value
          ? JSON.stringify(value)
          : '';
  }
  private async context(
    db: Prisma.TransactionClient,
    actor: CpActor,
    id: string,
    write = false,
  ) {
    return assertEngineeringRevisionAccess(
      db,
      actor,
      id,
      'CONTROL_PLAN',
      write,
    );
  }
  private async load(
    db: Prisma.TransactionClient,
    id: string,
  ): Promise<{
    version: number;
    document: CpDocument;
    legacyReviewRequired: boolean;
  }> {
    const saved = await db.controlPlanDocument.findUnique({
      where: { revisionId: id },
    });
    if (saved)
      return {
        version: saved.version,
        document: normalizeCpDocument(saved.data),
        legacyReviewRequired: false,
      };
    const revision = await db.documentRevision.findUniqueOrThrow({
      where: { id },
      include: { document: { include: { project: true } } },
    });
    const p = revision.document.project;
    const header = Object.fromEntries(
      [
        'organisationName',
        'organisationPlant',
        'orgPartNumber',
        'customerPartNumber',
        'partName',
        'customer',
        'drawingRevDate',
        'dwgNumber',
        'dwgRevNoAndDate',
        'controlPlanNumber',
        'keyContact',
        'originationDate',
        'latestChangeLevel',
      ].map((k) => [
        k,
        String((p as unknown as Record<string, unknown>)[k] ?? ''),
      ]),
    );
    header.issueDate = header.originationDate;
    header.engineeringChangeLevel = header.latestChangeLevel;
    header.revisionNumber = revision.revisionNumber;
    const document = emptyCpDocument(header);
    const rows = await db.controlPlanRow.findMany({
      where: { revisionId: id },
      include: {
        processStep: { include: { revision: { include: { document: true } } } },
        characteristic: true,
        pfmeaRows: true,
      },
      orderBy: [{ rowNumber: 'asc' }, { id: 'asc' }],
    });
    if (
      rows.some(
        (r) =>
          r.processStep.revision.document.tenantId !==
            revision.document.tenantId ||
          r.processStep.revision.document.projectId !==
            revision.document.projectId ||
          (r.characteristic &&
            r.characteristic.tenantId !== revision.document.tenantId),
      )
    )
      throw new BadRequestException(
        'Legacy control plan contains invalid program references. Ask an administrator to repair its source links.',
      );
    document.lines = rows.map((r) =>
      Object.assign(blankCpLine(r.id), {
        operationId: r.processStepId,
        operationNumber: r.processStep.stepNumber,
        operationName: r.processStep.name,
        equipment: this.equipment(r.processStep.machinesEquipmentDocs),
        characteristicId: r.characteristicId ?? '',
        characteristicName: r.characteristic?.name ?? '',
        classification: r.characteristic?.classification ?? '',
        unit: r.characteristic?.unitOfMeasure ?? '',
        specification: r.specTolerance ?? '',
        evaluationMethod: r.measurementMethod ?? '',
        sampleSize: r.sampleSize ?? '',
        frequency: r.frequency ?? '',
        controlMethod: r.controlMethod ?? '',
        controlType: ['prevention', 'detection'].includes(r.controlType)
          ? r.controlType
          : 'unspecified',
        reactionPlan: r.reactionPlan ?? '',
        responsible: r.responsible ?? '',
        notes: r.notes ?? '',
        sourceState: 'manual',
      }),
    );
    return { version: 0, document, legacyReviewRequired: rows.length > 0 };
  }
  async fork(
    actor: CpActor,
    id: string,
    body: { revisionNumber: string; phase: string; summary: string },
  ) {
    if (
      !/^\d+\.\d+$/.test(body.revisionNumber) ||
      !['prototype', 'pre-launch', 'production'].includes(body.phase)
    )
      throw new BadRequestException(
        'Provide revision X.Y and a valid plan phase',
      );
    try {
      return await this.prisma.$transaction(async (tx) => {
        const source = await this.context(tx, actor, id);
        if (!source.projectWritable)
          throw new ForbiddenException(
            'This program does not permit creating revisions.',
          );
        const user = await tx.user.findFirstOrThrow({
          where: { id: actor.userId, tenantId: actor.tenantId },
        });
        if (
          user.isGuest &&
          (source.document.project.createdById !== actor.userId ||
            source.document.project.createdAt.getTime() < Date.now() - 86400000)
        )
          throw new BadRequestException(
            'Trial may create revisions only in its active project',
          );
        const loaded = await this.load(tx, id);
        const revision = await tx.documentRevision.create({
          data: {
            documentId: source.documentId,
            revisionNumber: body.revisionNumber,
            status: 'draft',
            summary: body.summary || `Control Plan ${body.phase}`,
            createdById: actor.userId,
          },
        });
        const document = structuredClone(loaded.document);
        document.config.phase = body.phase as CpDocument['config']['phase'];
        document.header.revisionNumber = body.revisionNumber;
        await tx.controlPlanDocument.create({
          data: {
            revisionId: revision.id,
            tenantId: actor.tenantId,
            version: 1,
            data: document as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.document.update({
          where: { id: source.documentId },
          data: { currentRevisionId: revision.id },
        });
        await tx.auditLog.create({
          data: {
            tenantId: actor.tenantId,
            userId: actor.userId,
            entityType: 'document_revision',
            entityId: revision.id,
            action: 'create',
            newValue: {
              sourceRevisionId: id,
              phase: body.phase,
              revisionNumber: body.revisionNumber,
            },
          },
        });
        return { revisionId: revision.id };
      }, CP_TRANSACTION_OPTIONS);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('Revision number already exists');
      if ((error as { code?: string }).code === 'P2034')
        throw new ConflictException(
          'Program changed concurrently. Reload before creating a revision.',
        );
      throw error;
    }
  }
  async get(actor: CpActor, id: string) {
    const revision = await this.context(this.prisma, actor, id);
    const loaded = await this.load(this.prisma, id);
    return {
      revisionId: id,
      ...loaded,
      writable: revision.writable,
      forkable: revision.projectWritable,
    };
  }
  private async validateLinks(
    db: Prisma.TransactionClient,
    actor: CpActor,
    id: string,
    document: CpDocument,
  ) {
    const refs = [
      ...document.lines.flatMap((l) => [
        l.operationId,
        l.characteristicId,
        l.source?.revisionId,
        l.source?.pfmeaRowId,
        l.source?.controlId,
        l.source?.characteristicId,
        l.source?.requirementId,
      ]),
      ...document.sourceBaselines.map((b) => b.revisionId),
    ];
    if (
      refs.some(
        (ref) =>
          ref &&
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            ref,
          ),
      )
    )
      throw new BadRequestException(
        'Invalid control-plan reference identifier.',
      );
    const target = await db.documentRevision.findUniqueOrThrow({
      where: { id },
      include: { document: true },
    });
    const projectId = target.document.projectId;
    const activeLines = document.lines.filter(
      (l) => l.sourceState !== 'removed',
    );
    const operationIds = [
      ...new Set(activeLines.map((l) => l.operationId).filter(Boolean)),
    ];
    const characteristicIds = [
      ...new Set(activeLines.map((l) => l.characteristicId).filter(Boolean)),
    ];
    const sourceRowIds = [
      ...new Set(
        activeLines.flatMap((l) =>
          l.source?.pfmeaRowId ? [l.source.pfmeaRowId] : [],
        ),
      ),
    ];
    // All maps are request-local and read through the same transaction snapshot.
    const [operations, characteristicCount, sourceRows] = await Promise.all([
      operationIds.length
        ? db.processStep.findMany({
            where: {
              id: { in: operationIds },
              revision: {
                document: {
                  projectId,
                  tenantId: actor.tenantId,
                  type: { in: ['PFD', 'PFMEA'] },
                },
              },
            },
            select: { id: true, revisionId: true },
          })
        : Promise.resolve([]),
      characteristicIds.length
        ? db.characteristic.count({
            where: { id: { in: characteristicIds }, tenantId: actor.tenantId },
          })
        : Promise.resolve(0),
      sourceRowIds.length
        ? db.pfmeaRow.findMany({
            where: {
              id: { in: sourceRowIds },
              revision: {
                document: {
                  projectId,
                  tenantId: actor.tenantId,
                  type: 'PFMEA',
                },
              },
            },
            include: {
              controls: true,
              characteristics: true,
              requirements: true,
            },
          })
        : Promise.resolve([]),
    ]);
    if (operations.length !== operationIds.length)
      throw new BadRequestException(
        'Control-plan operations must belong to a PFD or PFMEA in this program.',
      );
    if (characteristicCount !== characteristicIds.length)
      throw new BadRequestException('Invalid characteristic reference.');
    const operationMap = new Map(
      operations.map((operation) => [operation.id, operation]),
    );
    const sourceRowMap = new Map(sourceRows.map((row) => [row.id, row]));
    const revisions = new Map<
      string,
      Awaited<ReturnType<typeof assertEngineeringRevisionAccess>>
    >();
    const sourceRevision = async (
      revisionId: string,
      expectedType?: string,
    ) => {
      let revision = revisions.get(revisionId);
      if (!revision) {
        revision = await assertEngineeringRevisionAccess(db, actor, revisionId);
        revisions.set(revisionId, revision);
      }
      if (
        revision.document.projectId !== projectId ||
        !['PFD', 'PFMEA'].includes(revision.document.type) ||
        (expectedType && revision.document.type !== expectedType)
      )
        throw new BadRequestException(
          'Source baseline belongs to another program or document type.',
        );
      return revision;
    };
    for (const baseline of document.sourceBaselines)
      await sourceRevision(baseline.revisionId, baseline.type);
    for (const exclusion of document.sourceExclusions ?? [])
      if (
        !document.sourceBaselines.some(
          (b) => b.revisionId === exclusion.revisionId,
        )
      )
        throw new BadRequestException(
          'Source exclusion must reference a selected baseline.',
        );
    for (const line of document.lines) {
      const source = line.source;
      if (!source) continue;
      await sourceRevision(source.revisionId);
      // Removed-source lines retain their historical text until an explicit resolution.
      if (line.sourceState === 'removed') continue;
      if (source.pfmeaRowId) {
        const row = sourceRowMap.get(source.pfmeaRowId);
        if (
          !row ||
          row.revisionId !== source.revisionId ||
          line.operationId !== row.processStepId ||
          (source.controlId &&
            !row.controls.some((c) => c.controlId === source.controlId)) ||
          (source.characteristicId &&
            !row.characteristics.some(
              (c) => c.characteristicId === source.characteristicId,
            )) ||
          (source.requirementId &&
            !row.requirements.some(
              (r) => r.requirementId === source.requirementId,
            ))
        )
          throw new BadRequestException('Invalid source FMEA mapping.');
      } else if (
        operationMap.get(line.operationId)?.revisionId !== source.revisionId
      )
        throw new BadRequestException('Invalid source operation mapping.');
    }
  }

  private async persist(
    db: Prisma.TransactionClient,
    actor: CpActor,
    id: string,
    expectedVersion: number,
    document: CpDocument,
  ) {
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0)
      throw new BadRequestException(
        'Expected version must be a nonnegative integer.',
      );
    document = normalizeCpDocument(document);
    const access = await this.context(db, actor, id, true);
    await this.validateLinks(db, actor, id, document);
    const existing = await db.controlPlanDocument.findUnique({
      where: { revisionId: id },
    });
    if ((existing?.version ?? 0) !== expectedVersion)
      throw new ConflictException(
        'Control plan changed. Reload before saving.',
      );
    if (existing) {
      const changed = await db.controlPlanDocument.updateMany({
        where: { revisionId: id, version: expectedVersion },
        data: {
          data: document as unknown as Prisma.InputJsonValue,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1)
        throw new ConflictException(
          'Control plan changed. Reload before saving.',
        );
    } else
      await db.controlPlanDocument.create({
        data: {
          revisionId: id,
          tenantId: actor.tenantId,
          version: 1,
          data: document as unknown as Prisma.InputJsonValue,
        },
      });
    await db.auditLog.create({
      data: {
        tenantId: actor.tenantId,
        userId: actor.userId,
        entityType: 'document_revision',
        entityId: id,
        action: 'update',
        oldValue: existing?.data ?? undefined,
        newValue: {
          revisionId: id,
          version: expectedVersion + 1,
          controlPlan: document,
        } as unknown as Prisma.InputJsonValue,
      },
    });
    return {
      revisionId: id,
      version: expectedVersion + 1,
      document,
      writable: true,
      forkable: access.projectWritable,
      legacyReviewRequired: false,
    };
  }
  async readiness(actor: CpActor, id: string) {
    await this.context(this.prisma, actor, id);
    const loaded = await this.load(this.prisma, id),
      result = controlPlanReadiness(loaded.document);
    for (const baseline of loaded.document.sourceBaselines) {
      const preview = await this.makePreview(
        this.prisma,
        actor,
        id,
        baseline.revisionId,
      );
      result.warnings.push(...preview.warnings);
      const unmapped = preview.changes.filter((c) => c.kind === 'add').length;
      if (unmapped)
        result.errors.push(
          `${unmapped} source control candidates remain unmapped; map them or document reviewed exclusions.`,
        );
      if (preview.changes.some((c) => c.kind !== 'add'))
        result.errors.push(
          'Review changed or removed source mappings before submission.',
        );
    }
    return { ...result, ready: result.errors.length === 0 };
  }
  async save(
    actor: CpActor,
    id: string,
    body: { expectedVersion: number; document: CpDocument },
  ) {
    return this.transaction((tx) =>
      this.persist(tx, actor, id, body.expectedVersion, body.document),
    );
  }
  private async candidates(
    db: Prisma.TransactionClient,
    actor: CpActor,
    id: string,
    sourceRevisionId: string,
  ) {
    const target = await this.context(db, actor, id);
    const source = await assertEngineeringRevisionAccess(
      db,
      actor,
      sourceRevisionId,
    );
    if (
      source.document.projectId !== target.document.projectId ||
      !['PFD', 'PFMEA'].includes(source.document.type)
    )
      throw new BadRequestException(
        'Choose a PFD or PFMEA revision from this program.',
      );
    const candidates: CpLine[] = [];
    const warnings: string[] = [];
    if (source.document.type === 'PFD') {
      const steps = await db.processStep.findMany({
        where: { revisionId: sourceRevisionId },
        orderBy: [{ sequenceOrder: 'asc' }, { id: 'asc' }],
      });
      for (const step of steps)
        candidates.push(
          Object.assign(blankCpLine(`source-${step.id}`), {
            operationId: step.id,
            operationNumber: step.stepNumber,
            operationName: step.name,
            equipment: this.equipment(step.machinesEquipmentDocs),
            source: {
              key: `pfd:${step.id}`,
              revisionId: sourceRevisionId,
              snapshot: {},
            },
            sourceState: 'current',
          }),
        );
      warnings.push(
        'PFD adds operation coverage only. Characteristics, specifications, sampling, methods and reactions require engineering definition.',
      );
    } else {
      const rows = await db.pfmeaRow.findMany({
        where: { revisionId: sourceRevisionId },
        include: {
          processStep: true,
          controls: { include: { control: true } },
          characteristics: { include: { characteristic: true } },
          requirements: { include: { requirement: true } },
        },
        orderBy: [{ rowNumber: 'asc' }, { id: 'asc' }],
      });
      const operationIds = [
        ...new Set(
          rows
            .map((row) => row.processStepId)
            .filter((value): value is string => Boolean(value)),
        ),
      ];
      const validOperationIds = new Set(
        (
          await db.processStep.findMany({
            where: {
              id: { in: operationIds },
              revision: {
                document: {
                  tenantId: actor.tenantId,
                  projectId: target.document.projectId,
                  type: { in: ['PFD', 'PFMEA'] },
                },
              },
            },
            select: { id: true },
          })
        ).map((operation) => operation.id),
      );
      for (const row of rows) {
        if (row.processStep) {
          if (!validOperationIds.has(row.processStep.id))
            throw new BadRequestException(
              'Source PFMEA contains an operation outside this program.',
            );
        }
        if (
          row.controls.some((c) => c.control.tenantId !== actor.tenantId) ||
          row.characteristics.some(
            (c) => c.characteristic.tenantId !== actor.tenantId,
          ) ||
          row.requirements.some(
            (r) => r.requirement.tenantId !== actor.tenantId,
          )
        )
          throw new BadRequestException(
            'Source PFMEA contains invalid tenant references.',
          );
        if (!row.processStep) {
          warnings.push(
            `PFMEA row ${row.rowNumber} has no operation; resolve before mapping.`,
          );
          continue;
        }
        if (!row.controls.length) {
          warnings.push(
            `PFMEA row ${row.rowNumber} has no control; no execution strategy invented.`,
          );
          continue;
        }
        row.controls.sort((a, b) => a.controlId.localeCompare(b.controlId));
        row.characteristics.sort((a, b) =>
          a.characteristicId.localeCompare(b.characteristicId),
        );
        row.requirements.sort((a, b) =>
          a.requirementId.localeCompare(b.requirementId),
        );
        const chars = row.characteristics.length
            ? row.characteristics.map((c) => c.characteristic)
            : [null],
          reqs = row.requirements.length
            ? row.requirements.map((r) => r.requirement)
            : [null];
        if (chars.length > 1 || reqs.length > 1)
          warnings.push(
            `PFMEA row ${row.rowNumber}: multiple characteristic/requirement candidates require explicit mapping review.`,
          );
        for (const link of row.controls)
          for (const char of chars)
            for (const req of reqs) {
              const control = link.control,
                key = `pfmea:${row.id}:${control.id}:${char?.id ?? 'none'}:${req?.id ?? 'none'}`;
              if (candidates.length >= 20000)
                throw new BadRequestException(
                  'Source has too many ambiguous mappings; split or refine source analysis before preview.',
                );
              candidates.push(
                Object.assign(
                  blankCpLine(`source-${fingerprint(key).slice(0, 24)}`),
                  {
                    operationId: row.processStep.id,
                    operationNumber: row.processStep.stepNumber,
                    operationName: row.processStep.name,
                    equipment: this.equipment(
                      row.processStep.machinesEquipmentDocs,
                    ),
                    characteristicId: char?.id ?? '',
                    characteristicName: char?.name ?? '',
                    classification: char?.classification ?? '',
                    unit: char?.unitOfMeasure ?? '',
                    specification: req?.spec ?? '',
                    tolerance: req?.tolerance ?? '',
                    sourceRequirement: req?.name ?? '',
                    evaluationMethod: control.detectionMethod ?? '',
                    controlMethod: control.name,
                    controlType: control.type,
                    source: {
                      key,
                      revisionId: sourceRevisionId,
                      pfmeaRowId: row.id,
                      controlId: control.id,
                      ...(char ? { characteristicId: char.id } : {}),
                      ...(req ? { requirementId: req.id } : {}),
                      snapshot: {},
                    },
                    sourceState: 'current',
                  },
                ),
              );
            }
      }
    }
    for (const line of candidates)
      line.source!.snapshot = Object.fromEntries(
        sourceFields.map((k) => [k, line[k]]),
      );
    return {
      candidates,
      warnings,
      type: source.document.type as 'PFD' | 'PFMEA',
    };
  }
  private async makePreview(
    db: Prisma.TransactionClient,
    actor: CpActor,
    id: string,
    sourceRevisionId: string,
  ) {
    const loaded = await this.load(db, id),
      source = await this.candidates(db, actor, id, sourceRevisionId);
    return {
      expectedVersion: loaded.version,
      sourceRevisionId,
      sourceFingerprint: fingerprint(source.candidates),
      changes: previewCp(loaded.document, source.candidates, sourceRevisionId),
      warnings: source.warnings,
      document: loaded.document,
      type: source.type,
    };
  }
  async preview(actor: CpActor, id: string, sourceRevisionId: string) {
    await this.context(this.prisma, actor, id);
    const { document, type, ...preview } = await this.makePreview(
      this.prisma,
      actor,
      id,
      sourceRevisionId,
    );
    return preview;
  }
  async apply(
    actor: CpActor,
    id: string,
    body: {
      expectedVersion: number;
      sourceRevisionId: string;
      sourceFingerprint: string;
      decisions: {
        key: string;
        action: string;
        reason?: string;
        resolutions?: Record<string, 'source' | 'current'>;
      }[];
    },
  ) {
    if (!Array.isArray(body.decisions))
      throw new BadRequestException('Explicit source decisions are required.');
    return this.transaction(async (tx) => {
      await this.context(tx, actor, id, true);
      const preview = await this.makePreview(
        tx,
        actor,
        id,
        body.sourceRevisionId,
      );
      if (
        preview.expectedVersion !== body.expectedVersion ||
        preview.sourceFingerprint !== body.sourceFingerprint
      )
        throw new ConflictException(
          'Control plan or source changed. Preview again.',
        );
      const document = applyCpChanges(
        preview.document,
        preview.changes,
        body.decisions,
      );
      const detached = document.lines.filter(
        (line) =>
          !line.source &&
          preview.changes.some(
            (change) => change.kind === 'remove' && change.lineId === line.id,
          ),
      );
      const operationIds = [
        ...new Set(detached.map((line) => line.operationId).filter(Boolean)),
      ];
      const characteristicIds = [
        ...new Set(
          detached.map((line) => line.characteristicId).filter(Boolean),
        ),
      ];
      const [existingOperations, existingCharacteristics] = await Promise.all([
        operationIds.length
          ? tx.processStep.findMany({
              where: {
                id: { in: operationIds },
                revision: { document: { tenantId: actor.tenantId } },
              },
              select: { id: true },
            })
          : Promise.resolve([]),
        characteristicIds.length
          ? tx.characteristic.findMany({
              where: {
                id: { in: characteristicIds },
                tenantId: actor.tenantId,
              },
              select: { id: true },
            })
          : Promise.resolve([]),
      ]);
      const presentOperations = new Set(
          existingOperations.map((value) => value.id),
        ),
        presentCharacteristics = new Set(
          existingCharacteristics.map((value) => value.id),
        );
      for (const line of detached) {
        if (line.operationId && !presentOperations.has(line.operationId))
          line.operationId = '';
        if (
          line.characteristicId &&
          !presentCharacteristics.has(line.characteristicId)
        )
          line.characteristicId = '';
      }
      if (
        !document.sourceBaselines.some(
          (b) => b.revisionId === body.sourceRevisionId,
        )
      )
        document.sourceBaselines.push({
          revisionId: body.sourceRevisionId,
          type: preview.type,
        });
      return this.persist(tx, actor, id, body.expectedVersion, document);
    });
  }
}
