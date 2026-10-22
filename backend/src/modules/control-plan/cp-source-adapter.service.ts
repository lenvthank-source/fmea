import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';
import { CpSourceLocator } from './control-plan-document';

export interface CpCandidateOperation {
  id: string; // processStepId or synthesized step UUID
  number: string;
  name: string;
  workElementName?: string;
  sourceScope: 'revision' | 'captured_project_context';
  sourceRevisionId: string | null;
  locator: CpSourceLocator;
}

export interface CpCandidateCharacteristic {
  id: string; // Characteristic junction or master ID
  name: string;
  kind: 'product' | 'process' | 'unspecified';
  classification: string;
  specification: string;
  tolerance: string;
  unit: string;
  pfmeaRowId: string;
  sourceRevisionId: string;
  locator: CpSourceLocator;
}

export interface CpCandidateControl {
  id: string; // Control junction or master ID
  method: string;
  controlType: 'prevention' | 'detection' | 'unspecified';
  evaluationMethod: string;
  sampleSize: string;
  frequency: string;
  reactionPlan: string;
  pfmeaRowId: string;
  sourceRevisionId: string;
  locator: CpSourceLocator;
}

export interface CpCandidateRequirement {
  id: string;
  name: string;
  specification: string;
  tolerance: string;
  unit: string;
  pfmeaRowId: string;
  sourceRevisionId: string;
  locator: CpSourceLocator;
}

export interface CpCandidateAction {
  id: string;
  model: 'WORKSHEET_ACTION_FIELDS' | 'TREE_LINK_ACTION' | 'TRACKER_ACTION';
  description: string;
  actionTaken?: string;
  status: string;
  responsible?: string;
  targetDate?: string;
  completionDate?: string;
  verificationState: string;
  evidenceReferences: string[];
  locator: CpSourceLocator;
}

export interface CpSourceBundle {
  selectedRevisionId: string;
  documentType: 'PFD' | 'PFMEA';
  sourceStatus: string;
  sourceSetHash: string;
  operations: CpCandidateOperation[];
  characteristics: CpCandidateCharacteristic[];
  controls: CpCandidateControl[];
  requirements: CpCandidateRequirement[];
  actions: CpCandidateAction[];
  capturedAt: string;
}

@Injectable()
export class CpSourceAdapterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Loads all source analysis data from a selected PFMEA or PFD revision.
   * Returns independent candidate sets rather than Cartesian adopted tuples.
   */
  async loadSourceBundle(
    tenantId: string,
    projectId: string,
    sourceRevisionId: string,
    client?: Prisma.TransactionClient,
  ): Promise<CpSourceBundle> {
    const db = client ?? this.prisma;

    const revision = await db.documentRevision.findUnique({
      where: { id: sourceRevisionId },
      include: {
        document: true,
      },
    });

    if (!revision || revision.document.tenantId !== tenantId || revision.document.projectId !== projectId) {
      throw new NotFoundException('Source revision not found in the current project.');
    }

    const docType = revision.document.type as 'PFD' | 'PFMEA';

    if (docType === 'PFD') {
      return this.loadPfdBundle(tenantId, projectId, revision, db);
    } else if (docType === 'PFMEA') {
      return this.loadPfmeaBundle(tenantId, projectId, revision, db);
    }

    throw new BadRequestException(`Unsupported source document type: ${docType}`);
  }

  private async loadPfdBundle(
    tenantId: string,
    projectId: string,
    revision: any,
    db: Prisma.TransactionClient,
  ): Promise<CpSourceBundle> {
    const steps = await db.processStep.findMany({
      where: { revisionId: revision.id },
      orderBy: { stepNumber: 'asc' },
    });

    const operations: CpCandidateOperation[] = steps.map((s) => ({
      id: s.id,
      number: String(s.stepNumber),
      name: s.name,
      sourceScope: 'revision',
      sourceRevisionId: revision.id,
      locator: {
        model: 'PFD_STEP',
        sourceRevisionId: revision.id,
        entityId: s.id,
        sourceScope: 'revision',
      },
    }));

    const sourceSetHash = this.computeSourceHash({
      revisionId: revision.id,
      operations,
      characteristics: [],
      controls: [],
      requirements: [],
      actions: [],
    });

    return {
      selectedRevisionId: revision.id,
      documentType: 'PFD',
      sourceStatus: revision.status,
      sourceSetHash,
      operations,
      characteristics: [],
      controls: [],
      requirements: [],
      actions: [],
      capturedAt: new Date().toISOString(),
    };
  }

  private async loadPfmeaBundle(
    tenantId: string,
    projectId: string,
    revision: any,
    db: Prisma.TransactionClient,
  ): Promise<CpSourceBundle> {
    const rows = await db.pfmeaRow.findMany({
      where: { revisionId: revision.id },
      include: {
        processStep: true,
        characteristics: { include: { characteristic: true } },
        controls: { include: { control: true } },
        requirements: { include: { requirement: true } },
      },
      orderBy: { rowNumber: 'asc' },
    });

    const opMap = new Map<string, CpCandidateOperation>();
    const characteristics: CpCandidateCharacteristic[] = [];
    const controls: CpCandidateControl[] = [];
    const requirements: CpCandidateRequirement[] = [];
    const actions: CpCandidateAction[] = [];

    for (const row of rows) {
      const stepId = row.processStepId || row.id;
      const stepNumber = row.processStep ? String(row.processStep.stepNumber) : String(row.rowNumber);
      const stepName = row.processStep ? row.processStep.name : (row.workElementName || `Row ${row.rowNumber}`);

      if (!opMap.has(stepId)) {
        opMap.set(stepId, {
          id: stepId,
          number: stepNumber,
          name: stepName,
          workElementName: row.workElementName || undefined,
          sourceScope: 'revision',
          sourceRevisionId: revision.id,
          locator: {
            model: 'PFMEA_ROW',
            sourceRevisionId: revision.id,
            entityId: row.id,
            parentIds: row.processStepId ? [row.processStepId] : [],
            sourceScope: 'revision',
          },
        });
      }

      // Characteristics
      for (const rc of row.characteristics) {
        const char = rc.characteristic;
        if (!char) continue;
        characteristics.push({
          id: char.id,
          name: char.name,
          kind: char.classification?.toLowerCase().includes('process') ? 'process' : 'product',
          classification: char.classification || '',
          specification: char.description || '',
          tolerance: '',
          unit: char.unitOfMeasure || '',
          pfmeaRowId: row.id,
          sourceRevisionId: revision.id,
          locator: {
            model: 'PFMEA_ROW',
            sourceRevisionId: revision.id,
            entityId: char.id,
            parentIds: [row.id],
            fieldPath: 'characteristics',
            sourceScope: 'revision',
          },
        });
      }

      // Controls
      for (const rctrl of row.controls) {
        const ctrl = rctrl.control;
        if (!ctrl) continue;
        controls.push({
          id: ctrl.id,
          method: ctrl.name,
          controlType: ctrl.type?.toLowerCase() === 'prevention' ? 'prevention' : ctrl.type?.toLowerCase() === 'detection' ? 'detection' : 'unspecified',
          evaluationMethod: ctrl.detectionMethod || '',
          sampleSize: '',
          frequency: '',
          reactionPlan: '',
          pfmeaRowId: row.id,
          sourceRevisionId: revision.id,
          locator: {
            model: 'WORKSHEET_CONTROL',
            sourceRevisionId: revision.id,
            entityId: ctrl.id,
            parentIds: [row.id],
            fieldPath: 'controls',
            sourceScope: 'revision',
          },
        });
      }

      // Requirements
      for (const rr of row.requirements) {
        const req = rr.requirement;
        if (!req) continue;
        requirements.push({
          id: req.id,
          name: req.name,
          specification: req.spec || '',
          tolerance: req.tolerance || '',
          unit: '',
          pfmeaRowId: row.id,
          sourceRevisionId: revision.id,
          locator: {
            model: 'PFMEA_ROW',
            sourceRevisionId: revision.id,
            entityId: req.id,
            parentIds: [row.id],
            fieldPath: 'requirements',
            sourceScope: 'revision',
          },
        });
      }

      // Worksheet action fields
      if (row.preventionAction || row.detectionAction || row.actionTaken) {
        actions.push({
          id: `act_${row.id}`,
          model: 'WORKSHEET_ACTION_FIELDS',
          description: [row.preventionAction, row.detectionAction].filter(Boolean).join('; '),
          actionTaken: row.actionTaken || '',
          status: row.actionTaken ? 'completed' : 'open',
          responsible: row.responsibility || undefined,
          targetDate: row.targetDate ? row.targetDate.toISOString() : undefined,
          completionDate: row.completionDate ? row.completionDate.toISOString() : undefined,
          verificationState: 'not_established',
          evidenceReferences: [],
          locator: {
            model: 'WORKSHEET_ACTION_FIELDS',
            sourceRevisionId: revision.id,
            entityId: row.id,
            fieldPath: 'actionTaken',
            sourceScope: 'revision',
          },
        });
      }
    }

    const operations = Array.from(opMap.values());
    const sourceSetHash = this.computeSourceHash({
      revisionId: revision.id,
      operations,
      characteristics,
      controls,
      requirements,
      actions,
    });

    return {
      selectedRevisionId: revision.id,
      documentType: 'PFMEA',
      sourceStatus: revision.status,
      sourceSetHash,
      operations,
      characteristics,
      controls,
      requirements,
      actions,
      capturedAt: new Date().toISOString(),
    };
  }

  /**
   * Deterministic SHA256 digest of the source candidate bundle.
   */
  computeSourceHash(bundleData: {
    revisionId: string;
    operations: CpCandidateOperation[];
    characteristics: CpCandidateCharacteristic[];
    controls: CpCandidateControl[];
    requirements: CpCandidateRequirement[];
    actions: CpCandidateAction[];
  }): string {
    const payload = JSON.stringify({
      revisionId: bundleData.revisionId,
      operations: bundleData.operations.map((o) => ({ id: o.id, num: o.number, name: o.name })),
      characteristics: bundleData.characteristics.map((c) => ({ id: c.id, name: c.name, spec: c.specification, tol: c.tolerance })),
      controls: bundleData.controls.map((ctrl) => ({ id: ctrl.id, method: ctrl.method, type: ctrl.controlType })),
      requirements: bundleData.requirements.map((r) => ({ id: r.id, name: r.name, spec: r.specification })),
      actions: bundleData.actions.map((a) => ({ id: a.id, desc: a.description, status: a.status })),
    });
    return createHash('sha256').update(payload).digest('hex');
  }
}
