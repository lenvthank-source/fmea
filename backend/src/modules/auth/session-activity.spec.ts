import { recordUserSession, recordUserActivity } from './session-activity';

describe('session-activity monotonic recording', () => {
  it('updates both lastLoginAt and lastActivityAt when both are null', async () => {
    const updateManyMock = jest.fn().mockResolvedValue({ count: 1 });
    const client = { user: { updateMany: updateManyMock } };
    const now = new Date('2026-10-21T12:00:00Z');

    const result = await recordUserSession(client, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      timestamp: now,
    });

    expect(result.loginUpdated).toBe(true);
    expect(result.activityUpdated).toBe(true);
    expect(updateManyMock).toHaveBeenCalledTimes(2);

    // Verify login query predicate
    expect(updateManyMock.mock.calls[0][0]).toEqual({
      where: {
        id: 'user-1',
        tenantId: 'tenant-1',
        status: 'active',
        OR: [{ lastLoginAt: null }, { lastLoginAt: { lt: now } }],
      },
      data: { lastLoginAt: now },
    });

    // Verify activity query predicate
    expect(updateManyMock.mock.calls[1][0]).toEqual({
      where: {
        id: 'user-1',
        tenantId: 'tenant-1',
        status: 'active',
        OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: now } }],
      },
      data: { lastActivityAt: now },
    });
  });

  it('reports zero updates if stored timestamp is already newer (monotonicity check)', async () => {
    const updateManyMock = jest.fn().mockResolvedValue({ count: 0 });
    const client = { user: { updateMany: updateManyMock } };
    const olderTime = new Date('2026-10-20T10:00:00Z');

    const result = await recordUserSession(client, {
      userId: 'user-1',
      tenantId: 'tenant-1',
      timestamp: olderTime,
    });

    expect(result.loginUpdated).toBe(false);
    expect(result.activityUpdated).toBe(false);
  });

  it('recordUserActivity updates lastActivityAt only without modifying lastLoginAt', async () => {
    const updateManyMock = jest.fn().mockResolvedValue({ count: 1 });
    const client = { user: { updateMany: updateManyMock } };
    const now = new Date('2026-10-21T15:30:00Z');

    const result = await recordUserActivity(client, {
      userId: 'user-2',
      tenantId: 'tenant-1',
      timestamp: now,
    });

    expect(result.activityUpdated).toBe(true);
    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(updateManyMock.mock.calls[0][0]).toEqual({
      where: {
        id: 'user-2',
        tenantId: 'tenant-1',
        status: 'active',
        OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: now } }],
      },
      data: { lastActivityAt: now },
    });
  });
});
