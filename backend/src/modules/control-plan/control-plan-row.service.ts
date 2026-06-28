import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCpRowDto } from './dto/create-cp-row.dto';
import { UpdateCpRowDto } from './dto/update-cp-row.dto';

@Injectable()
export class ControlPlanRowService {
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
      throw new ForbiddenException('You do not have access to this Control Plan row');
    }

    return row;
  }

  async findAllRows(tenantId: string, revisionId: string) {
    await this.verifyRevisionAccess(tenantId, revisionId);

    const rows = await this.prisma.controlPlanRow.findMany({
      where: { revisionId },
      include: {
        processStep: true,
        characteristic: true,
        pfmeaRows: {
          include: {
            pfmeaRow: true,
          },
        },
      },
      orderBy: { rowNumber: 'asc' },
    });

    return rows.map((r) => ({
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
      processStep: r.processStep,
      characteristic: r.characteristic,
      linkedPfmeaRows: r.pfmeaRows.map((link) => link.pfmeaRow),
    }));
  }

  async createRow(tenantId: string, revisionId: string, dto: CreateCpRowDto) {
    const revision = await this.verifyRevisionAccess(tenantId, revisionId);

    // Verify step exists
    const step = await this.prisma.processStep.findUnique({
      where: { id: dto.processStepId },
    });

    if (!step) {
      throw new BadRequestException('Process step not found');
    }

    if (dto.characteristicId) {
      const char = await this.prisma.characteristic.findFirst({
        where: { id: dto.characteristicId, tenantId },
      });
      if (!char) {
        throw new BadRequestException('Characteristic not found');
      }
    }

    return this.prisma.controlPlanRow.create({
      data: {
        revisionId,
        processStepId: dto.processStepId,
        characteristicId: dto.characteristicId || null,
        rowNumber: dto.rowNumber,
        specTolerance: dto.specTolerance || null,
        measurementMethod: dto.measurementMethod || null,
        sampleSize: dto.sampleSize || null,
        frequency: dto.frequency || null,
        controlType: dto.controlType,
        controlMethod: dto.controlMethod || null,
        reactionPlan: dto.reactionPlan || null,
        responsible: dto.responsible || null,
        notes: dto.notes || null,
      },
    });
  }

  async updateRow(tenantId: string, rowId: string, dto: UpdateCpRowDto) {
    const row = await this.verifyRowAccess(tenantId, rowId);

    if (dto.characteristicId) {
      const char = await this.prisma.characteristic.findFirst({
        where: { id: dto.characteristicId, tenantId },
      });
      if (!char) {
        throw new BadRequestException('Characteristic not found');
      }
    }

    return this.prisma.controlPlanRow.update({
      where: { id: rowId },
      data: {
        characteristicId: dto.characteristicId !== undefined ? dto.characteristicId : row.characteristicId,
        rowNumber: dto.rowNumber !== undefined ? dto.rowNumber : row.rowNumber,
        specTolerance: dto.specTolerance !== undefined ? dto.specTolerance : row.specTolerance,
        measurementMethod: dto.measurementMethod !== undefined ? dto.measurementMethod : row.measurementMethod,
        sampleSize: dto.sampleSize !== undefined ? dto.sampleSize : row.sampleSize,
        frequency: dto.frequency !== undefined ? dto.frequency : row.frequency,
        controlType: dto.controlType !== undefined ? dto.controlType : row.controlType,
        controlMethod: dto.controlMethod !== undefined ? dto.controlMethod : row.controlMethod,
        reactionPlan: dto.reactionPlan !== undefined ? dto.reactionPlan : row.reactionPlan,
        responsible: dto.responsible !== undefined ? dto.responsible : row.responsible,
        notes: dto.notes !== undefined ? dto.notes : row.notes,
      },
    });
  }

  async removeRow(tenantId: string, rowId: string) {
    await this.verifyRowAccess(tenantId, rowId);

    return this.prisma.controlPlanRow.delete({
      where: { id: rowId },
    });
  }

  async syncFromPfmea(tenantId: string, cpRevisionId: string) {
    const cpRevision = await this.verifyRevisionAccess(tenantId, cpRevisionId);
    const projectId = cpRevision.document.projectId;

    // Find the active PFMEA document for this project
    const pfmeaDoc = await this.prisma.document.findFirst({
      where: { projectId, type: 'PFMEA', tenantId },
    });
    if (!pfmeaDoc || !pfmeaDoc.currentRevisionId) {
      throw new BadRequestException('Active PFMEA document or revision not found for this project.');
    }

    // Fetch all FMEA rows with their controls, characteristics, and requirements (specs)
    const fmeaRows = await this.prisma.pfmeaRow.findMany({
      where: { revisionId: pfmeaDoc.currentRevisionId },
      include: {
        controls: {
          include: { control: true },
        },
        characteristics: {
          include: { characteristic: true },
        },
        requirements: {
          include: { requirement: true },
        },
      },
    });

    return this.prisma.$transaction(async (tx) => {
      // Clean up previous synced mappings for this revision
      // Only delete rows that have linked FMEA row connections to prevent overwriting manual rows
      const existingLinkedRows = await tx.controlPlanRow.findMany({
        where: {
          revisionId: cpRevisionId,
          pfmeaRows: { some: {} },
        },
      });

      const linkedRowIds = existingLinkedRows.map((r) => r.id);
      if (linkedRowIds.length > 0) {
        await tx.controlPlanPfmeaLink.deleteMany({
          where: { controlPlanRowId: { in: linkedRowIds } },
        });
        await tx.controlPlanRow.deleteMany({
          where: { id: { in: linkedRowIds } },
        });
      }

      let rowCounter = await tx.controlPlanRow.count({ where: { revisionId: cpRevisionId } });
      const createdRows = [];

      for (const fmeaRow of fmeaRows) {
        if (!fmeaRow.processStepId) continue;
        
        // Find if this fmeaRow has controls
        const fmeaControls = fmeaRow.controls.map((c) => c.control);
        const fmeaChars = fmeaRow.characteristics.map((c) => c.characteristic);
        const fmeaReqs = fmeaRow.requirements.map((r) => r.requirement);

        // If there are no controls, skip
        if (fmeaControls.length === 0) continue;

        // Take the first special characteristic (if any) to link to
        const primaryChar = fmeaChars.length > 0 ? fmeaChars[0] : null;
        
        // Pull spec/tolerance details from the requirement if available
        const primaryReq = fmeaReqs.length > 0 ? fmeaReqs[0] : null;
        const specTolerance = primaryReq
          ? `${primaryReq.spec || ''} ${primaryReq.tolerance || ''}`.trim()
          : null;

        for (const control of fmeaControls) {
          rowCounter++;
          
          // Create the Control Plan row mapping
          const cpRow = await tx.controlPlanRow.create({
            data: {
              revisionId: cpRevisionId,
              processStepId: fmeaRow.processStepId,
              characteristicId: primaryChar ? primaryChar.id : null,
              rowNumber: rowCounter,
              specTolerance: specTolerance || null,
              measurementMethod: control.detectionMethod || 'Visual Inspection',
              sampleSize: '5 pcs', // Default manufacturing sample size
              frequency: '1 per shift', // Default inspection frequency
              controlType: control.type, // 'prevention' or 'detection'
              controlMethod: control.name,
              reactionPlan: 'Hold suspect material and notify Quality Supervisor', // Standard default reaction plan
              responsible: 'Operator / Inspector',
            },
          });

          // Create traceback link
          await tx.controlPlanPfmeaLink.create({
            data: {
              controlPlanRowId: cpRow.id,
              pfmeaRowId: fmeaRow.id,
            },
          });

          createdRows.push(cpRow);
        }
      }

      return {
        message: `Successfully synchronized ${createdRows.length} rows from PFMEA.`,
        syncedRowsCount: createdRows.length,
      };
    });
  }

  async syncFromPfd(tenantId: string, cpRevisionId: string) {
    const cpRevision = await this.verifyRevisionAccess(tenantId, cpRevisionId);
    const projectId = cpRevision.document.projectId;

    // Find the active PFD document for this project
    const pfdDoc = await this.prisma.document.findFirst({
      where: { projectId, type: 'PFD', tenantId },
    });
    if (!pfdDoc || !pfdDoc.currentRevisionId) {
      throw new BadRequestException('Active PFD document or revision not found for this project.');
    }

    // Fetch all PFD process steps
    const pfdSteps = await this.prisma.processStep.findMany({
      where: { revisionId: pfdDoc.currentRevisionId },
      orderBy: { sequenceOrder: 'asc' },
    });

    return this.prisma.$transaction(async (tx) => {
      let rowCounter = await tx.controlPlanRow.count({ where: { revisionId: cpRevisionId } });
      const createdRows = [];

      for (const step of pfdSteps) {
        // Check if a ControlPlanRow already exists for this step in this revision
        const existing = await tx.controlPlanRow.findFirst({
          where: { revisionId: cpRevisionId, processStepId: step.id },
        });

        if (!existing) {
          rowCounter++;
          const cpRow = await tx.controlPlanRow.create({
            data: {
              revisionId: cpRevisionId,
              processStepId: step.id,
              rowNumber: rowCounter,
              specTolerance: step.desiredOutcome || '—',
              measurementMethod: 'Visual Inspection',
              sampleSize: '5 pcs',
              frequency: '1 per shift',
              controlType: 'prevention',
              controlMethod: step.processCharacteristics || 'Process Monitoring',
              reactionPlan: 'Notify Supervisor and adjust process',
              responsible: 'Operator',
            },
          });
          createdRows.push(cpRow);
        }
      }

      return {
        message: `Successfully synchronized ${createdRows.length} rows from PFD.`,
        syncedRowsCount: createdRows.length,
      };
    });
  }
}
