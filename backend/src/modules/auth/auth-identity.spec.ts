import { AuthService } from './auth.service';

describe('stable public session identity', () => {
  const makeService = (isGuest = true) => {
    const stored = { id: 'user-1', tenantId: 'tenant-1', email: 'original@example.test', name: isGuest ? 'Guest-original' : 'Chosen Name', publicHandle: isGuest ? 'paper-ball' : null, isGuest, status: 'active', lastActivityAt: new Date(), userRoles: [] };
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(stored), update: jest.fn().mockResolvedValue(stored) } };
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: stored.id, tenantId: stored.tenantId }), signAsync: jest.fn().mockResolvedValue('token') };
    const service = new AuthService(prisma as any, jwt as any, { get: jest.fn() } as any);
    return { service, stored, prisma, jwt };
  };
  it('returns the same handle on repeated /me requests without changing legacy identity fields', async () => {
    const { service, prisma } = makeService();
    const first = await service.getMe('tenant-1', 'user-1');
    const second = await service.getMe('tenant-1', 'user-1');
    expect(first.publicHandle).toBe('paper-ball');
    expect(second.publicHandle).toBe(first.publicHandle);
    expect(first.name).toBe('Guest-original');
    expect(first.email).toBe('original@example.test');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('carries the stored handle in refreshed access tokens', async () => {
    const { service, jwt } = makeService();
    await service.refresh('refresh-token');
    expect(jwt.signAsync.mock.calls[0][0]).toMatchObject({ sub: 'user-1', publicHandle: 'paper-ball', isGuest: true });
  });
  it('preserves registered display names without allocating trial handles', async () => {
    const { service } = makeService(false);
    expect(await service.getMe('tenant-1', 'user-1')).toMatchObject({ name: 'Chosen Name', publicHandle: null, isGuest: false });
  });
  it('does not expose another tenant account', async () => {
    const { service } = makeService();
    await expect(service.getMe('other-tenant', 'user-1')).rejects.toThrow('User not found');
  });
});
