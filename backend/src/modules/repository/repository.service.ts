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
    return this.prisma.workElementPackage.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        packageData: dto.packageData,
        status: 'pending',
        contributorId: user.id,
        contributorName: user.name || user.email || 'Unknown User',
        contributorTenantId: user.tenantId,
        sourceProjectId: dto.sourceProjectId || null,
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
    return this.prisma.workElementPackage.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedById: adminUser.id,
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
    return this.prisma.workElementPackage.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedById: adminUser.id,
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

    const step = await this.prisma.processStep.findFirst({
      where: { id: dto.processStepId, revisionId: dto.revisionId },
    });
    if (!step) {
      throw new NotFoundException(`Process step ${dto.processStepId} not found in revision ${dto.revisionId}`);
    }

    // 1. Append package name to machinesEquipmentDocs
    let currentWe: string[] = [];
    if (step.machinesEquipmentDocs) {
      if (Array.isArray(step.machinesEquipmentDocs)) {
        currentWe = [...(step.machinesEquipmentDocs as string[])];
      } else if (typeof step.machinesEquipmentDocs === 'string') {
        try {
          currentWe = JSON.parse(step.machinesEquipmentDocs as string);
        } catch {
          currentWe = [step.machinesEquipmentDocs as string];
        }
      }
    }

    if (!currentWe.includes(pkg.name)) {
      currentWe.push(pkg.name);
      await this.prisma.processStep.update({
        where: { id: step.id },
        data: { machinesEquipmentDocs: currentWe },
      });
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
