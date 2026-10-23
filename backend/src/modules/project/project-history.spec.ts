import { ProjectService } from './project.service';
import * as access from '../../common/engineering-access';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
const tenantId = randomUUID(),
  userId = randomUUID(),
  projectId = randomUUID(),
  documentId = randomUUID(),
  revisionId = randomUUID();
function fixture() {
  const project = {
    id: projectId,
    tenantId,
    name: 'Synthetic project',
    createdById: userId,
    status: 'active',
    createdAt: new Date(),
    uiSettings: {},
  };
  const revision = {
    id: revisionId,
    documentId,
    status: 'draft',
    lockedAt: null as Date | null,
    revisionNumber: '1.0',
    document: {
      id: documentId,
      tenantId,
      projectId,
      currentRevisionId: randomUUID() as string | null,
    },
  };
  const db: any = {
    project: {
      findFirst: jest.fn().mockResolvedValue(project),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn(),
    },
    user: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ id: userId, status: 'active', isGuest: false }),
    },
    documentRevision: {
      findFirst: jest.fn().mockImplementation(async () => revision),
      count: jest.fn().mockResolvedValue(2),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    document: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    pfmeaRow: { count: jest.fn().mockResolvedValue(0) },
    operationVersionBinding: { count: jest.fn().mockResolvedValue(0) },
    controlPlanDocument: { count: jest.fn().mockResolvedValue(0) },
    dfmeaDocument: { count: jest.fn().mockResolvedValue(0) },
    auditLog: { create: jest.fn() },
    $queryRaw: jest.fn().mockResolvedValue([]),
  };
  db.$transaction = jest.fn(async (work: any) => work(db));
  const scoped = jest
    .spyOn(access, 'assertEngineeringRevisionAccess')
    .mockImplementation(
      async () =>
        ({
          ...revision,
          document: { ...revision.document, project },
          writable: true,
          projectWritable: true,
        }) as never,
    );
  return {
    db,
    project,
    revision,
    scoped,
    service: new ProjectService(db, { createEntry: jest.fn() } as never),
  };
}
describe('project and revision protected history mutations', () => {
  afterEach(() => jest.restoreAllMocks());
  it.each(['approved', 'in_review', 'superseded'])(
    'prevents admin deletion of %s history',
    async (status) => {
      const f = fixture();
      f.revision.status = status;
      f.revision.lockedAt = status === 'approved' ? new Date() : null;
      await expect(
        f.service.adminDeleteRevision(tenantId, userId, revisionId),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(f.db.documentRevision.deleteMany).not.toHaveBeenCalled();
      expect(f.db.document.updateMany).not.toHaveBeenCalled();
      expect(f.db.auditLog.create).not.toHaveBeenCalled();
    },
  );
  it('prevents deletion when approval changed state after the initial scope lookup', async () => {
    const f = fixture();
    f.scoped.mockResolvedValue({
      ...f.revision,
      status: 'draft',
      document: { ...f.revision.document, project: f.project },
    } as never);
    f.revision.status = 'approved';
    f.revision.lockedAt = new Date();
    await expect(
      f.service.deleteRevision(tenantId, userId, revisionId),
    ).rejects.toThrow('Protected');
    expect(f.db.documentRevision.deleteMany).not.toHaveBeenCalled();
  });
  it('prevents trial reference activation before any pointer or lock mutation', async () => {
    const f = fixture();
    f.project.uiSettings = { isDemo: true } as never;
    f.db.user.findFirst.mockResolvedValue({ status: 'active', isGuest: true });
    await expect(
      f.service.switchActiveRevision(tenantId, userId, revisionId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.db.document.updateMany).not.toHaveBeenCalled();
    expect(f.db.project.update).not.toHaveBeenCalled();
    expect(f.db.$queryRaw).not.toHaveBeenCalled();
  });
  it('selects an approved baseline atomically without writing its protected revision', async () => {
    const f = fixture();
    f.revision.status = 'approved';
    f.revision.lockedAt = new Date();
    await expect(
      f.service.switchActiveRevision(tenantId, userId, revisionId),
    ).resolves.toMatchObject({ activated: true, revisionId });
    expect(f.db.document.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId,
          currentRevisionId: f.revision.document.currentRevisionId,
        }),
        data: { currentRevisionId: revisionId },
      }),
    );
    expect(f.db.project.update).toHaveBeenCalledTimes(1);
    expect(f.db.auditLog.create).toHaveBeenCalledTimes(1);
    expect(f.db.documentRevision.deleteMany).not.toHaveBeenCalled();
    expect(f.db.$queryRaw.mock.calls[0][0].values).toEqual([tenantId, userId]);
    expect(f.db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
      timeout: 30000,
      maxWait: 10000,
    });
  });
  it('rechecks active and last-revision constraints inside the transaction', async () => {
    const f = fixture();
    f.revision.document.currentRevisionId = revisionId;
    await expect(
      f.service.deleteRevision(tenantId, userId, revisionId),
    ).rejects.toThrow('active revision');
    f.revision.document.currentRevisionId = randomUUID();
    f.db.documentRevision.count.mockResolvedValue(1);
    await expect(
      f.service.deleteRevision(tenantId, userId, revisionId),
    ).rejects.toThrow('last revision');
    expect(f.db.documentRevision.deleteMany).not.toHaveBeenCalled();
  });
  it('does not delete or audit after a competing pointer change', async () => {
    const f = fixture();
    f.db.document.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      f.service.switchActiveRevision(tenantId, userId, revisionId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(f.db.project.update).not.toHaveBeenCalled();
    expect(f.db.auditLog.create).not.toHaveBeenCalled();
  });
  it('checks the final delete predicate and never cascades child deletions separately', async () => {
    const f = fixture();
    f.db.documentRevision.deleteMany.mockResolvedValue({ count: 0 });
    await expect(
      f.service.deleteRevision(tenantId, userId, revisionId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(f.db.documentRevision.deleteMany).toHaveBeenCalledWith({
      where: {
        id: revisionId,
        status: 'draft',
        lockedAt: null,
        document: { tenantId, projectId },
      },
    });
    expect(f.db.auditLog.create).not.toHaveBeenCalled();
  });
  it('prevents project hard deletion with any protected history, even for admin', async () => {
    const f = fixture();
    f.db.documentRevision.count.mockResolvedValue(1);
    await expect(
      f.service.remove(tenantId, projectId, true, userId),
    ).rejects.toThrow('Archive');
    expect(f.db.project.deleteMany).not.toHaveBeenCalled();
    expect(f.db.auditLog.create).not.toHaveBeenCalled();
  });
  it('requires actual actor context for project removal and rejects trial reference deletion', async () => {
    const f = fixture();
    await expect(
      f.service.remove(tenantId, projectId, true),
    ).rejects.toBeInstanceOf(ForbiddenException);
    f.project.uiSettings = { isDemo: true } as never;
    f.db.user.findFirst.mockResolvedValue({ status: 'active', isGuest: true });
    await expect(
      f.service.remove(tenantId, projectId, false, userId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(f.db.project.deleteMany).not.toHaveBeenCalled();
  });
  it('does not cascade a routing draft into other analysis revisions', async () => {
    const f = fixture();
    f.db.operationVersionBinding.count.mockResolvedValue(1);
    await expect(
      f.service.adminDeleteRevision(tenantId, userId, revisionId),
    ).rejects.toThrow('Resolve source links');
    expect(f.db.documentRevision.deleteMany).not.toHaveBeenCalled();
  });
  it('returns retryable409 when competing approval invalidates the serializable snapshot', async () => {
    const f = fixture();
    f.db.$transaction.mockRejectedValue({ code: 'P2034' });
    await expect(
      f.service.deleteRevision(tenantId, userId, revisionId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(f.db.auditLog.create).not.toHaveBeenCalled();
  });
});

describe('transaction rollback and canonical source preservation', () => {
  afterEach(() => jest.restoreAllMocks());
  it('retains canonical Control Plan source baselines even if the source revision remains a draft', async () => {
    const f = fixture();
    f.db.controlPlanDocument.count.mockResolvedValue(1);
    await expect(
      f.service.adminDeleteRevision(tenantId, userId, revisionId),
    ).rejects.toThrow('Resolve source links');
    expect(f.db.documentRevision.deleteMany).not.toHaveBeenCalled();
  });
  it('rolls back pointer and project-number changes if final administrative delete loses the state race', async () => {
    const f = fixture();
    f.revision.document.currentRevisionId = revisionId;
    const replacementId = randomUUID();
    f.db.documentRevision.findFirst
      .mockResolvedValueOnce(f.revision)
      .mockResolvedValueOnce({ id: replacementId, revisionNumber: '2.0' });
    f.db.documentRevision.deleteMany.mockResolvedValue({ count: 0 });
    let committed = { pointer: revisionId, number: '1.0' },
      staged: typeof committed | null = null;
    f.db.$transaction.mockImplementation(async (work: any) => {
      staged = { ...committed };
      try {
        const result = await work(f.db);
        committed = staged!;
        return result;
      } finally {
        staged = null;
      }
    });
    f.db.document.updateMany.mockImplementation(async () => {
      (staged ?? committed).pointer = replacementId;
      return { count: 1 };
    });
    f.db.project.update.mockImplementation(async () => {
      (staged ?? committed).number = '2.0';
      return {};
    });
    await expect(
      f.service.adminDeleteRevision(tenantId, userId, revisionId),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(f.db.document.updateMany).toHaveBeenCalledTimes(1);
    expect(f.db.project.update).toHaveBeenCalledTimes(1);
    expect(committed).toEqual({ pointer: revisionId, number: '1.0' });
    expect(f.db.auditLog.create).not.toHaveBeenCalled();
  });
});
