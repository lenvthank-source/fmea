import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('revisions/:revisionId/audit-logs')
  async getRevisionAuditLogs(
    @Request() req: RequestWithUser,
    @Param('revisionId') revisionId: string,
  ) {
    return this.auditLogService.getEntriesForRevision(req.user.tenantId, revisionId);
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Request() req: RequestWithUser,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.auditLogService.getEntriesForEntity(req.user.tenantId, entityType, entityId);
  }
}
