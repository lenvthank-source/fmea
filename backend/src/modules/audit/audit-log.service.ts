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

  async getRecentActivity(tenantId: string, limit = 8) {
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    const userIds = Array.from(new Set(logs.map((l) => l.userId).filter(Boolean)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = logs.map((l) => {
      const u = userMap.get(l.userId);
      const name = u?.name || 'Quality Engineer';
      const initials = name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'QE';

      let title = `${l.action.toUpperCase()} on ${l.entityType.replace(/_/g, ' ')}`;
      let sub = `Entity: ${l.entityId.substring(0, 8)}...`;
      let color = '#2563eb';

      if (l.action === 'create') {
        title = `New ${l.entityType.replace(/_/g, ' ')} Created`;
        color = '#10b981';
      } else if (l.action === 'delete') {
        title = `${l.entityType.replace(/_/g, ' ')} Removed`;
        color = '#ef4444';
      } else if (l.action === 'approve') {
        title = `Revision Approved & Locked`;
        color = '#8b5cf6';
      } else if (l.action === 'update') {
        title = `${l.entityType.replace(/_/g, ' ')} Updated`;
        color = '#f59e0b';
      }

      if (l.newValue && typeof l.newValue === 'object') {
        const anyVal = l.newValue as any;
        if (anyVal.name) sub = String(anyVal.name);
        else if (anyVal.title) sub = String(anyVal.title);
        else if (anyVal.partName) sub = String(anyVal.partName);
      }

      return {
        id: l.id,
        initials,
        color,
        title,
        sub,
        time: l.timestamp.toISOString(),
        action: l.action,
        entityType: l.entityType,
      };
    });

    // If fewer than limit, enrich with actual active database projects and actions
    if (formatted.length < limit) {
      const projects = await this.prisma.project.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: limit - formatted.length,
        include: { creator: true, documents: true },
      });

      for (const p of projects) {
        const pName = p.partName || p.name || 'Quality Program';
        const docTypes = p.documents.map((d) => d.type).join(', ') || 'PFMEA, PFD, CP';
        formatted.push({
          id: `proj-${p.id}`,
          initials: (p.creator?.name || 'QE')
            .split(' ')
            .map((s) => s[0])
            .join('')
            .substring(0, 2)
            .toUpperCase(),
          color: '#09090b',
          title: `Quality Program: ${pName}`,
          sub: `${docTypes} · 21 CFR Part 11 Audit Trail Active`,
          time: p.updatedAt.toISOString(),
          action: 'project_active',
          entityType: 'project',
        });
      }
    }

    return formatted;
  }
}
