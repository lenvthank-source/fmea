import { RepositoryService } from './repository.service';
import { NotFoundException } from '@nestjs/common';

describe('Repository visibility and import integrity', () => {
  const owner = { sub: 'owner', tenantId: 'tenant-a', permissions: [] };
  const admin = {
    sub: 'admin',
    tenantId: 'tenant-a',
    permissions: ['admin.config'],
  };
  let prisma: any;
  let guard: any;
  let service: RepositoryService;
  beforeEach(() => {
    prisma = {
      workElementPackage: { findUnique: jest.fn(), findMany: jest.fn() },
      documentRevision: {
        findFirst: jest
          .fn()
          .mockResolvedValue({
            document: {
              project: {
                id: 'own',
                status: 'active',
                createdById: 'owner',
                createdAt: new Date(),
                uiSettings: {},
              },
            },
          }),
      },
      processStep: { findFirst: jest.fn() },
      $transaction: jest.fn(),
    };
    guard = {
      assertRevisionWritable: jest.fn(),
      assertRevisionWritableByStep: jest.fn(),
    };
    service = new RepositoryService(prisma, guard);
  });
  it('exposes approved shared packages but hides another tenant pending package', async () => {
    prisma.workElementPackage.findUnique.mockResolvedValue({
      id: 'p',
      status: 'approved',
      contributorTenantId: 'tenant-b',
    });
    expect((await service.getPackageById('p', owner)).status).toBe('approved');
    prisma.workElementPackage.findUnique.mockResolvedValue({
      id: 'p',
      status: 'pending',
      contributorTenantId: 'tenant-b',
      contributorId: 'other',
    });
    await expect(service.getPackageById('p', owner)).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.getPackageById('p', admin)).rejects.toThrow(
      NotFoundException,
    );
  });
  it('allows own pending detail but management requires matching tenant and permission', async () => {
    prisma.workElementPackage.findUnique.mockResolvedValue({
      id: 'p',
      status: 'pending',
      contributorTenantId: 'tenant-a',
      contributorId: 'owner',
    });
    await expect(service.getPackageById('p', owner)).resolves.toMatchObject({
      id: 'p',
    });
    await expect(service.getPackageById('p', owner, true)).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.getPackageById('p', admin, true),
    ).resolves.toMatchObject({ id: 'p' });
  });
  it('scopes pending queues and personal submissions to tenant', async () => {
    await service.listPendingForAdmin(admin);
    expect(prisma.workElementPackage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'pending', contributorTenantId: 'tenant-a' },
      }),
    );
    await service.listMySubmissions('owner', 'tenant-a');
    expect(prisma.workElementPackage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contributorId: 'owner', contributorTenantId: 'tenant-a' },
      }),
    );
  });
  it('rejects locked or cross-tenant destinations before any import writes', async () => {
    prisma.workElementPackage.findUnique.mockResolvedValue({
      id: 'p',
      status: 'approved',
    });
    guard.assertRevisionWritable.mockRejectedValue(
      new Error('Cannot modify a locked revision'),
    );
    await expect(
      service.importPackage(
        'p',
        { revisionId: 'locked', processStepId: 's' },
        owner,
      ),
    ).rejects.toThrow('locked');
    expect(prisma.processStep.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('checks linked master revision before writes', async () => {
    prisma.workElementPackage.findUnique.mockResolvedValue({
      id: 'p',
      status: 'approved',
    });
    prisma.processStep.findFirst.mockResolvedValue({
      id: 's',
      linkedPfdStepId: 'master',
    });
    prisma.processStep.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'master' });
    guard.assertRevisionWritableByStep.mockRejectedValue(
      new Error('Wrong tenant'),
    );
    await expect(
      service.importPackage(
        'p',
        { revisionId: 'r', processStepId: 's' },
        owner,
      ),
    ).rejects.toThrow('Wrong tenant');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('blocks trial imports into reference, expired, or another visitor project', async () => {
    prisma.workElementPackage.findUnique.mockResolvedValue({
      id: 'p',
      status: 'approved',
    });
    const guest = { ...owner, isGuest: true };
    for (const project of [
      {
        id: 'p',
        status: 'active',
        createdById: 'someone-else',
        createdAt: new Date(),
        uiSettings: {},
      },
      {
        id: 'p',
        status: 'active',
        createdById: 'owner',
        createdAt: new Date(),
        uiSettings: { expiresAt: '2000-01-01' },
      },
      {
        id: 'p',
        status: 'active',
        createdById: 'owner',
        createdAt: new Date(),
        uiSettings: { isDemo: true },
      },
    ]) {
      prisma.documentRevision.findFirst.mockResolvedValue({
        document: { project },
      });
      await expect(
        service.importPackage(
          'p',
          { revisionId: 'r', processStepId: 's' },
          guest,
        ),
      ).rejects.toThrow();
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
