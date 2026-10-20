import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ControlPlanRowService } from './control-plan-row.service';
import { CreateCpRowDto } from './dto/create-cp-row.dto';
import { UpdateCpRowDto } from './dto/update-cp-row.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller()
export class ControlPlanRowController {
  constructor(private cpRowService: ControlPlanRowService) {}

  @Get('revisions/:id/control-plan-rows')
  @Permissions('cp.view')
  async findAllRows(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit?: number,
  ) {
    return this.cpRowService.findAllRows(
      {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        isGuest: req.user.isGuest,
      },
      revisionId,
      page,
      limit,
    );
  }

  @Post('revisions/:id/control-plan-rows')
  @Permissions('cp.edit')
  async createRow(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
    @Body() dto: CreateCpRowDto,
  ) {
    return this.cpRowService.createRow(
      {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        isGuest: req.user.isGuest,
      },
      revisionId,
      dto,
    );
  }

  @Patch('control-plan-rows/:rowId')
  @Permissions('cp.edit')
  async updateRow(
    @Request() req: RequestWithUser,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateCpRowDto,
  ) {
    return this.cpRowService.updateRow(
      {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        isGuest: req.user.isGuest,
      },
      rowId,
      dto,
    );
  }

  @Delete('control-plan-rows/:rowId')
  @Permissions('cp.edit')
  async removeRow(
    @Request() req: RequestWithUser,
    @Param('rowId') rowId: string,
  ) {
    return this.cpRowService.removeRow(
      {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        isGuest: req.user.isGuest,
      },
      rowId,
    );
  }

  @Post('revisions/:id/control-plan-rows/sync')
  @Permissions('cp.edit')
  async syncFromPfmea(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
  ) {
    return this.cpRowService.syncFromPfmea(
      {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        isGuest: req.user.isGuest,
      },
      revisionId,
    );
  }

  @Post('revisions/:id/control-plan-rows/sync-pfd')
  @Permissions('cp.edit')
  async syncFromPfd(
    @Request() req: RequestWithUser,
    @Param('id') revisionId: string,
  ) {
    return this.cpRowService.syncFromPfd(
      {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        isGuest: req.user.isGuest,
      },
      revisionId,
    );
  }
}
