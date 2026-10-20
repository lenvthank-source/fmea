import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RevisionGuard } from '../../common/revision-guard';
import { assertEngineeringRevisionAccess } from '../../common/engineering-access';
import {
  dfmeaReadiness,
  dfmeaEvaluations,
  emptyDfmea,
  validateDfmea,
  DFMEA_CRITERIA_PROFILE,
} from './dfmea-document';
import type { DfmeaData } from './dfmea-document';
import { dfmeaActionChanges } from './dfmea-action-policy';
export interface DfmeaActor {
  tenantId: string;
  userId: string;
  isGuest?: boolean;
}
@Injectable()
export class DfmeaService {
  constructor(
    private prisma: PrismaService,
    private guard: RevisionGuard,
  ) {}
  async fork(
    actor: DfmeaActor,
    id: string,
    body: { revisionNumber: string; summary: string },
  ) {
    if (!/^\d+\.\d+$/.test(body.revisionNumber))
      throw new BadRequestException('Revision must use X.Y');
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const source = await assertEngineeringRevisionAccess(
            tx,
            actor,
            id,
            'DFMEA',
          );
          const user = await tx.user.findFirstOrThrow({
            where: { id: actor.userId, tenantId: actor.tenantId },
          });
          if (!source.projectWritable)
            throw new BadRequestException(
              'This project is read-only; a new revision cannot be created.',
            );
          if (
            user.isGuest &&
            (source.document.project.createdById !== actor.userId ||
              source.document.project.createdAt.getTime() <
                Date.now() - 86400000)
          )
            throw new BadRequestException(
              'Trial may create revisions only in its active project',
            );
          const saved = await tx.dfmeaDocument.findFirst({
            where: { revisionId: id, tenantId: actor.tenantId },
          });
          if (!saved)
            throw new BadRequestException(
              'Map legacy design analysis before creating a canonical revision',
            );
          const rev = await tx.documentRevision.create({
            data: {
              documentId: source.documentId,
              revisionNumber: body.revisionNumber,
              summary: body.summary,
              status: 'draft',
              createdById: actor.userId,
            },
          });
          await tx.dfmeaDocument.create({
            data: {
              revisionId: rev.id,
              tenantId: actor.tenantId,
              data: saved.data as Prisma.InputJsonValue,
              version: 1,
            },
          });
          await tx.document.update({
            where: { id: source.documentId },
            data: { currentRevisionId: rev.id },
          });
          await tx.auditLog.create({
            data: {
              tenantId: actor.tenantId,
              userId: actor.userId,
              entityType: 'document_revision',
              entityId: rev.id,
              action: 'create',
              newValue: {
                sourceRevisionId: id,
                revisionNumber: body.revisionNumber,
              },
            },
          });
          return { revisionId: rev.id };
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('Revision number already exists');
      throw error;
    }
  }
  async get(actor: DfmeaActor, revisionId: string) {
    const revision = await assertEngineeringRevisionAccess(
      this.prisma,
      actor,
      revisionId,
      'DFMEA',
    );
    const saved = await this.prisma.dfmeaDocument.findUnique({
      where: { revisionId },
    });
    const data = (saved?.data ?? emptyDfmea()) as unknown as DfmeaData;
    const legacyRows = await this.prisma.pfmeaRow.findMany({
      where: { revisionId },
      include: {
        processStep: true,
        functions: { include: { function: true } },
        requirements: { include: { requirement: true } },
        failureModes: { include: { failureMode: true } },
        effects: { include: { effect: true } },
        causes: { include: { cause: true } },
        controls: { include: { control: true } },
      },
      orderBy: { rowNumber: 'asc' },
    });
    const rows = await this.prisma.pfmeaRow.findMany({
      where: {
        revision: {
          document: {
            tenantId: actor.tenantId,
            projectId: revision.document.projectId,
            type: 'PFMEA',
          },
        },
      },
      include: {
        revision: true,
        characteristics: { include: { characteristic: true } },
      },
    });
    const downstreamTargets = [
      ...new Map(
        rows.flatMap((row) =>
          row.characteristics.map(
            (link) =>
              [
                `${row.revisionId}:${link.characteristicId}`,
                {
                  revisionId: row.revisionId,
                  revisionNumber: row.revision.revisionNumber,
                  characteristicId: link.characteristicId,
                  name: link.characteristic.name,
                },
              ] as const,
          ),
        ),
      ).values(),
    ];
    return {
      data,
      downstreamTargets,
      evaluations: dfmeaEvaluations(data),
      criteriaProfile: DFMEA_CRITERIA_PROFILE,
      version: saved?.version ?? 0,
      writable: revision.writable,
      forkable: revision.projectWritable && !!saved,
      legacy: { status: 'unreviewed', rows: legacyRows },
      readiness: dfmeaReadiness(data),
    };
  }
  async save(
    actor: DfmeaActor,
    revisionId: string,
    expectedVersion: number,
    data: unknown,
  ) {
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0)
      throw new BadRequestException(
        'Expected version must be a nonnegative integer.',
      );
    const errors = validateDfmea(data);
    if (errors.length) throw new BadRequestException(errors);
    await this.guard.assertRevisionWritable(actor.tenantId, revisionId);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await assertEngineeringRevisionAccess(
            tx,
            actor,
            revisionId,
            'DFMEA',
            true,
          );
          const saved = await tx.dfmeaDocument.findUnique({
            where: { revisionId },
          });
          if ((saved?.version ?? 0) !== expectedVersion)
            throw new ConflictException(
              'DFMEA changed in another session. Reload before saving.',
            );
          const target = await tx.documentRevision.findUniqueOrThrow({
            where: { id: revisionId },
            include: { document: true },
          });
          for (const mapping of (data as DfmeaData).legacyMappings ?? []) {
            const source = await tx.pfmeaRow.findFirst({
              where: {
                id: mapping.sourceRowId,
                revision: {
                  document: {
                    tenantId: actor.tenantId,
                    projectId: target.document.projectId,
                    type: 'DFMEA',
                  },
                },
              },
            });
            if (!source)
              throw new BadRequestException(
                'Legacy source row is not part of this design program',
              );
          }
          for (const link of (data as DfmeaData).downstreamLinks ?? []) {
            if (!link.targetRevisionId && !link.targetCharacteristicId)
              continue;
            const row = await tx.pfmeaRow.findFirst({
              where: {
                revisionId: link.targetRevisionId,
                revision: {
                  document: {
                    tenantId: actor.tenantId,
                    projectId: target.document.projectId,
                    type: 'PFMEA',
                  },
                },
                characteristics: {
                  some: { characteristicId: link.targetCharacteristicId },
                },
              },
            });
            if (!row)
              throw new BadRequestException(
                'Downstream characteristic is not part of the selected process analysis in this program',
              );
          }
          const oldModel = saved?.data as unknown as DfmeaData | undefined;
          const user = await tx.user.findFirstOrThrow({
            where: { id: actor.userId, tenantId: actor.tenantId },
            select: { name: true, email: true },
          });
          const actionErrors = dfmeaActionChanges(oldModel, data as DfmeaData, {
            id: actor.userId,
            name: user.name,
            email: user.email,
          });
          if (actionErrors.length) throw new BadRequestException(actionErrors);
          const result = saved
            ? await tx.dfmeaDocument.updateMany({
                where: { id: saved.id, version: expectedVersion },
                data: {
                  data: data as Prisma.InputJsonValue,
                  version: { increment: 1 },
                },
              })
            : null;
          if (result && result.count !== 1)
            throw new ConflictException('DFMEA changed in another session.');
          if (!saved)
            await tx.dfmeaDocument.create({
              data: {
                revisionId,
                tenantId: actor.tenantId,
                data: data as Prisma.InputJsonValue,
                version: 1,
              },
            });
          await tx.auditLog.create({
            data: {
              tenantId: actor.tenantId,
              userId: actor.userId,
              entityType: 'document_revision',
              entityId: revisionId,
              action: 'update',
              oldValue: saved?.data ?? undefined,
              newValue: {
                version: expectedVersion + 1,
                dfmea: data,
              } as Prisma.InputJsonValue,
            },
          });
          return {
            data,
            evaluations: dfmeaEvaluations(data as DfmeaData),
            criteriaProfile: DFMEA_CRITERIA_PROFILE,
            version: expectedVersion + 1,
            readiness: dfmeaReadiness(data as DfmeaData),
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      )
        throw new ConflictException(
          'DFMEA changed in another session. Reload before saving.',
        );
      throw error;
    }
  }
}
