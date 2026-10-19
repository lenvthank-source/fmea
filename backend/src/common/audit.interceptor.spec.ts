import { firstValueFrom, of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';

describe('AuditInterceptor project creation', () => {
  it('records the created entity ID returned by a collection POST', async () => {
    const audit = { createEntry: jest.fn().mockResolvedValue({}) };
    const interceptor = new AuditInterceptor({} as any, audit as any);
    const request = {
      method: 'POST',
      url: '/api/v1/projects',
      user: { sub: 'u1', tenantId: 't1' },
      headers: {},
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ statusCode: 201 }),
      }),
    };
    await firstValueFrom(
      interceptor.intercept(context as any, {
        handle: () => of({ id: 'created-project', name: 'Actual program' }),
      }),
    );
    expect(audit.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 't1',
        userId: 'u1',
        entityType: 'project',
        entityId: 'created-project',
        action: 'create',
      }),
    );
  });
});
