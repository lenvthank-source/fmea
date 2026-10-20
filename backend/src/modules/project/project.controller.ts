import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

const actor = (req: RequestWithUser) => ({
  tenantId: req.user.tenantId,
  userId: req.user.sub,
  isGuest: req.user.isGuest,
});

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  // --- Static / Admin Routes (Must come BEFORE parameterized :id routes) ---

  @Get()
  @Permissions('project.view')
  async findAll(
    @Request() req: RequestWithUser,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit?: number,
    @Query('search') search?: string,
  ) {
    const isGuest = !!req.user.isGuest;
    const isAdmin = req.user.roles?.includes('Admin') || false;
    const userId = req.user.sub;
    return this.projectService.findAll(
      req.user.tenantId,
      status,
      page,
      limit,
      userId,
      search,
      isGuest,
      isAdmin,
    );
  }

  @Post()
  @Permissions('project.create')
  async create(@Request() req: RequestWithUser, @Body() dto: CreateProjectDto) {
    const isGuest = !!req.user.isGuest;
    return this.projectService.create(
      req.user.tenantId,
      req.user.sub,
      dto,
      isGuest,
    );
  }

  @Post(':id/replicate')
  @Permissions('project.create')
  async replicate(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body()
    dto: {
      name: string;
      qualityHeaderOverrides: Partial<CreateProjectDto>;
      includeTypes: ('PFD' | 'PFMEA' | 'DFMEA' | 'CONTROL_PLAN')[];
    },
  ) {
    return this.projectService.replicate(
      req.user.tenantId,
      req.user.sub,
      id,
      dto,
    );
  }

  @Get('admin/revisions')
  @Permissions('admin.config')
  async adminGetRevisions(@Request() req: RequestWithUser) {
    return this.projectService.adminGetRevisions(req.user.tenantId);
  }

  @Delete('admin/revisions/:revisionId')
  @Permissions('admin.config')
  async adminDeleteRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
  ) {
    return this.projectService.adminDeleteRevision(
      req.user.tenantId,
      req.user.sub,
      revisionId,
    );
  }

  @Patch('revisions/:revisionId')
  @Permissions('project.edit')
  async updateRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
    @Body()
    dto: {
      revisionNumber?: string;
      summary?: string;
      changeDescription?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    },
  ) {
    return this.projectService.updateRevision(
      req.user.tenantId,
      req.user.sub,
      revisionId,
      dto,
    );
  }

  @Delete('revisions/:revisionId')
  @Permissions('admin.config')
  async deleteRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
  ) {
    return this.projectService.deleteRevision(
      req.user.tenantId,
      req.user.sub,
      revisionId,
    );
  }

  @Post('revisions/:revisionId/activate')
  @Permissions('project.edit')
  async switchActiveRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
  ) {
    return this.projectService.switchActiveRevision(
      req.user.tenantId,
      req.user.sub,
      revisionId,
    );
  }

  // --- Parameterized :id Routes ---

  @Get(':id')
  @Permissions('project.view')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.projectService.assertActorProjectAccess(actor(req), id);
    const isAdmin = req.user.roles?.includes('Admin') || false;
    return this.projectService.findOne(req.user.tenantId, id, true, isAdmin);
  }

  @Patch(':id')
  @Permissions('project.edit')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    await this.projectService.assertActorProjectAccess(actor(req), id, true);
    return this.projectService.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions('project.delete')
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    const isAdmin = req.user.roles?.includes('Admin') || false;
    return this.projectService.remove(
      req.user.tenantId,
      id,
      isAdmin,
      req.user.sub,
    );
  }

  @Get(':id/documents')
  @Permissions('project.view')
  async findDocuments(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    await this.projectService.assertActorProjectAccess(actor(req), id);
    const isAdmin = req.user.roles?.includes('Admin') || false;
    return this.projectService.findDocuments(req.user.tenantId, id, isAdmin);
  }

  @Post(':id/revisions')
  @Permissions('project.edit')
  async createRevision(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body()
    body: {
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
  async getRevisions(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.projectService.assertActorProjectAccess(actor(req), id);
    const isAdmin = req.user.roles?.includes('Admin') || false;
    return this.projectService.getRevisions(req.user.tenantId, id, isAdmin);
  }

  @Get(':id/revisions/:revisionId')
  @Permissions('project.view')
  async getRevisionDetail(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
    @Param('id') projectId: string,
  ) {
    await this.projectService.assertActorRevisionAccess(
      actor(req),
      revisionId,
      projectId,
    );
    return this.projectService.getRevisionDetail(req.user.tenantId, revisionId);
  }

  @Get(':id/revisions/:revisionId/readiness')
  @Permissions('project.view')
  async getReadiness(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
    @Param('id') projectId: string,
  ) {
    await this.projectService.assertActorRevisionAccess(
      actor(req),
      revisionId,
      projectId,
    );
    return this.projectService.getRevisionReadiness(
      req.user.tenantId,
      revisionId,
      req.user.sub,
    );
  }

  @Post(':id/revisions/:revisionId/submit')
  @Permissions('project.edit')
  async submitRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
    @Param('id') projectId: string,
  ) {
    await this.projectService.assertActorRevisionAccess(
      actor(req),
      revisionId,
      projectId,
    );
    return this.projectService.submitRevision(
      req.user.tenantId,
      req.user.sub,
      revisionId,
    );
  }

  @Post(':id/revisions/:revisionId/approve')
  @Permissions('revision.approve')
  async approveRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
    @Param('id') projectId: string,
    @Body() dto: { password: string; comment: string },
  ) {
    await this.projectService.assertActorRevisionAccess(
      actor(req),
      revisionId,
      projectId,
    );
    return this.projectService.approveRevision(
      req.user.tenantId,
      req.user.sub,
      revisionId,
      dto,
    );
  }

  @Post(':id/revisions/:revisionId/reject')
  @Permissions('revision.review')
  async rejectRevision(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
    @Param('id') projectId: string,
    @Body() dto: { comment: string },
  ) {
    await this.projectService.assertActorRevisionAccess(
      actor(req),
      revisionId,
      projectId,
    );
    return this.projectService.rejectRevision(
      req.user.tenantId,
      req.user.sub,
      revisionId,
      dto,
    );
  }
}
