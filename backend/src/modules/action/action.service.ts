import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { R2Service } from './r2.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import {
  assertEngineeringRevisionAccess,
  assertEngineeringProjectAccess,
} from '../../common/engineering-access';
import { calculateAP } from '../pfmea/ap-calculator';

@Injectable()
export class ActionService {
  private readonly logger = new Logger(ActionService.name);

  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
  ) {}

  private async verifyProjectAccess(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  private async verifyActionAccess(tenantId: string, actionId: string) {
    const action = await this.prisma.action.findUnique({
      where: { id: actionId },
    });
    if (!action) {
      throw new NotFoundException('Action not found');
    }
    if (action.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this action');
    }
    return action;
  }

  async findUserActions(tenantId: string, userId: string) {
    const actions = await this.prisma.action.findMany({
      where: {
        tenantId,
        OR: [{ ownerId: userId }, { createdById: userId }],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        fmeaLinks: {
          include: {
            pfmeaRow: {
              include: {
                processStep: true,
              },
            },
          },
        },
        evidences: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Generate presigned URLs for all evidences
    return Promise.all(
      actions.map(async (action) => {
        const enrichedEvidences = await Promise.all(
          action.evidences.map(async (ev) => ({
            ...ev,
            fileUrl: await this.r2Service.getPresignedUrl(ev.fileUrl),
          })),
        );
        return {
          ...action,
          evidences: enrichedEvidences,
        };
      }),
    );
  }

  async findProjectActions(tenantId: string, projectId: string) {
    await this.verifyProjectAccess(tenantId, projectId);

    const actions = await this.prisma.action.findMany({
      where: { tenantId, projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        fmeaLinks: {
          include: {
            pfmeaRow: {
              include: {
                processStep: true,
              },
            },
          },
        },
        evidences: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return Promise.all(
      actions.map(async (action) => {
        const enrichedEvidences = await Promise.all(
          action.evidences.map(async (ev) => ({
            ...ev,
            fileUrl: await this.r2Service.getPresignedUrl(ev.fileUrl),
          })),
        );
        return {
          ...action,
          evidences: enrichedEvidences,
        };
      }),
    );
  }

  async createAction(tenantId: string, userId: string, dto: CreateActionDto) {
    await this.verifyProjectAccess(tenantId, dto.projectId);

    // Verify owner belongs to tenant
    const owner = await this.prisma.user.findFirst({
      where: { id: dto.ownerId, tenantId },
    });
    if (!owner) {
      throw new BadRequestException(
        'Action owner not found in this tenant context',
      );
    }

    // Verify FMEA row exists
    const fmeaRow = await this.prisma.pfmeaRow.findUnique({
      where: { id: dto.fmeaRowId },
    });
    if (!fmeaRow) {
      throw new NotFoundException('Linked PFMEA row not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const revision = await assertEngineeringRevisionAccess(
        tx,
        { tenantId, userId },
        fmeaRow.revisionId,
        undefined,
        true,
      );
      if (revision.document.projectId !== dto.projectId)
        throw new BadRequestException('Analysis belongs to another project');
      // 1. Create the action
      const action = await tx.action.create({
        data: {
          tenantId,
          projectId: dto.projectId,
          description: dto.description,
          actionType: dto.actionType || 'corrective',
          ownerId: dto.ownerId,
          dueDate: new Date(dto.dueDate),
          status: 'open',
          priority: dto.priority || 'medium',
          createdById: userId,
        },
      });

      // 2. Link to FMEA row, saving the current ratings in the before state
      await tx.actionFmeaLink.create({
        data: {
          actionId: action.id,
          fmeaType: dto.fmeaType || 'PFMEA',
          fmeaRowId: dto.fmeaRowId,
          beforeSeverity: fmeaRow.severity,
          beforeOccurrence: fmeaRow.occurrence,
          beforeDetection: fmeaRow.detection,
          beforeAp: fmeaRow.ap,
        },
      });

      // 3. Trigger Mock Email Notification
      this.logger.log(
        `[MOCK NOTIFICATION] Email sent to: ${owner.email} (${owner.name}). Action assigned: "${dto.description}" with due date: ${dto.dueDate}.`,
      );

      return action;
    });
  }

  async updateAction(
    tenantId: string,
    userId: string,
    actionId: string,
    dto: UpdateActionDto,
  ) {
    const action = await this.verifyActionAccess(tenantId, actionId);

    if (dto.ownerId) {
      const owner = await this.prisma.user.findFirst({
        where: { id: dto.ownerId, tenantId },
      });
      if (!owner) {
        throw new BadRequestException('Owner not found in this tenant');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const locked=await tx.action.updateMany({where:{id:actionId,tenantId,status:{notIn:['closed','cancelled']}},data:{updatedAt:new Date()}});
      if(locked.count!==1)throw new BadRequestException('Action is protected or no longer editable');
      const current = await tx.action.findFirstOrThrow({
        where: { id: actionId, tenantId },
      });
      await assertEngineeringProjectAccess(
        tx,
        { tenantId, userId },
        current.projectId,
        true,
      );
      const links = await tx.actionFmeaLink.findMany({
        where: { actionId },
        include: { pfmeaRow: true },
      });
      for (const link of links)
        await assertEngineeringRevisionAccess(
          tx,
          { tenantId, userId },
          link.pfmeaRow.revisionId,
          undefined,
          true,
        );
      const next = dto.status ?? current.status;
      const allowed: Record<string, string[]> = {
        open: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: ['in_progress', 'verified', 'cancelled'],
        verified: ['closed'],
        closed: [],
        cancelled: [],
      };
      if (next !== current.status && !allowed[current.status]?.includes(next))
        throw new BadRequestException(
          `Invalid action transition ${current.status} to ${next}`,
        );
      if (['closed', 'cancelled'].includes(current.status))
        throw new BadRequestException(
          'Closed or cancelled action history is protected',
        );
      if(current.status==='verified'&&(next!=='closed'||['description','ownerId','dueDate','priority','afterSeverity','afterOccurrence','afterDetection'].some(key=>(dto as any)[key]!==undefined)))throw new BadRequestException('Verified action contents are protected; only closure may be recorded');
      const notes = dto.completionNotes ?? current.completionNotes;
      if (
        ['completed', 'verified', 'closed', 'cancelled'].includes(next) &&
        !notes?.trim()
      )
        throw new BadRequestException(
          'Record completion/effectiveness or cancellation justification',
        );
      if (next === 'verified' && userId === current.ownerId)
        throw new ForbiddenException(
          'Action owner cannot verify their own effectiveness (product policy)',
        );
      if (
        ['verified', 'closed'].includes(next) &&
        !(await tx.actionEvidence.count({ where: { actionId } }))
      )
        throw new BadRequestException(
          'Verification requires retained implementation/effectiveness evidence',
        );
      for (const link of links) {
        const S =
          dto.afterSeverity !== undefined
            ? dto.afterSeverity
            : link.afterSeverity;
        const O =
          dto.afterOccurrence !== undefined
            ? dto.afterOccurrence
            : link.afterOccurrence;
        const D =
          dto.afterDetection !== undefined
            ? dto.afterDetection
            : link.afterDetection;
        if (
          ['verified', 'closed'].includes(next) &&
          [S, O, D].some((v) => !Number.isInteger(v) || v! < 1 || v! > 10)
        )
          throw new BadRequestException(
            'Verification requires justified integer after ratings',
          );
        await tx.actionFmeaLink.update({
          where: { id: link.id },
          data: {
            afterSeverity: S,
            afterOccurrence: O,
            afterDetection: D,
            afterAp: calculateAP(S, O, D),
          },
        });
        // Preserve initial ratings and protected history. Reassessment is separate.
        if (['verified', 'closed'].includes(next))
          await tx.pfmeaRow.update({
            where: { id: link.fmeaRowId },
            data: {
              revisedSeverity: S,
              revisedOccurrence: O,
              revisedDetection: D,
              revisedAp: calculateAP(S, O, D),
            },
          });
      }
      // 3. Update main Action attributes
      const updatedAction = await tx.action.update({
        where: { id: actionId },
        data: {
          description:
            dto.description !== undefined
              ? dto.description
              : current.description,
          ownerId: dto.ownerId !== undefined ? dto.ownerId : current.ownerId,
          dueDate:
            dto.dueDate !== undefined ? new Date(dto.dueDate) : current.dueDate,
          status: dto.status !== undefined ? dto.status : current.status,
          priority: dto.priority !== undefined ? dto.priority : current.priority,
          completionNotes:
            dto.completionNotes !== undefined
              ? dto.completionNotes
              : current.completionNotes,
          closedAt:
            dto.status && ['closed', 'cancelled'].includes(dto.status)
              ? new Date()
              : current.closedAt,
        },
      });

      return updatedAction;
    });
  }

  async addEvidence(
    tenantId: string,
    userId: string,
    actionId: string,
    fileBuffer: Buffer,
    fileName: string,
    fileType: string,
    fileSize: number,
    description?: string,
  ) {
    const action = await this.verifyActionAccess(tenantId, actionId);
    await assertEngineeringProjectAccess(
      this.prisma,
      { tenantId, userId },
      action.projectId,
      true,
    );
    if (['verified', 'closed', 'cancelled'].includes(action.status))
      throw new BadRequestException('Verified action evidence is protected');
    const links = await this.prisma.actionFmeaLink.findMany({
      where: { actionId },
      include: { pfmeaRow: true },
    });
    for (const link of links)
      await assertEngineeringRevisionAccess(
        this.prisma,
        { tenantId, userId },
        link.pfmeaRow.revisionId,
        undefined,
        true,
      );

    // Upload to Cloudflare R2 (or local mock folder)
    const { fileUrl, fileKey } = await this.r2Service.uploadFile(
      fileBuffer,
      fileName,
      fileType,
    );

    let evidence;
    try{evidence=await this.prisma.$transaction(async tx=>{
      const locked=await tx.action.updateMany({where:{id:actionId,tenantId,status:{notIn:['verified','closed','cancelled']}},data:{updatedAt:new Date()}});
      if(locked.count!==1)throw new BadRequestException('Verified action evidence is protected');
      for(const link of links)await assertEngineeringRevisionAccess(tx,{tenantId,userId},link.pfmeaRow.revisionId,undefined,true);
    return tx.actionEvidence.create({
      data: {
        actionId,
        fileUrl: fileKey, // Store the R2 key in DB
        fileName,
        fileType,
        fileSize,
        description: description || null,
        uploadedById: userId,
      },
    });
    });}catch(error){await this.r2Service.deleteFile(fileKey).catch(()=>this.logger.warn('Could not clean up a rejected evidence upload'));throw error;}

    // Return the response with presigned URL
    return {
      ...evidence,
      fileUrl: await this.r2Service.getPresignedUrl(evidence.fileUrl),
    };
  }

  async removeEvidence(tenantId: string, evidenceId: string, userId?: string) {
    const evidence = await this.prisma.actionEvidence.findUnique({
      where: { id: evidenceId },
      include: {
        action: true,
      },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    if (evidence.action.tenantId !== tenantId) {
      throw new ForbiddenException(
        'You do not have access to this action evidence',
      );
    }

    if (!userId) throw new ForbiddenException('Actor required');
    await assertEngineeringProjectAccess(
      this.prisma,
      { tenantId, userId },
      evidence.action.projectId,
      true,
    );
    if (['verified', 'closed', 'cancelled'].includes(evidence.action.status))
      throw new BadRequestException('Verified action evidence is protected');
    const links = await this.prisma.actionFmeaLink.findMany({
      where: { actionId: evidence.actionId },
      include: { pfmeaRow: true },
    });
    for (const link of links)
      await assertEngineeringRevisionAccess(
        this.prisma,
        { tenantId, userId },
        link.pfmeaRow.revisionId,
        undefined,
        true,
      );
    const deleted=await this.prisma.$transaction(async tx=>{
      const locked=await tx.action.updateMany({where:{id:evidence.actionId,tenantId,status:{notIn:['verified','closed','cancelled']}},data:{updatedAt:new Date()}});
      if(locked.count!==1)throw new BadRequestException('Verified action evidence is protected');
      for(const link of links)await assertEngineeringRevisionAccess(tx,{tenantId,userId},link.pfmeaRow.revisionId,undefined,true);
      return tx.actionEvidence.delete({where:{id:evidenceId}});
    });
    await this.r2Service.deleteFile(evidence.fileUrl);
    return deleted;
  }

  async getEvidencePresignedUrl(tenantId: string, evidenceId: string) {
    const evidence = await this.prisma.actionEvidence.findUnique({
      where: { id: evidenceId },
      include: {
        action: true,
      },
    });

    if (!evidence) {
      throw new NotFoundException('Evidence not found');
    }

    if (evidence.action.tenantId !== tenantId) {
      throw new ForbiddenException(
        'You do not have access to this action evidence',
      );
    }

    const url = await this.r2Service.getPresignedUrl(evidence.fileUrl);
    return { url };
  }
}
