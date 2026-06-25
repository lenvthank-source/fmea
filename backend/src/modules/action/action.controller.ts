import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ActionService } from './action.service';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller()
export class ActionController {
  constructor(private actionService: ActionService) {}

  @Get('actions')
  @Permissions('pfmea.view')
  async findUserActions(@Request() req: RequestWithUser) {
    return this.actionService.findUserActions(req.user.tenantId, req.user.sub);
  }

  @Get('projects/:projectId/actions')
  @Permissions('pfmea.view')
  async findProjectActions(@Request() req: RequestWithUser, @Param('projectId') projectId: string) {
    return this.actionService.findProjectActions(req.user.tenantId, projectId);
  }

  @Post('actions')
  @Permissions('pfmea.edit')
  async createAction(@Request() req: RequestWithUser, @Body() dto: CreateActionDto) {
    return this.actionService.createAction(req.user.tenantId, req.user.sub, dto);
  }

  @Patch('actions/:actionId')
  @Permissions('pfmea.edit')
  async updateAction(
    @Request() req: RequestWithUser,
    @Param('actionId') actionId: string,
    @Body() dto: UpdateActionDto,
  ) {
    return this.actionService.updateAction(req.user.tenantId, req.user.sub, actionId, dto);
  }

  @Post('actions/:actionId/evidence')
  @Permissions('pfmea.edit')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidence(
    @Request() req: RequestWithUser,
    @Param('actionId') actionId: string,
    @UploadedFile() file: any,
    @Body('description') description?: string,
  ) {
    return this.actionService.addEvidence(
      req.user.tenantId,
      req.user.sub,
      actionId,
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      description,
    );
  }

  @Delete('evidence/:evidenceId')
  @Permissions('pfmea.edit')
  async removeEvidence(@Request() req: RequestWithUser, @Param('evidenceId') evidenceId: string) {
    return this.actionService.removeEvidence(req.user.tenantId, evidenceId);
  }
}
