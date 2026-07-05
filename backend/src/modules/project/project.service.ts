import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

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
}
