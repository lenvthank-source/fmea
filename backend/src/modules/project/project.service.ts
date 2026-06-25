import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.project.findMany({
      where: {
        tenantId,
        status: { not: 'archived' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project || project.status === 'archived') {
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
        },
      });

      // 2. Initialize default documents (PFD, PFMEA, CONTROL_PLAN)
      const docTypes = [
        { type: 'PFD', name: 'Process Flow Diagram' },
        { type: 'PFMEA', name: 'Process FMEA' },
        { type: 'CONTROL_PLAN', name: 'Control Plan' },
      ];

      for (const docType of docTypes) {
        // Create document
        const document = await tx.document.create({
          data: {
            tenantId,
            projectId: project.id,
            type: docType.type,
            name: `${project.name} - ${docType.name}`,
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
            summary: 'Initial draft version',
            createdById: userId,
          },
        });

        // Link document to current revision
        await tx.document.update({
          where: { id: document.id },
          data: { currentRevisionId: revision.id },
        });
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
      },
    });
  }

  async remove(tenantId: string, id: string) {
    // Verify ownership first
    await this.findOne(tenantId, id);

    return this.prisma.project.update({
      where: { id },
      data: { status: 'archived' },
    });
  }

  async findDocuments(tenantId: string, projectId: string) {
    await this.findOne(tenantId, projectId);

    return this.prisma.document.findMany({
      where: { projectId, tenantId },
    });
  }
}
