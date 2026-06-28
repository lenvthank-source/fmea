import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePfmeaRowDto } from './dto/create-pfmea-row.dto';
import { UpdatePfmeaRowDto } from './dto/update-pfmea-row.dto';
import { calculateAP } from './ap-calculator';

@Injectable()
export class PfmeaRowService {
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
    const row = await this.prisma.pfmeaRow.findUnique({
      where: { id: rowId },
      include: {
        revision: {
          include: { document: true },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('PFMEA row not found');
    }

    if (row.revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this PFMEA row');
    }

    return row;
  }

  async findAllRows(tenantId: string, revisionId: string) {
    await this.verifyRevisionAccess(tenantId, revisionId);

    const rows = await this.prisma.pfmeaRow.findMany({
      where: { revisionId },
      include: {
        processStep: true,
        functions: {
          include: { function: true },
        },
        requirements: {
          include: { requirement: true },
        },
        failureModes: {
          include: { failureMode: true },
        },
        effects: {
          include: { effect: true },
        },
        causes: {
          include: { cause: true },
        },
        controls: {
          include: { control: true },
        },
        characteristics: {
          include: { characteristic: true },
        },
      },
      orderBy: { rowNumber: 'asc' },
    });

    // Flatten the response so the frontend receives plain entity arrays
    return rows.map((r) => ({
      id: r.id,
      revisionId: r.revisionId,
      processStepId: r.processStepId,
      rowNumber: r.rowNumber,
      severity: r.severity,
      occurrence: r.occurrence,
      detection: r.detection,
      ap: r.ap,
      status: r.status,
      accessLevel: r.accessLevel,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      processStep: r.processStep,
      functions: r.functions.map((f) => f.function),
      requirements: r.requirements.map((req) => req.requirement),
      failureModes: r.failureModes.map((fm) => fm.failureMode),
      effects: r.effects.map((e) => e.effect),
      causes: r.causes.map((c) => c.cause),
      controls: r.controls.map((c) => c.control),
      characteristics: r.characteristics.map((c) => c.characteristic),
    }));
  }

  async createRow(tenantId: string, userId: string, revisionId: string, dto: CreatePfmeaRowDto) {
    const pfmeaRevision = await this.verifyRevisionAccess(tenantId, revisionId);

    // Process steps belong to the PFD revision (different from PFMEA revision).
    // Verify the step exists and belongs to the same project via tenant check.
    const step = await this.prisma.processStep.findUnique({
      where: { id: dto.processStepId },
      include: { revision: { include: { document: true } } },
    });
    if (!step) {
      throw new BadRequestException('Process step not found');
    }
    if (step.revision.document.projectId !== pfmeaRevision.document.projectId) {
      throw new BadRequestException('Process step does not belong to this project');
    }

    return this.prisma.pfmeaRow.create({
      data: {
        revisionId,
        processStepId: dto.processStepId,
        rowNumber: dto.rowNumber,
        severity: null,
        occurrence: null,
        detection: null,
        ap: null,
        notes: '',
        status: 'draft',
        accessLevel: 'public',
        createdById: userId,
      },
    });
  }

  async updateRow(tenantId: string, rowId: string, dto: UpdatePfmeaRowDto) {
    const row = await this.verifyRowAccess(tenantId, rowId);

    // Recalculate AP
    const S = dto.severity !== undefined ? dto.severity : row.severity;
    const O = dto.occurrence !== undefined ? dto.occurrence : row.occurrence;
    const D = dto.detection !== undefined ? dto.detection : row.detection;
    const calculatedAp = calculateAP(S, O, D);

    return this.prisma.$transaction(async (tx) => {
      // 1. Sync Functions (Many-to-Many)
      if (dto.functions) {
        // Delete existing links
        await tx.pfmeaRowFunction.deleteMany({
          where: { pfmeaRowId: rowId },
        });

        for (const name of dto.functions) {
          let func = await tx.function.findFirst({
            where: { tenantId, name: { equals: name, mode: 'insensitive' } },
          });
          if (!func) {
            func = await tx.function.create({
              data: { tenantId, name, isTemplate: false },
            });
          }
          await tx.pfmeaRowFunction.create({
            data: { pfmeaRowId: rowId, functionId: func.id },
          });
        }
      }

      // 2. Sync Requirements (Many-to-Many)
      if (dto.requirements) {
        await tx.pfmeaRowRequirement.deleteMany({
          where: { pfmeaRowId: rowId },
        });

        for (const name of dto.requirements) {
          let req = await tx.requirement.findFirst({
            where: { tenantId, name: { equals: name, mode: 'insensitive' } },
          });
          if (!req) {
            req = await tx.requirement.create({
              data: { tenantId, name, isTemplate: false },
            });
          }
          await tx.pfmeaRowRequirement.create({
            data: { pfmeaRowId: rowId, requirementId: req.id },
          });
        }
      }

      // 3. Sync Failure Modes (Many-to-Many)
      if (dto.failureModes) {
        await tx.pfmeaRowFailureMode.deleteMany({
          where: { pfmeaRowId: rowId },
        });

        for (const name of dto.failureModes) {
          let fm = await tx.failureMode.findFirst({
            where: { tenantId, name: { equals: name, mode: 'insensitive' } },
          });
          if (!fm) {
            fm = await tx.failureMode.create({
              data: { tenantId, name, isTemplate: false },
            });
          }
          await tx.pfmeaRowFailureMode.create({
            data: { pfmeaRowId: rowId, failureModeId: fm.id },
          });
        }
      }

      // 4. Sync Effects (Many-to-Many)
      if (dto.effects) {
        await tx.pfmeaRowEffect.deleteMany({
          where: { pfmeaRowId: rowId },
        });

        for (const name of dto.effects) {
          let effect = await tx.effect.findFirst({
            where: { tenantId, name: { equals: name, mode: 'insensitive' } },
          });
          if (!effect) {
            effect = await tx.effect.create({
              data: { tenantId, name, level: 'local', isTemplate: false },
            });
          }
          await tx.pfmeaRowEffect.create({
            data: { pfmeaRowId: rowId, effectId: effect.id },
          });
        }
      }

      // 5. Sync Causes (Many-to-Many)
      if (dto.causes) {
        await tx.pfmeaRowCause.deleteMany({
          where: { pfmeaRowId: rowId },
        });

        for (const name of dto.causes) {
          let cause = await tx.cause.findFirst({
            where: { tenantId, name: { equals: name, mode: 'insensitive' } },
          });
          if (!cause) {
            cause = await tx.cause.create({
              data: { tenantId, name, isTemplate: false },
            });
          }
          await tx.pfmeaRowCause.create({
            data: { pfmeaRowId: rowId, causeId: cause.id },
          });
        }
      }

      // 6. Sync Controls (Many-to-Many)
      if (dto.controls) {
        await tx.pfmeaRowControl.deleteMany({
          where: { pfmeaRowId: rowId },
        });

        for (const c of dto.controls) {
          let control = await tx.control.findFirst({
            where: {
              tenantId,
              name: { equals: c.name, mode: 'insensitive' },
              type: c.type,
            },
          });
          if (!control) {
            control = await tx.control.create({
              data: {
                tenantId,
                name: c.name,
                type: c.type,
                detectionMethod: c.detectionMethod || null,
                isTemplate: false,
              },
            });
          }
          await tx.pfmeaRowControl.create({
            data: { pfmeaRowId: rowId, controlId: control.id },
          });
        }
      }

      // 7. Sync Characteristics (Many-to-Many)
      if (dto.characteristics) {
        await tx.pfmeaRowCharacteristic.deleteMany({
          where: { pfmeaRowId: rowId },
        });

        for (const char of dto.characteristics) {
          let characteristic = await tx.characteristic.findFirst({
            where: {
              tenantId,
              name: { equals: char.name, mode: 'insensitive' },
            },
          });
          if (!characteristic) {
            characteristic = await tx.characteristic.create({
              data: {
                tenantId,
                name: char.name,
                classification: char.classification,
                unitOfMeasure: char.unitOfMeasure || null,
                isTemplate: false,
              },
            });
          }
          await tx.pfmeaRowCharacteristic.create({
            data: { pfmeaRowId: rowId, characteristicId: characteristic.id },
          });
        }
      }

      // 8. Update main PfmeaRow fields
      return tx.pfmeaRow.update({
        where: { id: rowId },
        data: {
          severity: S,
          occurrence: O,
          detection: D,
          ap: calculatedAp,
          notes: dto.notes !== undefined ? dto.notes : row.notes,
          status: dto.status !== undefined ? dto.status : row.status,
          accessLevel: dto.accessLevel !== undefined ? dto.accessLevel : row.accessLevel,
        },
      });
    });
  }

  async removeRow(tenantId: string, rowId: string) {
    await this.verifyRowAccess(tenantId, rowId);

    return this.prisma.pfmeaRow.delete({
      where: { id: rowId },
    });
  }
}
