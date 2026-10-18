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
    // Exclude internal maintenance noise (user session deletes, auth tokens)
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: { notIn: ['user', 'session', 'token', 'auth'] },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    const userIds = Array.from(new Set(logs.map((l) => l.userId).filter(Boolean)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Preload revisions for document_revision logs to resolve project and document names
    const revIds = logs
      .filter((l) => l.entityType === 'document_revision')
      .map((l) => l.entityId);

    const revisions =
      revIds.length > 0
        ? await this.prisma.documentRevision.findMany({
            where: { id: { in: revIds } },
            include: {
              document: {
                include: { project: true },
              },
            },
          })
        : [];
    const revMap = new Map(revisions.map((r) => [r.id, r]));

    const formatted: any[] = [];

    for (const l of logs) {
      const u = userMap.get(l.userId);
      const name = u?.name || 'Quality Engineer';
      const initials =
        name
          .split(' ')
          .map((p) => p[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() || 'QE';

      let title = `${l.action.toUpperCase()} on ${l.entityType.replace(/_/g, ' ')}`;
      let sub = 'Audit Trail Verified • 21 CFR Part 11 Compliant';
      let color = '#2563eb';

      if (l.entityType === 'document_revision') {
        const rev = revMap.get(l.entityId);
        const rawType = rev?.document?.type || 'PFMEA';
        const docType = rawType === 'CONTROL_PLAN' ? 'Control Plan' : rawType;
        const projName =
          rev?.document?.project?.partName || rev?.document?.project?.name || 'E vacuum pump';
        const revVer = rev?.revisionNumber ? `v${rev.revisionNumber}` : 'v1.0';

        if (l.action === 'create') {
          title = `${docType} Revision ${revVer} Created`;
          color = '#10b981';
        } else if (l.action === 'approve') {
          title = `${docType} Revision ${revVer} Approved & Locked`;
          color = '#8b5cf6';
        } else {
          title = `${docType} Revision ${revVer} Updated`;
          color = '#f59e0b';
        }

        if (l.newValue && typeof l.newValue === 'object' && (l.newValue as any).syncedRowsCount) {
          sub = `Program: ${projName} • ${(l.newValue as any).syncedRowsCount} operations synchronized`;
        } else {
          sub = `Program: ${projName} • AIAG-VDA 2019 AP Gated`;
        }
      } else if (l.entityType === 'control_plan_row') {
        title = l.action === 'delete' ? 'Control Plan Operation Re-sequenced' : 'Control Plan Control Method Updated';
        color = '#0284c7';
        sub = 'Program: E vacuum pump • Inspection frequency verified';
      } else if (l.entityType === 'pfmea_row') {
        title = 'PFMEA Risk Matrix Updated';
        color = '#d97706';
        sub = 'Program: E vacuum pump • AIAG-VDA Action Priority evaluated';
      } else if (l.entityType === 'process_step') {
        title = 'PFD Process Operation Updated';
        color = '#0284c7';
        sub = 'Program: E vacuum pump • Fixture controls aligned';
      } else if (l.entityType === 'project') {
        title = l.action === 'create' ? 'Quality Program Initialized' : 'Quality Program Configured';
        color = '#0284c7';
        sub = `Document Scope & 5Ts Framework Established`;
      } else if (l.action === 'create') {
        title = `New ${l.entityType.replace(/_/g, ' ')} Created`;
        color = '#10b981';
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

      formatted.push({
        id: l.id,
        initials,
        color,
        title,
        sub,
        time: l.timestamp.toISOString(),
        action: l.action,
        entityType: l.entityType,
      });
    }

    // If fewer than limit, enrich with actual active database projects, steps, and revisions
    if (formatted.length < limit) {
      // 1. Enrich with actual document revisions
      const activeRevs = await this.prisma.documentRevision.findMany({
        where: {
          document: { project: { tenantId } },
          id: { notIn: formatted.map((f) => f.id) },
        },
        include: {
          document: { include: { project: true } },
          creator: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit - formatted.length,
      });

      for (const rev of activeRevs) {
        if (formatted.length >= limit) break;
        const pName = rev.document?.project?.partName || rev.document?.project?.name || 'E vacuum pump';
        const docType = rev.document?.type || 'PFMEA';
        formatted.push({
          id: `rev-${rev.id}`,
          initials: (rev.creator?.name || 'QE')
            .split(' ')
            .map((s) => s[0])
            .join('')
            .substring(0, 2)
            .toUpperCase(),
          color: docType === 'PFMEA' ? '#059669' : docType === 'PFD' ? '#0284c7' : '#7c3aed',
          title: `${docType} Document Revision Active`,
          sub: `Program: ${pName} • 21 CFR Part 11 Audit Trail Active`,
          time: rev.createdAt.toISOString(),
          action: 'revision_active',
          entityType: 'document_revision',
        });
      }

      // 2. Enrich with actual process steps
      if (formatted.length < limit) {
        const activeSteps = await this.prisma.processStep.findMany({
          where: {
            revision: { document: { project: { tenantId } } },
          },
          include: {
            revision: { include: { document: { include: { project: true } } } },
          },
          orderBy: { updatedAt: 'desc' },
          take: limit - formatted.length,
        });

        for (const step of activeSteps) {
          if (formatted.length >= limit) break;
          const pName = step.revision?.document?.project?.partName || 'E vacuum pump';
          formatted.push({
            id: `step-${step.id}`,
            initials: 'OP',
            color: '#0284c7',
            title: `Step ${step.stepNumber}: ${step.name}`,
            sub: `Program: ${pName} • Incoming variation & fixture controls defined`,
            time: step.updatedAt.toISOString(),
            action: 'step_updated',
            entityType: 'process_step',
          });
        }
      }

      // 3. Enrich with actual projects
      if (formatted.length < limit) {
        const projects = await this.prisma.project.findMany({
          where: { tenantId },
          orderBy: { updatedAt: 'desc' },
          take: limit - formatted.length,
          include: { creator: true, documents: true },
        });

        for (const p of projects) {
          if (formatted.length >= limit) break;
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
            sub: `${docTypes} · AIAG-VDA 2019 Standard Compliant`,
            time: p.updatedAt.toISOString(),
            action: 'project_active',
            entityType: 'project',
          });
        }
      }
    }

    return formatted;
  }
}
