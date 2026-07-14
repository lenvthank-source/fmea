import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async createEntry(data: {
    tenantId: string;
    userId: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValue?: any;
    newValue?: any;
    diff?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldValue: data.oldValue || undefined,
        newValue: data.newValue || undefined,
        diff: data.diff || undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async getEntriesForEntity(tenantId: string, entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId, entityType, entityId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getEntriesForRevision(tenantId: string, revisionId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'document_revision',
        entityId: revisionId,
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
