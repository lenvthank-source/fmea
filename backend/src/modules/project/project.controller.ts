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
    @Body('changeDesc') changeDesc: string,
  ) {
    return this.projectService.createRevision(req.user.tenantId, id, req.user.sub, changeDesc);
  }

  @Get(':id/revisions')
  @Permissions('project.view')
  async getRevisions(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.projectService.getRevisions(req.user.tenantId, id);
  }
}
