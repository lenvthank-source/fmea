import { Body, Controller, Delete, Get, Param, Post, Request } from '@nestjs/common';
import { StructureLinkageService } from './structure-linkage.service';
import { LinkFailuresDto } from './dto/link-failures.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller()
export class FailureLinkController {
  constructor(private service: StructureLinkageService) {}

  @Get('failure-modes/:id/linkage-candidates')
  @Permissions('pfmea.view')
  getCandidates(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.service.getLinkageCandidates(req.user.tenantId, id);
  }

  @Post('failure-modes/:id/link')
  @Permissions('pfmea.edit')
  link(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: LinkFailuresDto,
  ) {
    return this.service.linkFailures(req.user.tenantId, id, dto);
  }

  @Get('failure-modes/:id/links')
  @Permissions('pfmea.view')
  getLinks(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.service.getModeLinks(req.user.tenantId, id);
  }

  @Get('process-steps/:id/linkage-summary')
  @Permissions('pfmea.view')
  getSummary(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.service.getLinkageSummary(req.user.tenantId, id);
  }

  @Delete('failure-links/:id')
  @Permissions('pfmea.edit')
  unlink(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.service.unlinkFailure(req.user.tenantId, id);
  }
}
