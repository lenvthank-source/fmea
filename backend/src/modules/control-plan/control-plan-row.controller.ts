import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { ControlPlanRowService } from './control-plan-row.service';
import { CreateCpRowDto } from './dto/create-cp-row.dto';
import { UpdateCpRowDto } from './dto/update-cp-row.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller()
export class ControlPlanRowController {
  constructor(private cpRowService: ControlPlanRowService) {}

  @Get('revisions/:id/control-plan-rows')
  @Permissions('pfmea.view') // Reusing pfmea.view permission for CP
  async findAllRows(@Request() req: RequestWithUser, @Param('id') revisionId: string) {
    return this.cpRowService.findAllRows(req.user.tenantId, revisionId);
  }

  @Post('revisions/:id/control-plan-rows')
  @Permissions('pfmea.edit') // Reusing pfmea.edit permission for CP
  async createRow(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
    @Body() dto: CreateCpRowDto,
  ) {
    return this.cpRowService.createRow(req.user.tenantId, revisionId, dto);
  }

  @Patch('control-plan-rows/:rowId')
  @Permissions('pfmea.edit')
  async updateRow(
    @Request() req: RequestWithUser,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateCpRowDto,
  ) {
    return this.cpRowService.updateRow(req.user.tenantId, rowId, dto);
  }

  @Delete('control-plan-rows/:rowId')
  @Permissions('pfmea.edit')
  async removeRow(@Request() req: RequestWithUser, @Param('rowId') rowId: string) {
    return this.cpRowService.removeRow(req.user.tenantId, rowId);
  }

  @Post('revisions/:id/control-plan-rows/sync')
  @Permissions('pfmea.edit')
  async syncFromPfmea(@Request() req: RequestWithUser, @Param('id') revisionId: string) {
    return this.cpRowService.syncFromPfmea(req.user.tenantId, revisionId);
  }

  @Post('revisions/:id/control-plan-rows/sync-pfd')
  @Permissions('pfmea.edit')
  async syncFromPfd(@Request() req: RequestWithUser, @Param('id') revisionId: string) {
    return this.cpRowService.syncFromPfd(req.user.tenantId, revisionId);
  }
}
