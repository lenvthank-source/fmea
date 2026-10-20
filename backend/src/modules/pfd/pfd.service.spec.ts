import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PfdService } from './pfd.service';
import type { PfdGraph } from './pfd-graph';
import symbols from './pfd-symbols.json';

const engineering = symbols.find((s) => s.kind === 'engineering')!.id;
const graph = (): PfdGraph => ({
  schemaVersion: 2,
  notation: 'manufacturing-v1',
  displayMode: 'manufacturing',
  layoutDirection: 'horizontal',
  reviewStatus: 'draft',
  nodes: [
    { id: 'start', kind: 'start', x: 0, y: 0 },
    { id: 'operation', kind: 'step', stepId: 'step', x: 160, y: 0 },
    { id: 'end', kind: 'end', x: 320, y: 0 },
  ],
  edges: [
    {
      id: 'in',
      source: 'start',
      target: 'operation',
      kind: 'normal',
      label: '',
      sourcePort: 'east',
      targetPort: 'west',
      points: [
        { x: 48, y: 0 },
        { x: 112, y: 0 },
      ],
    },
    {
      id: 'out',
      source: 'operation',
      target: 'end',
      kind: 'normal',
      label: '',
    },
  ],
});
function fixture() {
  const project = {
    id: 'project',
    createdById: 'user',
    createdAt: new Date(),
    status: 'active',
    uiSettings: {},
  };
  const revision = {
    id: 'revision',
    status: 'draft',
    lockedAt: null,
    pfdGraph: graph(),
    pfdGraphVersion: 5,
    document: {
      type: 'PFD',
      tenantId: 'tenant',
      projectId: 'project',
      project,
    },
  };
  const step = {
    id: 'step',
    revisionId: revision.id,
    processItemId: 'item',
    sequenceOrder: 4,
    stepNumber: 'OP10',
    name: 'Inspect',
    stepType: 'inspection',
    manufacturingSymbolId: null,
    engineeringSymbolId: null,
    linkedPfdStepId: null,
    revision,
  };
  const prisma: any = {
    user: {
      findFirst: jest
        .fn()
        .mockResolvedValue({
          isGuest: false,
          status: 'active',
          guestExpiresAt: null,
        }),
    },
    documentRevision: {
      findFirst: jest.fn().mockResolvedValue(revision),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    processItem: {
      findFirst: jest.fn().mockResolvedValue({ id: 'item' }),
      create: jest.fn(),
    },
    processStep: {
      findFirst: jest.fn().mockResolvedValue(step),
      findFirstOrThrow: jest.fn().mockResolvedValue(step),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ ...step, id: 'new-step' }),
      update: jest.fn().mockResolvedValue(step),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      delete: jest.fn().mockResolvedValue(step),
    },
    pfmeaRow: { count: jest.fn().mockResolvedValue(0) },
    controlPlanRow: { count: jest.fn().mockResolvedValue(0) },
    project: { findFirst: jest.fn().mockResolvedValue(project) },
  };
  prisma.$transaction = jest.fn(async (callback: any) => callback(prisma));
  return {
    service: new PfdService(prisma, {} as any),
    prisma,
    revision,
    step,
    project,
  };
}
const graphWrites = (prisma: any) =>
  prisma.documentRevision.updateMany.mock.calls
    .map((call: any[]) => call[0])
    .filter((update: any) => update.data.pfdGraphVersion?.increment === 1);

describe('PFD authenticated transactional mutations', () => {
  it('requires an actual active actor, even when invoked without the controller', async () => {
    const { service, prisma } = fixture();
    await expect(
      service.createStep('tenant', 'revision', {
        name: 'Pack',
        stepType: 'operation',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    prisma.user.findFirst.mockResolvedValue({
      status: 'disabled',
      isGuest: false,
    });
    await expect(
      service.getGraph('tenant', 'revision', 'user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.processStep.create).not.toHaveBeenCalled();
  });
  it('rejects a foreign revision through a tenant-scoped query', async () => {
    const { service, prisma } = fixture();
    prisma.documentRevision.findFirst.mockResolvedValue(null);
    await expect(
      service.getGraph('tenant', 'foreign', 'user'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.documentRevision.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'foreign', document: { tenantId: 'tenant' } },
      }),
    );
  });
  it('rejects non-PFD graph writes and legacy DFMEA operation writes', async () => {
    const { service, revision } = fixture();
    revision.document.type = 'PFMEA';
    await expect(
      service.saveGraph(
        'tenant',
        'revision',
        { version: 5, graph: graph() },
        'user',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    revision.document.type = 'DFMEA';
    await expect(
      service.createStep(
        'tenant',
        'revision',
        { name: 'Design', stepType: 'operation' },
        'user',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rechecks database guest state and protects reference projects without a guest claim', async () => {
    const { service, prisma, project } = fixture();
    prisma.user.findFirst.mockResolvedValue({
      status: 'active',
      isGuest: true,
    });
    project.uiSettings = { isDemo: true };
    await expect(
      service.getGraph('tenant', 'revision', 'user'),
    ).resolves.toMatchObject({ writable: false });
    await expect(
      service.createStep(
        'tenant',
        'revision',
        { name: 'Pack', stepType: 'operation' },
        'user',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('protects expired and other users trial projects inside the mutation transaction', async () => {
    const { service, prisma, project } = fixture();
    prisma.user.findFirst.mockResolvedValue({
      isGuest: true,
      status: 'active',
      guestExpiresAt: new Date(0),
    });
    await expect(
      service.reorderSteps('tenant', 'revision', [], 'user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    prisma.user.findFirst.mockResolvedValue({
      isGuest: true,
      status: 'active',
    });
    project.createdById = 'other';
    await expect(
      service.removeStep('tenant', 'step', 'user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('protects archived projects and locks the revision inside the transaction', async () => {
    const { service, prisma, project } = fixture();
    project.status = 'archived';
    await expect(
      service.createStepsBatch(
        'tenant',
        'revision',
        [{ name: 'Pack', stepType: 'operation' }],
        'user',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    project.status = 'active';
    prisma.documentRevision.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.updateStep('tenant', 'step', { name: 'Changed' }, 'user'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.processStep.update).not.toHaveBeenCalled();
  });
  it('returns explicit access with absent topology, including protected revisions', async () => {
    const { service, revision } = fixture();
    revision.pfdGraph = null as any;
    revision.status = 'approved';
    revision.lockedAt = new Date() as any;
    await expect(
      service.getGraph('tenant', 'revision', 'user'),
    ).resolves.toEqual({ graph: null, version: 5, writable: false });
  });
  it('rejects stale graph saves after obtaining the revision lock', async () => {
    const { service, prisma } = fixture();
    prisma.processStep.findMany.mockResolvedValue([
      { id: 'step', stepType: 'inspection' },
    ]);
    prisma.documentRevision.updateMany.mockImplementation(
      async ({ where }: any) => ({
        count: where.pfdGraphVersion === undefined ? 1 : 0,
      }),
    );
    await expect(
      service.saveGraph(
        'tenant',
        'revision',
        { version: 4, graph: graph() },
        'user',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.documentRevision.updateMany.mock.calls[0][0].data).toEqual({
      pfdGraphVersion: { increment: 0 },
    });
    expect(graphWrites(prisma)[0].where).toMatchObject({
      pfdGraphVersion: 4,
      status: 'draft',
      lockedAt: null,
      document: { tenantId: 'tenant' },
    });
  });
  it('saves v2 geometry without changing authored routes', async () => {
    const { service, prisma } = fixture();
    prisma.processStep.findMany.mockResolvedValue([
      { id: 'step', stepType: 'inspection' },
    ]);
    await expect(
      service.saveGraph(
        'tenant',
        'revision',
        { version: 5, graph: graph() },
        'user',
      ),
    ).resolves.toMatchObject({ version: 6 });
    expect(graphWrites(prisma)[0].data.pfdGraph.edges[0].points).toEqual(
      graph().edges[0].points,
    );
  });
  it('rejects unknown/cross-library symbols and incompatible manufacturing selections', async () => {
    const { service, prisma } = fixture();
    for (const dto of [
      { manufacturingSymbolId: 'missing' },
      { manufacturingSymbolId: engineering },
      { engineeringSymbolId: 'manufacturing.operation' },
      { manufacturingSymbolId: 'manufacturing.inspection' },
    ]) {
      await expect(
        service.createStep(
          'tenant',
          'revision',
          { name: 'Pack', stepType: 'operation', ...dto },
          'user',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    expect(prisma.processStep.create).not.toHaveBeenCalled();
  });
  it('persists selected symbols while keeping equipment independent of activity meaning', async () => {
    const { service, prisma } = fixture();
    await service.createStep(
      'tenant',
      'revision',
      {
        name: 'Pack',
        stepType: 'operation',
        manufacturingSymbolId: 'manufacturing.operation',
        engineeringSymbolId: engineering,
      },
      'user',
    );
    expect(prisma.processStep.create.mock.calls[0][0].data).toMatchObject({
      stepType: 'operation',
      manufacturingSymbolId: 'manufacturing.operation',
      engineeringSymbolId: engineering,
      sequenceOrder: 5,
    });
    expect(graphWrites(prisma)[0].data.pfdGraph).toMatchObject({
      schemaVersion: 2,
      reviewStatus: 'draft',
      edges: graph().edges,
    });
  });
  it('clears explicit selections with null and does not silently rewrite stepType', async () => {
    const { service, prisma } = fixture();
    await service.updateStep(
      'tenant',
      'step',
      { engineeringSymbolId: null, manufacturingSymbolId: null },
      'user',
    );
    expect(prisma.processStep.update.mock.calls[0][0].data).toMatchObject({
      engineeringSymbolId: null,
      manufacturingSymbolId: null,
      stepType: undefined,
    });
  });
  it('rejects a step type change if the explicitly selected activity symbol would become misleading', async () => {
    const { service, step } = fixture();
    step.manufacturingSymbolId = 'manufacturing.inspection' as any;
    await expect(
      service.updateStep('tenant', 'step', { stepType: 'operation' }, 'user'),
    ).rejects.toThrow('must match');
  });
  it('checks every batch process-item owner rather than only its first entry', async () => {
    const { service, prisma } = fixture();
    prisma.processItem.findFirst.mockImplementation(async ({ where }: any) =>
      where.id === 'foreign' ? null : { id: 'item' },
    );
    await expect(
      service.createStepsBatch(
        'tenant',
        'revision',
        [
          { name: 'Pack', stepType: 'operation' },
          { name: 'Ship', stepType: 'operation', processItemId: 'foreign' },
        ],
        'user',
      ),
    ).rejects.toThrow('must belong');
    expect(prisma.processStep.create).not.toHaveBeenCalled();
  });
  it('rejects invalid activity types in raw batch payloads even when no symbol is selected', async () => {
    const { service, prisma } = fixture();
    await expect(
      service.createStepsBatch(
        'tenant',
        'revision',
        [{ name: 'Pack', stepType: 'not-a-process-activity' }],
        'user',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.processStep.create).not.toHaveBeenCalled();
  });
  it('persists batch symbols and invalidates topology only once', async () => {
    const { service, prisma } = fixture();
    await service.createStepsBatch(
      'tenant',
      'revision',
      [
        {
          name: 'Pack',
          stepType: 'operation',
          engineeringSymbolId: engineering,
        },
        {
          name: 'Ship',
          stepType: 'transport',
          manufacturingSymbolId: 'manufacturing.transport',
        },
      ],
      'user',
    );
    expect(prisma.processStep.create).toHaveBeenCalledTimes(2);
    expect(graphWrites(prisma)).toHaveLength(1);
    expect(prisma.processStep.create.mock.calls[1][0].data).toMatchObject({
      manufacturingSymbolId: 'manufacturing.transport',
    });
  });
  it('reorders exact membership transactionally, invalidates version and preserves routes', async () => {
    const { service, prisma } = fixture();
    prisma.processStep.findMany.mockResolvedValue([{ id: 'step' }]);
    await expect(
      service.reorderSteps('tenant', 'revision', ['foreign'], 'user'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.processStep.update).not.toHaveBeenCalled();
    await service.reorderSteps('tenant', 'revision', ['step'], 'user');
    expect(prisma.processStep.update).toHaveBeenCalledWith({
      where: { id: 'step' },
      data: { sequenceOrder: 1 },
    });
    expect(graphWrites(prisma)[0].data.pfdGraph.edges).toEqual(graph().edges);
  });
  it('does not orphan downstream or delete topology when analysis dependencies exist', async () => {
    const { service, prisma } = fixture();
    prisma.pfmeaRow.count.mockResolvedValue(1);
    await expect(
      service.removeStep('tenant', 'step', 'user'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.processStep.updateMany).not.toHaveBeenCalled();
    expect(prisma.processStep.delete).not.toHaveBeenCalled();
    expect(graphWrites(prisma)).toHaveLength(0);
  });
  it('deletes incident routes in v2 and scopes downstream orphaning to the same program draft', async () => {
    const { service, prisma } = fixture();
    await service.removeStep('tenant', 'step', 'user');
    expect(prisma.processStep.updateMany).toHaveBeenCalledWith({
      where: {
        linkedPfdStepId: 'step',
        revision: {
          document: { tenantId: 'tenant', projectId: 'project' },
          status: 'draft',
          lockedAt: null,
        },
      },
      data: { isOrphaned: true },
    });
    expect(
      graphWrites(prisma)[0].data.pfdGraph.nodes.map((node: any) => node.id),
    ).toEqual(['start', 'end']);
    expect(graphWrites(prisma)[0].data.pfdGraph.edges).toEqual([]);
  });
  it('rejects cross-program PFD imports before reading its operations', async () => {
    const { service, prisma, revision } = fixture();
    prisma.documentRevision.findFirst.mockImplementation(
      async ({ where }: any) =>
        where.id === 'source'
          ? {
              ...revision,
              document: { ...revision.document, projectId: 'other' },
            }
          : revision,
    );
    await expect(
      service.importSteps('tenant', 'revision', 'source', 'user'),
    ).rejects.toThrow('same program');
    expect(prisma.processStep.create).not.toHaveBeenCalled();
  });
  it('imports source symbols and remaps native v2 geometry into an empty PFD draft', async () => {
    const { service, prisma, revision, step } = fixture();
    const source = { ...revision, id: 'source', pfdGraph: graph() };
    revision.pfdGraph = null as any;
    prisma.documentRevision.findFirst.mockImplementation(
      async ({ where }: any) => (where.id === 'source' ? source : revision),
    );
    prisma.processStep.findMany.mockImplementation(async ({ where }: any) =>
      where.revisionId === 'source'
        ? [
            {
              ...step,
              manufacturingSymbolId: 'manufacturing.inspection',
              engineeringSymbolId: engineering,
            },
          ]
        : [],
    );
    prisma.processStep.findFirst.mockResolvedValue(null);
    await expect(
      service.importSteps('tenant', 'revision', 'source', 'user'),
    ).resolves.toEqual({ importedCount: 1 });
    expect(prisma.processStep.create.mock.calls[0][0].data).toMatchObject({
      manufacturingSymbolId: 'manufacturing.inspection',
      engineeringSymbolId: engineering,
      linkedPfdStepId: 'step',
    });
    const copied = prisma.documentRevision.updateMany.mock.calls
      .map((call: any[]) => call[0].data.pfdGraph)
      .find((value: any) =>
        value?.nodes?.some((node: any) => node.stepId === 'new-step'),
      );
    expect(copied).toMatchObject({
      schemaVersion: 2,
      reviewStatus: 'draft',
      edges: graph().edges,
    });
  });
});
