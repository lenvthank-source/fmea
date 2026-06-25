import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { PfdService } from './pfd.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { CreateWorkElementDto } from './dto/create-work-element.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller()
export class PfdController {
  constructor(private pfdService: PfdService) {}

  @Get('revisions/:id/pfd-steps')
  @Permissions('pfmea.view')
  async findAllSteps(@Request() req: RequestWithUser, @Param('id') revisionId: string) {
    return this.pfdService.findAllSteps(req.user.tenantId, revisionId);
  }

  @Post('revisions/:id/pfd-steps')
  @Permissions('pfmea.edit')
  async createStep(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
    @Body() dto: CreateStepDto,
  ) {
    return this.pfdService.createStep(req.user.tenantId, revisionId, dto);
  }

  @Patch('pfd-steps/:stepId')
  @Permissions('pfmea.edit')
  async updateStep(
    @Request() req: RequestWithUser,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateStepDto,
  ) {
    return this.pfdService.updateStep(req.user.tenantId, stepId, dto);
  }

  @Delete('pfd-steps/:stepId')
  @Permissions('pfmea.edit')
  async removeStep(@Request() req: RequestWithUser, @Param('stepId') stepId: string) {
    return this.pfdService.removeStep(req.user.tenantId, stepId);
  }

  @Post('revisions/:id/pfd-steps/reorder')
  @Permissions('pfmea.edit')
  async reorderSteps(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
    @Body('orderedStepIds') orderedStepIds: string[],
  ) {
    return this.pfdService.reorderSteps(req.user.tenantId, revisionId, orderedStepIds);
  }

  @Post('pfd-steps/:stepId/work-elements')
  @Permissions('pfmea.edit')
  async createWorkElement(
    @Request() req: RequestWithUser,
    @Param('stepId') stepId: string,
    @Body() dto: CreateWorkElementDto,
  ) {
    return this.pfdService.createWorkElement(req.user.tenantId, stepId, dto);
  }

  @Delete('work-elements/:elementId')
  @Permissions('pfmea.edit')
  async removeWorkElement(
    @Request() req: RequestWithUser,
    @Param('elementId') elementId: string,
  ) {
    return this.pfdService.removeWorkElement(req.user.tenantId, elementId);
  }
}
