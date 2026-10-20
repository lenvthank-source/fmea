import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PfdService } from './pfd.service';
import type { PfdGraph } from './pfd-graph';

const graph = (): PfdGraph => ({ schemaVersion: 1, notation: 'manufacturing-v1', reviewStatus: 'reviewed', nodes: [
  { id: 'start', kind: 'start', x: 0, y: 0 }, { id: 'operation', kind: 'step', stepId: 'step', x: 0, y: 100 },
  { id: 'end', kind: 'end', x: 0, y: 200 },
], edges: [
  { id: 'in', source: 'start', target: 'operation', kind: 'normal', label: '' },
  { id: 'out', source: 'operation', target: 'end', kind: 'normal', label: '' },
] });
function fixture() {
  const revision = { id: 'revision', status: 'draft', lockedAt: null, pfdGraph: graph(), pfdGraphVersion: 5, document: { tenantId: 'tenant', projectId: 'project' } };
  const step = { id: 'step', revisionId: revision.id, processItemId: 'item', stepNumber: 'OP10', name: 'Inspect', stepType: 'inspection', linkedPfdStepId: null, revision };
  const prisma: any = {
    documentRevision: { findUnique: jest.fn().mockResolvedValue(revision), findFirst: jest.fn().mockResolvedValue(revision), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    processItem: { findFirst: jest.fn().mockResolvedValue({ id: 'item' }), create: jest.fn() },
    processStep: { findUnique: jest.fn().mockResolvedValue(step), findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(1), create: jest.fn().mockResolvedValue({ ...step, id: 'new-step' }), update: jest.fn().mockResolvedValue(step), updateMany: jest.fn().mockResolvedValue({ count: 0 }), delete: jest.fn().mockResolvedValue(step) },
    pfmeaRow: { count: jest.fn().mockResolvedValue(0) }, controlPlanRow: { count: jest.fn().mockResolvedValue(0) },
    project: { findFirst: jest.fn().mockResolvedValue({ id: 'project', createdById: 'user', createdAt: new Date(), status: 'active', uiSettings: {} }) },
  };
  prisma.$transaction = jest.fn(async (callback: any) => callback(prisma));
  const guard: any = { assertRevisionWritable: jest.fn().mockResolvedValue(undefined), assertRevisionWritableByStep: jest.fn().mockResolvedValue(undefined) };
  return { service: new PfdService(prisma, guard), prisma, guard, revision, step };
}
describe('PFD service graph and protected downstream integration', () => {
  it('rejects stale graph versions without a successful save', async () => {
    const { service, prisma } = fixture();
    prisma.processStep.findMany.mockResolvedValue([{ id: 'step', stepType: 'inspection' }]);
    prisma.documentRevision.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.saveGraph('tenant', 'revision', { version: 4, graph: { ...graph(), reviewStatus: 'draft' } })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.documentRevision.updateMany.mock.calls[0][0].where).toMatchObject({ pfdGraphVersion: 4, status: 'draft', lockedAt: null, document: { tenantId: 'tenant' } });
  });
  it('respects writable revision guards before saving or changing a step', async () => {
    const { service, prisma, guard } = fixture();
    guard.assertRevisionWritable.mockRejectedValue(new BadRequestException('locked'));
    await expect(service.saveGraph('tenant', 'revision', { version: 5, graph: graph() })).rejects.toThrow('locked');
    guard.assertRevisionWritableByStep.mockRejectedValue(new BadRequestException('locked'));
    await expect(service.updateStep('tenant', 'step', { name: 'Changed' })).rejects.toThrow('locked');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('keeps trial reference projects read-only and rejects other trial ownership', async () => {
    const { service, prisma } = fixture();
    prisma.project.findFirst.mockResolvedValue({ id: 'project', uiSettings: { isDemo: true } });
    await expect(service.assertActorAccess({ tenantId: 'tenant', sub: 'user', isGuest: true }, 'revision', true)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.assertActorAccess({ tenantId: 'tenant', sub: 'user', isGuest: true }, 'revision', false)).resolves.toBe(false);
    prisma.project.findFirst.mockResolvedValue({ id: 'project', createdById: 'other', createdAt: new Date(), status: 'active', uiSettings: {} });
    await expect(service.assertActorAccess({ tenantId: 'tenant', sub: 'user', isGuest: true }, 'revision', false)).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('permits only an owned active trial project to be writable', async () => {
    const { service } = fixture();
    await expect(service.assertActorAccess({ tenantId: 'tenant', sub: 'user', isGuest: true }, 'revision', true)).resolves.toBe(true);
  });
  it('does not orphan downstream or alter topology when deletion has analysis dependencies', async () => {
    const { service, prisma } = fixture();
    prisma.pfmeaRow.count.mockResolvedValue(1);
    await expect(service.removeStep('tenant', 'step')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.processStep.updateMany).not.toHaveBeenCalled();
    expect(prisma.processStep.delete).not.toHaveBeenCalled();
    expect(prisma.documentRevision.updateMany).not.toHaveBeenCalled();
  });
  it('deletes graph nodes/incident edges and scopes orphaning to tenant draft revisions', async () => {
    const { service, prisma } = fixture();
    await service.removeStep('tenant', 'step');
    expect(prisma.processStep.updateMany).toHaveBeenCalledWith({ where: { linkedPfdStepId: 'step', revision: { document: { tenantId: 'tenant' }, status: 'draft', lockedAt: null } }, data: { isOrphaned: true } });
    const update = prisma.documentRevision.updateMany.mock.calls[0][0];
    expect(update.data.pfdGraph.nodes.map((node: any) => node.id)).toEqual(['start', 'end']);
    expect(update.data.pfdGraph.edges).toEqual([]);
    expect(update.data.pfdGraph.reviewStatus).toBe('draft');
    expect(update.data.pfdGraphVersion).toEqual({ increment: 1 });
  });
  it('synchronizes metadata only to draft/unlocked tenant downstream steps and invalidates both graphs', async () => {
    const { service, prisma } = fixture();
    prisma.processStep.findMany.mockResolvedValue([{ revisionId: 'downstream' }]);
    await service.updateStep('tenant', 'step', { name: 'Updated inspection' });
    expect(prisma.processStep.updateMany.mock.calls[0][0].where).toEqual({ linkedPfdStepId: 'step', revision: { document: { tenantId: 'tenant' }, status: 'draft', lockedAt: null } });
    expect(prisma.documentRevision.updateMany).toHaveBeenCalledTimes(2);
    for (const [update] of prisma.documentRevision.updateMany.mock.calls) {
      expect(update.where).toMatchObject({ status: 'draft', lockedAt: null, document: { tenantId: 'tenant' } });
      expect(update.data.pfdGraph.reviewStatus).toBe('draft');
    }
  });
  it('invalidates a reviewed graph after creating an operation without inventing new edges', async () => {
    const { service, prisma } = fixture();
    await service.createStep('tenant', 'revision', { name: 'Pack', stepNumber: 'OP20', stepType: 'operation' });
    expect(prisma.processStep.create).toHaveBeenCalled();
    const changed = prisma.documentRevision.updateMany.mock.calls[0][0].data;
    expect(changed.pfdGraph.reviewStatus).toBe('draft');
    expect(changed.pfdGraph.edges).toEqual(graph().edges);
    expect(changed.pfdGraphVersion).toEqual({ increment: 1 });
  });
  it('increments topology version even when the legacy graph is null', async () => {
    const { service, prisma, revision } = fixture();
    prisma.documentRevision.findFirst.mockResolvedValue({ ...revision, pfdGraph: null });
    await service.createStep('tenant', 'revision', { name: 'Pack', stepType: 'operation' });
    expect(prisma.documentRevision.updateMany.mock.calls[0][0].data).toEqual({ pfdGraphVersion: { increment: 1 } });
  });
  it('invalidates once for a batch of operations', async () => {
    const { service, prisma } = fixture();
    await service.createStepsBatch('tenant', 'revision', [{ name: 'Pack', stepType: 'operation' }, { name: 'Ship', stepType: 'operation' }]);
    expect(prisma.processStep.create).toHaveBeenCalledTimes(2);
    expect(prisma.documentRevision.updateMany).toHaveBeenCalledTimes(1);
  });
  it('accepts topology after an import batch and update using their exact version increments', async () => {
    const { service, prisma, revision } = fixture();
    prisma.documentRevision.updateMany.mockImplementation(async ({where}: any) => {
      if (where.pfdGraphVersion !== revision.pfdGraphVersion) return {count:0};
      revision.pfdGraphVersion++;
      return {count:1};
    });
    await service.createStepsBatch('tenant','revision',[{name:'Pack',stepType:'operation'},{name:'Ship',stepType:'operation'}]);
    await service.updateStep('tenant','step',{name:'Inspect after pressing'});
    prisma.processStep.findMany.mockResolvedValue([{id:'step',stepType:'inspection'}]);
    await expect(service.saveGraph('tenant','revision',{version:7,graph:{...graph(),reviewStatus:'draft'}})).resolves.toMatchObject({version:8});
    await expect(service.saveGraph('tenant','revision',{version:7,graph:{...graph(),reviewStatus:'draft'}})).rejects.toBeInstanceOf(ConflictException);
  });
});
