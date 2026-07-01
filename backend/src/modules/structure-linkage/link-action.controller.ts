import { Body, Controller, Delete, Param, Patch, Post, Request } from '@nestjs/common';
import { StructureLinkageService } from './structure-linkage.service';
import { CreateLinkActionDto } from './dto/create-link-action.dto';
import { UpdateLinkActionDto } from './dto/update-link-action.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller()
export class LinkActionController {
  constructor(private service: StructureLinkageService) {}

  @Post('failure-links/:linkId/actions')
  @Permissions('pfmea.edit')
  create(
    @Request() req: RequestWithUser,
    @Param('linkId') linkId: string,
    @Body() dto: CreateLinkActionDto,
  ) {
    return this.service.createLinkAction(req.user.tenantId, linkId, dto);
  }

  @Patch('link-actions/:id')
  @Permissions('pfmea.edit')
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateLinkActionDto,
  ) {
    return this.service.updateLinkAction(req.user.tenantId, id, dto);
  }

  @Delete('link-actions/:id')
  @Permissions('pfmea.edit')
  remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.service.deleteLinkAction(req.user.tenantId, id);
  }
}
