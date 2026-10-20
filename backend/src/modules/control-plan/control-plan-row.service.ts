import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCpRowDto } from './dto/create-cp-row.dto';
import { UpdateCpRowDto } from './dto/update-cp-row.dto';
import { assertEngineeringRevisionAccess } from '../../common/engineering-access';
import type { CpActor } from './control-plan-document.service';
import { RevisionGuard } from '../../common/revision-guard';

@Injectable()
export class ControlPlanRowService {
  constructor(
    private prisma: PrismaService,
    private revisionGuard: RevisionGuard,
  ) {}

  private async verifyRevisionAccess(tenantId: string, revisionId: string) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: { document: true },
    });

    if (!revision) {
      throw new NotFoundException('Document revision not found');
    }

    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException(
        'You do not have access to this document revision',
      );
    }

    return revision;
  }

  private async verifyRowAccess(tenantId: string, rowId: string) {
    const row = await this.prisma.controlPlanRow.findUnique({
      where: { id: rowId },
      include: {
        revision: {
          include: { document: true },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Control Plan row not found');
    }

    if (row.revision.document.tenantId !== tenantId) {
      throw new ForbiddenException(
        'You do not have access to this Control Plan row',
      );
    }

    return row;
  }

  async findAllRows(
    actor: CpActor,
    revisionId: string,
    page?: number,
    limit?: number,
  ) {
    const tenantId = actor.tenantId;
    const revision = await assertEngineeringRevisionAccess(
      this.prisma,
      actor,
      revisionId,
      'CONTROL_PLAN',
    );

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [rows, total] = await Promise.all([
      this.prisma.controlPlanRow.findMany({
        where: { revisionId },
        include: {
          processStep: {
            include: { revision: { include: { document: true } } },
          },
          characteristic: true,
          pfmeaRows: {
            include: {
              pfmeaRow: {
                include: { revision: { include: { document: true } } },
              },
            },
          },
        },
        orderBy: { rowNumber: 'asc' },
        skip,
        take,
      }),
      this.prisma.controlPlanRow.count({ where: { revisionId } }),
    ]);

    if (
      rows.some(
        (r) =>
          r.processStep.revision.document.tenantId !== tenantId ||
          r.processStep.revision.document.projectId !==
            revision.document.projectId ||
          (r.characteristic && r.characteristic.tenantId !== tenantId) ||
          r.pfmeaRows.some(
            (link) =>
              link.pfmeaRow.revision.document.tenantId !== tenantId ||
              link.pfmeaRow.revision.document.projectId !==
                revision.document.projectId,
          ),
      )
    )
      throw new BadRequestException(
        'Legacy control plan has invalid source links requiring administrator repair.',
      );
    const data = rows.map((r) => ({
      id: r.id,
      revisionId: r.revisionId,
      processStepId: r.processStepId,
      characteristicId: r.characteristicId,
      rowNumber: r.rowNumber,
      specTolerance: r.specTolerance,
      measurementMethod: r.measurementMethod,
      sampleSize: r.sampleSize,
      frequency: r.frequency,
      controlType: r.controlType,
      controlMethod: r.controlMethod,
      reactionPlan: r.reactionPlan,
      responsible: r.responsible,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      processStep: (({ revision: _revision, ...step }) => step)(r.processStep),
      characteristic: r.characteristic,
      linkedPfmeaRows: r.pfmeaRows.map((link) =>
        (({ revision: _revision, ...row }) => row)(link.pfmeaRow),
      ),
    }));

    return {
      data,
      total,
      page: page || 1,
      limit: limit || total || data.length,
    };
  }

  async createRow(actor: CpActor, revisionId: string, _dto: CreateCpRowDto) {
    await assertEngineeringRevisionAccess(
      this.prisma,
      actor,
      revisionId,
      'CONTROL_PLAN',
      true,
    );
    throw new BadRequestException(
      'Use the versioned control-plan document editor. Legacy row writes are retired to prevent unversioned edits.',
    );
  }
  async updateRow(actor: CpActor, rowId: string, _dto: UpdateCpRowDto) {
    const row = await this.verifyRowAccess(actor.tenantId, rowId);
    return this.createRow(actor, row.revisionId, {} as CreateCpRowDto);
  }
  async removeRow(actor: CpActor, rowId: string) {
    const row = await this.verifyRowAccess(actor.tenantId, rowId);
    return this.createRow(actor, row.revisionId, {} as CreateCpRowDto);
  }
  async syncFromPfmea(actor: CpActor, revisionId: string) {
    await assertEngineeringRevisionAccess(
      this.prisma,
      actor,
      revisionId,
      'CONTROL_PLAN',
      true,
    );
    throw new BadRequestException(
      'Direct synchronization is retired. Preview source changes and apply explicit decisions using control-plan-document/sync-preview and sync-apply.',
    );
  }
  async syncFromPfd(actor: CpActor, revisionId: string) {
    return this.syncFromPfmea(actor, revisionId);
  }
}
