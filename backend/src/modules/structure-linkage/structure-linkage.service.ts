import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStructureFunctionDto } from './dto/create-structure-function.dto';
import { CreateStructureFailureDto } from './dto/create-structure-failure.dto';
import { UpdateStructureFailureDto } from './dto/update-structure-failure.dto';
import { LinkFailuresDto } from './dto/link-failures.dto';
import { CreateLinkActionDto } from './dto/create-link-action.dto';
import { UpdateLinkActionDto } from './dto/update-link-action.dto';

@Injectable()
export class StructureLinkageService {
  constructor(private prisma: PrismaService) {}

  // ===== STRUCTURE FUNCTIONS =====

  async createFunction(tenantId: string, dto: CreateStructureFunctionDto) {
    const roleMap: Record<string, string> = {
      project: 'effect',
      process_step: 'mode',
      work_element: 'cause',
    };
    if (!roleMap[dto.parentType]) {
      throw new BadRequestException(`Invalid parentType: ${dto.parentType}`);
    }

    return this.prisma.structureFunction.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        parentType: dto.parentType,
        parentId: dto.parentId,
        narration: dto.narration,
        location:
          dto.location ||
          (dto.parentType !== 'project' ? 'your_plant' : null),
      },
      include: { failures: true },
    });
  }

  async getFunctions(
    tenantId: string,
    parentType: string,
    parentId: string,
  ) {
    return this.prisma.structureFunction.findMany({
      where: { tenantId, parentType, parentId },
      include: {
        failures: {
          include: {
            modeEffectLinks: { include: { linkActions: true } },
            linkedAsEffect: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getProjectFunctions(tenantId: string, projectId: string) {
    return this.prisma.structureFunction.findMany({
      where: { tenantId, projectId },
      include: {
        failures: {
          include: {
            modeEffectLinks: { include: { linkActions: true } },
            linkedAsEffect: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteFunction(tenantId: string, functionId: string) {
    const fn = await this.prisma.structureFunction.findUnique({
      where: { id: functionId },
    });
    if (!fn) throw new NotFoundException('Function not found');
    if (fn.tenantId !== tenantId) throw new ForbiddenException('Access denied');
    return this.prisma.structureFunction.delete({ where: { id: functionId } });
  }

  // ===== STRUCTURE FAILURES =====

  async createFailure(tenantId: string, dto: CreateStructureFailureDto) {
    const fn = await this.prisma.structureFunction.findUnique({
      where: { id: dto.functionId },
    });
    if (!fn) throw new NotFoundException('Parent function not found');
    if (fn.tenantId !== tenantId) throw new ForbiddenException('Access denied');

    const roleMap: Record<string, string> = {
      project: 'effect',
      process_step: 'mode',
      work_element: 'cause',
    };
    const role = roleMap[fn.parentType];

    return this.prisma.structureFailure.create({
      data: {
        functionId: dto.functionId,
        role,
        narration: dto.narration,
        severityRating:
          role === 'effect' ? (dto.severityRating ?? null) : null,
        occurrenceRating:
          role === 'cause' ? (dto.occurrenceRating ?? null) : null,
        detectionRating:
          role === 'cause' ? (dto.detectionRating ?? null) : null,
        currentControlPrevention:
          role === 'cause' ? (dto.currentControlPrevention ?? null) : null,
        currentControlDetection:
          role === 'cause' ? (dto.currentControlDetection ?? null) : null,
        filterCode: dto.filterCode ?? null,
      },
    });
  }

  async getFailures(tenantId: string, functionId: string) {
    const fn = await this.prisma.structureFunction.findUnique({
      where: { id: functionId },
    });
    if (!fn) throw new NotFoundException('Function not found');
    if (fn.tenantId !== tenantId) throw new ForbiddenException('Access denied');

    return this.prisma.structureFailure.findMany({
      where: { functionId },
      include: {
        modeEffectLinks: { include: { linkActions: true } },
        linkedAsEffect: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateFailure(
    tenantId: string,
    failureId: string,
    dto: UpdateStructureFailureDto,
  ) {
    const failure = await this.prisma.structureFailure.findUnique({
      where: { id: failureId },
      include: { function: true },
    });
    if (!failure) throw new NotFoundException('Failure not found');
    if (failure.function.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');

    return this.prisma.structureFailure.update({
      where: { id: failureId },
      data: {
        severityRating: dto.severityRating,
        occurrenceRating: dto.occurrenceRating,
        detectionRating: dto.detectionRating,
        currentControlPrevention: dto.currentControlPrevention,
        currentControlDetection: dto.currentControlDetection,
        filterCode: dto.filterCode,
      },
    });
  }

  async deleteFailure(tenantId: string, failureId: string) {
    const failure = await this.prisma.structureFailure.findUnique({
      where: { id: failureId },
      include: { function: true },
    });
    if (!failure) throw new NotFoundException('Failure not found');
    if (failure.function.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');
    return this.prisma.structureFailure.delete({ where: { id: failureId } });
  }

  // ===== LINKAGE =====

  async getLinkageCandidates(tenantId: string, failureModeId: string) {
    const mode = await this.prisma.structureFailure.findUnique({
      where: { id: failureModeId },
      include: { function: true },
    });
    if (!mode) throw new NotFoundException('Failure mode not found');
    if (mode.function.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');
    if (mode.role !== 'mode')
      throw new BadRequestException(
        'Only failure modes can have linkage candidates',
      );

    const projectId = mode.function.projectId;
    const stepParentId = mode.function.parentId; // the processStep ID

    // Left pane: all project-level failures (effects)
    const effects = await this.prisma.structureFailure.findMany({
      where: {
        role: 'effect',
        function: { projectId, tenantId },
      },
      include: { function: true },
    });

    // Right pane: work-element-level failures from the same process step
    // parentId for work_element functions is stored as a string (stepId or stepId::weName)
    // We fetch all WE-level failures for the project, then filter in-memory by stepParentId
    const allWeCauses = await this.prisma.structureFailure.findMany({
      where: {
        role: 'cause',
        function: {
          tenantId,
          projectId,
          parentType: 'work_element',
        },
      },
      include: { function: true },
    });
    // Filter to causes whose function's parentId starts with the step's ID
    const causes = allWeCauses.filter(
      (c) => c.function.parentId === stepParentId || c.function.parentId.startsWith(stepParentId + '::'),
    );

    // Currently linked effects and causes
    const existingLinks = await this.prisma.failureLink.findMany({
      where: { failureModeId },
    });
    const linkedEffectIds = existingLinks
      .filter((l) => l.linkType === 'effect')
      .map((l) => l.linkedFailureId);
    const linkedCauseIds = existingLinks
      .filter((l) => l.linkType === 'cause')
      .map((l) => l.linkedFailureId);

    return {
      mode,
      effects: effects.map((e) => ({
        ...e,
        isCurrentlyLinked: linkedEffectIds.includes(e.id),
      })),
      causes: causes.map((c) => ({
        ...c,
        isCurrentlyLinked: linkedCauseIds.includes(c.id),
      })),
      linkedEffectIds,
      linkedCauseIds,
    };
  }

  async linkFailures(
    tenantId: string,
    failureModeId: string,
    dto: LinkFailuresDto,
  ) {
    const mode = await this.prisma.structureFailure.findUnique({
      where: { id: failureModeId },
      include: { function: true },
    });
    if (!mode) throw new NotFoundException('Failure mode not found');
    if (mode.function.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');
    if (mode.role !== 'mode')
      throw new BadRequestException('Only failure modes can be linked');

    return this.prisma.$transaction(async (tx) => {
      // Remove existing links (replace strategy)
      await tx.failureLink.deleteMany({ where: { failureModeId } });

      // Create effect links
      for (const effectId of dto.effectIds) {
        await tx.failureLink.create({
          data: {
            failureModeId,
            linkedFailureId: effectId,
            linkType: 'effect',
          },
        });
      }

      // Create cause links
      for (const causeId of dto.causeIds) {
        await tx.failureLink.create({
          data: {
            failureModeId,
            linkedFailureId: causeId,
            linkType: 'cause',
          },
        });
      }

      // Update isLinked status on the mode
      const isLinked =
        dto.effectIds.length > 0 || dto.causeIds.length > 0;
      await tx.structureFailure.update({
        where: { id: failureModeId },
        data: { isLinked },
      });

      return {
        success: true,
        effectCount: dto.effectIds.length,
        causeCount: dto.causeIds.length,
      };
    });
  }

  async getModeLinks(tenantId: string, failureModeId: string) {
    const mode = await this.prisma.structureFailure.findUnique({
      where: { id: failureModeId },
      include: { function: true },
    });
    if (!mode) throw new NotFoundException('Failure mode not found');
    if (mode.function.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');

    const links = await this.prisma.failureLink.findMany({
      where: { failureModeId },
      include: {
        linkedFailure: { include: { function: true } },
        linkActions: true,
      },
    });

    const effects = links
      .filter((l) => l.linkType === 'effect')
      .map((l) => ({
        linkId: l.id,
        failure: l.linkedFailure,
        actions: l.linkActions,
      }));

    const causes = links
      .filter((l) => l.linkType === 'cause')
      .map((l) => ({
        linkId: l.id,
        failure: l.linkedFailure,
        actions: l.linkActions,
      }));

    const highestSeverity = Math.max(
      0,
      ...effects.map((e) => e.failure.severityRating || 0),
    );

    return { mode, effects, causes, highestSeverity };
  }

  async getLinkageSummary(tenantId: string, processStepId: string) {
    const allModes = await this.prisma.structureFailure.findMany({
      where: {
        role: 'mode',
        function: {
          tenantId,
          parentType: 'process_step',
          parentId: processStepId,
        },
      },
    });
    const linkedModes = allModes.filter((m) => m.isLinked);
    return {
      totalModes: allModes.length,
      linkedModes: linkedModes.length,
      unlinkedModes: allModes.length - linkedModes.length,
    };
  }

  // ===== FAILURE LINKS =====

  async unlinkFailure(tenantId: string, linkId: string) {
    const link = await this.prisma.failureLink.findUnique({
      where: { id: linkId },
      include: { failureMode: { include: { function: true } } },
    });
    if (!link) throw new NotFoundException('Failure link not found');
    if (link.failureMode.function.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');

    await this.prisma.failureLink.delete({ where: { id: linkId } });

    // Check if mode still has any links; if not, mark as unlinked
    const remaining = await this.prisma.failureLink.count({
      where: { failureModeId: link.failureModeId },
    });
    if (remaining === 0) {
      await this.prisma.structureFailure.update({
        where: { id: link.failureModeId },
        data: { isLinked: false },
      });
    }
    return { success: true };
  }

  // ===== LINK ACTIONS =====

  async createLinkAction(
    tenantId: string,
    failureLinkId: string,
    dto: CreateLinkActionDto,
  ) {
    const link = await this.prisma.failureLink.findUnique({
      where: { id: failureLinkId },
      include: { failureMode: { include: { function: true } } },
    });
    if (!link) throw new NotFoundException('Failure link not found');
    if (link.failureMode.function.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');

    return this.prisma.linkAction.create({
      data: {
        failureLinkId,
        description: dto.description,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        revisedSeverity: dto.revisedSeverity ?? null,
        revisedOccurrence: dto.revisedOccurrence ?? null,
        revisedDetection: dto.revisedDetection ?? null,
        remarks: dto.remarks ?? null,
        status: 'open',
      },
    });
  }

  async updateLinkAction(
    tenantId: string,
    actionId: string,
    dto: UpdateLinkActionDto,
  ) {
    const action = await this.prisma.linkAction.findUnique({
      where: { id: actionId },
      include: {
        failureLink: {
          include: { failureMode: { include: { function: true } } },
        },
      },
    });
    if (!action) throw new NotFoundException('Link action not found');
    if (action.failureLink.failureMode.function.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');

    return this.prisma.linkAction.update({
      where: { id: actionId },
      data: {
        description: dto.description,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        revisedSeverity: dto.revisedSeverity,
        revisedOccurrence: dto.revisedOccurrence,
        revisedDetection: dto.revisedDetection,
        remarks: dto.remarks,
        status: dto.status,
      },
    });
  }

  async deleteLinkAction(tenantId: string, actionId: string) {
    const action = await this.prisma.linkAction.findUnique({
      where: { id: actionId },
      include: {
        failureLink: {
          include: { failureMode: { include: { function: true } } },
        },
      },
    });
    if (!action) throw new NotFoundException('Link action not found');
    if (action.failureLink.failureMode.function.tenantId !== tenantId)
      throw new ForbiddenException('Access denied');
    return this.prisma.linkAction.delete({ where: { id: actionId } });
  }
}
