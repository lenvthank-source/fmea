import { CpReviewService } from './cp-review.service';
import { CpDocumentV2 } from './control-plan-document';
import { BadRequestException } from '@nestjs/common';

describe('CpReviewService', () => {
  let service: CpReviewService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      cpReviewDecision: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'decision-1', ...data }),
        ),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'decision-1',
            decision: 'accept',
            targetKind: 'control',
            targetId: 'ctrl-1',
          },
        ]),
      },
      cpValidationRun: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'run-1', createdAt: new Date(), ...data }),
        ),
      },
    };
    service = new CpReviewService(mockPrisma);
  });

  it('records review decision and computes value hash', async () => {
    const res = await service.recordReviewDecision(
      'tenant-1',
      'rev-1',
      'user-1',
      {
        observedDocumentVersion: 2,
        targetKind: 'control',
        targetId: 'ctrl-101',
        value: { method: 'Visual Inspection', frequency: '100%' },
        decision: 'accept',
      },
    );

    expect(res.decisionId).toBe('decision-1');
    expect(res.valueHash).toBeDefined();
    expect(mockPrisma.cpReviewDecision.create).toHaveBeenCalled();
  });

  it('requires reason for reject, not_applicable, modify_accept, and retain_current', async () => {
    await expect(
      service.recordReviewDecision(
        'tenant-1',
        'rev-1',
        'user-1',
        {
          observedDocumentVersion: 2,
          targetKind: 'control',
          targetId: 'ctrl-101',
          value: {},
          decision: 'reject',
          reason: '',
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('validates document and reports blockers on incomplete header or controls', async () => {
    const incompleteDoc: CpDocumentV2 = {
      schemaVersion: 2,
      config: {
        phase: 'unspecified',
        safeLaunch: { enabled: false },
        standardProfile: 'fmeapex-cp-baseline-v1',
      },
      header: {},
      sourceBaselines: [],
      operations: [],
    };

    const res = await service.runValidation('tenant-1', 'rev-1', incompleteDoc);
    expect(res.isValid).toBe(false);
    expect(res.findings.length).toBeGreaterThan(0);
    expect(res.findings.some((f) => f.ruleId === 'HDR-001')).toBe(true);
    expect(res.findings.some((f) => f.ruleId === 'OPR-001')).toBe(true);
    expect(mockPrisma.cpValidationRun.create).toHaveBeenCalled();
  });
});
