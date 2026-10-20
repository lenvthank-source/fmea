import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { IsInt, IsObject, IsString, Min } from 'class-validator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { DfmeaService } from './dfmea.service';
class ForkDfmeaDto {
  @IsString() revisionNumber: string;
  @IsString() summary: string;
}
class SaveDfmeaDto {
  @IsInt() @Min(0) expectedVersion: number;
  @IsObject() data: Record<string, unknown>;
}
@Controller('revisions/:revisionId/dfmea-document')
export class DfmeaController {
  constructor(private service: DfmeaService) {}
  @Get()
  @Permissions('dfmea.view')
  async get(@Request() req: RequestWithUser, @Param('revisionId') id: string) {
    const result = await this.service.get(
      {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        isGuest: req.user.isGuest,
      },
      id,
    );
    return {
      ...result,
      writable: result.writable && req.user.permissions.includes('dfmea.edit'),
      forkable: result.forkable && req.user.permissions.includes('dfmea.edit'),
    };
  }
  @Post('fork') @Permissions('dfmea.edit') fork(
    @Request() req: RequestWithUser,
    @Param('revisionId') id: string,
    @Body() body: ForkDfmeaDto,
  ) {
    return this.service.fork(
      {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        isGuest: req.user.isGuest,
      },
      id,
      body,
    );
  }
  @Put()
  @Permissions('dfmea.edit')
  save(
    @Request() req: RequestWithUser,
    @Param('revisionId') id: string,
    @Body() dto: SaveDfmeaDto,
  ) {
    return this.service.save(
      {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        isGuest: req.user.isGuest,
      },
      id,
      dto.expectedVersion,
      dto.data,
    );
  }
}
