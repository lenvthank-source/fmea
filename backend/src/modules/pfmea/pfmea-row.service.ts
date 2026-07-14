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
      workElementName: r.workElementName,
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
            for (const eff of effects) {
              let effRecord = await tx.effect.findFirst({
                where: { tenantId, name: { equals: eff.narration, mode: 'insensitive' } },
              });
              if (!effRecord) {
                effRecord = await tx.effect.create({
                  data: { tenantId, name: eff.narration, isTemplate: false },
                });
              }
              await tx.pfmeaRowEffect.create({
                data: { pfmeaRowId: rowId, effectId: effRecord.id },
              });
            }

            // Sync causes
            await tx.pfmeaRowCause.deleteMany({ where: { pfmeaRowId: rowId } });
            for (const cause of causes) {
              let causeRecord = await tx.cause.findFirst({
                where: { tenantId, name: { equals: cause.narration, mode: 'insensitive' } },
              });
              if (!causeRecord) {
                causeRecord = await tx.cause.create({
                  data: { tenantId, name: cause.narration, isTemplate: false },
                });
              }
              await tx.pfmeaRowCause.create({
                data: { pfmeaRowId: rowId, causeId: causeRecord.id },
              });
            }

            // Sync controls from causes
            await tx.pfmeaRowControl.deleteMany({ where: { pfmeaRowId: rowId } });
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
                await tx.pfmeaRowControl.create({
                  data: { pfmeaRowId: rowId, controlId: ctrlRecord.id },
                });
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
                await tx.pfmeaRowControl.create({
                  data: { pfmeaRowId: rowId, controlId: ctrlRecord.id },
                });
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
