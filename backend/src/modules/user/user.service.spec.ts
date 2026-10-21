import { UserService } from './user.service';

describe('UserService inactive archival and listing', () => {
  it('checkAndArchiveInactiveUsers correctly archives only users with all signals older than 15 days', async () => {
    let capturedWhere: any;
    const prisma = {
      user: {
        updateMany: jest.fn().mockImplementation(({ where }) => {
          capturedWhere = where;
          return Promise.resolve({ count: 1 });
        }),
      },
    };

    const service = new UserService(prisma as any);
    await service.checkAndArchiveInactiveUsers('tenant-123');

    expect(prisma.user.updateMany).toHaveBeenCalledTimes(1);
    expect(capturedWhere.tenantId).toBe('tenant-123');
    expect(capturedWhere.status).toBe('active');
    expect(capturedWhere.userRoles).toEqual({
      none: {
        role: { name: 'Admin' },
      },
    });

    // Both lastLoginAt and lastActivityAt must be null or older than cutoff, AND createdAt older than cutoff
    expect(capturedWhere.createdAt).toHaveProperty('lt');
    expect(capturedWhere.AND).toEqual([
      {
        OR: [
          { lastLoginAt: null },
          { lastLoginAt: { lt: expect.any(Date) } },
        ],
      },
      {
        OR: [
          { lastActivityAt: null },
          { lastActivityAt: { lt: expect.any(Date) } },
        ],
      },
    ]);
  });

  it('findAll includes lastActivityAt in select alongside lastLoginAt', async () => {
    let capturedSelect: any;
    const prisma = {
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockImplementation(({ select }) => {
          capturedSelect = select;
          return Promise.resolve([]);
        }),
      },
    };

    const service = new UserService(prisma as any);
    await service.findAll('tenant-123');

    expect(capturedSelect.lastLoginAt).toBe(true);
    expect(capturedSelect.lastActivityAt).toBe(true);
    expect(capturedSelect.email).toBe(true);
    expect(capturedSelect.status).toBe(true);
  });
});
