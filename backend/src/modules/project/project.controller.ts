import { Body, Controller, Delete, Get, Param, Patch, Post, Request, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @Permissions('project.view')
  async findAll(@Request() req: RequestWithUser, @Query('status') status?: string) {
    return this.projectService.findAll(req.user.tenantId, status);
  }

  @Get(':id')
  @Permissions('project.view')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.projectService.findOne(req.user.tenantId, id, true);
  }

  @Post()
  @Permissions('project.create')
  async create(@Request() req: RequestWithUser, @Body() dto: CreateProjectDto) {
    return this.projectService.create(req.user.tenantId, req.user.sub, dto);
  }

  @Patch(':id')
  @Permissions('project.edit')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('project.delete')
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.projectService.remove(req.user.tenantId, id);
  }

  @Get(':id/documents')
  @Permissions('project.view')
  async findDocuments(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.projectService.findDocuments(req.user.tenantId, id);
  }

  @Post(':id/revisions')
  @Permissions('project.edit')
  async createRevision(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() body: {
      changeDesc: string;
      revisionNumber?: string;
      summary?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    },
  ) {
    return this.projectService.createRevision(
      req.user.tenantId,
      id,
      req.user.sub,
      body.changeDesc,
      {
        revisionNumber: body.revisionNumber,
        summary: body.summary,
        effectiveFrom: body.effectiveFrom,
        effectiveTo: body.effectiveTo,
      },
    );
  }

  @Get(':id/revisions')
  @Permissions('project.view')
  async getRevisions(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.projectService.getRevisions(req.user.tenantId, id);
  }

  @Get(':id/revisions/:revisionId')
  @Permissions('project.view')
  async getRevisionDetail(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
  ) {
    return this.projectService.getRevisionDetail(req.user.tenantId, revisionId);
  }

  @Patch('revisions/:revisionId')
  @Permissions('project.edit')
  async updateRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
    @Body() dto: {
      revisionNumber?: string;
      summary?: string;
      changeDescription?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    },
  ) {
    return this.projectService.updateRevision(req.user.tenantId, req.user.sub, revisionId, dto);
  }

  @Delete('revisions/:revisionId')
  @Permissions('admin.config')
  async deleteRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
  ) {
    return this.projectService.deleteRevision(req.user.tenantId, req.user.sub, revisionId);
  }

  @Delete('admin/revisions/:revisionId')
  @Permissions('admin.config')
  async adminDeleteRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
  ) {
    return this.projectService.adminDeleteRevision(req.user.tenantId, req.user.sub, revisionId);
  }

  @Get('admin/revisions')
  @Permissions('admin.config')
  async adminGetRevisions(
    @Request() req: RequestWithUser,
  ) {
    return this.projectService.adminGetRevisions(req.user.tenantId);
  }

  @Post('revisions/:revisionId/activate')
  @Permissions('project.edit')
  async switchActiveRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
  ) {
    return this.projectService.switchActiveRevision(req.user.tenantId, req.user.sub, revisionId);
  }
}
