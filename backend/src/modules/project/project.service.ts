import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async findAll(tenantId: string, status?: string) {
    return this.prisma.project.findMany({
      where: {
        tenantId,
        status: status || { not: 'archived' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string, allowArchived = false) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status === 'archived' && !allowArchived) {
      throw new NotFoundException('Project not found');
    }

    if (project.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async create(tenantId: string, userId: string, dto: CreateProjectDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the project
      const project = await tx.project.create({
        data: {
          tenantId,
          createdById: userId,
          name: dto.name,
          description: dto.description,
          customer: dto.customer,
          plantId: dto.plantId,
          productFamilyId: dto.productFamilyId,
          modelYear: dto.modelYear,
          status: 'active',

          organisationName: dto.organisationName,
          organisationCode: dto.organisationCode,
          orgPartNumber: dto.orgPartNumber,
          organisationPlant: dto.organisationPlant,
          customerPartNumber: dto.customerPartNumber,
          partName: dto.partName,
          keyContact: dto.keyContact,
          latestChangeLevel: dto.latestChangeLevel,
          drawingRevDate: dto.drawingRevDate ? new Date(dto.drawingRevDate) : null,
          documentNumber: dto.documentNumber,
          controlPlanNumber: dto.controlPlanNumber,
          assemblyLineNumber: dto.assemblyLineNumber,
          originationDate: dto.originationDate ? new Date(dto.originationDate) : new Date(),
          supplierApprovalDate: dto.supplierApprovalDate ? new Date(dto.supplierApprovalDate) : null,
          otherApprovalDate: dto.otherApprovalDate ? new Date(dto.otherApprovalDate) : null,
          documentTypes: dto.documentTypes,
          cftMembers: dto.cftMembers || [],
          customerEngApprover: dto.customerEngApprover,
          customerEngApprovalDate: dto.customerEngApprovalDate ? new Date(dto.customerEngApprovalDate) : null,
          customerQualApprover: dto.customerQualApprover,
          customerQualApprovalDate: dto.customerQualApprovalDate ? new Date(dto.customerQualApprovalDate) : null,
          otherApprover: dto.otherApprover,
          otherApprovalDate2: dto.otherApprovalDate2 ? new Date(dto.otherApprovalDate2) : null,
          dwgNumber: dto.dwgNumber,
          dwgRevNoAndDate: dto.dwgRevNoAndDate,
          preliminaryFinalFlag: dto.preliminaryFinalFlag || 'preliminary',
        },
      });

      // 2. Initialize documents (PFD, PFMEA, CONTROL_PLAN, DFMEA) - import from existing project if selected
      const stepIdMap = new Map<string, string>();
      const allDocTypes = ['PFD', 'PFMEA', 'DFMEA', 'CONTROL_PLAN'];
      const docsToCreate = [...new Set([...allDocTypes, ...(dto.documentTypes || [])])];
      const orderedDocTypes = ['PFD', 'DFMEA', 'PFMEA', 'CONTROL_PLAN'].filter(type => docsToCreate.includes(type));

      const isImporting = !!dto.sourceProjectId;
      const importTypes = dto.importTypes || [];

      for (const type of orderedDocTypes) {
        let sourceDoc: any = null;
        if (isImporting && importTypes.includes(type)) {
          sourceDoc = await tx.document.findFirst({
            where: {
              projectId: dto.sourceProjectId,
              type,
              tenantId
            }
          });
        }

        let docName = '';
        if (type === 'PFD') docName = 'Process Flow Diagram';
        else if (type === 'PFMEA') docName = 'Process FMEA';
        else if (type === 'DFMEA') docName = 'Design FMEA';
        else if (type === 'CONTROL_PLAN') docName = 'Control Plan';

        // Create document
        const document = await tx.document.create({
          data: {
            tenantId,
            projectId: project.id,
            type,
            name: `${project.name} - ${docName}`,
            status: 'active',
            createdById: userId,
          },
        });

        // Create initial draft revision
        const revision = await tx.documentRevision.create({
          data: {
            documentId: document.id,
            revisionNumber: '1.0',
            status: 'draft',
            summary: sourceDoc ? `Imported from ${sourceDoc.name}` : 'Initial draft version',
            changeDescription: sourceDoc ? 'Imported initial version from source project.' : 'Initial project creation.',
            createdById: userId,
          },
        });

        // Link document to current revision
        await tx.document.update({
          where: { id: document.id },
          data: { currentRevisionId: revision.id },
        });

        // Copy content from source document if found
        if (sourceDoc && sourceDoc.currentRevisionId) {
          const oldRevisionId = sourceDoc.currentRevisionId;

          if (type === 'PFD') {
            const oldSteps = await tx.processStep.findMany({
              where: { revisionId: oldRevisionId },
              orderBy: { sequenceOrder: 'asc' }
            });
            for (const step of oldSteps) {
              const newStep = await tx.processStep.create({
                data: {
                  revisionId: revision.id,
                  processItemId: step.processItemId,
                  stepNumber: step.stepNumber,
                  name: step.name,
                  description: step.description,
                  stepType: step.stepType,
                  sequenceOrder: step.sequenceOrder,
                  inputs: step.inputs,
                  outputs: step.outputs,
                  resources: step.resources,
                  incomingVariation: step.incomingVariation || undefined,
                  specialCharacteristics: step.specialCharacteristics,
                  flowIcons: step.flowIcons || undefined,
                  machinesEquipmentDocs: step.machinesEquipmentDocs || undefined,
                  desiredOutcome: step.desiredOutcome,
                  processCharacteristics: step.processCharacteristics,
                  linkedPfdStepId: step.linkedPfdStepId,
                  isOrphaned: step.isOrphaned,
                },
              });
              stepIdMap.set(step.id, newStep.id);
            }
          } else if (type === 'PFMEA' || type === 'DFMEA') {
            const oldRows = await tx.pfmeaRow.findMany({
              where: { revisionId: oldRevisionId },
              include: {
                functions: true,
                requirements: true,
                failureModes: true,
                effects: true,
                causes: true,
                controls: true,
                characteristics: true,
              },
              orderBy: { rowNumber: 'asc' }
            });

            for (const row of oldRows) {
              const newStepId = row.processStepId ? stepIdMap.get(row.processStepId) : null;

              const newRow = await tx.pfmeaRow.create({
                data: {
                  revisionId: revision.id,
                  processStepId: newStepId || undefined,
                  workElementName: row.workElementName,
                  rowNumber: row.rowNumber,
                  severity: row.severity,
                  occurrence: row.occurrence,
                  detection: row.detection,
                  ap: row.ap,
                  filterCode: row.filterCode,
                  status: row.status,
                  accessLevel: row.accessLevel,
                  preventionAction: row.preventionAction,
                  detectionAction: row.detectionAction,
                  responsibility: row.responsibility,
                  targetDate: row.targetDate,
                  actionTaken: row.actionTaken,
                  completionDate: row.completionDate,
                  revisedSeverity: row.revisedSeverity,
                  revisedOccurrence: row.revisedOccurrence,
                  revisedDetection: row.revisedDetection,
                  revisedAp: row.revisedAp,
                  notes: row.notes,
                  createdById: userId,
                },
              });

              // Copy relations
              if (row.functions.length > 0) {
                await tx.pfmeaRowFunction.createMany({
                  data: row.functions.map(f => ({
                    pfmeaRowId: newRow.id,
                    functionId: f.functionId,
                  }))
                });
              }
              if (row.requirements.length > 0) {
                await tx.pfmeaRowRequirement.createMany({
                  data: row.requirements.map(req => ({
                    pfmeaRowId: newRow.id,
                    requirementId: req.requirementId,
                  }))
                });
              }
              if (row.failureModes.length > 0) {
                await tx.pfmeaRowFailureMode.createMany({
                  data: row.failureModes.map(fm => ({
                    pfmeaRowId: newRow.id,
                    failureModeId: fm.failureModeId,
                  }))
                });
              }
              if (row.effects.length > 0) {
                await tx.pfmeaRowEffect.createMany({
                  data: row.effects.map(e => ({
                    pfmeaRowId: newRow.id,
                    effectId: e.effectId,
                  }))
                });
              }
              if (row.causes.length > 0) {
                await tx.pfmeaRowCause.createMany({
                  data: row.causes.map(c => ({
                    pfmeaRowId: newRow.id,
                    causeId: c.causeId,
                  }))
                });
              }
              if (row.controls.length > 0) {
                await tx.pfmeaRowControl.createMany({
                  data: row.controls.map(ctrl => ({
                    pfmeaRowId: newRow.id,
                    controlId: ctrl.controlId,
                  }))
                });
              }
              if (row.characteristics.length > 0) {
                await tx.pfmeaRowCharacteristic.createMany({
                  data: row.characteristics.map(char => ({
                    pfmeaRowId: newRow.id,
                    characteristicId: char.characteristicId,
                  }))
                });
              }
            }
          } else if (type === 'CONTROL_PLAN') {
            const oldCpRows = await tx.controlPlanRow.findMany({
              where: { revisionId: oldRevisionId },
              orderBy: { rowNumber: 'asc' }
            });
            for (const cpRow of oldCpRows) {
              const newStepId = cpRow.processStepId ? stepIdMap.get(cpRow.processStepId) : null;

              await tx.controlPlanRow.create({
                data: {
                  revisionId: revision.id,
                  processStepId: newStepId || cpRow.processStepId,
                  characteristicId: cpRow.characteristicId,
                  rowNumber: cpRow.rowNumber,
                  specTolerance: cpRow.specTolerance,
                  measurementMethod: cpRow.measurementMethod,
                  sampleSize: cpRow.sampleSize,
                  frequency: cpRow.frequency,
                  controlType: cpRow.controlType,
                  controlMethod: cpRow.controlMethod,
                  reactionPlan: cpRow.reactionPlan,
                  responsible: cpRow.responsible,
                  notes: cpRow.notes,
                },
              });
            }
          }
        }
      }

      return project;
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProjectDto) {
    // Verify ownership first
    await this.findOne(tenantId, id);

    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        customer: dto.customer,
        status: dto.status,
        modelYear: dto.modelYear,

        organisationName: dto.organisationName,
        organisationCode: dto.organisationCode,
        orgPartNumber: dto.orgPartNumber,
        organisationPlant: dto.organisationPlant,
        customerPartNumber: dto.customerPartNumber,
        partName: dto.partName,
        keyContact: dto.keyContact,
        latestChangeLevel: dto.latestChangeLevel,
        drawingRevDate: dto.drawingRevDate === null ? null : (dto.drawingRevDate ? new Date(dto.drawingRevDate) : undefined),
        documentNumber: dto.documentNumber,
        controlPlanNumber: dto.controlPlanNumber,
        assemblyLineNumber: dto.assemblyLineNumber,
        originationDate: dto.originationDate ? new Date(dto.originationDate) : undefined,
        supplierApprovalDate: dto.supplierApprovalDate === null ? null : (dto.supplierApprovalDate ? new Date(dto.supplierApprovalDate) : undefined),
        otherApprovalDate: dto.otherApprovalDate === null ? null : (dto.otherApprovalDate ? new Date(dto.otherApprovalDate) : undefined),
        documentTypes: dto.documentTypes,
        cftMembers: dto.cftMembers,
        customerEngApprover: dto.customerEngApprover,
        customerEngApprovalDate: dto.customerEngApprovalDate === null ? null : (dto.customerEngApprovalDate ? new Date(dto.customerEngApprovalDate) : undefined),
        customerQualApprover: dto.customerQualApprover,
        customerQualApprovalDate: dto.customerQualApprovalDate === null ? null : (dto.customerQualApprovalDate ? new Date(dto.customerQualApprovalDate) : undefined),
        otherApprover: dto.otherApprover,
        otherApprovalDate2: dto.otherApprovalDate2 === null ? null : (dto.otherApprovalDate2 ? new Date(dto.otherApprovalDate2) : undefined),
        dwgNumber: dto.dwgNumber,
        dwgRevNoAndDate: dto.dwgRevNoAndDate,
        preliminaryFinalFlag: dto.preliminaryFinalFlag,
        uiSettings: dto.uiSettings,
        revisionNumber: dto.revisionNumber,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    // Verify ownership first (allow deleting archived projects)
    await this.findOne(tenantId, id, true);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async findDocuments(tenantId: string, projectId: string) {
    await this.findOne(tenantId, projectId);

    return this.prisma.document.findMany({
      where: { projectId, tenantId },
    });
  }

  async createRevision(
    tenantId: string,
    projectId: string,
    userId: string,
    changeDesc: string,
    options?: {
      revisionNumber?: string;
      summary?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    },
  ) {
    const project = await this.findOne(tenantId, projectId);

    // Determine the next revision number
    let nextRev: string;
    if (options?.revisionNumber) {
      // Validate format: must be X.Y (e.g. 2.0, 3.1)
      if (!/^\d+\.\d+$/.test(options.revisionNumber)) {
        throw new BadRequestException(
          'Revision number must match the format X.Y (e.g. 2.0, 3.1)',
        );
      }
      nextRev = options.revisionNumber;
    } else {
      // Auto-increment from the current project revision number
      nextRev = (parseFloat(project.revisionNumber || '1.0') + 1.0).toFixed(1);
    }

    // Check for duplicate revision number across the project's documents
    const documents = await this.prisma.document.findMany({
      where: { projectId, tenantId },
      include: {
        revisions: {
          where: { revisionNumber: nextRev },
          select: { id: true },
        },
      },
    });

    const hasDuplicate = documents.some((doc) => doc.revisions.length > 0);
    if (hasDuplicate) {
      throw new ConflictException(
        `Revision number ${nextRev} already exists for one or more documents in this project.`,
      );
    }

    const createdRevisions = await this.prisma.$transaction(async (tx) => {
      const newRevisions: any[] = [];

      for (const doc of documents) {
        // Create new DocumentRevision
        const newRevision = await tx.documentRevision.create({
          data: {
            documentId: doc.id,
            revisionNumber: nextRev,
            status: 'draft',
            summary: options?.summary || `Revision ${nextRev}`,
            changeDescription: changeDesc,
            effectiveFrom: options?.effectiveFrom
              ? new Date(options.effectiveFrom)
              : undefined,
            effectiveTo: options?.effectiveTo
              ? new Date(options.effectiveTo)
              : undefined,
            createdById: userId,
          },
        });

        // Copy data from old revision (if there is a current revision)
        if (doc.currentRevisionId) {
          const oldRevisionId = doc.currentRevisionId;

          // Copy ProcessSteps (for PFD documents)
          if (doc.type === 'PFD') {
            const oldSteps = await tx.processStep.findMany({
              where: { revisionId: oldRevisionId },
            });
            for (const step of oldSteps) {
              await tx.processStep.create({
                data: {
                  revisionId: newRevision.id,
                  processItemId: step.processItemId,
                  stepNumber: step.stepNumber,
                  name: step.name,
                  description: step.description,
                  stepType: step.stepType,
                  sequenceOrder: step.sequenceOrder,
                  inputs: step.inputs,
                  outputs: step.outputs,
                  resources: step.resources,
                  incomingVariation: step.incomingVariation || undefined,
                  specialCharacteristics: step.specialCharacteristics,
                  flowIcons: step.flowIcons || undefined,
                  machinesEquipmentDocs: step.machinesEquipmentDocs || undefined,
                  desiredOutcome: step.desiredOutcome,
                  processCharacteristics: step.processCharacteristics,
                  linkedPfdStepId: step.linkedPfdStepId,
                  isOrphaned: step.isOrphaned,
                },
              });
            }
          }

          // Copy PfmeaRows (for PFMEA documents)
          if (doc.type === 'PFMEA') {
            const oldRows = await tx.pfmeaRow.findMany({
              where: { revisionId: oldRevisionId },
            });
            for (const row of oldRows) {
              await tx.pfmeaRow.create({
                data: {
                  revisionId: newRevision.id,
                  processStepId: row.processStepId,
                  workElementName: row.workElementName,
                  rowNumber: row.rowNumber,
                  severity: row.severity,
                  occurrence: row.occurrence,
                  detection: row.detection,
                  ap: row.ap,
                  filterCode: row.filterCode,
                  status: row.status,
                  accessLevel: row.accessLevel,
                  preventionAction: row.preventionAction,
                  detectionAction: row.detectionAction,
                  responsibility: row.responsibility,
                  targetDate: row.targetDate,
                  actionTaken: row.actionTaken,
                  completionDate: row.completionDate,
                  revisedSeverity: row.revisedSeverity,
                  revisedOccurrence: row.revisedOccurrence,
                  revisedDetection: row.revisedDetection,
                  revisedAp: row.revisedAp,
                  notes: row.notes,
                  createdById: userId,
                },
              });
            }
          }

          // Copy ControlPlanRows (for CONTROL_PLAN documents)
          if (doc.type === 'CONTROL_PLAN') {
            const oldCpRows = await tx.controlPlanRow.findMany({
              where: { revisionId: oldRevisionId },
            });
            for (const cpRow of oldCpRows) {
              await tx.controlPlanRow.create({
                data: {
                  revisionId: newRevision.id,
                  processStepId: cpRow.processStepId,
                  characteristicId: cpRow.characteristicId,
                  rowNumber: cpRow.rowNumber,
                  specTolerance: cpRow.specTolerance,
                  measurementMethod: cpRow.measurementMethod,
                  sampleSize: cpRow.sampleSize,
                  frequency: cpRow.frequency,
                  controlType: cpRow.controlType,
                  controlMethod: cpRow.controlMethod,
                  reactionPlan: cpRow.reactionPlan,
                  responsible: cpRow.responsible,
                  notes: cpRow.notes,
                },
              });
            }
          }

          // Mark the previous revision as superseded
          await tx.documentRevision.update({
            where: { id: oldRevisionId },
            data: { status: 'superseded' },
          });
        }

        // Update document to point to the new revision
        await tx.document.update({
          where: { id: doc.id },
          data: { currentRevisionId: newRevision.id },
        });

        newRevisions.push(newRevision);
      }

      // Update project revision number
      await tx.project.update({
        where: { id: projectId },
        data: { revisionNumber: nextRev },
      });

      // Create backward-compatible ProjectRevision log entry
      await tx.projectRevision.create({
        data: {
          projectId,
          revisionNo: nextRev,
          changeDesc: changeDesc,
          createdById: userId,
        },
      });

      return newRevisions;
    });

    // Write audit log entry
    await this.auditLogService.createEntry({
      tenantId,
      userId,
      entityType: 'document_revision',
      entityId: createdRevisions[0]?.id || projectId,
      action: 'create',
      newValue: {
        revisionNumber: nextRev,
        projectId,
        changeDescription: changeDesc,
        documentCount: createdRevisions.length,
      },
    });

    return createdRevisions;
  }

  async getRevisions(tenantId: string, projectId: string) {
    await this.findOne(tenantId, projectId);

    // Fetch DocumentRevision records for all documents of the project
    const documents = await this.prisma.document.findMany({
      where: { projectId, tenantId },
      select: { id: true },
    });

    const documentIds = documents.map((d) => d.id);

    return this.prisma.documentRevision.findMany({
      where: { documentId: { in: documentIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            processSteps: true,
            pfmeaRows: true,
            controlPlanRows: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        document: {
          select: {
            id: true,
            type: true,
            name: true,
            currentRevisionId: true,
          },
        },
      },
    });
  }

  async getRevisionDetail(tenantId: string, revisionId: string) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: {
        _count: {
          select: {
            processSteps: true,
            pfmeaRows: true,
            controlPlanRows: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        document: {
          select: {
            id: true,
            type: true,
            name: true,
            currentRevisionId: true,
            tenantId: true,
            projectId: true,
          },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    // Tenant isolation check
    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this revision');
    }

    return revision;
  }

  async deleteRevision(tenantId: string, userId: string, revisionId: string) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: {
        document: {
          select: {
            id: true,
            tenantId: true,
            currentRevisionId: true,
          },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    // Tenant isolation check
    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this revision');
    }

    // Cannot delete the currently active revision
    if (revision.document.currentRevisionId === revisionId) {
      throw new BadRequestException('Cannot delete the active revision.');
    }

    // Cannot delete if it's locked
    if (revision.lockedAt !== null) {
      throw new BadRequestException('Cannot delete a locked revision.');
    }

    // Cannot delete the only revision for the document
    const revisionCount = await this.prisma.documentRevision.count({
      where: { documentId: revision.documentId },
    });

    if (revisionCount <= 1) {
      throw new BadRequestException('Cannot delete the last revision.');
    }

    // Delete within a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.processStep.deleteMany({ where: { revisionId } });
      await tx.pfmeaRow.deleteMany({ where: { revisionId } });
      await tx.controlPlanRow.deleteMany({ where: { revisionId } });
      await tx.documentRevision.delete({ where: { id: revisionId } });
    });

    // Write audit log entry
    await this.auditLogService.createEntry({
      tenantId,
      userId,
      entityType: 'document_revision',
      entityId: revisionId,
      action: 'delete',
      oldValue: {
        revisionNumber: revision.revisionNumber,
        status: revision.status,
        documentId: revision.documentId,
      },
    });

    return { deleted: true, revisionId };
  }

  async adminDeleteRevision(tenantId: string, userId: string, revisionId: string) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: {
        document: {
          select: {
            id: true,
            tenantId: true,
            projectId: true,
            currentRevisionId: true,
          },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    // Tenant isolation check
    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this revision');
    }

    // Delete within a transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. If this is the currently active revision for the document
      if (revision.document.currentRevisionId === revisionId) {
        // Find another revision for this document (e.g. most recent one that is not this revision)
        const anotherRevision = await tx.documentRevision.findFirst({
          where: {
            documentId: revision.documentId,
            id: { not: revisionId }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Set document's currentRevisionId to the other revision or null
        await tx.document.update({
          where: { id: revision.documentId },
          data: {
            currentRevisionId: anotherRevision ? anotherRevision.id : null
          }
        });

        // Also if we changed it, update the project's revisionNumber to match the new active revision's number (or '1.0' if none)
        await tx.project.update({
          where: { id: revision.document.projectId },
          data: {
            revisionNumber: anotherRevision ? anotherRevision.revisionNumber : '1.0'
          }
        });
      }

      // 2. Delete cascaded data
      await tx.processStep.deleteMany({ where: { revisionId } });
      await tx.pfmeaRow.deleteMany({ where: { revisionId } });
      await tx.controlPlanRow.deleteMany({ where: { revisionId } });
      await tx.approval.deleteMany({ where: { revisionId } });

      // 3. Delete AuditLog entries related to this revision
      await tx.auditLog.deleteMany({
        where: {
          tenantId,
          entityId: revisionId
        }
      });

      // 4. Delete ProjectRevision log entries matching this revision number and project
      await tx.projectRevision.deleteMany({
        where: {
          projectId: revision.document.projectId,
          revisionNo: revision.revisionNumber
        }
      });

      // 5. Delete the DocumentRevision itself
      await tx.documentRevision.delete({ where: { id: revisionId } });
    });

    return { deleted: true, revisionId };
  }

  async adminGetRevisions(tenantId: string) {
    return this.prisma.documentRevision.findMany({
      where: {
        document: {
          tenantId
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            processSteps: true,
            pfmeaRows: true,
            controlPlanRows: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        document: {
          select: {
            id: true,
            type: true,
            name: true,
            currentRevisionId: true,
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
        },
      },
    });
  }

  async updateRevision(
    tenantId: string,
    userId: string,
    revisionId: string,
    dto: {
      revisionNumber?: string;
      summary?: string;
      changeDescription?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    },
  ) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: {
        document: {
          select: { tenantId: true, id: true },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    // Tenant isolation check
    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this revision');
    }

    // Cannot update a locked revision
    if (revision.lockedAt !== null) {
      throw new BadRequestException('Cannot update a locked revision.');
    }

    // If revision number is changing, validate format and uniqueness
    if (dto.revisionNumber && dto.revisionNumber !== revision.revisionNumber) {
      if (!/^\d+\.\d+$/.test(dto.revisionNumber)) {
        throw new BadRequestException(
          'Revision number must match the format X.Y (e.g. 2.0, 3.1)',
        );
      }

      const existing = await this.prisma.documentRevision.findUnique({
        where: {
          documentId_revisionNumber: {
            documentId: revision.documentId,
            revisionNumber: dto.revisionNumber,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Revision number ${dto.revisionNumber} already exists for this document.`,
        );
      }
    }

    const oldValue = {
      revisionNumber: revision.revisionNumber,
      summary: revision.summary,
      changeDescription: revision.changeDescription,
      effectiveFrom: revision.effectiveFrom,
      effectiveTo: revision.effectiveTo,
    };

    const updated = await this.prisma.documentRevision.update({
      where: { id: revisionId },
      data: {
        revisionNumber: dto.revisionNumber,
        summary: dto.summary,
        changeDescription: dto.changeDescription,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
    });

    // Write audit log entry with old/new values
    await this.auditLogService.createEntry({
      tenantId,
      userId,
      entityType: 'document_revision',
      entityId: revisionId,
      action: 'update',
      oldValue,
      newValue: {
        revisionNumber: updated.revisionNumber,
        summary: updated.summary,
        changeDescription: updated.changeDescription,
        effectiveFrom: updated.effectiveFrom,
        effectiveTo: updated.effectiveTo,
      },
    });

    return updated;
  }

  async switchActiveRevision(tenantId: string, userId: string, revisionId: string) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: {
        document: {
          select: {
            id: true,
            tenantId: true,
            projectId: true,
            currentRevisionId: true,
          },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    // Tenant isolation check
    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this revision');
    }

    // Update document to point to this revision
    await this.prisma.document.update({
      where: { id: revision.document.id },
      data: { currentRevisionId: revisionId },
    });

    // Update project's revision number to match
    await this.prisma.project.update({
      where: { id: revision.document.projectId },
      data: { revisionNumber: revision.revisionNumber },
    });

    // Write audit log entry
    await this.auditLogService.createEntry({
      tenantId,
      userId,
      entityType: 'document_revision',
      entityId: revisionId,
      action: 'activate',
      oldValue: { previousActiveRevisionId: revision.document.currentRevisionId },
      newValue: { newActiveRevisionId: revisionId, revisionNumber: revision.revisionNumber },
    });

    return { activated: true, revisionId, revisionNumber: revision.revisionNumber };
  }
}
