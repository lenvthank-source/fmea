import { CpSourceAdapterService } from './cp-source-adapter.service';
import { CpSourceCaptureService } from './cp-source-capture.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CpSourceAdapterService & CpSourceCaptureService', () => {
  let adapter: CpSourceAdapterService;
  let captureService: CpSourceCaptureService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      documentRevision: {
        findUnique: jest.fn(),
      },
      pfmeaRow: {
        findMany: jest.fn(),
      },
      processStep: {
        findMany: jest.fn(),
      },
      cpSourceCapture: {
        create: jest.fn(),
      },
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([{ generation: 1 }]),
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };
    adapter = new CpSourceAdapterService(mockPrisma as unknown as PrismaService);
    captureService = new CpSourceCaptureService(
      mockPrisma as unknown as PrismaService,
      adapter,
    );
  });

  it('2x2x2 analysis records yield independent candidate sets without Cartesian duplication', async () => {
    mockPrisma.documentRevision.findUnique.mockResolvedValue({
      id: 'rev-pfmea-1',
      status: 'approved',
      document: {
        type: 'PFMEA',
        tenantId: 'tenant-1',
        projectId: 'proj-1',
      },
    });

    // 1 row with 2 characteristics, 2 controls, 2 requirements
    mockPrisma.pfmeaRow.findMany.mockResolvedValue([
      {
        id: 'row-1',
        rowNumber: 1,
        processStepId: 'step-10',
        processStep: { stepNumber: 10, name: 'CNC Milling' },
        characteristics: [
          { characteristic: { id: 'char-1', name: 'Width', type: 'Product', classification: 'CC', targetValue: '10mm', tolerance: '+/-0.1' } },
          { characteristic: { id: 'char-2', name: 'Depth', type: 'Product', classification: '', targetValue: '5mm', tolerance: '+/-0.05' } },
        ],
        controls: [
          { control: { id: 'ctrl-1', name: 'Tool check', type: 'Prevention', evaluationTechnique: 'Visual', sampleSize: '1', frequency: 'shift' } },
          { control: { id: 'ctrl-2', name: 'Caliper check', type: 'Detection', evaluationTechnique: 'Vernier', sampleSize: '5', frequency: 'hour' } },
        ],
        requirements: [
          { requirement: { id: 'req-1', name: 'Drawing Spec A', targetValue: '10', tolerance: '0.1', unit: 'mm' } },
          { requirement: { id: 'req-2', name: 'Drawing Spec B', targetValue: '5', tolerance: '0.05', unit: 'mm' } },
        ],
      },
    ]);

    const bundle = await adapter.loadSourceBundle('tenant-1', 'proj-1', 'rev-pfmea-1', mockPrisma);

    expect(bundle.operations).toHaveLength(1);
    expect(bundle.characteristics).toHaveLength(2);
    expect(bundle.controls).toHaveLength(2);
    expect(bundle.requirements).toHaveLength(2);
    // Crucial check: NOT 2x2x2 = 8 Cartesian adopted records!
    expect(bundle.controls).toHaveLength(2);
    expect(bundle.characteristics).toHaveLength(2);
    expect(bundle.sourceSetHash).toHaveLength(64);
  });

  it('preserves all rows even when row count is large (>125 rows)', async () => {
    mockPrisma.documentRevision.findUnique.mockResolvedValue({
      id: 'rev-pfmea-large',
      status: 'approved',
      document: {
        type: 'PFMEA',
        tenantId: 'tenant-1',
        projectId: 'proj-1',
      },
    });

    const mockRows = Array.from({ length: 130 }, (_, i) => ({
      id: `row-${i + 1}`,
      rowNumber: i + 1,
      processStepId: `step-${Math.floor(i / 10) * 10}`,
      processStep: { stepNumber: Math.floor(i / 10) * 10, name: `Op ${Math.floor(i / 10) * 10}` },
      characteristics: [],
      controls: [
        { control: { id: `ctrl-${i + 1}`, name: `Control ${i + 1}`, type: 'Prevention' } },
      ],
      requirements: [],
    }));

    mockPrisma.pfmeaRow.findMany.mockResolvedValue(mockRows);

    const bundle = await adapter.loadSourceBundle('tenant-1', 'proj-1', 'rev-pfmea-large', mockPrisma);

    expect(bundle.controls).toHaveLength(130);
    // Verifies last row is preserved
    expect(bundle.controls[129].id).toBe('ctrl-130');
  });

  it('captureSourceSnapshot acquires source fence and stores immutable snapshot', async () => {
    mockPrisma.documentRevision.findUnique.mockResolvedValue({
      id: 'rev-pfd-1',
      status: 'approved',
      document: {
        type: 'PFD',
        tenantId: 'tenant-1',
        projectId: 'proj-1',
      },
    });
    mockPrisma.processStep.findMany.mockResolvedValue([
      { id: 'step-1', stepNumber: 10, name: 'Receiving' },
    ]);
    mockPrisma.cpSourceCapture.create.mockResolvedValue({
      id: 'capture-uuid-1',
      capturedAt: new Date('2026-10-23T01:00:00Z'),
    });

    const result = await captureService.captureSourceSnapshot(
      'tenant-1',
      'proj-1',
      'cp-rev-1',
      'rev-pfd-1',
      'user-1',
      mockPrisma,
    );

    expect(result.captureId).toBe('capture-uuid-1');
    expect(result.snapshotHash).toHaveLength(64);
    expect(mockPrisma.$executeRaw).toHaveBeenCalled(); // source fence initialized
    expect(mockPrisma.cpSourceCapture.create).toHaveBeenCalled();
  });
});
