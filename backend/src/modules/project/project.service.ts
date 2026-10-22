import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import * as bcrypt from 'bcryptjs';
import { revisionReadiness } from './revision-readiness';
import { PfdGraph } from '../pfd/pfd-graph';
import {
  assertEngineeringRevisionAccess,
  assertEngineeringProjectAccess,
  EngineeringActor,
} from '../../common/engineering-access';
import { dfmeaReadiness, DfmeaData } from '../dfmea/dfmea-document';
import { ControlPlanDocumentService } from '../control-plan/control-plan-document.service';
import { Prisma } from '@prisma/client';
import { resolveProjectPresentation } from './project-presentation';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async assertActorProjectAccess(
    actor: EngineeringActor,
    projectId: string,
    write = false,
  ) {
    return assertEngineeringProjectAccess(this.prisma, actor, projectId, write);
  }
  async assertActorRevisionAccess(
    actor: EngineeringActor,
    revisionId: string,
    projectId?: string,
    write = false,
  ) {
    const revision = await assertEngineeringRevisionAccess(
      this.prisma,
      actor,
      revisionId,
      undefined,
      write,
    );
    if (projectId && revision.document.projectId !== projectId)
      throw new BadRequestException('Revision belongs to another project');
    return revision;
  }
  private async copyProcessContainer(
    tx: Prisma.TransactionClient,
    sourceItemId: string,
    targetProjectId: string,
    tenantId: string,
    ids: Map<string, string>,
  ) {
    if (ids.has(sourceItemId)) return ids.get(sourceItemId)!;
    const source = await tx.processItem.findFirstOrThrow({
      where: { id: sourceItemId, tenantId },
    });
    const copied = await tx.processItem.create({
      data: {
        tenantId,
        projectId: targetProjectId,
        name: source.name,
        description: source.description,
      },
    });
    ids.set(sourceItemId, copied.id);
    return copied.id;
  }

  private async copyEngineeringDocument(
    tx: Prisma.TransactionClient,
    oldId: string,
    newId: string,
    tenantId: string,
    idMap = new Map<string, string>(),
    crossProject = false,
  ) {
    const design = await tx.dfmeaDocument.findFirst({
      where: { revisionId: oldId, tenantId },
    });
    const plan = await tx.controlPlanDocument.findFirst({
      where: { revisionId: oldId, tenantId },
    });
    // Stable aggregate identities are revision-local; external database references are remapped.
    const remap = (value: any): any =>
      typeof value === 'string'
        ? idMap.get(value) || value
        : Array.isArray(value)
          ? value.map(remap)
          : value && typeof value === 'object'
            ? Object.fromEntries(
                Object.entries(value).map(([k, v]) => [k, remap(v)]),
              )
            : value;
    if (design)
      await tx.dfmeaDocument.create({
        data: { revisionId: newId, tenantId, data: remap(design.data) },
      });
    if (plan) {
      const data = remap(plan.data);
      if (crossProject) {
        data.sourceBaselines = (data.sourceBaselines || []).filter(
          (b: any) =>
            idMap.has(b.revisionId) ||
            [...idMap.values()].includes(b.revisionId),
        );
        data.header = {
          ...data.header,
          controlPlanNumber: '',
          supplierApprovalDate: '',
          customerEngApprovalDate: '',
          customerQualApprovalDate: '',
        };
        for (const line of data.lines || []) {
          if (
            line.operationId &&
            ![...idMap.values()].includes(line.operationId)
          )
            line.operationId = '';
          if (
            line.source &&
            ![...idMap.values()].includes(line.source.revisionId)
          ) {
            line.notes = `${line.notes || ''}\nImported source baseline ${line.source.revisionId}: remapping/review required.`;
            delete line.source;
            line.sourceState = 'manual';
          } else if (line.source) {
            line.source.key = line.source.key
              .split(':')
              .map((part: string) => idMap.get(part) || part)
              .join(':');
            line.sourceState = 'changed';
          }
        }
      }
      await tx.controlPlanDocument.create({
        data: { revisionId: newId, tenantId, data },
      });
    }
  }

  private async copyProcessGraph(
    tx: Prisma.TransactionClient,
    sourceRevisionId: string,
    targetRevisionId: string,
    stepIds: Map<string, string>,
  ) {
    const source = await tx.documentRevision.findUnique({
      where: { id: sourceRevisionId },
      select: { pfdGraph: true },
    });
    const graph = source?.pfdGraph as unknown as PfdGraph | null;
    if (!graph || ![1, 2].includes(graph.schemaVersion)) return;
    const nodes = graph.nodes
      .filter((n) => n.kind !== 'step' || (n.stepId && stepIds.has(n.stepId)))
      .map((n) => ({
        ...n,
        ...(n.stepId ? { stepId: stepIds.get(n.stepId)! } : {}),
      }));
    const nodeIds = new Set(nodes.map((n) => n.id));
    await tx.documentRevision.update({
      where: { id: targetRevisionId },
      data: {
        pfdGraph: {
          ...graph,
          nodes,
          edges: graph.edges.filter(
            (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
          ),
          reviewStatus: 'draft',
        } as unknown as Prisma.InputJsonValue,
        pfdGraphVersion: 0,
      },
    });
  }

  private async autoArchiveExpiredGuestProjects(tenantId: string) {
    try {
      const cutOff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredProjects = await this.prisma.project.findMany({
        where: {
          tenantId,
          status: { not: 'archived' },
          createdAt: { lt: cutOff },
          creator: { isGuest: true },
        },
        include: { creator: true },
      });

      for (const p of expiredProjects) {
        const creatorName = p.creator?.name || 'Guest';
        const formattedDate = p.createdAt
          .toISOString()
          .replace('T', ' ')
          .substring(0, 16);
        const archivedName = `[Guest Archive - ${creatorName}] ${p.name || p.partName || 'Project'} (${formattedDate})`;
        const currentUi = (p.uiSettings as Record<string, any>) || {};

        await this.prisma.project.update({
          where: { id: p.id },
          data: {
            name: archivedName,
            status: 'archived',
            uiSettings: {
              ...currentUi,
              isGuestArchive: true,
              archivedAt: new Date().toISOString(),
              originalName: p.name || p.partName,
            },
          },
        });
      }
    } catch (err) {
      console.error('Failed to auto-archive expired guest projects:', err);
    }
  }

  async findAll(
    tenantId: string,
    status?: string,
    page?: number,
    limit?: number,
    userId?: string,
    search?: string,
    isGuest = false,
    isAdmin = false,
  ) {
    // 1. Auto-archive any guest projects older than 24 hours
    await this.autoArchiveExpiredGuestProjects(tenantId);

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;
    let where: any = {};

    if (isAdmin) {
      // Admin sees ALL projects in system or tenant, including archived guest projects
      where = {
        tenantId,
        ...(status && status !== 'all' ? { status } : {}),
      };
    } else if (isGuest) {
      // Guests can ONLY see:
      // (a) The pre-filled reference demo project
      // (b) At most 1 active project created by this guest within 24h
      const cutOff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      where = {
        tenantId,
        OR: [
          { id: 'c439cfbe-548a-4e25-a37c-0194652b8526' }, // Reference demo project
          {
            createdById: userId,
            status: { not: 'archived' },
            createdAt: { gte: cutOff },
          },
        ],
      };
    } else {
      // Normal Quality Engineer
      where = {
        tenantId,
        status: status || { not: 'archived' },
      };
      if (userId) {
        where.createdById = userId;
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      const searchCondition = {
        OR: [
          { partName: { contains: s, mode: 'insensitive' } },
          { orgPartNumber: { contains: s, mode: 'insensitive' } },
          { customer: { contains: s, mode: 'insensitive' } },
          { name: { contains: s, mode: 'insensitive' } },
        ],
      };
      if (where.OR) {
        where = {
          AND: [where, searchCondition],
        };
      } else {
        where.AND = [searchCondition];
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          creator: {
            select: { id: true, name: true, email: true, isGuest: true },
          },
          documents: { select: { id: true, type: true, status: true } },
        },
      }),
      this.prisma.project.count({
        where,
      }),
    ]);
    return {
      data: data.map((p) => ({
        ...p,
        presentation: resolveProjectPresentation(p),
      })),
      total,
      page: page || 1,
      limit: limit || total,
    };
  }

  async findOne(
    tenantId: string,
    id: string,
    allowArchived = false,
    isAdmin = false,
  ) {
    if (
      !id ||
      typeof id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new NotFoundException('Project not found');
    }

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true, isGuest: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (isAdmin) {
      return project;
    }

    if (project.status === 'archived' && !allowArchived) {
      throw new NotFoundException('Project not found');
    }

    // Allow viewing the reference demo project across tenants if needed
    const isReferenceDemo =
      (project.uiSettings as any)?.isDemo ||
      id === 'c439cfbe-548a-4e25-a37c-0194652b8526';
    if (project.tenantId !== tenantId && !isReferenceDemo) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async create(
    tenantId: string,
    userId: string,
    dto: CreateProjectDto,
    isGuest = false,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // If guest user, enforce 1 custom project limit
      if (isGuest) {
        const cutOff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const guestActiveCount = await tx.project.count({
          where: {
            createdById: userId,
            status: { not: 'archived' },
            createdAt: { gte: cutOff },
          },
        });
        if (guestActiveCount >= 1) {
          throw new BadRequestException(
            'Guest accounts are limited to 1 custom project (24h lifespan). Please delete your project to create a new one.',
          );
        }
      }

      // Preview cap: public-try limited to 10 projects (store requirement, Q5)
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (tenant?.subdomain === 'public-try') {
        const cnt = await tx.project.count({ where: { tenantId } });
        if (cnt >= 10)
          throw new BadRequestException(
            'Preview limited to 10 projects — contact sales for enterprise',
          );
      }

      const expiresAt = isGuest
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;
      const initialUi = dto.uiSettings
        ? typeof dto.uiSettings === 'string'
          ? JSON.parse(dto.uiSettings)
          : dto.uiSettings
        : {};
      const uiSettings = isGuest
        ? { ...initialUi, isGuestProject: true, expiresAt }
        : initialUi;

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
          uiSettings,

          organisationName: dto.organisationName,
          organisationCode: dto.organisationCode,
          orgPartNumber: dto.orgPartNumber,
          organisationPlant: dto.organisationPlant,
          customerPartNumber: dto.customerPartNumber,
          partName: dto.partName,
          keyContact: dto.keyContact,
          latestChangeLevel: dto.latestChangeLevel,
          drawingRevDate: dto.drawingRevDate
            ? new Date(dto.drawingRevDate)
            : null,
          documentNumber: dto.documentNumber,
          controlPlanNumber: dto.controlPlanNumber,
          assemblyLineNumber: dto.assemblyLineNumber,
          originationDate: dto.originationDate
            ? new Date(dto.originationDate)
            : new Date(),
          supplierApprovalDate: dto.supplierApprovalDate
            ? new Date(dto.supplierApprovalDate)
            : null,
          otherApprovalDate: dto.otherApprovalDate
            ? new Date(dto.otherApprovalDate)
            : null,
          documentTypes: dto.documentTypes,
          cftMembers: dto.cftMembers || [],
          customerEngApprover: dto.customerEngApprover,
          customerEngApprovalDate: dto.customerEngApprovalDate
            ? new Date(dto.customerEngApprovalDate)
            : null,
          customerQualApprover: dto.customerQualApprover,
          customerQualApprovalDate: dto.customerQualApprovalDate
            ? new Date(dto.customerQualApprovalDate)
            : null,
          otherApprover: dto.otherApprover,
          otherApprovalDate2: dto.otherApprovalDate2
            ? new Date(dto.otherApprovalDate2)
            : null,
          dwgNumber: dto.dwgNumber,
          dwgRevNoAndDate: dto.dwgRevNoAndDate,
          preliminaryFinalFlag: dto.preliminaryFinalFlag || 'preliminary',
        },
      });

      // 2. Initialize documents (PFD, PFMEA, CONTROL_PLAN, DFMEA) - import from existing project if selected
      const stepIdMap = new Map<string, string>();
      const engineeringCopies: { oldId: string; newId: string }[] = [];
      const allDocTypes = ['PFD', 'PFMEA', 'DFMEA', 'CONTROL_PLAN'];
      const docsToCreate = [
        ...new Set([...allDocTypes, ...(dto.documentTypes || [])]),
      ];
      const orderedDocTypes = ['PFD', 'DFMEA', 'PFMEA', 'CONTROL_PLAN'].filter(
        (type) => docsToCreate.includes(type),
      );

      const isImporting = !!dto.sourceProjectId;
      const importTypes = dto.importTypes || [];

      for (const type of orderedDocTypes) {
        let sourceDoc: any = null;
        if (isImporting && importTypes.includes(type)) {
          sourceDoc = await tx.document.findFirst({
            where: {
              projectId: dto.sourceProjectId,
              type,
              tenantId,
            },
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
            summary: sourceDoc
              ? `Imported from ${sourceDoc.name}`
              : 'Initial draft version',
            changeDescription: sourceDoc
              ? 'Imported initial version from source project.'
              : 'Initial project creation.',
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
          stepIdMap.set(oldRevisionId, revision.id);
          engineeringCopies.push({ oldId: oldRevisionId, newId: revision.id });

          if (type === 'PFD') {
            const oldSteps = await tx.processStep.findMany({
              where: { revisionId: oldRevisionId },
              orderBy: { sequenceOrder: 'asc' },
            });
            for (const step of oldSteps) {
              const newStep = await tx.processStep.create({
                data: {
                  revisionId: revision.id,
                  processItemId: await this.copyProcessContainer(
                    tx,
                    step.processItemId,
                    project.id,
                    tenantId,
                    stepIdMap,
                  ),
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
                  manufacturingSymbolId: step.manufacturingSymbolId,
                  engineeringSymbolId: step.engineeringSymbolId,
                  machinesEquipmentDocs:
                    step.machinesEquipmentDocs || undefined,
                  desiredOutcome: step.desiredOutcome,
                  processCharacteristics: step.processCharacteristics,
                  linkedPfdStepId: step.linkedPfdStepId,
                  isOrphaned: step.isOrphaned,
                },
              });
              stepIdMap.set(step.id, newStep.id);
            }
            await this.copyProcessGraph(
              tx,
              oldRevisionId,
              revision.id,
              stepIdMap,
            );
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
              orderBy: { rowNumber: 'asc' },
            });

            for (const row of oldRows) {
              const newStepId = row.processStepId
                ? stepIdMap.get(row.processStepId)
                : null;

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

              stepIdMap.set(row.id, newRow.id);
              // Copy relations
              if (row.functions.length > 0) {
                await tx.pfmeaRowFunction.createMany({
                  data: row.functions.map((f) => ({
                    pfmeaRowId: newRow.id,
                    functionId: f.functionId,
                  })),
                });
              }
              if (row.requirements.length > 0) {
                await tx.pfmeaRowRequirement.createMany({
                  data: row.requirements.map((req) => ({
                    pfmeaRowId: newRow.id,
                    requirementId: req.requirementId,
                  })),
                });
              }
              if (row.failureModes.length > 0) {
                await tx.pfmeaRowFailureMode.createMany({
                  data: row.failureModes.map((fm) => ({
                    pfmeaRowId: newRow.id,
                    failureModeId: fm.failureModeId,
                  })),
                });
              }
              if (row.effects.length > 0) {
                await tx.pfmeaRowEffect.createMany({
                  data: row.effects.map((e) => ({
                    pfmeaRowId: newRow.id,
                    effectId: e.effectId,
                  })),
                });
              }
              if (row.causes.length > 0) {
                await tx.pfmeaRowCause.createMany({
                  data: row.causes.map((c) => ({
                    pfmeaRowId: newRow.id,
                    causeId: c.causeId,
                  })),
                });
              }
              if (row.controls.length > 0) {
                await tx.pfmeaRowControl.createMany({
                  data: row.controls.map((ctrl) => ({
                    pfmeaRowId: newRow.id,
                    controlId: ctrl.controlId,
                  })),
                });
              }
              if (row.characteristics.length > 0) {
                await tx.pfmeaRowCharacteristic.createMany({
                  data: row.characteristics.map((char) => ({
                    pfmeaRowId: newRow.id,
                    characteristicId: char.characteristicId,
                  })),
                });
              }
            }
          } else if (type === 'CONTROL_PLAN') {
            const oldCpRows = await tx.controlPlanRow.findMany({
              where: { revisionId: oldRevisionId },
              include: { pfmeaRows: true },
              orderBy: { rowNumber: 'asc' },
            });
            for (const cpRow of oldCpRows) {
              const newStepId = cpRow.processStepId
                ? stepIdMap.get(cpRow.processStepId)
                : null;

              await tx.controlPlanRow.create({
                data: {
                  revisionId: revision.id,
                  processStepId:
                    newStepId ||
                    (() => {
                      throw new BadRequestException(
                        'Include the source PFD when copying legacy Control Plan rows',
                      );
                    })(),
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
                  pfmeaRows: {
                    create: cpRow.pfmeaRows
                      .map((l) => ({ pfmeaRowId: stepIdMap.get(l.pfmeaRowId) }))
                      .filter((l) => !!l.pfmeaRowId)
                      .map((l) => ({ pfmeaRowId: l.pfmeaRowId! })),
                  },
                },
              });
            }
          }
        }
      }

      for (const copy of engineeringCopies)
        await this.copyEngineeringDocument(
          tx,
          copy.oldId,
          copy.newId,
          tenantId,
          stepIdMap,
          true,
        );
      return project;
    });
  }

  async replicate(
    tenantId: string,
    userId: string,
    sourceProjectId: string,
    dto: {
      name: string;
      qualityHeaderOverrides: Partial<CreateProjectDto>;
      includeTypes: string[];
    },
  ) {
    // Verify source project exists and user has access
    const sourceProject = await this.findOne(tenantId, sourceProjectId);

    // Check if source project has any documents of the requested types
    const sourceDocuments = await this.prisma.document.findMany({
      where: {
        projectId: sourceProjectId,
        tenantId,
        type: { in: dto.includeTypes },
      },
      include: {
        revisions: {
          where: { status: { not: 'deleted' } },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (sourceDocuments.length === 0) {
      throw new BadRequestException(
        'Source project has no documents of the selected types',
      );
    }

    // Check for guest user
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.isGuest) {
      throw new ForbiddenException('Guest users cannot replicate projects');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the new project with overridden quality header
      const project = await tx.project.create({
        data: {
          tenantId,
          createdById: userId,
          name: dto.name,
          description: sourceProject.description,
          customer:
            dto.qualityHeaderOverrides.customer ?? sourceProject.customer,
          plantId: sourceProject.plantId,
          productFamilyId: sourceProject.productFamilyId,
          modelYear:
            dto.qualityHeaderOverrides.modelYear ?? sourceProject.modelYear,
          status: 'active',

          organisationName:
            dto.qualityHeaderOverrides.organisationName ??
            sourceProject.organisationName,
          organisationCode:
            dto.qualityHeaderOverrides.organisationCode ??
            sourceProject.organisationCode,
          orgPartNumber:
            dto.qualityHeaderOverrides.orgPartNumber ??
            sourceProject.orgPartNumber,
          organisationPlant:
            dto.qualityHeaderOverrides.organisationPlant ??
            sourceProject.organisationPlant,
          customerPartNumber:
            dto.qualityHeaderOverrides.customerPartNumber ??
            sourceProject.customerPartNumber,
          partName:
            dto.qualityHeaderOverrides.partName ?? sourceProject.partName,
          keyContact:
            dto.qualityHeaderOverrides.keyContact ?? sourceProject.keyContact,
          latestChangeLevel:
            dto.qualityHeaderOverrides.latestChangeLevel ??
            sourceProject.latestChangeLevel,
          drawingRevDate: dto.qualityHeaderOverrides.drawingRevDate
            ? new Date(dto.qualityHeaderOverrides.drawingRevDate)
            : null,
          documentNumber: dto.qualityHeaderOverrides.documentNumber ?? '',
          controlPlanNumber:
            dto.qualityHeaderOverrides.controlPlanNumber ??
            sourceProject.controlPlanNumber,
          assemblyLineNumber:
            dto.qualityHeaderOverrides.assemblyLineNumber ??
            sourceProject.assemblyLineNumber,
          originationDate: new Date(),
          supplierApprovalDate: null,
          otherApprovalDate: null,
          documentTypes:
            dto.qualityHeaderOverrides.documentTypes &&
            dto.qualityHeaderOverrides.documentTypes.length > 0
              ? dto.qualityHeaderOverrides.documentTypes
              : sourceProject.documentTypes || ['Prototype'],
          cftMembers:
            dto.qualityHeaderOverrides.cftMembers ?? sourceProject.cftMembers,
          customerEngApprover:
            dto.qualityHeaderOverrides.customerEngApprover ?? null,
          customerEngApprovalDate: null,
          customerQualApprover:
            dto.qualityHeaderOverrides.customerQualApprover ?? null,
          customerQualApprovalDate: null,
          otherApprover: dto.qualityHeaderOverrides.otherApprover ?? null,
          otherApprovalDate2: null,
          dwgNumber:
            dto.qualityHeaderOverrides.dwgNumber ?? sourceProject.dwgNumber,
          dwgRevNoAndDate:
            dto.qualityHeaderOverrides.dwgRevNoAndDate ??
            sourceProject.dwgRevNoAndDate,
          preliminaryFinalFlag: 'preliminary',
        },
      });

      // 2. Initialize documents - clone from source project
      const stepIdMap = new Map<string, string>();
      const engineeringCopies: { oldId: string; newId: string }[] = [];

      const orderedDocTypes = ['PFD', 'DFMEA', 'PFMEA', 'CONTROL_PLAN'].filter(
        (type) => dto.includeTypes.includes(type),
      );

      for (const type of orderedDocTypes) {
        const sourceDoc = sourceDocuments.find((d) => d.type === type);
        if (!sourceDoc || !sourceDoc.revisions[0]) continue;
        const sourceRevisionId = sourceDoc.revisions[0].id;

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
            summary: `Replicated from ${sourceDoc.name}`,
            changeDescription:
              'Replicated initial version from source project.',
            createdById: userId,
          },
        });

        await tx.document.update({
          where: { id: document.id },
          data: { currentRevisionId: revision.id },
        });

        stepIdMap.set(sourceRevisionId, revision.id);
        engineeringCopies.push({ oldId: sourceRevisionId, newId: revision.id });
        // Clone content based on document type
        if (type === 'PFD') {
          const oldSteps = await tx.processStep.findMany({
            where: { revisionId: sourceRevisionId },
            orderBy: { sequenceOrder: 'asc' },
          });
          for (const step of oldSteps) {
            const newStep = await tx.processStep.create({
              data: {
                revisionId: revision.id,
                processItemId: await this.copyProcessContainer(
                  tx,
                  step.processItemId,
                  project.id,
                  tenantId,
                  stepIdMap,
                ),
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
                  manufacturingSymbolId: step.manufacturingSymbolId,
                  engineeringSymbolId: step.engineeringSymbolId,
                machinesEquipmentDocs: step.machinesEquipmentDocs || undefined,
                desiredOutcome: step.desiredOutcome,
                processCharacteristics: step.processCharacteristics,
                linkedPfdStepId: null,
                isOrphaned: step.isOrphaned,
              },
            });
            stepIdMap.set(step.id, newStep.id);
          }
          await this.copyProcessGraph(
            tx,
            sourceRevisionId,
            revision.id,
            stepIdMap,
          );
        } else if (type === 'PFMEA' || type === 'DFMEA') {
          const oldRows = await tx.pfmeaRow.findMany({
            where: { revisionId: sourceRevisionId },
            include: {
              functions: true,
              requirements: true,
              failureModes: true,
              effects: true,
              causes: true,
              controls: true,
              characteristics: true,
            },
            orderBy: { rowNumber: 'asc' },
          });

          for (const row of oldRows) {
            const newStepId = row.processStepId
              ? stepIdMap.get(row.processStepId)
              : null;

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

            stepIdMap.set(row.id, newRow.id);
            // Copy relations
            if (row.functions.length > 0) {
              await tx.pfmeaRowFunction.createMany({
                data: row.functions.map((f) => ({
                  pfmeaRowId: newRow.id,
                  functionId: f.functionId,
                })),
              });
            }
            if (row.requirements.length > 0) {
              await tx.pfmeaRowRequirement.createMany({
                data: row.requirements.map((req) => ({
                  pfmeaRowId: newRow.id,
                  requirementId: req.requirementId,
                })),
              });
            }
            if (row.failureModes.length > 0) {
              await tx.pfmeaRowFailureMode.createMany({
                data: row.failureModes.map((fm) => ({
                  pfmeaRowId: newRow.id,
                  failureModeId: fm.failureModeId,
                })),
              });
            }
            if (row.effects.length > 0) {
              await tx.pfmeaRowEffect.createMany({
                data: row.effects.map((e) => ({
                  pfmeaRowId: newRow.id,
                  effectId: e.effectId,
                })),
              });
            }
            if (row.causes.length > 0) {
              await tx.pfmeaRowCause.createMany({
                data: row.causes.map((c) => ({
                  pfmeaRowId: newRow.id,
                  causeId: c.causeId,
                })),
              });
            }
            if (row.controls.length > 0) {
              await tx.pfmeaRowControl.createMany({
                data: row.controls.map((ctrl) => ({
                  pfmeaRowId: newRow.id,
                  controlId: ctrl.controlId,
                })),
              });
            }
            if (row.characteristics.length > 0) {
              await tx.pfmeaRowCharacteristic.createMany({
                data: row.characteristics.map((char) => ({
                  pfmeaRowId: newRow.id,
                  characteristicId: char.characteristicId,
                })),
              });
            }
          }
        } else if (type === 'CONTROL_PLAN') {
          const oldCpRows = await tx.controlPlanRow.findMany({
            where: { revisionId: sourceRevisionId },
            include: { pfmeaRows: true },
            orderBy: { rowNumber: 'asc' },
          });
          for (const cpRow of oldCpRows) {
            const newStepId = cpRow.processStepId
              ? stepIdMap.get(cpRow.processStepId)
              : null;
            if (!newStepId && cpRow.processStepId) {
              throw new BadRequestException(
                'Include the source PFD when copying legacy Control Plan rows',
              );
            }

            await tx.controlPlanRow.create({
              data: {
                revisionId: revision.id,
                processStepId:
                  newStepId ||
                  (() => {
                    throw new BadRequestException(
                      'Include the source PFD when copying legacy Control Plan rows',
                    );
                  })(),
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
                pfmeaRows: {
                  create: cpRow.pfmeaRows
                    .map((l) => ({ pfmeaRowId: stepIdMap.get(l.pfmeaRowId) }))
                    .filter((l) => !!l.pfmeaRowId)
                    .map((l) => ({ pfmeaRowId: l.pfmeaRowId! })),
                },
              },
            });
          }
        }
      }

      for (const copy of engineeringCopies)
        await this.copyEngineeringDocument(
          tx,
          copy.oldId,
          copy.newId,
          tenantId,
          stepIdMap,
          true,
        );
      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          entityType: 'project',
          entityId: project.id,
          action: 'replicate',
          oldValue: { sourceProjectId, includeTypes: dto.includeTypes },
          newValue: { newProjectId: project.id },
        },
      });

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
        drawingRevDate:
          dto.drawingRevDate === null
            ? null
            : dto.drawingRevDate
              ? new Date(dto.drawingRevDate)
              : undefined,
        documentNumber: dto.documentNumber,
        controlPlanNumber: dto.controlPlanNumber,
        assemblyLineNumber: dto.assemblyLineNumber,
        originationDate: dto.originationDate
          ? new Date(dto.originationDate)
          : undefined,
        supplierApprovalDate:
          dto.supplierApprovalDate === null
            ? null
            : dto.supplierApprovalDate
              ? new Date(dto.supplierApprovalDate)
              : undefined,
        otherApprovalDate:
          dto.otherApprovalDate === null
            ? null
            : dto.otherApprovalDate
              ? new Date(dto.otherApprovalDate)
              : undefined,
        documentTypes: dto.documentTypes,
        cftMembers: dto.cftMembers,
        customerEngApprover: dto.customerEngApprover,
        customerEngApprovalDate:
          dto.customerEngApprovalDate === null
            ? null
            : dto.customerEngApprovalDate
              ? new Date(dto.customerEngApprovalDate)
              : undefined,
        customerQualApprover: dto.customerQualApprover,
        customerQualApprovalDate:
          dto.customerQualApprovalDate === null
            ? null
            : dto.customerQualApprovalDate
              ? new Date(dto.customerQualApprovalDate)
              : undefined,
        otherApprover: dto.otherApprover,
        otherApprovalDate2:
          dto.otherApprovalDate2 === null
            ? null
            : dto.otherApprovalDate2
              ? new Date(dto.otherApprovalDate2)
              : undefined,
        dwgNumber: dto.dwgNumber,
        dwgRevNoAndDate: dto.dwgRevNoAndDate,
        preliminaryFinalFlag: dto.preliminaryFinalFlag,
        uiSettings: dto.uiSettings,
        revisionNumber: dto.revisionNumber,
      },
    });
  }

  private async protectedMutation<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(work, {
        isolationLevel: 'Serializable',
        timeout: 30000,
        maxWait: 10000,
      });
    } catch (error) {
      if (
        ['P2034', 'P2002'].includes(String((error as { code?: string }).code))
      )
        throw new ConflictException(
          'Project or revision changed concurrently. Reload before retrying.',
        );
      throw error;
    }
  }

  /** Locks are ordered consistently across pointer changes and destructive operations.
   * Revision locks serialize deletion with submission/approval, without rewriting content. */
  private async lockProjectHistory(
    tx: Prisma.TransactionClient,
    tenantId: string,
    projectId: string,
    userId: string,
  ) {
    await tx.$queryRaw(
      Prisma.sql`SELECT set_config('app.current_tenant_id',${tenantId},true), set_config('app.current_user_id',${userId},true)`,
    );
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM project WHERE id=${projectId}::uuid AND tenant_id=${tenantId}::uuid FOR UPDATE`,
    );
    await tx.$queryRaw(
      Prisma.sql`SELECT id FROM document WHERE project_id=${projectId}::uuid AND tenant_id=${tenantId}::uuid ORDER BY id FOR UPDATE`,
    );
    await tx.$queryRaw(
      Prisma.sql`SELECT r.id FROM document_revision r JOIN document d ON d.id=r.document_id WHERE d.project_id=${projectId}::uuid AND d.tenant_id=${tenantId}::uuid ORDER BY r.id FOR UPDATE OF r`,
    );
  }

  async remove(tenantId: string, id: string, isAdmin = false, userId?: string) {
    if (!userId)
      throw new ForbiddenException(
        'Authenticated actor required to delete a project.',
      );
    return this.protectedMutation(async (tx) => {
      const project = await assertEngineeringProjectAccess(
        tx,
        { tenantId, userId },
        id,
        true,
      );
      if (
        !isAdmin &&
        (id === 'c439cfbe-548a-4e25-a37c-0194652b8526' ||
          (project.uiSettings as { isDemo?: boolean } | null)?.isDemo)
      )
        throw new ForbiddenException(
          'The reference demo project cannot be deleted.',
        );
      await this.lockProjectHistory(tx, tenantId, id, userId);
      const protectedCount = await tx.documentRevision.count({
        where: {
          document: { projectId: id, tenantId },
          OR: [{ status: { not: 'draft' } }, { lockedAt: { not: null } }],
        },
      });
      if (protectedCount)
        throw new BadRequestException(
          'This project contains protected engineering history. Archive the project instead of deleting it.',
        );
      const changed = await tx.project.deleteMany({ where: { id, tenantId } });
      if (changed.count !== 1)
        throw new ConflictException('Project changed before deletion. Reload.');
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          entityType: 'project',
          entityId: id,
          action: 'delete',
          oldValue: {
            projectId: id,
            name: project.name,
            status: project.status,
          },
        },
      });
      return { deleted: true, projectId: id };
    });
  }

  async findDocuments(tenantId: string, projectId: string, isAdmin = false) {
    const project = await this.findOne(tenantId, projectId, true, isAdmin);

    return this.prisma.document.findMany({
      where: { projectId, tenantId: project.tenantId },
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
    const accessible = await this.prisma.document.findFirst({
      where: { projectId, tenantId, currentRevisionId: { not: null } },
    });
    if (accessible?.currentRevisionId)
      await assertEngineeringRevisionAccess(
        this.prisma,
        { tenantId, userId },
        accessible.currentRevisionId,
        undefined,
        false,
      );
    const actor = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (
      actor?.isGuest &&
      (project.createdById !== userId ||
        project.createdAt.getTime() < Date.now() - 86400000 ||
        project.status === 'archived')
    )
      throw new ForbiddenException(
        'Trial revision creation is limited to your active project',
      );

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
      // Auto-increment using proper semver minor increment
      // Parse current revision as major.minor, increment minor
      const currentRev = project.revisionNumber || '1.0';
      const parts = currentRev.split('.').map(Number);
      if (parts.length !== 2 || parts.some(isNaN)) {
        // Fallback if format is unexpected
        nextRev = '1.1';
      } else {
        const [major, minor] = parts;
        nextRev = `${major}.${minor + 1}`;
      }
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
          if (doc.type === 'PFD' || doc.type === 'DFMEA') {
            const oldSteps = await tx.processStep.findMany({
              where: { revisionId: oldRevisionId },
            });
            const stepIdMap = new Map<string, string>();
            for (const step of oldSteps) {
              const copiedStep = await tx.processStep.create({
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
                  manufacturingSymbolId: step.manufacturingSymbolId,
                  engineeringSymbolId: step.engineeringSymbolId,
                  machinesEquipmentDocs:
                    step.machinesEquipmentDocs || undefined,
                  desiredOutcome: step.desiredOutcome,
                  processCharacteristics: step.processCharacteristics,
                  linkedPfdStepId: step.linkedPfdStepId,
                  isOrphaned: step.isOrphaned,
                },
              });
              stepIdMap.set(step.id, copiedStep.id);
            }
            await this.copyProcessGraph(
              tx,
              oldRevisionId,
              newRevision.id,
              stepIdMap,
            );
          }

          // Copy PfmeaRows (for PFMEA documents)
          if (doc.type === 'PFMEA' || doc.type === 'DFMEA') {
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
            });
            for (const row of oldRows) {
              const newRow = await tx.pfmeaRow.create({
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

              // Copy relations
              if (row.functions.length > 0) {
                await tx.pfmeaRowFunction.createMany({
                  data: row.functions.map((f) => ({
                    pfmeaRowId: newRow.id,
                    functionId: f.functionId,
                  })),
                });
              }
              if (row.requirements.length > 0) {
                await tx.pfmeaRowRequirement.createMany({
                  data: row.requirements.map((req) => ({
                    pfmeaRowId: newRow.id,
                    requirementId: req.requirementId,
                  })),
                });
              }
              if (row.failureModes.length > 0) {
                await tx.pfmeaRowFailureMode.createMany({
                  data: row.failureModes.map((fm) => ({
                    pfmeaRowId: newRow.id,
                    failureModeId: fm.failureModeId,
                  })),
                });
              }
              if (row.effects.length > 0) {
                await tx.pfmeaRowEffect.createMany({
                  data: row.effects.map((e) => ({
                    pfmeaRowId: newRow.id,
                    effectId: e.effectId,
                  })),
                });
              }
              if (row.causes.length > 0) {
                await tx.pfmeaRowCause.createMany({
                  data: row.causes.map((c) => ({
                    pfmeaRowId: newRow.id,
                    causeId: c.causeId,
                  })),
                });
              }
              if (row.controls.length > 0) {
                await tx.pfmeaRowControl.createMany({
                  data: row.controls.map((ctrl) => ({
                    pfmeaRowId: newRow.id,
                    controlId: ctrl.controlId,
                  })),
                });
              }
              if (row.characteristics.length > 0) {
                await tx.pfmeaRowCharacteristic.createMany({
                  data: row.characteristics.map((char) => ({
                    pfmeaRowId: newRow.id,
                    characteristicId: char.characteristicId,
                  })),
                });
              }
            }
          }

          // Copy ControlPlanRows (for CONTROL_PLAN documents)
          if (doc.type === 'CONTROL_PLAN') {
            const oldCpRows = await tx.controlPlanRow.findMany({
              where: { revisionId: oldRevisionId },
              include: { pfmeaRows: true },
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
                  pfmeaRows: {
                    create: cpRow.pfmeaRows.map((l) => ({
                      pfmeaRowId: l.pfmeaRowId,
                    })),
                  },
                },
              });
            }
          }

          await this.copyEngineeringDocument(
            tx,
            oldRevisionId,
            newRevision.id,
            tenantId,
          );
          // Preserve approved baseline status and history. The document pointer selects the active revision.
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

  async getRevisions(tenantId: string, projectId: string, isAdmin = false) {
    const project = await this.findOne(tenantId, projectId, true, isAdmin);

    // Fetch DocumentRevision records for all documents of the project
    const documents = await this.prisma.document.findMany({
      where: { projectId, tenantId: project.tenantId },
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

  private async deleteDraftRevision(
    tenantId: string,
    userId: string,
    revisionId: string,
    administrative: boolean,
  ) {
    return this.protectedMutation(async (tx) => {
      const scoped = await assertEngineeringRevisionAccess(
        tx,
        { tenantId, userId },
        revisionId,
      );
      const projectId = scoped.document.projectId;
      await assertEngineeringProjectAccess(
        tx,
        { tenantId, userId },
        projectId,
        true,
      );
      await this.lockProjectHistory(tx, tenantId, projectId, userId);
      const revision = await tx.documentRevision.findFirst({
        where: { id: revisionId, document: { tenantId, projectId } },
        include: { document: true },
      });
      if (!revision) throw new NotFoundException('Revision not found');
      if (revision.status !== 'draft' || revision.lockedAt !== null)
        throw new BadRequestException(
          'Protected engineering revisions cannot be deleted, including by administrators. Archive the project instead.',
        );
      if (!administrative && revision.document.currentRevisionId === revisionId)
        throw new BadRequestException('Cannot delete the active revision.');
      const revisionCount = await tx.documentRevision.count({
        where: { documentId: revision.documentId },
      });
      if (!administrative && revisionCount <= 1)
        throw new BadRequestException('Cannot delete the last revision.');
      // Deleting a routing revision must not cascade into another analysis revision.
      const [linkedAnalysis, linkedPlan] = await Promise.all([
        tx.pfmeaRow.count({
          where: {
            revisionId: { not: revisionId },
            processStep: { revisionId },
          },
        }),
        tx.controlPlanRow.count({
          where: {
            revisionId: { not: revisionId },
            processStep: { revisionId },
          },
        }),
      ]);
      const [canonicalPlanLinks, designLinks] = await Promise.all([
        tx.controlPlanDocument.count({
          where: {
            OR: [
              {
                data: {
                  path: ['sourceBaselines'],
                  array_contains: [{ revisionId }],
                },
              },
              {
                data: {
                  path: ['lines'],
                  array_contains: [{ source: { revisionId } }],
                },
              },
            ],
          },
        }),
        tx.dfmeaDocument.count({
          where: {
            data: {
              path: ['downstreamLinks'],
              array_contains: [{ targetRevisionId: revisionId }],
            },
          },
        }),
      ]);
      if (linkedAnalysis || linkedPlan || canonicalPlanLinks || designLinks)
        throw new BadRequestException(
          'Other engineering revisions reference these operations. Resolve source links before deletion.',
        );
      if (
        administrative &&
        revision.document.currentRevisionId === revisionId
      ) {
        const replacement = await tx.documentRevision.findFirst({
          where: { documentId: revision.documentId, id: { not: revisionId } },
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        });
        const pointer = await tx.document.updateMany({
          where: {
            id: revision.documentId,
            tenantId,
            currentRevisionId: revisionId,
          },
          data: { currentRevisionId: replacement?.id ?? null },
        });
        if (pointer.count !== 1)
          throw new ConflictException(
            'Active revision changed. Reload before deleting.',
          );
        await tx.project.update({
          where: { id: projectId },
          data: { revisionNumber: replacement?.revisionNumber ?? null },
        });
      }
      const deleted = await tx.documentRevision.deleteMany({
        where: {
          id: revisionId,
          status: 'draft',
          lockedAt: null,
          document: { tenantId, projectId },
        },
      });
      if (deleted.count !== 1)
        throw new ConflictException(
          'Revision state changed before deletion. Reload.',
        );
      // Child rows cascade from this draft; existing approval/project history is retained.
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          entityType: 'document_revision',
          entityId: revisionId,
          action: 'delete',
          oldValue: {
            projectId,
            documentId: revision.documentId,
            revisionNumber: revision.revisionNumber,
            status: revision.status,
            administrative,
          },
        },
      });
      return { deleted: true, revisionId };
    });
  }
  async deleteRevision(tenantId: string, userId: string, revisionId: string) {
    return this.deleteDraftRevision(tenantId, userId, revisionId, false);
  }
  async adminDeleteRevision(
    tenantId: string,
    userId: string,
    revisionId: string,
  ) {
    return this.deleteDraftRevision(tenantId, userId, revisionId, true);
  }

  async adminGetRevisions(tenantId: string) {
    return this.prisma.documentRevision.findMany({
      where: {
        document: {
          tenantId,
        },
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
                name: true,
              },
            },
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
    if (revision.status !== 'draft') {
      throw new BadRequestException(
        'Only draft revisions can be updated. Submit workflow must be used for status changes.',
      );
    }
    // Validate effective dates
    if (dto.effectiveFrom && dto.effectiveTo) {
      const from = new Date(dto.effectiveFrom);
      const to = new Date(dto.effectiveTo);
      if (to < from)
        throw new BadRequestException(
          'effectiveTo cannot be earlier than effectiveFrom',
        );
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

    const updated = await this.prisma.$transaction(async (tx) => {
      await assertEngineeringRevisionAccess(
        tx,
        { tenantId, userId },
        revisionId,
        undefined,
        true,
      );
      return tx.documentRevision.update({
        where: { id: revisionId },
        data: {
          revisionNumber: dto.revisionNumber,
          summary: dto.summary,
          changeDescription: dto.changeDescription,
          effectiveFrom: dto.effectiveFrom
            ? new Date(dto.effectiveFrom)
            : undefined,
          effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        },
      });
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

  async switchActiveRevision(
    tenantId: string,
    userId: string,
    revisionId: string,
  ) {
    return this.protectedMutation(async (tx) => {
      const scoped = await assertEngineeringRevisionAccess(
        tx,
        { tenantId, userId },
        revisionId,
      );
      const project = await assertEngineeringProjectAccess(
        tx,
        { tenantId, userId },
        scoped.document.projectId,
        true,
      );
      if (project.status === 'archived')
        throw new ForbiddenException('Archived projects are read only.');
      await this.lockProjectHistory(tx, tenantId, project.id, userId);
      const revision = await tx.documentRevision.findFirst({
        where: {
          id: revisionId,
          document: { tenantId, projectId: project.id },
        },
        include: { document: true },
      });
      if (!revision) throw new NotFoundException('Revision not found');
      // Selecting an approved baseline changes only the active pointer, never its locked content.
      const changed = await tx.document.updateMany({
        where: {
          id: revision.documentId,
          tenantId,
          currentRevisionId: revision.document.currentRevisionId,
        },
        data: { currentRevisionId: revisionId },
      });
      if (changed.count !== 1)
        throw new ConflictException(
          'Active revision changed. Reload before activating.',
        );
      await tx.project.update({
        where: { id: project.id },
        data: { revisionNumber: revision.revisionNumber },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          entityType: 'document_revision',
          entityId: revisionId,
          action: 'activate',
          oldValue: {
            projectId: project.id,
            previousActiveRevisionId: revision.document.currentRevisionId,
          },
          newValue: {
            projectId: project.id,
            newActiveRevisionId: revisionId,
            revisionNumber: revision.revisionNumber,
          },
        },
      });
      return {
        activated: true,
        revisionId,
        revisionNumber: revision.revisionNumber,
      };
    });
  }

  // ===== Revision Approval Workflow =====

  async getRevisionReadiness(
    tenantId: string,
    revisionId: string,
    actorUserId?: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const revision = await db.documentRevision.findFirst({
      where: { id: revisionId, document: { tenantId } },
      include: {
        document: true,
        processSteps: { select: { id: true, stepType: true } },
        pfmeaRows: {
          include: {
            functions: { include: { function: true } },
            requirements: { include: { requirement: true } },
            failureModes: { include: { failureMode: true } },
            effects: { include: { effect: true } },
            causes: { include: { cause: true } },
            controls: { include: { control: true } },
          },
        },
        controlPlanRows: true,
      },
    });
    if (!revision) throw new NotFoundException('Revision not found');
    if (revision.document.type === 'DFMEA') {
      const canonical = await db.dfmeaDocument.findFirst({
        where: { revisionId, tenantId },
      });
      return canonical
        ? dfmeaReadiness(canonical.data as unknown as DfmeaData)
        : {
            ready: false,
            errors: [
              'Map and review legacy DFMEA in the design editor before submission.',
            ],
            warnings: [],
          };
    }
    if (revision.document.type === 'CONTROL_PLAN') {
      const canonical = await db.controlPlanDocument.findFirst({
        where: { revisionId, tenantId },
      });
      if (!canonical)
        return {
          ready: false,
          errors: [
            'Review and save the canonical Control Plan before submission.',
          ],
          warnings: [],
        };
      const readiness = await new ControlPlanDocumentService(
        db as PrismaService,
      ).readiness(
        { tenantId, userId: actorUserId || revision.createdById },
        revisionId,
        db,
      );
      const data = canonical.data as any;
      for (const baseline of data.sourceBaselines || []) {
        const source = await db.documentRevision.findFirst({
          where: {
            id: baseline.revisionId,
            document: {
              tenantId,
              projectId: revision.document.projectId,
              type: baseline.type,
            },
          },
        });
        if (!source)
          readiness.errors.push(
            'Source baseline is missing or outside this project.',
          );
        else if (
          source.status !== 'approved' &&
          !data.config.sourceExceptionJustification?.trim()
        )
          readiness.errors.push(
            'Release requires approved source baselines or documented exception (product policy).',
          );
      }
      readiness.ready = readiness.errors.length === 0;
      return readiness;
    }
    const rows = revision.pfmeaRows.map((row) => ({
      ...row,
      functions: row.functions.map((x) => x.function),
      requirements: row.requirements.map((x) => x.requirement),
      failureModes: row.failureModes.map((x) => x.failureMode),
      effects: row.effects.map((x) => x.effect),
      causes: row.causes.map((x) => x.cause),
      controls: row.controls.map((x) => x.control),
    }));
    return revisionReadiness({
      type: revision.document.type,
      graph: revision.pfdGraph,
      steps: revision.processSteps,
      rows,
      controlRows: revision.controlPlanRows,
    });
  }

  private async assertSubmissionReady(
    tenantId: string,
    revisionId: string,
    userId?: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const readiness = await this.getRevisionReadiness(
      tenantId,
      revisionId,
      userId,
      db,
    );
    if (!readiness.ready)
      throw new BadRequestException({
        message: readiness.errors.join(' '),
        readiness,
      });
  }

  /**
   * Submit a draft revision for approval
   * Changes status from 'draft' to 'in_review'
   */
  async submitRevision(tenantId: string, userId: string, revisionId: string) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: {
        document: {
          select: { id: true, tenantId: true, projectId: true },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this revision');
    }

    if (revision.status !== 'draft') {
      throw new BadRequestException(
        'Only draft revisions can be submitted for approval',
      );
    }

    const updated = await this.prisma.$transaction(
      async (tx) => {
        await assertEngineeringRevisionAccess(
          tx,
          { tenantId, userId },
          revisionId,
          undefined,
          true,
        );
        await this.assertSubmissionReady(tenantId, revisionId, userId, tx);
        return tx.documentRevision.update({
          where: { id: revisionId },
          data: { status: 'in_review', submittedAt: new Date() },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    await this.auditLogService.createEntry({
      tenantId,
      userId,
      entityType: 'document_revision',
      entityId: revisionId,
      action: 'submit_for_approval',
      newValue: { status: 'in_review', submittedAt: updated.submittedAt },
    });

    return updated;
  }

  /**
   * Approve a revision with e-signature (password + comment)
   * Changes status from 'in_review' to 'approved' and locks the revision
   */
  async approveRevision(
    tenantId: string,
    userId: string,
    revisionId: string,
    dto: { password: string; comment: string },
  ) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: {
        document: {
          select: { id: true, tenantId: true, projectId: true },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this revision');
    }

    if (revision.status !== 'in_review') {
      throw new BadRequestException('Only revisions in review can be approved');
    }

    await this.assertSubmissionReady(tenantId, revisionId, userId);

    // Segregation of duties: submitter cannot approve their own revision
    if (revision.createdById === userId) {
      throw new ForbiddenException(
        'You cannot approve your own revision (segregation of duties)',
      );
    }

    // Verify user's password for e-signature
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('User not found or password not set');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password for e-signature');
    }

    if (!dto.comment?.trim())
      throw new BadRequestException('Record the approval decision');
    return this.prisma.$transaction(
      async (tx) => {
        await assertEngineeringRevisionAccess(
          tx,
          { tenantId, userId },
          revisionId,
        );
        const changed = await tx.documentRevision.updateMany({
          where: {
            id: revisionId,
            status: 'in_review',
            lockedAt: null,
            document: { tenantId },
          },
          data: {
            status: 'approved',
            lockedAt: new Date(),
            approvedAt: new Date(),
          },
        });
        if (changed.count !== 1)
          throw new ConflictException(
            'Review state changed. Reload before deciding.',
          );
        await this.assertSubmissionReady(tenantId, revisionId, userId, tx);
        await tx.approval.create({
          data: {
            revisionId,
            approverId: userId,
            role: 'approver',
            decision: 'approved',
            comment: dto.comment,
            decidedAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            entityType: 'document_revision',
            entityId: revisionId,
            action: 'approve',
            oldValue: { status: 'in_review' },
            newValue: { status: 'approved', comment: dto.comment },
          },
        });
        return tx.documentRevision.findUniqueOrThrow({
          where: { id: revisionId },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * Reject a revision with comment
   */
  async rejectRevision(
    tenantId: string,
    userId: string,
    revisionId: string,
    dto: { comment: string },
  ) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      include: {
        document: {
          select: { id: true, tenantId: true, projectId: true },
        },
      },
    });

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this revision');
    }

    if (revision.status !== 'in_review') {
      throw new BadRequestException('Only revisions in review can be rejected');
    }

    // Segregation of duties: submitter cannot reject their own revision
    if (revision.createdById === userId) {
      throw new ForbiddenException(
        'You cannot reject your own revision (segregation of duties)',
      );
    }

    if (!dto.comment?.trim())
      throw new BadRequestException('Record the review decision');
    return this.prisma.$transaction(
      async (tx) => {
        await assertEngineeringRevisionAccess(
          tx,
          { tenantId, userId },
          revisionId,
        );
        const changed = await tx.documentRevision.updateMany({
          where: {
            id: revisionId,
            status: 'in_review',
            lockedAt: null,
            document: { tenantId },
          },
          data: { status: 'draft', submittedAt: null },
        });
        if (changed.count !== 1)
          throw new ConflictException(
            'Review state changed. Reload before deciding.',
          );
        await tx.approval.create({
          data: {
            revisionId,
            approverId: userId,
            role: 'reviewer',
            decision: 'changes_requested',
            comment: dto.comment,
            decidedAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            tenantId,
            userId,
            entityType: 'document_revision',
            entityId: revisionId,
            action: 'reject',
            oldValue: { status: 'in_review' },
            newValue: { status: 'draft', comment: dto.comment },
          },
        });
        return tx.documentRevision.findUniqueOrThrow({
          where: { id: revisionId },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async assertRevisionWritable(tenantId: string, revisionId: string) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id: revisionId },
      select: {
        lockedAt: true,
        status: true,
        document: { select: { tenantId: true } },
      },
    });

    if (!revision) {
      throw new NotFoundException('Revision not found');
    }

    if (revision.document.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this revision');
    }

    if (revision.lockedAt !== null) {
      throw new BadRequestException(
        'Cannot modify a locked (approved) revision',
      );
    }

    if (revision.status !== 'draft') {
      throw new BadRequestException('Only draft revisions can be modified');
    }
  }
}
