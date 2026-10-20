import { PfmeaRowService, strictImportedRating } from './pfmea-row.service';
describe('legacy analysis integrity', () => {
  it('rejects imported out-of-range and fractional ratings', () => {
    for (const value of [-1, 0, 11, 1.5, 'unknown'])
      expect(() => strictImportedRating(value, 2, 'severity')).toThrow(
        'Import row 2',
      );
    expect(strictImportedRating('', 1, 'severity')).toBeNull();
  });
  it('severity edits never look up or update other matching-narration rows', async () => {
    const row = {
      id: 'row',
      revisionId: 'revision',
      severity: 3,
      occurrence: 4,
      detection: 5,
      revision: { document: { tenantId: 't', type: 'PFMEA' } },
    };
    const db: any = {
      pfmeaRow: {
        findUnique: jest.fn().mockResolvedValue(row),
        findFirstOrThrow: jest.fn().mockResolvedValue(row),
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'row' }),
      },
      documentRevision: {
        findFirst: jest
          .fn()
          .mockResolvedValue({
            status: 'draft',
            lockedAt: null,
            document: {
              type: 'PFMEA',
              project: {
                id: 'p',
                createdById: 'u',
                status: 'active',
                createdAt: new Date(),
                uiSettings: {},
              },
            },
          }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { findFirst: jest.fn().mockResolvedValue({ isGuest: false }) },
    };
    db.$transaction = async (fn: any) => fn(db);
    const service = new PfmeaRowService(db, {
      assertRevisionWritableByRow: jest.fn(),
    } as any);
    await service.updateRow('t', 'row', { severity: 7 }, 'u');
    expect(db.pfmeaRow.findMany).not.toHaveBeenCalled();
    expect(db.pfmeaRow.update).toHaveBeenCalledTimes(1);
    expect(db.pfmeaRow.update.mock.calls[0][0].where).toEqual({ id: 'row' });
  });
});
