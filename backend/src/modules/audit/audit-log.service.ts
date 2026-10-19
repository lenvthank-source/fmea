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

  async getEntriesForEntity(
    tenantId: string,
    entityType: string,
    entityId: string,
  ) {
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

  async getRecentActivity(
    tenantId: string,
    limit = 8,
    viewer: { sub: string; isGuest?: boolean; roles?: string[] },
  ) {
    const take = Number.isFinite(limit)
      ? Math.max(1, Math.min(20, Math.floor(limit)))
      : 8;
    // Match the project-list visibility rules, not the shared guest tenant alone.
    const isAdmin = viewer.roles?.includes('Admin');
    const projects = await this.prisma.project.findMany({
      where: {
        tenantId,
        status: { not: 'archived' },
        ...(!isAdmin
          ? viewer.isGuest
            ? {
                OR: [
                  { id: 'c439cfbe-548a-4e25-a37c-0194652b8526' },
                  {
                    createdById: viewer.sub,
                    createdAt: {
                      gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                  },
                ],
              }
            : { createdById: viewer.sub }
          : {}),
      },
      select: { id: true, name: true, partName: true },
    });
    if (!projects.length) return [];
    const projectIds = projects.map((p) => p.id);
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const documents = await this.prisma.document.findMany({
      where: { tenantId, projectId: { in: projectIds } },
      select: { id: true, projectId: true, type: true },
    });
    const revisions = await this.prisma.documentRevision.findMany({
      where: { document: { tenantId, projectId: { in: projectIds } } },
      select: { id: true, documentId: true, revisionNumber: true },
    });
    const revisionIds = revisions.map((r) => r.id);
    const revisionScope = {
      revision: { document: { tenantId, projectId: { in: projectIds } } },
    };
    const [steps, rows, controls, actions, functions] = await Promise.all([
      this.prisma.processStep.findMany({
        where: revisionScope,
        select: { id: true, revisionId: true },
      }),
      this.prisma.pfmeaRow.findMany({
        where: revisionScope,
        select: { id: true, revisionId: true },
      }),
      this.prisma.controlPlanRow.findMany({
        where: revisionScope,
        select: { id: true, revisionId: true },
      }),
      this.prisma.action.findMany({
        where: { tenantId, projectId: { in: projectIds } },
        select: { id: true, projectId: true },
      }),
      this.prisma.structureFunction.findMany({
        where: { tenantId, projectId: { in: projectIds } },
        select: { id: true, projectId: true },
      }),
    ]);
    const docMap = new Map(documents.map((d) => [d.id, d]));
    const revMap = new Map(revisions.map((r) => [r.id, r]));
    const entityProjects = new Map<string, string>();
    const add = (type: string, id: string, projectId?: string) => {
      if (projectId && projectMap.has(projectId))
        entityProjects.set(`${type}:${id}`, projectId);
    };
    projects.forEach((p) => add('project', p.id, p.id));
    documents.forEach((d) => add('document', d.id, d.projectId));
    revisions.forEach((r) =>
      add('document_revision', r.id, docMap.get(r.documentId)?.projectId),
    );
    for (const [type, entities] of [
      ['process_step', steps],
      ['pfmea_row', rows],
      ['control_plan_row', controls],
    ] as const) {
      entities.forEach((e) =>
        add(
          type,
          e.id,
          docMap.get(revMap.get(e.revisionId)?.documentId || '')?.projectId,
        ),
      );
    }
    actions.forEach((a) => add('action', a.id, a.projectId));
    functions.forEach((f) => add('structure_function', f.id, f.projectId));
    const functionScope = { tenantId, projectId: { in: projectIds } };
    const [failures, links, linkActions] = await Promise.all([
      this.prisma.structureFailure.findMany({
        where: { function: functionScope },
        select: { id: true, function: { select: { projectId: true } } },
      }),
      this.prisma.failureLink.findMany({
        where: { failureMode: { function: functionScope } },
        select: {
          id: true,
          failureMode: {
            select: { function: { select: { projectId: true } } },
          },
        },
      }),
      this.prisma.linkAction.findMany({
        where: { failureLink: { failureMode: { function: functionScope } } },
        select: {
          id: true,
          failureLink: {
            select: {
              failureMode: {
                select: { function: { select: { projectId: true } } },
              },
            },
          },
        },
      }),
    ]);
    failures.forEach((f) =>
      add('structure_failure', f.id, f.function.projectId),
    );
    links.forEach((l) =>
      add('failure_link', l.id, l.failureMode.function.projectId),
    );
    linkActions.forEach((a) =>
      add('link_action', a.id, a.failureLink.failureMode.function.projectId),
    );
    const scopedEntities = [...entityProjects.keys()].map((key) => {
      const [entityType, entityId] = key.split(':');
      return { entityType, entityId };
    });
    // Deleted entities can still be attributed by their immutable audit snapshot.
    const snapshotScopes = [
      ...projectIds.map((id) => ({ path: ['projectId'], equals: id })),
      ...revisionIds.map((id) => ({ path: ['revisionId'], equals: id })),
    ];
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: {
          in: [
            'project',
            'document',
            'document_revision',
            'process_step',
            'pfmea_row',
            'control_plan_row',
            'action',
            'structure_function',
            'structure_failure',
            'failure_link',
            'link_action',
          ],
        },
        OR: [
          ...scopedEntities,
          ...snapshotScopes.flatMap((scope) => [
            { newValue: scope },
            { oldValue: scope },
          ]),
        ],
      },
      orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
      take,
    });
    const users = await this.prisma.user.findMany({
      where: { tenantId, id: { in: [...new Set(logs.map((l) => l.userId))] } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const labels: Record<string, string> = {
      project: 'Project',
      document: 'Document',
      document_revision: 'Revision',
      process_step: 'Process step',
      pfmea_row: 'FMEA row',
      control_plan_row: 'Control plan row',
      action: 'Action',
      structure_function: 'Function',
      structure_failure: 'Failure',
      failure_link: 'Failure relationship',
      link_action: 'Mitigation action',
    };
    const verbs: Record<string, string> = {
      create: 'created',
      update: 'updated',
      delete: 'deleted',
      approve: 'approved',
      reject: 'rejected',
      submit: 'submitted for review',
      activate: 'activated',
    };
    return logs.flatMap((log) => {
      const snapshot = (
        log.newValue && typeof log.newValue === 'object'
          ? log.newValue
          : log.oldValue
      ) as Record<string, unknown> | null;
      const revision =
        revMap.get(log.entityId) ||
        revMap.get(String(snapshot?.revisionId || ''));
      const document =
        docMap.get(revision?.documentId || '') || docMap.get(log.entityId);
      const projectId =
        entityProjects.get(`${log.entityType}:${log.entityId}`) ||
        document?.projectId ||
        String(snapshot?.projectId || '');
      const project = projectMap.get(projectId);
      if (!project) return [];
      const actor = userMap.get(log.userId) || 'Team member';
      const type =
        document?.type === 'CONTROL_PLAN' ? 'Control plan' : document?.type;
      const label =
        log.entityType === 'document_revision' && type
          ? `${type} revision ${revision?.revisionNumber || ''}`.trim()
          : labels[log.entityType];
      return [
        {
          id: log.id,
          initials: actor
            .split(/\s+/)
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          actor,
          projectId,
          entityId: log.entityId,
          entityType: log.entityType,
          color: log.action === 'delete' ? '#ad4823' : '#45664c',
          title: `${label} ${verbs[log.action] || log.action}`,
          sub: `${project.partName || project.name} · ${actor}`,
          time: log.timestamp.toISOString(),
          action: log.action,
        },
      ];
    });
  }
}
