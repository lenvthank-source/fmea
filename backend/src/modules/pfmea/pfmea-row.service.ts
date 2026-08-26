import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePfmeaRowDto } from './dto/create-pfmea-row.dto';
import { UpdatePfmeaRowDto } from './dto/update-pfmea-row.dto';
import { ImportPfmeaRowItemDto } from './dto/import-pfmea-rows.dto';
import { calculateAP } from './ap-calculator';
import { RevisionGuard } from '../../common/revision-guard';

@Injectable()
export class PfmeaRowService {
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

  async findAllRows(tenantId: string, revisionId: string, page?: number, limit?: number) {
    await this.verifyRevisionAccess(tenantId, revisionId);

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [rows, total] = await Promise.all([
      this.prisma.pfmeaRow.findMany({
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
        skip,
        take,
      }),
      this.prisma.pfmeaRow.count({ where: { revisionId } }),
    ]);

    // Flatten the response so the frontend receives plain entity arrays
    const data = rows.map((r) => ({
      id: r.id,
      revisionId: r.revisionId,
      processStepId: r.processStepId,
      workElementName: r.workElementName,
      rowNumber: r.rowNumber,
      severity: r.severity,
      occurrence: r.occurrence,
      detection: r.detection,
      ap: r.ap,
      status: r.status,
      accessLevel: r.accessLevel,
      preventionAction: r.preventionAction,
      detectionAction: r.detectionAction,
      responsibility: r.responsibility,
      targetDate: r.targetDate,
      actionTaken: r.actionTaken,
      completionDate: r.completionDate,
      revisedSeverity: r.revisedSeverity,
      revisedOccurrence: r.revisedOccurrence,
      revisedDetection: r.revisedDetection,
      revisedAp: r.revisedAp,
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

    return { data, total, page: page || 1, limit: limit || total || data.length };
  }

  async createRow(tenantId: string, userId: string, revisionId: string, dto: CreatePfmeaRowDto) {
    await this.revisionGuard.assertRevisionWritable(tenantId, revisionId);
    const pfmeaRevision = await this.verifyRevisionAccess(tenantId, revisionId);

    if (dto.processStepId) {
      const step = await this.prisma.processStep.findUnique({
        where: { id: dto.processStepId },
        include: { revision: { include: { document: true } } },
      });
      if (!step) {
        throw new BadRequestException('Process step not found');
      }
      // Verify the step belongs to this tenant (project-level check is too strict
      // since PFD steps can be linked to PFMEA rows across document revisions)
      if (step.revision.document.tenantId !== tenantId) {
        throw new BadRequestException('Process step does not belong to this tenant');
      }
    }

    return this.prisma.pfmeaRow.create({
      data: {
        revisionId,
        processStepId: dto.processStepId || null,
        workElementName: dto.workElementName || null,
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
    await this.revisionGuard.assertRevisionWritableByRow(tenantId, rowId);
    const row = await this.verifyRowAccess(tenantId, rowId);

    // Recalculate AP
    const S = dto.severity !== undefined ? dto.severity : row.severity;
    const O = dto.occurrence !== undefined ? dto.occurrence : row.occurrence;
    const D = dto.detection !== undefined ? dto.detection : row.detection;
    const calculatedAp = calculateAP(S, O, D);

    // Recalculate Revised AP
    const revS = dto.revisedSeverity !== undefined ? dto.revisedSeverity : row.revisedSeverity;
    const revO = dto.revisedOccurrence !== undefined ? dto.revisedOccurrence : row.revisedOccurrence;
    const revD = dto.revisedDetection !== undefined ? dto.revisedDetection : row.revisedDetection;
    const calculatedRevisedAp = (revS && revO && revD) ? calculateAP(revS, revO, revD) : null;

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

      // 8. Inherit Severity from matching effects if not explicitly provided
      let finalSeverity = S;
      let finalAp = calculatedAp;
      if (dto.severity === undefined && dto.effects && dto.effects.length > 0) {
        const matchingOtherRow = await tx.pfmeaRow.findFirst({
          where: {
            id: { not: rowId },
            severity: { not: null },
            effects: {
              some: {
                effect: {
                  name: { in: dto.effects, mode: 'insensitive' }
                }
              }
            }
          },
          orderBy: { severity: 'desc' }
        });
        if (matchingOtherRow && matchingOtherRow.severity) {
          finalSeverity = matchingOtherRow.severity;
          finalAp = calculateAP(finalSeverity, O, D);
        }
      }

      // 9. Propagate Severity to other rows with matching effects (DFMEA <-> PFMEA Severity Linkage)
      if (finalSeverity !== null && finalSeverity !== undefined) {
        let effectNames: string[] = [];
        if (dto.effects) {
          effectNames = dto.effects;
        } else {
          const rowEffects = await tx.pfmeaRowEffect.findMany({
            where: { pfmeaRowId: rowId },
            include: { effect: true },
          });
          effectNames = rowEffects.map(re => re.effect.name);
        }

        if (effectNames.length > 0) {
          const otherRowsWithSameEffects = await tx.pfmeaRow.findMany({
            where: {
              id: { not: rowId },
              effects: {
                some: {
                  effect: {
                    name: { in: effectNames, mode: 'insensitive' }
                  }
                }
              }
            }
          });

          for (const otherRow of otherRowsWithSameEffects) {
            if (otherRow.severity !== finalSeverity) {
              const otherCalculatedAp = calculateAP(finalSeverity, otherRow.occurrence, otherRow.detection);
              await tx.pfmeaRow.update({
                where: { id: otherRow.id },
                data: {
                  severity: finalSeverity,
                  ap: otherCalculatedAp
                }
              });
            }
          }
        }
      }

      // 10. Update main PfmeaRow fields
      return tx.pfmeaRow.update({
        where: { id: rowId },
        data: {
          severity: finalSeverity,
          occurrence: O,
          detection: D,
          ap: finalAp,
          filterCode: dto.filterCode !== undefined ? dto.filterCode : row.filterCode,
          workElementName: dto.workElementName !== undefined ? dto.workElementName : row.workElementName,
          notes: dto.notes !== undefined ? dto.notes : row.notes,
          status: dto.status !== undefined ? dto.status : row.status,
          accessLevel: dto.accessLevel !== undefined ? dto.accessLevel : row.accessLevel,
          preventionAction: dto.preventionAction !== undefined ? dto.preventionAction : row.preventionAction,
          detectionAction: dto.detectionAction !== undefined ? dto.detectionAction : row.detectionAction,
          responsibility: dto.responsibility !== undefined ? dto.responsibility : row.responsibility,
          targetDate: dto.targetDate !== undefined ? (dto.targetDate ? new Date(dto.targetDate) : null) : row.targetDate,
          actionTaken: dto.actionTaken !== undefined ? dto.actionTaken : row.actionTaken,
          completionDate: dto.completionDate !== undefined ? (dto.completionDate ? new Date(dto.completionDate) : null) : row.completionDate,
          revisedSeverity: dto.revisedSeverity !== undefined ? dto.revisedSeverity : row.revisedSeverity,
          revisedOccurrence: dto.revisedOccurrence !== undefined ? dto.revisedOccurrence : row.revisedOccurrence,
          revisedDetection: dto.revisedDetection !== undefined ? dto.revisedDetection : row.revisedDetection,
          revisedAp: calculatedRevisedAp,
        },
      });
    });
  }

  async removeRow(tenantId: string, rowId: string) {
    await this.revisionGuard.assertRevisionWritableByRow(tenantId, rowId);
    await this.verifyRowAccess(tenantId, rowId);

    return this.prisma.pfmeaRow.delete({
      where: { id: rowId },
    });
  }

  async syncFromTree(tenantId: string, revisionId: string) {
    const revision = await this.verifyRevisionAccess(tenantId, revisionId);
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch all steps for this revision
      const steps = await tx.processStep.findMany({
        where: { revisionId },
      });

      // 2. Fetch all project structure functions with failures and linkages
      const projectFunctions = await tx.structureFunction.findMany({
        where: { projectId: revision.document.projectId, tenantId },
        include: {
          failures: {
            include: {
              modeEffectLinks: {
                include: {
                  linkedFailure: {
                    include: { function: true }
                  }
                }
              }
            }
          }
        }
      });

      // Fetch all existing rows in this revision to match or clean up
      const existingRows = await tx.pfmeaRow.findMany({
        where: { revisionId },
        include: {
          functions: { include: { function: true } },
          failureModes: { include: { failureMode: true } },
          effects: { include: { effect: true } },
          causes: { include: { cause: true } },
          controls: { include: { control: true } },
        }
      });

      const processedRowIds = new Set<string>();

      // Loop through each process step to find its modes and linkages
      for (const step of steps) {
        const stepFunctions = projectFunctions.filter(
          (sf) => sf.parentType === 'process_step' && sf.parentId === step.id
        );

        for (const sf of stepFunctions) {
          const modes = sf.failures.filter((f) => f.role === 'mode');

          for (const mode of modes) {
            const effects = mode.modeEffectLinks
              .filter((l) => l.linkType === 'effect')
              .map((l) => l.linkedFailure);
            const causes = mode.modeEffectLinks
              .filter((l) => l.linkType === 'cause')
              .map((l) => l.linkedFailure);

            // Determine severity (S) from highest rating of linked effects
            const severityRatings = effects.map((e) => e.severityRating).filter(Boolean) as number[];
            const S = severityRatings.length > 0 ? Math.max(...severityRatings) : mode.severityRating;

            // Determine occurrence (O) and detection (D) from linked causes
            const occurrenceRatings = causes.map((c) => c.occurrenceRating).filter(Boolean) as number[];
            const O = occurrenceRatings.length > 0 ? Math.max(...occurrenceRatings) : null;

            const detectionRatings = causes.map((c) => c.detectionRating).filter(Boolean) as number[];
            const D = detectionRatings.length > 0 ? Math.max(...detectionRatings) : null;

            // Get work element name from causes
            let workElementName: string | null = null;
            if (causes.length > 0) {
              const firstCause = causes[0];
              const parts = firstCause.function.parentId.split('::');
              workElementName = parts[1] || null;
            }

            // Find existing row
            let row = existingRows.find(
              (r) =>
                r.processStepId === step.id &&
                r.failureModes.some((fm) => fm.failureMode.name === mode.narration)
            );

            const ap = (S && O && D) ? calculateAP(S, O, D) : null;

            if (row) {
              // Update row
              await tx.pfmeaRow.update({
                where: { id: row.id },
                data: {
                  workElementName,
                  severity: S,
                  occurrence: O,
                  detection: D,
                  ap,
                },
              });
              processedRowIds.add(row.id);
            } else {
              // Create row
              const nextRowNumber = await this.getNextRowNumber(tx, revisionId);
              row = await tx.pfmeaRow.create({
                data: {
                  revisionId,
                  processStepId: step.id,
                  workElementName,
                  rowNumber: nextRowNumber,
                  severity: S,
                  occurrence: O,
                  detection: D,
                  ap,
                  createdById: revision.createdById,
                },
                include: {
                  functions: true,
                  failureModes: true,
                  effects: true,
                  causes: true,
                  controls: true,
                }
              }) as any;
              processedRowIds.add(row!.id);
            }

            const rowId = row!.id;

            // Sync functions
            await tx.pfmeaRowFunction.deleteMany({ where: { pfmeaRowId: rowId } });
            let funcRecord = await tx.function.findFirst({
              where: { tenantId, name: { equals: sf.narration, mode: 'insensitive' } },
            });
            if (!funcRecord) {
              funcRecord = await tx.function.create({
                data: { tenantId, name: sf.narration, isTemplate: false },
              });
            }
            await tx.pfmeaRowFunction.create({
              data: { pfmeaRowId: rowId, functionId: funcRecord.id },
            });

            // Sync failure modes
            await tx.pfmeaRowFailureMode.deleteMany({ where: { pfmeaRowId: rowId } });
            let modeRecord = await tx.failureMode.findFirst({
              where: { tenantId, name: { equals: mode.narration, mode: 'insensitive' } },
            });
            if (!modeRecord) {
              modeRecord = await tx.failureMode.create({
                data: { tenantId, name: mode.narration, isTemplate: false },
              });
            }
            await tx.pfmeaRowFailureMode.create({
              data: { pfmeaRowId: rowId, failureModeId: modeRecord.id },
            });

            // Sync effects
            await tx.pfmeaRowEffect.deleteMany({ where: { pfmeaRowId: rowId } });
            const addedEffectIds = new Set<string>();
            for (const eff of effects) {
              let effRecord = await tx.effect.findFirst({
                where: { tenantId, name: { equals: eff.narration, mode: 'insensitive' } },
              });
              if (!effRecord) {
                effRecord = await tx.effect.create({
                  data: { tenantId, name: eff.narration, isTemplate: false },
                });
              }
              if (!addedEffectIds.has(effRecord.id)) {
                await tx.pfmeaRowEffect.create({
                  data: { pfmeaRowId: rowId, effectId: effRecord.id },
                });
                addedEffectIds.add(effRecord.id);
              }
            }

            // Sync causes
            await tx.pfmeaRowCause.deleteMany({ where: { pfmeaRowId: rowId } });
            const addedCauseIds = new Set<string>();
            for (const cause of causes) {
              let causeRecord = await tx.cause.findFirst({
                where: { tenantId, name: { equals: cause.narration, mode: 'insensitive' } },
              });
              if (!causeRecord) {
                causeRecord = await tx.cause.create({
                  data: { tenantId, name: cause.narration, isTemplate: false },
                });
              }
              if (!addedCauseIds.has(causeRecord.id)) {
                await tx.pfmeaRowCause.create({
                  data: { pfmeaRowId: rowId, causeId: causeRecord.id },
                });
                addedCauseIds.add(causeRecord.id);
              }
            }

            // Sync controls from causes
            await tx.pfmeaRowControl.deleteMany({ where: { pfmeaRowId: rowId } });
            const addedControlIds = new Set<string>();
            for (const cause of causes) {
              if (cause.currentControlPrevention) {
                let ctrlRecord = await tx.control.findFirst({
                  where: {
                    tenantId,
                    type: 'prevention',
                    name: { equals: cause.currentControlPrevention, mode: 'insensitive' },
                  },
                });
                if (!ctrlRecord) {
                  ctrlRecord = await tx.control.create({
                    data: {
                      tenantId,
                      type: 'prevention',
                      name: cause.currentControlPrevention,
                      isTemplate: false,
                    },
                  });
                }
                if (!addedControlIds.has(ctrlRecord.id)) {
                  await tx.pfmeaRowControl.create({
                    data: { pfmeaRowId: rowId, controlId: ctrlRecord.id },
                  });
                  addedControlIds.add(ctrlRecord.id);
                }
              }

              if (cause.currentControlDetection) {
                let ctrlRecord = await tx.control.findFirst({
                  where: {
                    tenantId,
                    type: 'detection',
                    name: { equals: cause.currentControlDetection, mode: 'insensitive' },
                  },
                });
                if (!ctrlRecord) {
                  ctrlRecord = await tx.control.create({
                    data: {
                      tenantId,
                      type: 'detection',
                      name: cause.currentControlDetection,
                      isTemplate: false,
                    },
                  });
                }
                if (!addedControlIds.has(ctrlRecord.id)) {
                  await tx.pfmeaRowControl.create({
                    data: { pfmeaRowId: rowId, controlId: ctrlRecord.id },
                  });
                  addedControlIds.add(ctrlRecord.id);
                }
              }
            }
          }
        }
      }

      // 5. Delete rows that are no longer referenced in the structure tree
      for (const row of existingRows) {
        if (!processedRowIds.has(row.id)) {
          await tx.pfmeaRow.delete({ where: { id: row.id } });
        }
      }

      return { success: true, syncedCount: processedRowIds.size };
    }, {
      timeout: 30000
    });
  }

  async importPfmeaRowsBatch(
    tenantId: string,
    userId: string,
    revisionId: string,
    dtos: ImportPfmeaRowItemDto[],
    mode: 'build' | 'update' = 'build',
  ) {
    await this.revisionGuard.assertRevisionWritable(tenantId, revisionId);
    const pfmeaRevision = await this.verifyRevisionAccess(tenantId, revisionId);
    const projectId = pfmeaRevision.document.projectId;

    return this.prisma.$transaction(async (tx) => {
      // Find or create default ProcessItem container
      let processItem = await tx.processItem.findFirst({
        where: { projectId, tenantId },
      });
      if (!processItem) {
        processItem = await tx.processItem.create({
          data: {
            tenantId,
            projectId,
            name: 'Process Flow Items',
            description: 'Default process flow container',
          },
        });
      }

      // If build new mode, delete existing rows in this revision
      if (mode === 'build') {
        await tx.pfmeaRow.deleteMany({ where: { revisionId } });
      }

      // Pre-fetch all process steps in this revision
      let steps = await tx.processStep.findMany({
        where: { revisionId },
      });

      const stepMapByNameOrNum = new Map<string, any>();
      for (const s of steps) {
        stepMapByNameOrNum.set(s.stepNumber.toLowerCase().trim(), s);
        stepMapByNameOrNum.set(s.name.toLowerCase().trim(), s);
        stepMapByNameOrNum.set(`${s.stepNumber} ${s.name}`.toLowerCase().trim(), s);
        stepMapByNameOrNum.set(`${s.stepNumber} - ${s.name}`.toLowerCase().trim(), s);
      }

      let rowNumber = 1;
      let nextStepSeq = steps.length + 1;

      for (let i = 0; i < dtos.length; i++) {
        const dto = dtos[i];

        // 1. Resolve or create ProcessStep
        let stepRecord: any = null;
        const rawStepStr = (dto.processStep || '').trim();
        if (rawStepStr) {
          stepRecord = stepMapByNameOrNum.get(rawStepStr.toLowerCase());
          if (!stepRecord) {
            const match = rawStepStr.match(/^((?:OP|Step|Process|ST|Oper)?\s*#?\s*\d+[A-Za-z]?)\s*[:\-–—.]?\s*(.*)$/i);
            const parsedNum = match && match[1] ? match[1].trim() : `OP${(steps.length + 1) * 10}`;
            const parsedName = match && match[2] ? match[2].trim() : rawStepStr;

            stepRecord = await tx.processStep.create({
              data: {
                revisionId,
                processItemId: processItem.id,
                stepNumber: parsedNum,
                name: parsedName || rawStepStr,
                stepType: 'operation',
                sequenceOrder: nextStepSeq++,
              },
            });
            steps.push(stepRecord);
            stepMapByNameOrNum.set(rawStepStr.toLowerCase(), stepRecord);
            stepMapByNameOrNum.set(stepRecord.stepNumber.toLowerCase().trim(), stepRecord);
            stepMapByNameOrNum.set(stepRecord.name.toLowerCase().trim(), stepRecord);
          }
        }

        // 2. Risk evaluations
        const S = dto.severity ? Number(dto.severity) : null;
        const O = dto.occurrence ? Number(dto.occurrence) : null;
        const D = dto.detection ? Number(dto.detection) : null;
        const calculatedAp = (S && O && D) ? calculateAP(S, O, D) : (dto.ap || null);

        const revS = dto.revisedSeverity ? Number(dto.revisedSeverity) : null;
        const revO = dto.revisedOccurrence ? Number(dto.revisedOccurrence) : null;
        const revD = dto.revisedDetection ? Number(dto.revisedDetection) : null;
        const calculatedRevAp = (revS && revO && revD) ? calculateAP(revS, revO, revD) : (dto.revisedAp || null);

        // 3. Create PfmeaRow
        const rowData = {
          revisionId,
          processStepId: stepRecord ? stepRecord.id : null,
          workElementName: dto.workElementName || null,
          rowNumber: rowNumber++,
          severity: S,
          occurrence: O,
          detection: D,
          ap: calculatedAp,
          filterCode: dto.filterCode || null,
          preventionAction: dto.preventionAction || null,
          detectionAction: dto.detectionAction || null,
          responsibility: dto.responsibility || null,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
          actionTaken: dto.actionTaken || null,
          completionDate: dto.completionDate ? new Date(dto.completionDate) : null,
          revisedSeverity: revS,
          revisedOccurrence: revO,
          revisedDetection: revD,
          revisedAp: calculatedRevAp,
          status: dto.status || 'Open',
          notes: dto.notes || null,
          createdById: userId,
        };

        const pfmeaRow = await tx.pfmeaRow.create({
          data: rowData,
        });
        const rowId = pfmeaRow.id;

        // 4. Link Function
        if (dto.function && dto.function.trim()) {
          const fnName = dto.function.trim();
          let func = await tx.function.findFirst({
            where: { tenantId, name: { equals: fnName, mode: 'insensitive' } },
          });
          if (!func) {
            func = await tx.function.create({
              data: { tenantId, name: fnName, isTemplate: false },
            });
          }
          await tx.pfmeaRowFunction.create({
            data: { pfmeaRowId: rowId, functionId: func.id },
          });

          // Sync structure_function if step exists
          if (stepRecord) {
            let sf = await tx.structureFunction.findFirst({
              where: {
                tenantId,
                projectId,
                parentType: 'process_step',
                parentId: stepRecord.id,
                narration: { equals: fnName, mode: 'insensitive' },
              },
            });
            if (!sf) {
              sf = await tx.structureFunction.create({
                data: {
                  tenantId,
                  projectId,
                  parentType: 'process_step',
                  parentId: stepRecord.id,
                  narration: fnName,
                  location: 'your_plant',
                },
              });
            }

            // 5. Link Failure Mode
            if (dto.failureMode && dto.failureMode.trim()) {
              const fmName = dto.failureMode.trim();
              let fm = await tx.failureMode.findFirst({
                where: { tenantId, name: { equals: fmName, mode: 'insensitive' } },
              });
              if (!fm) {
                fm = await tx.failureMode.create({
                  data: { tenantId, name: fmName, isTemplate: false },
                });
              }
              await tx.pfmeaRowFailureMode.create({
                data: { pfmeaRowId: rowId, failureModeId: fm.id },
              });

              // Create structure failure mode under function
              let sMode = await tx.structureFailure.findFirst({
                where: {
                  functionId: sf.id,
                  role: 'mode',
                  narration: { equals: fmName, mode: 'insensitive' },
                },
              });
              if (!sMode) {
                sMode = await tx.structureFailure.create({
                  data: {
                    functionId: sf.id,
                    role: 'mode',
                    narration: fmName,
                  },
                });
              }

              // 6. Link Failure Effect
              if (dto.failureEffect && dto.failureEffect.trim()) {
                const effName = dto.failureEffect.trim();
                let eff = await tx.effect.findFirst({
                  where: { tenantId, name: { equals: effName, mode: 'insensitive' } },
                });
                if (!eff) {
                  eff = await tx.effect.create({
                    data: { tenantId, name: effName, isTemplate: false },
                  });
                }
                await tx.pfmeaRowEffect.create({
                  data: { pfmeaRowId: rowId, effectId: eff.id },
                });

                // Create structure failure effect under project/system function if available
                let sEffect = await tx.structureFailure.findFirst({
                  where: {
                    role: 'effect',
                    narration: { equals: effName, mode: 'insensitive' },
                  },
                });
                if (!sEffect) {
                  sEffect = await tx.structureFailure.create({
                    data: {
                      functionId: sf.id,
                      role: 'effect',
                      narration: effName,
                      severityRating: S,
                    },
                  });
                }
              }

              // 7. Link Failure Cause & Controls
              if (dto.failureCause && dto.failureCause.trim()) {
                const causeName = dto.failureCause.trim();
                let cause = await tx.cause.findFirst({
                  where: { tenantId, name: { equals: causeName, mode: 'insensitive' } },
                });
                if (!cause) {
                  cause = await tx.cause.create({
                    data: { tenantId, name: causeName, isTemplate: false },
                  });
                }
                await tx.pfmeaRowCause.create({
                  data: { pfmeaRowId: rowId, causeId: cause.id },
                });

                // Create structure failure cause under function
                let sCause = await tx.structureFailure.findFirst({
                  where: {
                    functionId: sf.id,
                    role: 'cause',
                    narration: { equals: causeName, mode: 'insensitive' },
                  },
                });
                if (!sCause) {
                  sCause = await tx.structureFailure.create({
                    data: {
                      functionId: sf.id,
                      role: 'cause',
                      narration: causeName,
                      occurrenceRating: O,
                      detectionRating: D,
                      currentControlPrevention: dto.preventionControl || null,
                      currentControlDetection: dto.detectionControl || null,
                      filterCode: dto.filterCode || null,
                    },
                  });
                }

                // Link Prevention Control
                if (dto.preventionControl && dto.preventionControl.trim()) {
                  const ctrlName = dto.preventionControl.trim();
                  let ctrl = await tx.control.findFirst({
                    where: { tenantId, type: 'prevention', name: { equals: ctrlName, mode: 'insensitive' } },
                  });
                  if (!ctrl) {
                    ctrl = await tx.control.create({
                      data: { tenantId, type: 'prevention', name: ctrlName, isTemplate: false },
                    });
                  }
                  await tx.pfmeaRowControl.create({
                    data: { pfmeaRowId: rowId, controlId: ctrl.id },
                  });
                }

                // Link Detection Control
                if (dto.detectionControl && dto.detectionControl.trim()) {
                  const ctrlName = dto.detectionControl.trim();
                  let ctrl = await tx.control.findFirst({
                    where: { tenantId, type: 'detection', name: { equals: ctrlName, mode: 'insensitive' } },
                  });
                  if (!ctrl) {
                    ctrl = await tx.control.create({
                      data: { tenantId, type: 'detection', name: ctrlName, isTemplate: false },
                    });
                  }
                  await tx.pfmeaRowControl.create({
                    data: { pfmeaRowId: rowId, controlId: ctrl.id },
                  });
                }
              }
            }
          }
        }
      }

      return { success: true, count: dtos.length };
    }, {
      timeout: 60000,
    });
  }

  private async getNextRowNumber(tx: any, revisionId: string): Promise<number> {
    const agg = await tx.pfmeaRow.aggregate({
      where: { revisionId },
      _max: { rowNumber: true },
    });
    return (agg._max.rowNumber || 0) + 1;
  }
}
