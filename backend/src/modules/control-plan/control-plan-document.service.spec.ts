import { ControlPlanDocumentService } from './control-plan-document.service';
import { emptyCpDocument, blankCpLine } from './control-plan-document';
import { ConflictException } from '@nestjs/common';
const actor = { tenantId: 'tenant', userId: 'actor' };
describe('CP persistence and source safety', () => {
  it('translates serializable write conflicts into retryable HTTP409', async () => {
    const prisma = {
      $transaction: jest.fn().mockRejectedValue({ code: 'P2034' }),
    };
    const service = new ControlPlanDocumentService(prisma as never);
    await expect(
      service.save(actor, 'id', {
        expectedVersion: 0,
        document: emptyCpDocument(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('translates first-save unique races into HTTP409', async () => {
    const prisma = {
      $transaction: jest.fn().mockRejectedValue({ code: 'P2002' }),
    };
    const service = new ControlPlanDocumentService(prisma as never);
    await expect(
      service.save(actor, 'id', {
        expectedVersion: 0,
        document: emptyCpDocument(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects malformed references before calling database UUID operations', async () => {
    const service = new ControlPlanDocumentService({} as never);
    const d = emptyCpDocument();
    d.lines = [blankCpLine('a')];
    d.lines[0].operationId = 'not-a-uuid';
    await expect(
      (service as any).validateLinks({}, actor, 'id', d),
    ).rejects.toThrow('reference identifier');
  });
  it('never converts unrelated storage failure into success or a misleading conflict', async () => {
    const problem = new Error('Storage unavailable'),
      service = new ControlPlanDocumentService({
        $transaction: jest.fn().mockRejectedValue(problem),
      } as never);
    await expect(
      service.save(actor, 'id', {
        expectedVersion: 0,
        document: emptyCpDocument(),
      }),
    ).rejects.toBe(problem);
  });
});
import { ControlPlanDocumentController } from './control-plan-document.controller';
describe('CP capability projection', () => {
  it('projects edit and fork as disabled for view-only permissions', async () => {
    const controller = new ControlPlanDocumentController({
      get: jest.fn().mockResolvedValue({ writable: true, forkable: true }),
    } as never);
    const result = await controller.get(
      {
        user: {
          tenantId: 't',
          sub: 'u',
          roles: ['Viewer'],
          permissions: ['cp.view'],
        },
      } as never,
      'id',
    );
    expect(result.writable).toBe(false);
    expect(result.forkable).toBe(false);
  });
  it('retains archive and reference restrictions even with edit permission', async () => {
    const controller = new ControlPlanDocumentController({
      get: jest.fn().mockResolvedValue({ writable: false, forkable: false }),
    } as never);
    const result = await controller.get(
      {
        user: {
          tenantId: 't',
          sub: 'u',
          roles: ['Engineer'],
          permissions: ['cp.edit'],
        },
      } as never,
      'id',
    );
    expect(result.writable).toBe(false);
    expect(result.forkable).toBe(false);
  });
  it('denies new phase revisions for non-writable projects before writes', async () => {
    const prisma = { $transaction: jest.fn(async (work: any) => work({})) };
    const service = new ControlPlanDocumentService(prisma as never);
    jest
      .spyOn(service as any, 'context')
      .mockResolvedValue({ projectWritable: false });
    await expect(
      service.fork(actor, 'id', {
        revisionNumber: '2.0',
        phase: 'production',
        summary: '',
      }),
    ).rejects.toThrow('does not permit');
  });
});

describe('legacy control-plan data isolation', () => {
  it('refuses historical foreign-operation relations before exposing names', async () => {
    const db = {
      controlPlanDocument: { findUnique: jest.fn().mockResolvedValue(null) },
      documentRevision: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          revisionNumber: '1.0',
          document: { tenantId: 'own', projectId: 'program', project: {} },
        }),
      },
      controlPlanRow: {
        findMany: jest.fn().mockResolvedValue([
          {
            processStep: {
              revision: {
                document: { tenantId: 'foreign', projectId: 'other' },
              },
            },
            characteristic: null,
          },
        ]),
      },
    };
    const service = new ControlPlanDocumentService(db as never);
    await expect((service as any).load(db, 'id')).rejects.toThrow(
      'invalid program references',
    );
  });
});
import * as engineeringAccess from '../../common/engineering-access';
import { randomUUID } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';
describe('large Control Plan transaction and source performance', () => {
  afterEach(() => jest.restoreAllMocks());
  it('bounds save/apply and fork transactions at30seconds with10second acquisition', async () => {
    const prisma = {
        $transaction: jest.fn().mockRejectedValue({ code: 'P2034' }),
      },
      service = new ControlPlanDocumentService(prisma as never);
    await expect(
      service.save(actor, 'id', {
        expectedVersion: 0,
        document: emptyCpDocument(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
      timeout: 30000,
      maxWait: 10000,
    });
    await expect(
      service.fork(actor, 'id', {
        revisionNumber: '2.0',
        phase: 'production',
        summary: '',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
      timeout: 30000,
      maxWait: 10000,
    });
  });
  it('reports exhausted transaction as retriable503 without silently losing local edits', async () => {
    const service = new ControlPlanDocumentService({
      $transaction: jest.fn().mockRejectedValue({ code: 'P2028' }),
    } as never);
    await expect(
      service.save(actor, 'id', {
        expectedVersion: 0,
        document: emptyCpDocument(),
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
  it('validates105mapped lines with one source authorization and batched operations/rows', async () => {
    const revisionId = randomUUID(),
      operationId = randomUUID(),
      rowId = randomUUID(),
      characteristicId = randomUUID(),
      controls = Array.from({ length: 105 }, () => randomUUID());
    const access = jest
      .spyOn(engineeringAccess, 'assertEngineeringRevisionAccess')
      .mockResolvedValue({
        document: { projectId: 'project', type: 'PFMEA' },
      } as never);
    const db = {
      documentRevision: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ document: { projectId: 'project' } }),
      },
      processStep: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: operationId, revisionId }]),
      },
      characteristic: { count: jest.fn().mockResolvedValue(1) },
      pfmeaRow: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: rowId,
            revisionId,
            processStepId: operationId,
            controls: controls.map((controlId) => ({ controlId })),
            characteristics: [{ characteristicId }],
            requirements: [],
          },
        ]),
      },
    };
    const document = emptyCpDocument();
    document.sourceBaselines = [{ revisionId, type: 'PFMEA' }];
    document.lines = controls.map((controlId, index) => ({
      ...blankCpLine(`line-${index}`),
      operationId,
      characteristicId,
      source: {
        key: `source-${controlId}`,
        revisionId,
        pfmeaRowId: rowId,
        controlId,
        characteristicId,
        snapshot: {},
      },
    }));
    await expect(
      (new ControlPlanDocumentService(db as never) as any).validateLinks(
        db,
        actor,
        'target',
        document,
      ),
    ).resolves.toBeUndefined();
    expect(access).toHaveBeenCalledTimes(1);
    expect(db.processStep.findMany).toHaveBeenCalledTimes(1);
    expect(db.pfmeaRow.findMany).toHaveBeenCalledTimes(1);
    expect(db.characteristic.count).toHaveBeenCalledTimes(1);
    expect(db.pfmeaRow.findMany.mock.calls[0][0].where.id.in).toEqual([rowId]);
    db.pfmeaRow.findMany.mockResolvedValue([]);
    await expect(
      (new ControlPlanDocumentService(db as never) as any).validateLinks(
        db,
        actor,
        'target',
        document,
      ),
    ).rejects.toThrow('Invalid source FMEA mapping');
  });
  it('produces all808unique deterministic candidates from101rowsx2controlsx2characteristicsx2requirements', async () => {
    const sourceRevisionId = randomUUID();
    const rows = Array.from({ length: 101 }, (_, index) => {
      const operationId = randomUUID();
      return {
        id: randomUUID(),
        rowNumber: index + 1,
        processStepId: operationId,
        processStep: {
          id: operationId,
          stepNumber: `OP${index + 1}`,
          name: `Operation ${index + 1}`,
          machinesEquipmentDocs: ['Bench'],
        },
        controls: Array.from({ length: 2 }, (_, i) => ({
          control: {
            id: randomUUID(),
            tenantId: actor.tenantId,
            name: `Control ${i}`,
            type: i ? 'detection' : 'prevention',
            detectionMethod: i ? 'Actual source method' : '',
          },
        })),
        characteristics: Array.from({ length: 2 }, (_, i) => ({
          characteristic: {
            id: randomUUID(),
            tenantId: actor.tenantId,
            name: `Characteristic ${i}`,
            classification: 'standard',
            unitOfMeasure: 'mm',
          },
        })),
        requirements: Array.from({ length: 2 }, (_, i) => ({
          requirement: {
            id: randomUUID(),
            tenantId: actor.tenantId,
            name: `Requirement ${i}`,
            spec: `${i} ±0.1`,
            tolerance: '±0.1',
          },
        })),
      };
    });
    for (const row of rows) {
      for (const link of row.controls)
        Object.assign(link, { controlId: link.control.id });
      for (const link of row.characteristics)
        Object.assign(link, { characteristicId: link.characteristic.id });
      for (const link of row.requirements)
        Object.assign(link, { requirementId: link.requirement.id });
    }
    const db = {
      pfmeaRow: { findMany: jest.fn().mockResolvedValue(rows) },
      processStep: {
        findMany: jest
          .fn()
          .mockResolvedValue(rows.map((r) => ({ id: r.processStepId }))),
      },
    };
    const service = new ControlPlanDocumentService(db as never);
    jest
      .spyOn(service as any, 'context')
      .mockResolvedValue({ document: { projectId: 'project' } });
    jest
      .spyOn(engineeringAccess, 'assertEngineeringRevisionAccess')
      .mockResolvedValue({
        document: { projectId: 'project', type: 'PFMEA' },
      } as never);
    const first = await (service as any).candidates(
      db,
      actor,
      'target',
      sourceRevisionId,
    );
    expect(first.candidates).toHaveLength(808);
    expect(new Set(first.candidates.map((l: any) => l.id)).size).toBe(808);
    expect(new Set(first.candidates.map((l: any) => l.source.key)).size).toBe(
      808,
    );
    expect(
      first.candidates.filter((l: any) => l.source.pfmeaRowId === rows[100].id),
    ).toHaveLength(8);
    expect(db.processStep.findMany).toHaveBeenCalledTimes(1);
    expect(db.pfmeaRow.findMany.mock.calls[0][0]).not.toHaveProperty('take');
    expect(db.pfmeaRow.findMany.mock.calls[0][0]).not.toHaveProperty('skip');
    for (const row of rows) {
      row.controls.reverse();
      row.characteristics.reverse();
      row.requirements.reverse();
    }
    const second = await (service as any).candidates(
      db,
      actor,
      'target',
      sourceRevisionId,
    );
    expect(second.candidates).toEqual(first.candidates);
    expect(
      first.candidates.every(
        (l: any) =>
          l.sampleSize === '' && l.frequency === '' && l.reactionPlan === '',
      ),
    ).toBe(true);
  });
});

describe('saved Control Plan capabilities', () => {
  it('retains authorized new-revision capability after successful versioned save', async () => {
    const db: any = {
      controlPlanDocument: {
        findUnique: jest.fn().mockResolvedValue({ version: 1, data: {} }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    db.$transaction = jest.fn(async (work: any) => work(db));
    const service = new ControlPlanDocumentService(db);
    const access = jest
      .spyOn(service as any, 'context')
      .mockResolvedValue({ projectWritable: true });
    jest.spyOn(service as any, 'validateLinks').mockResolvedValue(undefined);
    const result = await service.save(actor, 'revision', {
      expectedVersion: 1,
      document: emptyCpDocument(),
    });
    expect(result).toMatchObject({
      version: 2,
      writable: true,
      forkable: true,
    });
    expect(access).toHaveBeenCalledWith(db, actor, 'revision', true);
  });
  it('cannot return successful writable capabilities if reference or viewer write access is denied', async () => {
    const db: any = {
      $transaction: jest.fn(async (work: any) => work(db)),
      controlPlanDocument: { updateMany: jest.fn() },
    };
    const service = new ControlPlanDocumentService(db);
    jest
      .spyOn(service as any, 'context')
      .mockRejectedValue(new Error('Project is read-only'));
    await expect(
      service.save(actor, 'revision', {
        expectedVersion: 0,
        document: emptyCpDocument(),
      }),
    ).rejects.toThrow('read-only');
    expect(db.controlPlanDocument.updateMany).not.toHaveBeenCalled();
  });
});
