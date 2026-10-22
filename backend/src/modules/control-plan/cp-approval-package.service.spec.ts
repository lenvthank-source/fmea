import { CpApprovalPackageService } from './cp-approval-package.service';
import { CpDocumentV2 } from './control-plan-document';
import { ForbiddenException, ConflictException } from '@nestjs/common';

describe('CpApprovalPackageService', () => {
  let service: CpApprovalPackageService;
  let mockPrisma: any;
  let mockPdfService: any;

  beforeEach(() => {
    mockPdfService = {
      renderControlPlanPdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 test bytes')),
    };

    mockPrisma = {
      $transaction: jest.fn().mockImplementation((fn) => fn(mockPrisma)),
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ generation: 1 }]),
      documentRevision: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'rev-1',
          createdById: 'author-1',
          lockedAt: null,
          document: { tenantId: 'tenant-1', projectId: 'proj-1' },
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'rev-1',
          createdById: 'author-1',
          lockedAt: null,
        }),
        update: jest.fn().mockResolvedValue({ id: 'rev-1', status: 'approved' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'approver-1',
          userRoles: [{ role: { name: 'Quality Engineer' } }],
        }),
      },
      controlPlanDocument: {
        findUnique: jest.fn().mockResolvedValue({
          revisionId: 'rev-1',
          version: 1,
          data: {
            schemaVersion: 2,
            config: { phase: 'production', safeLaunch: { enabled: false } },
            header: { controlPlanNumber: 'CP-1' },
            operations: [],
          },
        }),
      },
      cpValidationRun: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'val-run-1',
          cpRevisionId: 'rev-1',
          profileRevisionId: 'prof-1',
          profileHash: 'hash-1',
          findings: [],
        }),
      },
      cpApprovalPackage: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'pkg-1', ...data }),
        ),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'pkg-1',
          tenantId: 'tenant-1',
          projectId: 'proj-1',
          revisionId: 'rev-1',
          state: 'ready',
          frozenSnapshot: {
            schemaVersion: 2,
            config: { phase: 'production', safeLaunch: { enabled: false } },
            header: { controlPlanNumber: 'CP-1' },
            operations: [],
          },
          frozenSnapshotHash: 'snap-hash-1',
          intentActorId: 'approver-1',
          intentDecisionAt: new Date(),
        }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'pkg-1',
          tenantId: 'tenant-1',
          projectId: 'proj-1',
          revisionId: 'rev-1',
          state: 'ready',
          frozenSnapshot: {
            schemaVersion: 2,
            config: { phase: 'production', safeLaunch: { enabled: false } },
            header: { controlPlanNumber: 'CP-1' },
            operations: [],
          },
          frozenSnapshotHash: 'snap-hash-1',
          intentActorId: 'approver-1',
          intentDecisionAt: new Date(),
        }),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'pkg-1', ...data }),
        ),
      },
      cpArtifact: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'art-1', ...data }),
        ),
        findUnique: jest.fn().mockResolvedValue({
          id: 'art-1',
          tenantId: 'tenant-1',
          packageId: 'pkg-1',
          fileName: 'control-plan.pdf',
          mimeType: 'application/pdf',
          content: Buffer.from('%PDF-1.4 test bytes'),
        }),
      },
      approval: {
        create: jest.fn().mockResolvedValue({ id: 'appr-1' }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    service = new CpApprovalPackageService(mockPrisma, mockPdfService);
  });

  it('enforces segregation of duties: revision author cannot approve without admin grant', async () => {
    await expect(
      service.recordApprovalIntent('tenant-1', 'rev-1', 'author-1', {
        expectedVersion: 1,
        validationRunId: 'val-run-1',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('records approval intent successfully for distinct approver', async () => {
    const res = await service.recordApprovalIntent(
      'tenant-1',
      'rev-1',
      'approver-1',
      {
        expectedVersion: 1,
        validationRunId: 'val-run-1',
        comment: 'Ready for production release',
      },
    );

    expect(res.packageId).toBe('pkg-1');
    expect(res.state).toBe('queued');
    expect(mockPrisma.cpApprovalPackage.create).toHaveBeenCalled();
  });

  it('processes queued package, renders PDF, and stores private artifacts', async () => {
    const pkg = await service.processPackage('pkg-1', 'Lead Approver');

    expect(pkg).toBeDefined();
    expect(mockPdfService.renderControlPlanPdf).toHaveBeenCalled();
    // 2 artifacts: approved_full_pdf and approval_manifest
    expect(mockPrisma.cpArtifact.create).toHaveBeenCalledTimes(2);
    expect(mockPrisma.cpApprovalPackage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pkg-1' },
        data: expect.objectContaining({ state: 'ready' }),
      }),
    );
  });

  it('finalizes package, locks revision, and creates Approval entity', async () => {
    const finalized = await service.finalizePackage('tenant-1', 'pkg-1');

    expect(finalized.state).toBe('finalized');
    expect(mockPrisma.documentRevision.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rev-1' },
        data: expect.objectContaining({
          status: 'approved',
          cpApprovalPackageId: 'pkg-1',
        }),
      }),
    );
    expect(mockPrisma.approval.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          revisionId: 'rev-1',
          approverId: 'approver-1',
          role: 'approver',
          decision: 'approved',
        }),
      }),
    );
  });
});
