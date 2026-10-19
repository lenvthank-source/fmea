import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Request } from '@nestjs/common';
import { PfdService } from './pfd.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { SavePfdGraphDto } from './dto/save-pfd-graph.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller()
export class PfdController {
  constructor(private pfdService: PfdService) {}

  @Get('revisions/:id/pfd-graph')
  @Permissions('pfmea.view')
  async getGraph(@Request() req: RequestWithUser, @Param('id') id: string) {
    const mayWrite = await this.pfdService.assertActorAccess(req.user, id, false);
    const graph = await this.pfdService.getGraph(req.user.tenantId, id);
    return { ...graph, writable: graph.writable && mayWrite && Boolean(req.user.permissions?.includes('pfmea.edit')) };
  }

  @Put('revisions/:id/pfd-graph')
  @Permissions('pfmea.edit')
  async saveGraph(@Request() req: RequestWithUser, @Param('id') id: string, @Body() dto: SavePfdGraphDto) {
    await this.pfdService.assertActorAccess(req.user, id, true);
    return this.pfdService.saveGraph(req.user.tenantId, id, dto);
  }

  @Get('revisions/:id/pfd-steps')
  @Permissions('pfmea.view')
  async findAllSteps(@Request() req: RequestWithUser, @Param('id') revisionId: string) {
    await this.pfdService.assertActorAccess(req.user, revisionId, false);
    return this.pfdService.findAllSteps(req.user.tenantId, revisionId);
  }

  @Post('revisions/:id/pfd-steps')
  @Permissions('pfmea.edit')
  async createStep(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
    @Body() dto: CreateStepDto,
  ) {
    await this.pfdService.assertActorAccess(req.user, revisionId, true);
    return this.pfdService.createStep(req.user.tenantId, revisionId, dto);
  }

  @Post('revisions/:id/pfd-steps/batch')
  @Permissions('pfmea.edit')
  async createStepsBatch(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
    @Body() dtos: CreateStepDto[],
  ) {
    await this.pfdService.assertActorAccess(req.user, revisionId, true);
    return this.pfdService.createStepsBatch(req.user.tenantId, revisionId, dtos);
  }

  @Post('revisions/:id/import-pfd-steps')
  @Permissions('pfmea.edit')
  async importPfdSteps(
    @Request() req: RequestWithUser,
    @Param('id') targetRevisionId: string,
    @Body('sourceRevisionId') sourceRevisionId: string,
  ) {
    await this.pfdService.assertActorAccess(req.user, targetRevisionId, true);
    await this.pfdService.assertActorAccess(req.user, sourceRevisionId, false);
    return this.pfdService.importSteps(req.user.tenantId, targetRevisionId, sourceRevisionId);
  }

  @Patch('pfd-steps/:stepId')
  @Permissions('pfmea.edit')
  async updateStep(
    @Request() req: RequestWithUser,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateStepDto,
  ) {
    await this.pfdService.assertActorAccess(req.user, stepId, true, true);
    return this.pfdService.updateStep(req.user.tenantId, stepId, dto);
  }

  @Delete('pfd-steps/:stepId')
  @Permissions('pfmea.edit')
  async removeStep(@Request() req: RequestWithUser, @Param('stepId') stepId: string) {
    await this.pfdService.assertActorAccess(req.user, stepId, true, true);
    return this.pfdService.removeStep(req.user.tenantId, stepId);
  }

  @Post('revisions/:id/pfd-steps/reorder')
  @Permissions('pfmea.edit')
  async reorderSteps(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
    @Body('orderedStepIds') orderedStepIds: string[],
  ) {
    await this.pfdService.assertActorAccess(req.user, revisionId, true);
    return this.pfdService.reorderSteps(req.user.tenantId, revisionId, orderedStepIds);
  }

}
