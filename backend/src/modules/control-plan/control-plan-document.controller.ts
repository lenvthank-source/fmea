import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  IsInt,
  IsObject,
  IsString,
  Min,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { ControlPlanDocumentService } from './control-plan-document.service';
import type { CpDocument } from './control-plan-document';
class SaveCpDocumentDto {
  @IsInt() @Min(0) expectedVersion: number;
  @IsObject() document: CpDocument;
}
class ForkCpDto {
  @IsString() revisionNumber: string;
  @IsString() phase: string;
  @IsString() summary: string;
}
class PreviewCpDto {
  @IsUUID() sourceRevisionId: string;
}
class ApplyCpDto extends PreviewCpDto {
  @IsInt() @Min(0) expectedVersion: number;
  @IsString() sourceFingerprint: string;
  @IsArray() decisions: {
    key: string;
    action: string;
    reason?: string;
    resolutions?: Record<string, 'source' | 'current'>;
  }[];
}
const actor = (req: RequestWithUser) => ({
  tenantId: req.user.tenantId,
  userId: req.user.sub,
  isGuest: req.user.isGuest,
});
@Controller('revisions/:revisionId/control-plan-document')
export class ControlPlanDocumentController {
  constructor(private readonly service: ControlPlanDocumentService) {}
  @Get() @Permissions('cp.view') get(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
  ) {
    return this.service.get(actor(req), id).then((result) => ({
      ...result,
      forkable:
        result.forkable &&
        (req.user.roles.includes('Admin') ||
          req.user.permissions.includes('cp.edit')),
      writable:
        result.writable &&
        (req.user.roles.includes('Admin') ||
          req.user.permissions.includes('cp.edit')),
    }));
  }
  @Put() @Permissions('cp.edit') save(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: SaveCpDocumentDto,
  ) {
    return this.service.save(actor(req), id, body);
  }
  @Post('fork') @Permissions('cp.edit') fork(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: ForkCpDto,
  ) {
    return this.service.fork(actor(req), id, body);
  }
  @Post('sync-preview') @Permissions('cp.view') preview(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: PreviewCpDto,
  ) {
    return this.service.preview(actor(req), id, body.sourceRevisionId);
  }
  @Post('sync-apply') @Permissions('cp.edit') apply(
    @Request() req: RequestWithUser,
    @Param('revisionId', new ParseUUIDPipe()) id: string,
    @Body() body: ApplyCpDto,
  ) {
    return this.service.apply(actor(req), id, body);
  }
}
