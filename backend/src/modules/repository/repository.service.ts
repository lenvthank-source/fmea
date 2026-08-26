import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateWorkElementPackageDto,
  UpdateWorkElementPackageDto,
  RejectWorkElementPackageDto,
  ImportWorkElementPackageDto,
} from './repository.dto';

@Injectable()
export class RepositoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Submit a new work element package for review (status = 'pending')
   */
  async submitPackage(dto: CreateWorkElementPackageDto, user: any) {
    if (user?.isGuest || (user?.email && user.email.toLowerCase().startsWith('guest'))) {
      throw new ForbiddenException('Guest accounts have read-only access to repository packages');
    }

    const userId = user?.sub || user?.id || user?.userId;
    if (!userId) {
      throw new BadRequestException('User ID is missing from authentication token');
    }

    const isAdmin =
      (user.roles || []).includes('Admin') ||
      (user.permissions || []).includes('admin.config') ||
      (user.permissions || []).includes('admin.users');

    const status = isAdmin ? 'approved' : 'pending';
    const reviewedById = isAdmin ? userId : null;
    const reviewedAt = isAdmin ? new Date() : null;

    return this.prisma.workElementPackage.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        packageData: dto.packageData,
        status,
        contributorId: userId,
        contributorName: user.name || user.email || 'Unknown User',
        contributorTenantId: user.tenantId,
        sourceProjectId: dto.sourceProjectId || null,
        reviewedById,
        reviewedAt,
      },
    });
  }

  /**
   * List approved packages (visible to all)
   */
  async listApproved() {
    return this.prisma.workElementPackage.findMany({
      where: { status: 'approved' },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * List pending packages for admin review
   */
  async listPendingForAdmin() {
    return this.prisma.workElementPackage.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * List packages submitted by the current user
   */
  async listMySubmissions(userId: string) {
    return this.prisma.workElementPackage.findMany({
      where: { contributorId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single package details
   */
  async getPackageById(id: string) {
    const pkg = await this.prisma.workElementPackage.findUnique({
      where: { id },
    });
    if (!pkg) {
      throw new NotFoundException(`Work element package ${id} not found`);
    }
    return pkg;
  }

  /**
   * Approve a pending package (Admin only)
   */
  async approvePackage(id: string, adminUser: any) {
    const pkg = await this.getPackageById(id);
    const adminId = adminUser?.sub || adminUser?.id || adminUser?.userId || null;

    return this.prisma.workElementPackage.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });
  }

  /**
   * Reject a pending package (Admin only)
   */
  async rejectPackage(id: string, dto: RejectWorkElementPackageDto, adminUser: any) {
    await this.getPackageById(id);
    const adminId = adminUser?.sub || adminUser?.id || adminUser?.userId || null;

    return this.prisma.workElementPackage.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason.trim(),
      },
    });
  }

  /**
   * Update package (Admin only)
   */
  async updatePackage(id: string, dto: UpdateWorkElementPackageDto) {
    await this.getPackageById(id);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.packageData !== undefined) data.packageData = dto.packageData;

    return this.prisma.workElementPackage.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete package (Admin only)
   */
  async deletePackage(id: string) {
    await this.getPackageById(id);
    return this.prisma.workElementPackage.delete({
      where: { id },
    });
  }

  /**
   * Deep-copy an approved package into a PFMEA process step
   */
  async importPackage(packageId: string, dto: ImportWorkElementPackageDto, user: any) {
    const pkg = await this.getPackageById(packageId);
    if (pkg.status !== 'approved') {
      throw new BadRequestException('Only approved packages can be imported into PFMEA');
    }

    // Find the step - try the given revision first
    let step = await this.prisma.processStep.findFirst({
      where: { id: dto.processStepId, revisionId: dto.revisionId },
    });
    
    // If not found, or if it's a PFMEA shadow revision, find the PFD master revision
    if (!step) {
      throw new NotFoundException(`Process step ${dto.processStepId} not found in revision ${dto.revisionId}`);
    }

    // Find the PFD master step (linkedPfdStepId is null for master)
    let masterStep = step;
    if (step.linkedPfdStepId) {
      const foundMaster = await this.prisma.processStep.findUnique({
        where: { id: step.linkedPfdStepId },
      });
      if (foundMaster) masterStep = foundMaster;
    }
    
    // Use the master step for work element tracking
    const targetStep = masterStep;

    // 1. Append package name to machinesEquipmentDocs on MASTER step
    let currentWe: string[] = [];
    if (targetStep.machinesEquipmentDocs) {
      if (Array.isArray(targetStep.machinesEquipmentDocs)) {
        currentWe = [...(targetStep.machinesEquipmentDocs as string[])];
      } else if (typeof targetStep.machinesEquipmentDocs === 'string') {
        try {
          currentWe = JSON.parse(targetStep.machinesEquipmentDocs as string);
        } catch {
          currentWe = [targetStep.machinesEquipmentDocs as string];
        }
      }
    }

    if (!currentWe.includes(pkg.name)) {
      currentWe.push(pkg.name);
      await this.prisma.processStep.update({
        where: { id: targetStep.id },
        data: { machinesEquipmentDocs: currentWe },
      });
    }

    // Also update the shadow step if different
    if (step.id !== targetStep.id && step.machinesEquipmentDocs) {
      let shadowWe: string[] = [];
      if (Array.isArray(step.machinesEquipmentDocs)) {
        shadowWe = [...(step.machinesEquipmentDocs as string[])];
      } else if (typeof step.machinesEquipmentDocs === 'string') {
        try {
          shadowWe = JSON.parse(step.machinesEquipmentDocs as string);
        } catch {
          shadowWe = [step.machinesEquipmentDocs as string];
        }
      }
      if (!shadowWe.includes(pkg.name)) {
        shadowWe.push(pkg.name);
        await this.prisma.processStep.update({
          where: { id: step.id },
          data: { machinesEquipmentDocs: shadowWe },
        });
      }
    }

    // 2. Extract functions & failures from packageData
    const pkgData = (pkg.packageData as any) || {};
    const functions = pkgData.functions || [];

    const parentId = `${step.id}::${pkg.name}`;

    return await this.prisma.$transaction(async (tx) => {
      const rev = await tx.documentRevision.findUnique({
        where: { id: dto.revisionId },
        select: { document: { select: { projectId: true } } },
      });
      const projectId = rev?.document?.projectId || '';

      const createdFunctions: any[] = [];
      const createdFailures: any[] = [];

      for (const fn of functions) {
        // Create StructureFunction
        const sf = await tx.structureFunction.create({
          data: {
            tenantId: user.tenantId,
            projectId: projectId,
            parentType: 'work_element',
            parentId: parentId,
            narration: fn.name || fn.narration || 'Unnamed Function',
            location: 'your_plant',
          },
        });
        createdFunctions.push(sf);

        // Create nested failures (causes)
        if (fn.failures && Array.isArray(fn.failures)) {
          for (const fail of fn.failures) {
            const failRec = await tx.structureFailure.create({
              data: {
                functionId: sf.id,
                role: 'cause',
                narration: fail.name || fail.narration || 'Unnamed Failure',
                severityRating: fail.severity || fail.severityRating || null,
                occurrenceRating: fail.occurrence || fail.occurrenceRating || null,
                detectionRating: fail.detection || fail.detectionRating || null,
                currentControlPrevention: fail.preventionControl || fail.currentControlPrevention || null,
                currentControlDetection: fail.detectionControl || fail.currentControlDetection || null,
                filterCode: fail.filterCode || null,
              },
            });
            createdFailures.push(failRec);
          }
        }
      }

      return {
        importedPackage: pkg.name,
        createdWorkElement: pkg.name,
        createdFunctionsCount: createdFunctions.length,
        createdFailuresCount: createdFailures.length,
      };
    });
  }
}
