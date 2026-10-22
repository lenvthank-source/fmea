import { CpLineageService } from './cp-lineage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CpDocumentV2 } from './control-plan-document';

describe('CpLineageService', () => {
  let service: CpLineageService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      operationVersionBinding: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      operationLineage: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      operationLineageRelation: {
        create: jest.fn(),
      },
    };
    service = new CpLineageService(mockPrisma as unknown as PrismaService);
  });

  describe('getOrCreateLineage', () => {
    it('returns existing lineage if step is already bound', async () => {
      mockPrisma.operationVersionBinding.findUnique.mockResolvedValue({
        id: 'bind-1',
        lineageId: 'lin-1',
        tenantId: 'tenant-1',
        projectId: 'proj-1',
      });

      const res = await service.getOrCreateLineage(
        'tenant-1',
        'proj-1',
        'rev-1',
        'step-1',
      );

      expect(res.lineageId).toBe('lin-1');
      expect(res.isNew).toBe(false);
      expect(mockPrisma.operationLineage.create).not.toHaveBeenCalled();
    });

    it('creates new lineage and binding if step is unbound', async () => {
      mockPrisma.operationVersionBinding.findUnique.mockResolvedValue(null);
      mockPrisma.operationLineage.create.mockResolvedValue({ id: 'lin-new' });
      mockPrisma.operationVersionBinding.create.mockResolvedValue({ id: 'bind-new' });

      const res = await service.getOrCreateLineage(
        'tenant-1',
        'proj-1',
        'rev-1',
        'step-new',
        'user-1',
      );

      expect(res.lineageId).toBe('lin-new');
      expect(res.isNew).toBe(true);
      expect(mockPrisma.operationLineage.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          projectId: 'proj-1',
          createdById: 'user-1',
        },
      });
      expect(mockPrisma.operationVersionBinding.create).toHaveBeenCalled();
    });
  });

  describe('recordLineageRelation', () => {
    it('detects and rejects cyclical relationships', async () => {
      await expect(
        service.recordLineageRelation('tenant-1', 'proj-1', {
          groupId: 'grp-1',
          predecessorIds: ['lin-A', 'lin-B'],
          successorIds: ['lin-B', 'lin-C'], // lin-B is in both!
          kind: 'split',
          actorId: 'user-1',
        }),
      ).rejects.toThrow('Cycle detected');
    });

    it('creates relation records when valid', async () => {
      mockPrisma.operationLineage.findMany.mockResolvedValue([
        { id: 'lin-A' },
        { id: 'lin-B' },
      ]);
      mockPrisma.operationLineageRelation.create.mockResolvedValue({ id: 'rel-1' });

      await service.recordLineageRelation('tenant-1', 'proj-1', {
        groupId: 'grp-1',
        predecessorIds: ['lin-A'],
        successorIds: ['lin-B'],
        kind: 'split',
        actorId: 'user-1',
      });

      expect(mockPrisma.operationLineageRelation.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          projectId: 'proj-1',
          groupId: 'grp-1',
          predecessorId: 'lin-A',
          successorId: 'lin-B',
          kind: 'split',
          actorId: 'user-1',
          reason: undefined,
        },
      });
    });
  });

  describe('cloneV2ControlPlan', () => {
    it('generates fresh UUIDs while preserving logical lineage and resetting reviews', () => {
      const v2: CpDocumentV2 = {
        schemaVersion: 2,
        config: {
          phase: 'production',
          safeLaunch: { enabled: false, entryCriteria: '', exitCriteria: '', additionalControls: '' },
          standardProfile: 'baseline',
          customerRequirements: '',
          sourceExceptionJustification: '',
        },
        header: { plan: 'CP-1' },
        sourceBaselines: [{ revisionId: 'r1', type: 'PFD' }],
        operations: [
          {
            id: 'old-op-id',
            lineageId: 'lin-100',
            order: 1,
            number: '10',
            name: 'Milling',
            applicability: 'Approved by QE',
            resources: [
              { id: 'res-1', kind: 'manufacturing_equipment', text: 'Mill #1' },
            ],
            characteristics: [
              {
                id: 'char-1',
                number: '1',
                kind: 'product',
                name: 'Slot Width',
                classification: 'CC',
                criteria: { kind: 'numeric', specification: '10mm', tolerance: '+/-0.1' },
                controls: [
                  {
                    id: 'ctrl-1',
                    controlType: 'detection',
                    method: 'Caliper',
                    evaluationMethod: 'Digital',
                    measurementEquipment: 'CAL-01',
                    executionRule: { mode: 'count', sampleSize: 5, frequency: '1/hr' },
                    reaction: { trigger: 'OOS', plan: 'Stop', responsible: 'Lead' },
                    responsibility: 'Op',
                    recordReference: 'LOG-1',
                    implementation: { status: 'implemented', reportedAt: '2026-10-23' },
                  },
                ],
              },
            ],
          },
        ],
      };

      const cloned = service.cloneV2ControlPlan(v2, { resetReviews: true });

      expect(cloned.operations).toHaveLength(1);
      const clonedOp = cloned.operations[0];

      // New ID generated
      expect(clonedOp.id).not.toBe('old-op-id');
      // Lineage preserved
      expect(clonedOp.lineageId).toBe('lin-100');
      // Applicability reset
      expect(clonedOp.applicability).toBe('');

      // Resource new ID
      expect(clonedOp.resources[0].id).not.toBe('res-1');
      expect(clonedOp.resources[0].text).toBe('Mill #1');

      // Characteristic and control new IDs
      const clonedChar = clonedOp.characteristics[0];
      expect(clonedChar.id).not.toBe('char-1');
      const clonedCtrl = clonedChar.controls[0];
      expect(clonedCtrl.id).not.toBe('ctrl-1');
      // Implementation review reset
      expect(clonedCtrl.implementation).toBeUndefined();
      // Core criteria and methods preserved
      expect(clonedChar.criteria.specification).toBe('10mm');
      expect(clonedCtrl.method).toBe('Caliper');
    });
  });
});
