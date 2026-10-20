import { assertEngineeringRevisionAccess } from './engineering-access';
function fixture() {
  const revision = {
    id: 'revision',
    status: 'draft',
    lockedAt: null,
    document: {
      tenantId: 't',
      type: 'DFMEA',
      project: {
        id: 'p',
        createdById: 'u',
        status: 'active',
        createdAt: new Date(),
        uiSettings: {},
      },
    },
  };
  const db: any = {
    documentRevision: {
      findFirst: jest.fn().mockResolvedValue(revision),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: { findFirst: jest.fn().mockResolvedValue({ isGuest: false }) },
  };
  return { db, revision, actor: { tenantId: 't', userId: 'u' } };
}
describe('engineering revision access', () => {
  it('filters tenant before exposing a revision', async () => {
    const { db, actor } = fixture();
    db.documentRevision.findFirst.mockResolvedValue(null);
    await expect(
      assertEngineeringRevisionAccess(db, actor, 'foreign'),
    ).rejects.toThrow('Revision not found');
    expect(
      db.documentRevision.findFirst.mock.calls[0][0].where.document.tenantId,
    ).toBe('t');
  });
  it('rejects document type confusion', async () => {
    const { db, actor } = fixture();
    await expect(
      assertEngineeringRevisionAccess(
        db,
        actor,
        'revision',
        'CONTROL_PLAN',
        true,
      ),
    ).rejects.toThrow('Expected CONTROL_PLAN');
    expect(db.documentRevision.updateMany).not.toHaveBeenCalled();
  });
  it('resolves omitted trial claims from the user record', async () => {
    const { db, revision, actor } = fixture();
    db.user.findFirst.mockResolvedValue({ isGuest: true });
    revision.document.project.createdById = 'other';
    await expect(
      assertEngineeringRevisionAccess(db, actor, 'revision', 'DFMEA', true),
    ).rejects.toThrow('Trial access');
  });
  it('allows trial reference reading, blocks writing', async () => {
    const { db, revision, actor } = fixture();
    db.user.findFirst.mockResolvedValue({ isGuest: true });
    revision.document.project.uiSettings = { isDemo: true };
    await expect(
      assertEngineeringRevisionAccess(db, actor, 'revision', 'DFMEA'),
    ).resolves.toMatchObject({ writable: false });
    await expect(
      assertEngineeringRevisionAccess(db, actor, 'revision', 'DFMEA', true),
    ).rejects.toThrow('Trial access');
  });
  it('blocks expired trial projects', async () => {
    const { db, revision, actor } = fixture();
    db.user.findFirst.mockResolvedValue({ isGuest: true });
    revision.document.project.createdAt = new Date(Date.now() - 86400001);
    await expect(
      assertEngineeringRevisionAccess(db, actor, 'revision', 'DFMEA', true),
    ).rejects.toThrow('Trial access');
  });
  it('serializes writes against draft/lock changes', async () => {
    const { db, actor } = fixture();
    db.documentRevision.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      assertEngineeringRevisionAccess(db, actor, 'revision', 'DFMEA', true),
    ).rejects.toThrow('protected');
    expect(db.documentRevision.updateMany.mock.calls[0][0].where).toMatchObject(
      { status: 'draft', lockedAt: null, document: { tenantId: 't' } },
    );
  });
});
