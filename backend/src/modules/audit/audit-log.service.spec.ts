import { AuditLogService } from './audit-log.service';

describe('Workspace activity', () => {
  let db: any;
  let service: AuditLogService;
  const viewer = { sub: 'viewer', isGuest: true, roles: ['Quality Engineer'] };
  beforeEach(() => {
    db = Object.fromEntries(
      [
        'project',
        'document',
        'documentRevision',
        'processStep',
        'pfmeaRow',
        'action',
        'structureFunction',
        'structureFailure',
        'failureLink',
        'linkAction',
        'auditLog',
        'user',
      ].map((key) => [key, { findMany: jest.fn().mockResolvedValue([]) }]),
    );
    service = new AuditLogService(db);
    db.project.findMany.mockResolvedValue([
      { id: 'p1', name: 'Actual program', partName: 'Actual part' },
    ]);
  });
  it('does not invent activity when the audit log is empty', async () => {
    expect(await service.getRecentActivity('tenant', 6, viewer)).toEqual([]);
    expect(db.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant' }),
        take: 6,
      }),
    );
  });
  it('scopes the guest to the reference project and their own unexpired projects', async () => {
    await service.getRecentActivity('tenant', 6, viewer);
    expect(db.project.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({
        tenantId: 'tenant',
        status: { not: 'archived' },
        OR: [
          { id: 'c439cfbe-548a-4e25-a37c-0194652b8526' },
          { createdById: 'viewer', createdAt: { gte: expect.any(Date) } },
        ],
      }),
    );
    expect(db.user.findMany.mock.calls[0][0].where.tenantId).toBe('tenant');
  });
  it('uses actual entity/project/actor data and preserves a delete as a delete', async () => {
    db.document.findMany.mockResolvedValue([
      { id: 'doc', projectId: 'p1', type: 'CONTROL_PLAN' },
    ]);
    db.documentRevision.findMany.mockResolvedValue([
      { id: 'rev', documentId: 'doc', revisionNumber: '2.3' },
    ]);
    db.auditLog.findMany.mockResolvedValue([
      {
        id: 'log',
        entityType: 'control_plan_row',
        entityId: 'deleted',
        action: 'delete',
        userId: 'u1',
        timestamp: new Date('2026-10-19T00:00:00Z'),
        newValue: { revisionId: 'rev' },
      },
    ]);
    db.user.findMany.mockResolvedValue([{ id: 'u1', name: 'Actual Engineer' }]);
    expect(await service.getRecentActivity('tenant', 6, viewer)).toEqual([
      expect.objectContaining({
        title: 'Control plan row deleted',
        sub: 'Actual part · Actual Engineer',
        projectId: 'p1',
        actor: 'Actual Engineer',
        time: '2026-10-19T00:00:00.000Z',
      }),
    ]);
  });
  it('drops unresolved or inaccessible records rather than assigning a demo name', async () => {
    db.auditLog.findMany.mockResolvedValue([
      {
        id: 'hidden',
        entityType: 'project',
        entityId: 'other-project',
        action: 'update',
        userId: 'u1',
        timestamp: new Date(),
        newValue: { projectId: 'other-project' },
      },
    ]);
    expect(await service.getRecentActivity('tenant', 6, viewer)).toEqual([]);
  });
  it('restricts normal users by owner, allows the admin scope, and bounds the limit', async () => {
    await service.getRecentActivity('tenant', 999, { sub: 'owner', roles: [] });
    expect(db.project.findMany.mock.calls[0][0].where.createdById).toBe(
      'owner',
    );
    expect(db.auditLog.findMany.mock.calls[0][0].take).toBe(20);
    await service.getRecentActivity('tenant', NaN, {
      sub: 'admin',
      roles: ['Admin'],
    });
    expect(db.project.findMany.mock.calls[1][0].where).toEqual({
      tenantId: 'tenant',
      status: { not: 'archived' },
    });
    expect(db.auditLog.findMany.mock.calls[1][0].take).toBe(8);
  });
});
