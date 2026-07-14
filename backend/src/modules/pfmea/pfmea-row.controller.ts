import { Body, Controller, Delete, Get, Param, Patch, Post, Request } from '@nestjs/common';
import { PfmeaRowService } from './pfmea-row.service';
import { CreatePfmeaRowDto } from './dto/create-pfmea-row.dto';
import { UpdatePfmeaRowDto } from './dto/update-pfmea-row.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller()
export class PfmeaRowController {
  constructor(private pfmeaRowService: PfmeaRowService) {}

  @Get('revisions/:id/pfmea-rows')
  @Permissions('pfmea.view')
  async findAllRows(@Request() req: RequestWithUser, @Param('id') revisionId: string) {
    return this.pfmeaRowService.findAllRows(req.user.tenantId, revisionId);
  }

  @Post('revisions/:id/pfmea-rows')
  @Permissions('pfmea.edit')
  async createRow(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
    @Body() dto: CreatePfmeaRowDto,
  ) {
    return this.pfmeaRowService.createRow(req.user.tenantId, req.user.sub, revisionId, dto);
  }

  @Patch('pfmea-rows/:rowId')
  @Permissions('pfmea.edit')
  async updateRow(
    @Request() req: RequestWithUser,
    @Param('rowId') rowId: string,
    @Body() dto: UpdatePfmeaRowDto,
  ) {
    return this.pfmeaRowService.updateRow(req.user.tenantId, rowId, dto);
  }

  @Delete('pfmea-rows/:rowId')
  @Permissions('pfmea.edit')
  async removeRow(@Request() req: RequestWithUser, @Param('rowId') rowId: string) {
    return this.pfmeaRowService.removeRow(req.user.tenantId, rowId);
  }

  @Post('revisions/:id/sync-from-tree')
  @Permissions('pfmea.edit')
  async syncFromTree(@Request() req: RequestWithUser, @Param('id') revisionId: string) {
    return this.pfmeaRowService.syncFromTree(req.user.tenantId, revisionId);
  }
}
