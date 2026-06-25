import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { R2Service } from './r2.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
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
        OR: [
          { ownerId: userId },
          { createdById: userId },
        ],
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
      throw new BadRequestException('Action owner not found in this tenant context');
    }

    // Verify FMEA row exists
    const fmeaRow = await this.prisma.pfmeaRow.findUnique({
      where: { id: dto.fmeaRowId },
    });
    if (!fmeaRow) {
      throw new NotFoundException('Linked PFMEA row not found');
    }

    return this.prisma.$transaction(async (tx) => {
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

  async updateAction(tenantId: string, userId: string, actionId: string, dto: UpdateActionDto) {
    const action = await this.verifyActionAccess(tenantId, actionId);

    if (dto.ownerId) {
      const owner = await this.prisma.user.findFirst({
        where: { id: dto.ownerId, tenantId },
      });
      if (!owner) {
        throw new BadRequestException('Owner not found in this tenant');
      }
    }

    // Fetch linked FMEA row info
    const fmeaLink = await this.prisma.actionFmeaLink.findFirst({
      where: { actionId },
    });

    return this.prisma.$transaction(async (tx) => {
      // 1. Update ratings in FmeaLink if provided
      if (
        fmeaLink &&
        (dto.afterSeverity !== undefined ||
          dto.afterOccurrence !== undefined ||
          dto.afterDetection !== undefined)
      ) {
        const S = dto.afterSeverity !== undefined ? dto.afterSeverity : fmeaLink.afterSeverity;
        const O = dto.afterOccurrence !== undefined ? dto.afterOccurrence : fmeaLink.afterOccurrence;
        const D = dto.afterDetection !== undefined ? dto.afterDetection : fmeaLink.afterDetection;
        const calculatedAp = calculateAP(S, O, D);

        await tx.actionFmeaLink.update({
          where: { id: fmeaLink.id },
          data: {
            afterSeverity: S,
            afterOccurrence: O,
            afterDetection: D,
            afterAp: calculatedAp,
          },
        });

        // 2. Sync "After" ratings back to the actual FMEA Row if action is marked verified/closed
        const targetStatus = dto.status || action.status;
        if (['verified', 'closed'].includes(targetStatus) && S && O && D) {
          await tx.pfmeaRow.update({
            where: { id: fmeaLink.fmeaRowId },
            data: {
              severity: S,
              occurrence: O,
              detection: D,
              ap: calculatedAp,
            },
          });
        }
      }

      // 3. Update main Action attributes
      const updatedAction = await tx.action.update({
        where: { id: actionId },
        data: {
          description: dto.description !== undefined ? dto.description : action.description,
          ownerId: dto.ownerId !== undefined ? dto.ownerId : action.ownerId,
          dueDate: dto.dueDate !== undefined ? new Date(dto.dueDate) : action.dueDate,
          status: dto.status !== undefined ? dto.status : action.status,
          priority: dto.priority !== undefined ? dto.priority : action.priority,
          completionNotes: dto.completionNotes !== undefined ? dto.completionNotes : action.completionNotes,
          closedAt:
            dto.status && ['closed', 'cancelled'].includes(dto.status)
              ? new Date()
              : action.closedAt,
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
    await this.verifyActionAccess(tenantId, actionId);

    // Upload to Cloudflare R2 (or local mock folder)
    const { fileUrl, fileKey } = await this.r2Service.uploadFile(fileBuffer, fileName, fileType);

    const evidence = await this.prisma.actionEvidence.create({
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

    // Return the response with presigned URL
    return {
      ...evidence,
      fileUrl: await this.r2Service.getPresignedUrl(evidence.fileUrl),
    };
  }

  async removeEvidence(tenantId: string, evidenceId: string) {
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
      throw new ForbiddenException('You do not have access to this action evidence');
    }

    // Delete file from R2
    await this.r2Service.deleteFile(evidence.fileUrl);

    // Delete from DB
    return this.prisma.actionEvidence.delete({
      where: { id: evidenceId },
    });
  }
}
