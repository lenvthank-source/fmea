import { BadRequestException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';

export interface CpSource {
  key: string;
  revisionId: string;
  pfmeaRowId?: string;
  controlId?: string;
  characteristicId?: string;
  requirementId?: string;
  snapshot: Record<string, string>;
}

export interface CpLine {
  id: string;
  operationId: string;
  operationNumber: string;
  operationName: string;
  equipment: string;
  characteristicId: string;
  characteristicNumber: string;
  characteristicName: string;
  characteristicKind: 'product' | 'process' | 'unspecified';
  classification: string;
  unit: string;
  specification: string;
  tolerance: string;
  evaluationMethod: string;
  gauge: string;
  sampleSize: string;
  frequency: string;
  controlMethod: string;
  controlType: 'prevention' | 'detection' | 'unspecified';
  reactionPlan: string;
  responsible: string;
  recordReference?: string;
  notes: string;
  volumeBasis: string;
  containmentRationale: string;
  reactionOwner: string;
  reactionProcedure: string;
  passThrough: string;
  errorProofing: string;
  reworkRepair: string;
  alternativeControl: string;
  systemReference: string;
  sourceRequirement: string;
  source?: CpSource;
  sourceState?: 'current' | 'changed' | 'removed' | 'manual';
}

export interface CpDocumentV1 {
  schemaVersion: 1;
  config: {
    phase: 'prototype' | 'pre-launch' | 'production' | 'unspecified';
    safeLaunch: {
      enabled: boolean;
      entryCriteria: string;
      exitCriteria: string;
      additionalControls: string;
    };
    standardProfile: string;
    customerRequirements: string;
    sourceExceptionJustification: string;
  };
  header: Record<string, string>;
  sourceBaselines: { revisionId: string; type: 'PFD' | 'PFMEA' }[];
  lines: CpLine[];
  sourceExclusions?: {
    key: string;
    revisionId: string;
    reason: string;
    sourceFingerprint: string;
  }[];
}

/* ========================================================================= */
/* V2 DOMAIN CONTRACTS (schemaVersion = 2)                                   */
/* ========================================================================= */

export type CpSourceLocatorModel =
  | 'PFD_STEP'
  | 'PFMEA_ROW'
  | 'WORKSHEET_CONTROL'
  | 'TREE_FAILURE_FIELD'
  | 'TREE_LINK_ACTION'
  | 'WORKSHEET_ACTION_FIELDS'
  | 'TRACKER_ACTION';

export interface CpSourceLocator {
  model: CpSourceLocatorModel;
  sourceRevisionId: string | null;
  captureId?: string;
  entityId: string;
  parentIds?: string[];
  fieldPath?: string;
  sourceScope: 'revision' | 'captured_project_context';
  capturedValueHash?: string;
}

export interface CpResourceV2 {
  id: string;
  kind: 'manufacturing_equipment' | 'jig_fixture' | 'tooling' | 'environment' | 'unspecified';
  text: string;
  controlledReference?: string;
  sources?: CpSourceLocator[];
}

export interface CpCriteriaV2 {
  kind: 'numeric' | 'attribute' | 'controlled_reference' | 'legacy_text' | 'unspecified';
  specification: string;
  tolerance: string;
  unit?: string;
  lowerLimit?: string;
  upperLimit?: string;
  controlledReference?: string;
}

export type CpExecutionMode =
  | 'count'
  | 'all_units'
  | 'event'
  | 'continuous'
  | 'controlled_reference'
  | 'unspecified';

export interface CpExecutionRuleV2 {
  mode: CpExecutionMode;
  sampleSize?: number;
  frequency?: string;
  volumeBasis?: string;
  trigger?: string;
  summary?: string;
  coverage?: string;
  monitoredScope?: string;
  systemIdentity?: string;
  version?: string;
  locator?: string;
  // Legacy unparsed fields preserved verbatim
  legacySampleSize?: string;
  legacyFrequency?: string;
  legacyVolumeBasis?: string;
}

export interface CpReactionV2 {
  trigger: string;
  plan: string;
  procedure?: string;
  responsible: string;
  containment?: string;
  restartCriteria?: string;
  recordReference?: string;
}

export interface CpControlV2 {
  id: string;
  controlType: 'prevention' | 'detection' | 'unspecified';
  method: string;
  evaluationMethod: string;
  measurementEquipment?: string;
  executionRule: CpExecutionRuleV2;
  reaction: CpReactionV2;
  responsibility: string;
  recordReference?: string;
  implementation?: {
    status: string;
    reportedAt?: string;
    evidenceReferences?: string[];
  };
  sourceBindings?: CpSourceLocator[];
  legacyFields?: Record<string, string>;
}

export interface CpCharacteristicV2 {
  id: string;
  number: string;
  kind: 'product' | 'process' | 'unspecified';
  name: string;
  description?: string;
  criteria: CpCriteriaV2;
  classification: string;
  sources?: CpSourceLocator[];
  controls: CpControlV2[];
}

export interface CpOperationV2 {
  id: string;
  lineageId?: string | null;
  order: number;
  number: string;
  name: string;
  sourceBindings?: CpSourceLocator[];
  resources: CpResourceV2[];
  applicability?: string;
  characteristics: CpCharacteristicV2[];
}

export interface CpDocumentV2 {
  schemaVersion: 2;
  config: {
    phase: 'prototype' | 'pre-launch' | 'production' | 'unspecified';
    safeLaunch: {
      enabled: boolean;
      entryCriteria: string;
      exitCriteria: string;
      additionalControls: string;
    };
    requirementProfileRevisionId?: string;
    standardProfile: string;
    customerRequirements: string;
    applicability?: string;
    sourceExceptionJustification: string;
  };
  header: Record<string, string>;
  sourceBaselines: {
    revisionId: string;
    type: 'PFD' | 'PFMEA';
    capturedScope?: string;
  }[];
  operations: CpOperationV2[];
  sourceExclusions?: {
    key: string;
    revisionId: string;
    reason: string;
    sourceFingerprint: string;
  }[];
  legacyUnmappedContent?: Record<string, unknown>[];
}

export type CpDocument = CpDocumentV1;
export type AnyCpDocument = CpDocumentV1 | CpDocumentV2;

export function isCpDocumentV2(doc: any): doc is CpDocumentV2 {
  return Boolean(doc && doc.schemaVersion === 2);
}

export const cpFields = [
  'operationId',
  'operationNumber',
  'operationName',
  'equipment',
  'characteristicId',
  'characteristicNumber',
  'characteristicName',
  'classification',
  'unit',
  'specification',
  'tolerance',
  'evaluationMethod',
  'gauge',
  'sampleSize',
  'frequency',
  'controlMethod',
  'reactionPlan',
  'responsible',
  'recordReference',
  'notes',
  'volumeBasis',
  'containmentRationale',
  'reactionOwner',
  'reactionProcedure',
  'passThrough',
  'errorProofing',
  'reworkRepair',
  'alternativeControl',
  'systemReference',
  'sourceRequirement',
] as const;

export const sourceFields = [
  'sourceRequirement',
  'evaluationMethod',
  'operationId',
  'operationNumber',
  'operationName',
  'equipment',
  'characteristicId',
  'characteristicName',
  'classification',
  'unit',
  'specification',
  'tolerance',
  'controlMethod',
  'controlType',
] as const;

export function blankCpLine(id: string): CpLine {
  return Object.assign(Object.fromEntries(cpFields.map((k) => [k, ''])), {
    id,
    characteristicKind: 'unspecified',
    controlType: 'unspecified',
    sourceState: 'manual',
  }) as unknown as CpLine;
}

export function emptyCpDocument(
  header: Record<string, string> = {},
): CpDocumentV1 {
  return {
    schemaVersion: 1,
    config: {
      phase: 'unspecified',
      safeLaunch: {
        enabled: false,
        entryCriteria: '',
        exitCriteria: '',
        additionalControls: '',
      },
      standardProfile: '',
      customerRequirements: '',
      sourceExceptionJustification: '',
    },
    header,
    sourceBaselines: [],
    sourceExclusions: [],
    lines: [],
  };
}

export function emptyCpDocumentV2(
  header: Record<string, string> = {},
): CpDocumentV2 {
  return {
    schemaVersion: 2,
    config: {
      phase: 'unspecified',
      safeLaunch: {
        enabled: false,
        entryCriteria: '',
        exitCriteria: '',
        additionalControls: '',
      },
      standardProfile: 'fmeapex-cp-baseline-v1',
      customerRequirements: '',
      sourceExceptionJustification: '',
    },
    header,
    sourceBaselines: [],
    operations: [],
    sourceExclusions: [],
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeCpDocument(value: unknown): CpDocumentV1 {
  if (!record(value) || value.schemaVersion !== 1)
    throw new BadRequestException('Unsupported control-plan document version.');
  const d = structuredClone(value) as unknown as CpDocumentV1;
  if (record(d.config)) {
    if (d.config.sourceExceptionJustification === undefined)
      d.config.sourceExceptionJustification = '';
  }
  if (d.sourceExclusions === undefined) d.sourceExclusions = [];
  if (Array.isArray(d.lines))
    d.lines = d.lines.map((line) => {
      if (!record(line)) return line;
      const next = { ...line };
      for (const field of cpFields)
        if (next[field] === undefined) next[field] = '';
      if (next.sourceState === undefined)
        next.sourceState = next.source ? 'changed' : 'manual';
      return next;
    });
  validateCpDocumentV1(d);
  return d;
}

export function normalizeAnyCpDocument(value: unknown): AnyCpDocument {
  if (!record(value))
    throw new BadRequestException('Unsupported control-plan document format.');
  if (value.schemaVersion === 2) return normalizeCpDocumentV2(value);
  return normalizeCpDocument(value);
}

export function normalizeCpDocumentV2(value: unknown): CpDocumentV2 {
  if (!record(value) || value.schemaVersion !== 2)
    throw new BadRequestException('Unsupported control-plan v2 document.');
  const d = structuredClone(value) as unknown as CpDocumentV2;
  if (record(d.config)) {
    if (d.config.sourceExceptionJustification === undefined)
      d.config.sourceExceptionJustification = '';
    if (d.config.standardProfile === undefined)
      d.config.standardProfile = 'fmeapex-cp-baseline-v1';
    if (d.config.customerRequirements === undefined)
      d.config.customerRequirements = '';
  }
  if (d.sourceExclusions === undefined) d.sourceExclusions = [];
  if (d.operations === undefined) d.operations = [];
  validateCpDocumentV2(d);
  return d;
}

export function validateCpDocument(
  value: unknown,
): asserts value is AnyCpDocument {
  if (!record(value))
    throw new BadRequestException('Invalid control-plan document structure.');
  if (value.schemaVersion === 2) {
    validateCpDocumentV2(value);
  } else if (value.schemaVersion === 1) {
    validateCpDocumentV1(value);
  } else {
    throw new BadRequestException(
      `Unsupported control-plan schema version: ${value.schemaVersion}`,
    );
  }
}

export function validateAnyCpDocument(
  value: unknown,
): asserts value is AnyCpDocument {
  if (!record(value))
    throw new BadRequestException('Invalid control-plan document structure.');
  if (value.schemaVersion === 2) {
    validateCpDocumentV2(value);
  } else {
    validateCpDocumentV1(value);
  }
}

export function validateCpDocumentV1(
  value: unknown,
): asserts value is CpDocumentV1 {
  if (
    !record(value) ||
    value.schemaVersion !== 1 ||
    !record(value.config) ||
    !record(value.config.safeLaunch) ||
    !record(value.header) ||
    !Array.isArray(value.lines) ||
    !Array.isArray(value.sourceBaselines)
  )
    throw new BadRequestException('Invalid control-plan document structure.');
  const c = value.config,
    s = c.safeLaunch as Record<string, unknown>;
  if (
    !['prototype', 'pre-launch', 'production', 'unspecified'].includes(
      String(c.phase),
    ) ||
    typeof s.enabled !== 'boolean' ||
    ['entryCriteria', 'exitCriteria', 'additionalControls'].some(
      (k) => typeof s[k] !== 'string',
    ) ||
    [
      'standardProfile',
      'customerRequirements',
      'sourceExceptionJustification',
    ].some((k) => typeof c[k] !== 'string')
  )
    throw new BadRequestException('Invalid control-plan configuration.');
  if (
    Object.values(value.header).some((v) => typeof v !== 'string') ||
    value.lines.length > 20000
  )
    throw new BadRequestException('Invalid header or excessive control lines.');
  const ids = new Set<string>(),
    keys = new Set<string>();
  for (const line of value.lines) {
    if (
      !record(line) ||
      typeof line.id !== 'string' ||
      !line.id ||
      ids.has(line.id) ||
      cpFields.some((k) => typeof line[k] !== 'string') ||
      !['product', 'process', 'unspecified'].includes(
        String(line.characteristicKind),
      ) ||
      !['prevention', 'detection', 'unspecified'].includes(
        String(line.controlType),
      )
    )
      throw new BadRequestException('Invalid or duplicate control line.');
    if (
      line.sourceState !== undefined &&
      !['current', 'changed', 'removed', 'manual'].includes(
        String(line.sourceState),
      )
    )
      throw new BadRequestException('Invalid source review state.');
    ids.add(line.id);
    if (line.source === null)
      throw new BadRequestException('Invalid source mapping.');
    if (line.source) {
      const src = line.source;
      if (
        !record(src) ||
        typeof src.key !== 'string' ||
        !src.key.trim() ||
        ['pfmeaRowId', 'controlId', 'characteristicId', 'requirementId'].some(
          (k) => src[k] !== undefined && typeof src[k] !== 'string',
        ) ||
        typeof src.revisionId !== 'string' ||
        !record(src.snapshot) ||
        Object.values(src.snapshot).some((v) => typeof v !== 'string') ||
        keys.has(src.key)
      )
        throw new BadRequestException('Invalid or duplicate source mapping.');
      keys.add(src.key);
    }
  }
  for (const baseline of value.sourceBaselines)
    if (
      !record(baseline) ||
      typeof baseline.revisionId !== 'string' ||
      !['PFD', 'PFMEA'].includes(String(baseline.type))
    )
      throw new BadRequestException('Invalid source baseline.');
  const excluded = new Set<string>();
  if (value.sourceExclusions !== undefined) {
    if (!Array.isArray(value.sourceExclusions))
      throw new BadRequestException('Invalid source exclusions.');
    for (const x of value.sourceExclusions) {
      if (
        !record(x) ||
        ['key', 'revisionId', 'reason', 'sourceFingerprint'].some(
          (k) => typeof x[k] !== 'string' || !String(x[k]).trim(),
        ) ||
        excluded.has(String(x.revisionId) + ':' + String(x.key))
      )
        throw new BadRequestException('Invalid or duplicate source exclusion.');
      excluded.add(String(x.revisionId) + ':' + String(x.key));
    }
  }
  if (JSON.stringify(value).length > 8_000_000)
    throw new BadRequestException('Control plan exceeds document limit.');
}

export function validateCpDocumentV2(
  value: unknown,
): asserts value is CpDocumentV2 {
  if (
    !record(value) ||
    value.schemaVersion !== 2 ||
    !record(value.config) ||
    !record(value.config.safeLaunch) ||
    !record(value.header) ||
    !Array.isArray(value.operations) ||
    !Array.isArray(value.sourceBaselines)
  )
    throw new BadRequestException('Invalid control-plan v2 document structure.');
  const c = value.config,
    s = c.safeLaunch as Record<string, unknown>;
  if (
    !['prototype', 'pre-launch', 'production', 'unspecified'].includes(
      String(c.phase),
    ) ||
    typeof s.enabled !== 'boolean' ||
    ['entryCriteria', 'exitCriteria', 'additionalControls'].some(
      (k) => typeof s[k] !== 'string',
    ) ||
    [
      'standardProfile',
      'customerRequirements',
      'sourceExceptionJustification',
    ].some((k) => typeof c[k] !== 'string')
  )
    throw new BadRequestException('Invalid control-plan v2 configuration.');
  if (Object.values(value.header).some((v) => typeof v !== 'string'))
    throw new BadRequestException('Invalid control-plan v2 header.');

  const opIds = new Set<string>();
  const charIds = new Set<string>();
  const ctrlIds = new Set<string>();
  let totalControls = 0;

  for (const op of value.operations) {
    if (
      !record(op) ||
      typeof op.id !== 'string' ||
      !op.id ||
      opIds.has(op.id) ||
      typeof op.number !== 'string' ||
      typeof op.name !== 'string' ||
      !Array.isArray(op.characteristics) ||
      !Array.isArray(op.resources)
    )
      throw new BadRequestException('Invalid or duplicate operation in v2 document.');
    opIds.add(op.id);

    for (const res of op.resources) {
      if (
        !record(res) ||
        typeof res.id !== 'string' ||
        !res.id ||
        typeof res.text !== 'string'
      )
        throw new BadRequestException('Invalid resource in v2 operation.');
    }

    for (const char of op.characteristics) {
      if (
        !record(char) ||
        typeof char.id !== 'string' ||
        !char.id ||
        charIds.has(char.id) ||
        typeof char.name !== 'string' ||
        !record(char.criteria) ||
        !Array.isArray(char.controls)
      )
        throw new BadRequestException('Invalid or duplicate characteristic in v2 operation.');
      charIds.add(char.id);

      for (const ctrl of char.controls) {
        if (
          !record(ctrl) ||
          typeof ctrl.id !== 'string' ||
          !ctrl.id ||
          ctrlIds.has(ctrl.id) ||
          !record(ctrl.executionRule) ||
          !record(ctrl.reaction)
        )
          throw new BadRequestException('Invalid or duplicate control in v2 characteristic.');
        ctrlIds.add(ctrl.id);
        totalControls++;
      }
    }
  }

  if (totalControls > 20000)
    throw new BadRequestException('Excessive control lines in v2 plan.');
  if (JSON.stringify(value).length > 12_000_000)
    throw new BadRequestException('Control plan v2 exceeds document size limit.');
}

export function previewV1ToV2Conversion(doc: CpDocumentV1): {
  v2: CpDocumentV2;
  previewHash: string;
  warnings: string[];
} {
  validateCpDocumentV1(doc);
  const warnings: string[] = [];
  const v2: CpDocumentV2 = {
    schemaVersion: 2,
    config: {
      phase: doc.config.phase,
      safeLaunch: structuredClone(doc.config.safeLaunch),
      standardProfile: doc.config.standardProfile || 'fmeapex-cp-baseline-v1',
      customerRequirements: doc.config.customerRequirements || '',
      sourceExceptionJustification: doc.config.sourceExceptionJustification || '',
    },
    header: structuredClone(doc.header),
    sourceBaselines: doc.sourceBaselines.map((b) => ({
      revisionId: b.revisionId,
      type: b.type,
      capturedScope: 'revision',
    })),
    operations: [],
    sourceExclusions: structuredClone(doc.sourceExclusions ?? []),
  };

  // Group lines by operationId
  const opGroups = new Map<string, CpLine[]>();
  for (const line of doc.lines) {
    const key = line.operationId?.trim() || `op_${line.operationNumber?.trim() || 'unassigned'}`;
    if (!opGroups.has(key)) opGroups.set(key, []);
    opGroups.get(key)!.push(line);
  }

  let opOrder = 1;
  for (const [opKey, lines] of opGroups.entries()) {
    const first = lines[0];
    const opId = first.operationId?.trim() ? first.operationId : `op_${first.operationNumber?.trim() || opOrder}`;
    const resources: CpResourceV2[] = [];
    const resourceTexts = new Set<string>();

    let resIdx = 1;
    for (const line of lines) {
      if (line.equipment?.trim() && !resourceTexts.has(line.equipment.trim())) {
        resourceTexts.add(line.equipment.trim());
        resources.push({
          id: `res_${opId}_${resIdx++}`,
          kind: 'manufacturing_equipment',
          text: line.equipment.trim(),
        });
      }
    }

    const characteristics: CpCharacteristicV2[] = [];
    for (const [lineIdx, line] of lines.entries()) {
      const charId = line.characteristicId?.trim() ? line.characteristicId : `char_${opId}_${lineIdx + 1}`;
      const controlId = line.id || `ctrl_${charId}_1`;

      const sourceBindings: CpSourceLocator[] = line.source
        ? [
            {
              model: 'PFMEA_ROW',
              sourceRevisionId: line.source.revisionId,
              entityId: line.source.pfmeaRowId || line.id,
              sourceScope: 'revision',
            },
          ]
        : [];

      const ctrl: CpControlV2 = {
        id: controlId,
        controlType: line.controlType,
        method: line.controlMethod,
        evaluationMethod: line.evaluationMethod,
        measurementEquipment: line.gauge,
        executionRule: {
          mode: 'unspecified',
          legacySampleSize: line.sampleSize,
          legacyFrequency: line.frequency,
          legacyVolumeBasis: line.volumeBasis,
        },
        reaction: {
          trigger: '',
          plan: line.reactionPlan,
          procedure: line.reactionProcedure,
          responsible: line.reactionOwner || line.responsible,
          containment: line.containmentRationale,
          recordReference: line.recordReference,
        },
        responsibility: line.responsible,
        recordReference: line.recordReference,
        sourceBindings,
        legacyFields: {
          notes: line.notes,
          passThrough: line.passThrough,
          errorProofing: line.errorProofing,
          reworkRepair: line.reworkRepair,
          alternativeControl: line.alternativeControl,
          systemReference: line.systemReference,
          sourceRequirement: line.sourceRequirement,
        },
      };

      const char: CpCharacteristicV2 = {
        id: charId,
        number: line.characteristicNumber,
        name: line.characteristicName,
        kind: line.characteristicKind,
        classification: line.classification,
        criteria: {
          kind: line.specification || line.tolerance ? 'legacy_text' : 'unspecified',
          specification: line.specification,
          tolerance: line.tolerance,
          unit: line.unit,
        },
        sources: sourceBindings,
        controls: [ctrl],
      };
      characteristics.push(char);
    }

    v2.operations.push({
      id: opId,
      order: opOrder++,
      number: first.operationNumber,
      name: first.operationName,
      resources,
      characteristics,
    });
  }

  const previewHash = fingerprint(v2);
  warnings.push(
    `Converted ${doc.lines.length} legacy control line(s) into ${v2.operations.length} operation section(s). Historical field reviews and approvals are not carried over.`,
  );
  return { v2, previewHash, warnings };
}

export function applyV1ToV2Conversion(
  doc: CpDocumentV1,
  previewHash: string,
): CpDocumentV2 {
  const { v2, previewHash: actualHash } = previewV1ToV2Conversion(doc);
  if (previewHash !== actualHash) {
    throw new BadRequestException('Conversion preview hash mismatch or stale document.');
  }
  validateCpDocumentV2(v2);
  return v2;
}

export interface CpChange {
  key: string;
  kind: 'add' | 'change' | 'remove';
  candidate: CpLine;
  lineId?: string;
  conflicts: string[];
}

export function fingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function previewCp(
  document: CpDocumentV1,
  candidates: CpLine[],
  sourceRevisionId: string,
): CpChange[] {
  const changes: CpChange[] = [];
  const existing = new Map(
    document.lines
      .filter((l) => l.source?.revisionId === sourceRevisionId)
      .map((l) => [l.source!.key, l]),
  );
  for (const candidate of candidates) {
    const key = candidate.source!.key,
      old = existing.get(key);
    existing.delete(key);
    if (!old) {
      if (
        document.sourceExclusions?.some(
          (x) =>
            x.key === key &&
            x.revisionId === sourceRevisionId &&
            x.sourceFingerprint === fingerprint(candidate.source!.snapshot),
        )
      )
        continue;
      changes.push({ key, kind: 'add', candidate, conflicts: [] });
      continue;
    }
    const changed = sourceFields.filter(
      (k) => candidate[k] !== old.source!.snapshot[k],
    );
    if (changed.length)
      changes.push({
        key,
        kind: 'change',
        candidate,
        lineId: old.id,
        conflicts: changed.filter((k) => old[k] !== old.source!.snapshot[k]),
      });
  }
  for (const [key, line] of existing)
    changes.push({
      key,
      kind: 'remove',
      candidate: line,
      lineId: line.id,
      conflicts: [],
    });
  return changes;
}

function previewCpV2(
  document: CpDocumentV2,
  candidates: CpLine[],
  sourceRevisionId: string,
): CpChange[] {
  // Convert v2 controls back to candidate comparison lines
  const existing = new Map<string, CpLine>();
  for (const op of document.operations) {
    for (const char of op.characteristics) {
      for (const ctrl of char.controls) {
        const binding = ctrl.sourceBindings?.find((b) => b.sourceRevisionId === sourceRevisionId);
        if (binding) {
          const l = blankCpLine(ctrl.id);
          l.operationId = op.id;
          l.operationNumber = op.number;
          l.operationName = op.name;
          l.characteristicId = char.id;
          l.characteristicNumber = char.number;
          l.characteristicName = char.name;
          l.classification = char.classification;
          l.specification = char.criteria.specification;
          l.tolerance = char.criteria.tolerance;
          l.unit = char.criteria.unit || '';
          l.controlMethod = ctrl.method;
          l.evaluationMethod = ctrl.evaluationMethod;
          l.gauge = ctrl.measurementEquipment || '';
          l.controlType = ctrl.controlType;
          l.responsible = ctrl.responsibility;
          l.reactionPlan = ctrl.reaction.plan;
          l.reactionOwner = ctrl.reaction.responsible;
          l.source = {
            key: binding.entityId,
            revisionId: sourceRevisionId,
            snapshot: ctrl.legacyFields ?? {},
          };
          existing.set(binding.entityId, l);
        }
      }
    }
  }

  const changes: CpChange[] = [];
  for (const candidate of candidates) {
    const key = candidate.source!.key;
    const old = existing.get(key);
    existing.delete(key);
    if (!old) {
      if (
        document.sourceExclusions?.some(
          (x) =>
            x.key === key &&
            x.revisionId === sourceRevisionId &&
            x.sourceFingerprint === fingerprint(candidate.source!.snapshot),
        )
      )
        continue;
      changes.push({ key, kind: 'add', candidate, conflicts: [] });
      continue;
    }
    const changed = sourceFields.filter(
      (k) => candidate[k] !== old.source!.snapshot[k],
    );
    if (changed.length)
      changes.push({
        key,
        kind: 'change',
        candidate,
        lineId: old.id,
        conflicts: changed.filter((k) => old[k] !== old.source!.snapshot[k]),
      });
  }
  for (const [key, line] of existing)
    changes.push({
      key,
      kind: 'remove',
      candidate: line,
      lineId: line.id,
      conflicts: [],
    });
  return changes;
}

export function applyCpChanges(
  document: CpDocumentV1,
  changes: CpChange[],
  decisions: {
    key: string;
    action: string;
    reason?: string;
    resolutions?: Record<string, 'source' | 'current'>;
  }[],
): CpDocumentV1 {
  const result = structuredClone(document) as CpDocumentV1,
    byKey = new Map(changes.map((c) => [c.key, c]));
  const seen = new Set<string>();
  for (const change of changes) {
    const line = result.lines.find((l) => l.id === change.lineId);
    if (line)
      line.sourceState = change.kind === 'remove' ? 'removed' : 'changed';
  }
  for (const decision of decisions) {
    if (
      !decision ||
      typeof decision.key !== 'string' ||
      typeof decision.action !== 'string'
    )
      throw new BadRequestException('Invalid synchronization decision.');
    if (seen.has(decision.key) || !byKey.has(decision.key))
      throw new BadRequestException(
        'Unknown or duplicate synchronization decision.',
      );
    seen.add(decision.key);
    const change = byKey.get(decision.key)!;
    if (decision.action === 'keep') continue;
    if (change.kind === 'add' && decision.action === 'exclude') {
      if (!decision.reason?.trim())
        throw new BadRequestException(
          'Document the source exclusion rationale.',
        );
      result.sourceExclusions = (result.sourceExclusions ?? []).filter(
        (x) =>
          !(
            x.key === change.key &&
            x.revisionId === change.candidate.source!.revisionId
          ),
      );
      result.sourceExclusions.push({
        key: change.key,
        revisionId: change.candidate.source!.revisionId,
        reason: decision.reason.trim(),
        sourceFingerprint: fingerprint(change.candidate.source!.snapshot),
      });
      continue;
    }

    if (change.kind === 'add' && decision.action === 'add') {
      result.sourceExclusions = result.sourceExclusions?.filter(
        (x) =>
          !(
            x.key === change.key &&
            x.revisionId === change.candidate.source!.revisionId
          ),
      );
      result.lines.push(structuredClone(change.candidate));
      continue;
    }
    const index = result.lines.findIndex((l) => l.id === change.lineId);
    if (index < 0)
      throw new BadRequestException('Synchronization line no longer exists.');
    if (change.kind === 'remove' && decision.action === 'detach') {
      delete result.lines[index].source;
      result.lines[index].sourceState = 'manual';
      continue;
    }
    if (change.kind === 'change' && decision.action === 'update') {
      const old = result.lines[index],
        next = structuredClone(old);
      if (
        change.conflicts.some(
          (k) =>
            !['source', 'current'].includes(decision.resolutions?.[k] ?? ''),
        )
      )
        throw new BadRequestException(
          'Resolve every conflicting source field explicitly.',
        );
      for (const field of sourceFields) {
        if (
          old[field] === old.source!.snapshot[field] ||
          decision.resolutions?.[field] === 'source'
        )
          (next as unknown as Record<string, unknown>)[field] =
            change.candidate[field];
      }
      next.source = structuredClone(change.candidate.source);
      next.sourceState = 'current';
      result.lines[index] = next;
      continue;
    }
    throw new BadRequestException(
      'Decision does not apply to this synchronization change.',
    );
  }
  return result;
}

function applyCpChangesV2(
  document: CpDocumentV2,
  changes: CpChange[],
  decisions: {
    key: string;
    action: string;
    reason?: string;
    resolutions?: Record<string, 'source' | 'current'>;
  }[],
): CpDocumentV2 {
  const result = structuredClone(document);
  const byKey = new Map(changes.map((c) => [c.key, c]));
  const seen = new Set<string>();

  for (const decision of decisions) {
    if (!decision || typeof decision.key !== 'string' || typeof decision.action !== 'string')
      throw new BadRequestException('Invalid synchronization decision.');
    if (seen.has(decision.key) || !byKey.has(decision.key))
      throw new BadRequestException('Unknown or duplicate synchronization decision.');
    seen.add(decision.key);

    const change = byKey.get(decision.key)!;
    if (decision.action === 'keep') continue;

    if (change.kind === 'add' && decision.action === 'exclude') {
      if (!decision.reason?.trim())
        throw new BadRequestException('Document the source exclusion rationale.');
      result.sourceExclusions = (result.sourceExclusions ?? []).filter(
        (x) => !(x.key === change.key && x.revisionId === change.candidate.source!.revisionId),
      );
      result.sourceExclusions.push({
        key: change.key,
        revisionId: change.candidate.source!.revisionId,
        reason: decision.reason.trim(),
        sourceFingerprint: fingerprint(change.candidate.source!.snapshot),
      });
      continue;
    }

    if (change.kind === 'add' && decision.action === 'add') {
      result.sourceExclusions = result.sourceExclusions?.filter(
        (x) => !(x.key === change.key && x.revisionId === change.candidate.source!.revisionId),
      );
      // Find or create operation
      let op = result.operations.find(
        (o) => o.number === change.candidate.operationNumber || o.id === change.candidate.operationId,
      );
      if (!op) {
        op = {
          id: change.candidate.operationId || randomUUID(),
          order: result.operations.length + 1,
          number: change.candidate.operationNumber,
          name: change.candidate.operationName,
          resources: [],
          characteristics: [],
        };
        result.operations.push(op);
      }
      // Add characteristic and control
      const ctrl: CpControlV2 = {
        id: change.candidate.id || randomUUID(),
        controlType: change.candidate.controlType,
        method: change.candidate.controlMethod,
        evaluationMethod: change.candidate.evaluationMethod,
        measurementEquipment: change.candidate.gauge,
        executionRule: {
          mode: 'unspecified',
          legacySampleSize: change.candidate.sampleSize,
          legacyFrequency: change.candidate.frequency,
          legacyVolumeBasis: change.candidate.volumeBasis,
        },
        reaction: {
          trigger: '',
          plan: change.candidate.reactionPlan,
          procedure: change.candidate.reactionProcedure,
          responsible: change.candidate.reactionOwner || change.candidate.responsible,
          containment: change.candidate.containmentRationale,
          recordReference: change.candidate.recordReference,
        },
        responsibility: change.candidate.responsible,
        recordReference: change.candidate.recordReference,
        sourceBindings: change.candidate.source
          ? [
              {
                model: 'PFMEA_ROW',
                sourceRevisionId: change.candidate.source.revisionId,
                entityId: change.candidate.source.key,
                sourceScope: 'revision',
              },
            ]
          : [],
      };
      const char: CpCharacteristicV2 = {
        id: change.candidate.characteristicId || randomUUID(),
        number: change.candidate.characteristicNumber,
        name: change.candidate.characteristicName,
        kind: change.candidate.characteristicKind,
        classification: change.candidate.classification,
        criteria: {
          kind: 'legacy_text',
          specification: change.candidate.specification,
          tolerance: change.candidate.tolerance,
          unit: change.candidate.unit,
        },
        controls: [ctrl],
      };
      op.characteristics.push(char);
      continue;
    }
  }

  return result;
}

export function controlPlanReadiness(value: unknown) {
  const errors: string[] = [],
    warnings: string[] = [
      'Application completeness policy, not certification. Customer and licensed manual requirements remain applicable.',
    ];
  try {
    validateCpDocument(value);
  } catch (error) {
    return {
      ready: false,
      errors: [
        error instanceof Error ? error.message : 'Invalid control plan.',
      ],
      warnings,
    };
  }

  const d = value as AnyCpDocument;
  // Common Header Validation: Public IATF SI25 Annex A.2 general data; stored values are never guessed.
  for (const key of [
    'controlPlanNumber',
    'issueDate',
    'customer',
    'organisationName',
    'organisationPlant',
    'partName',
    'engineeringChangeLevel',
    'keyContact',
  ])
    if (!d.header[key]?.trim()) errors.push(`Header: record ${key}.`);
  if (
    !d.header.orgPartNumber?.trim() &&
    !d.header.commonPlanDesignation?.trim()
  )
    errors.push(
      'Header: identify covered part number(s) or common plan designation.',
    );

  if (d.config.phase === 'unspecified')
    errors.push('Select control-plan phase.');
  if (!d.config.standardProfile?.trim())
    errors.push('Record standard/profile and edition.');
  if (
    !d.sourceBaselines.length &&
    !d.config.sourceExceptionJustification?.trim()
  )
    errors.push(
      'Select source baselines or document reviewed source exception.',
    );
  if (
    d.config.safeLaunch.enabled &&
    (!d.config.safeLaunch.entryCriteria.trim() ||
      !d.config.safeLaunch.exitCriteria.trim() ||
      !d.config.safeLaunch.additionalControls.trim())
  )
    errors.push(
      'Safe launch requires entry criteria, exit criteria and additional controls.',
    );

  if (d.schemaVersion === 2) {
    return controlPlanReadinessV2(d, errors, warnings);
  }

  // V1 line validation
  if (!d.lines.length) errors.push('Add control strategies.');
  for (const [index, l] of d.lines.entries()) {
    const label = `Control line ${index + 1}`;
    for (const k of [
      'operationId',
      'operationNumber',
      'operationName',
      'characteristicName',
      'controlMethod',
      'responsible',
      'reactionOwner',
    ] as const)
      if (!l[k]?.trim())
        errors.push(`${label}: record ${k} or reviewed applicability.`);
    if (!l.specification.trim() && !l.systemReference.trim())
      errors.push(
        `${label}: record specification or reference the controlled system holding its details.`,
      );
    if (
      !l.systemReference.trim() &&
      ['sampleSize', 'frequency', 'volumeBasis'].some(
        (k) => !String(l[k as keyof CpLine] ?? '').trim(),
      )
    )
      errors.push(
        `${label}: record sampling quantity, frequency and volume basis, or reference the controlled system holding the details.`,
      );
    if (l.characteristicKind === 'unspecified')
      errors.push(`${label}: classify product/process characteristic.`);
    if (l.controlType === 'unspecified')
      errors.push(`${label}: classify prevention/detection control.`);
    if (!l.reactionPlan.trim() && !l.reactionProcedure.trim())
      errors.push(`${label}: document reaction plan or controlled procedure.`);
    if (l.controlType === 'detection' && !l.evaluationMethod.trim())
      errors.push(`${label}: record evaluation technique.`);
    if (l.sourceState === 'changed' || l.sourceState === 'removed')
      errors.push(`${label}: resolve source changes.`);
  }
  return { ready: !errors.length, errors, warnings };
}

function controlPlanReadinessV2(
  d: CpDocumentV2,
  errors: string[],
  warnings: string[],
) {
  if (!d.operations.length) {
    errors.push('Add control strategies.');
    return { ready: false, errors, warnings };
  }

  let totalControls = 0;
  for (const [opIdx, op] of d.operations.entries()) {
    const opLabel = `Operation ${op.number || opIdx + 1}`;
    if (!op.number.trim()) errors.push(`${opLabel}: record operation number.`);
    if (!op.name.trim()) errors.push(`${opLabel}: record operation name.`);

    for (const [charIdx, char] of op.characteristics.entries()) {
      const charLabel = `${opLabel} Characteristic ${char.number || charIdx + 1}`;
      if (!char.name.trim()) errors.push(`${charLabel}: record characteristic name.`);
      if (char.kind === 'unspecified')
        errors.push(`${charLabel}: classify product/process characteristic.`);
      if (
        char.criteria.kind === 'unspecified' ||
        (!char.criteria.specification.trim() && !char.criteria.controlledReference?.trim())
      ) {
        errors.push(`${charLabel}: record specification or controlled reference.`);
      }

      for (const [ctrlIdx, ctrl] of char.controls.entries()) {
        totalControls++;
        const ctrlLabel = `${charLabel} Control ${ctrlIdx + 1}`;
        if (!ctrl.method.trim()) errors.push(`${ctrlLabel}: record control method.`);
        if (ctrl.controlType === 'unspecified')
          errors.push(`${ctrlLabel}: classify prevention/detection control.`);
        if (ctrl.controlType === 'detection' && !ctrl.evaluationMethod.trim())
          errors.push(`${ctrlLabel}: record evaluation technique.`);
        if (!ctrl.responsibility.trim())
          errors.push(`${ctrlLabel}: assign responsible owner.`);
        if (!ctrl.reaction.plan.trim() && !ctrl.reaction.procedure?.trim())
          errors.push(`${ctrlLabel}: document reaction plan or controlled procedure.`);

        // Execution rule checks
        if (ctrl.executionRule.mode === 'unspecified') {
          if (
            !ctrl.executionRule.legacySampleSize?.trim() ||
            !ctrl.executionRule.legacyFrequency?.trim() ||
            !ctrl.executionRule.legacyVolumeBasis?.trim()
          ) {
            errors.push(`${ctrlLabel}: record sampling quantity, frequency and volume basis, or reference the controlled system holding the details.`);
          }
        } else if (ctrl.executionRule.mode === 'count') {
          if (!ctrl.executionRule.sampleSize || ctrl.executionRule.sampleSize <= 0)
            errors.push(`${ctrlLabel}: count mode requires positive sample size.`);
          if (!ctrl.executionRule.frequency?.trim())
            errors.push(`${ctrlLabel}: count mode requires inspection frequency.`);
        } else if (ctrl.executionRule.mode === 'continuous') {
          if (!ctrl.executionRule.monitoredScope?.trim())
            errors.push(`${ctrlLabel}: continuous mode requires monitored scope.`);
        } else if (ctrl.executionRule.mode === 'controlled_reference') {
          if (!ctrl.executionRule.systemIdentity?.trim())
            errors.push(`${ctrlLabel}: controlled reference mode requires system identity.`);
        }
      }
    }
  }

  if (totalControls === 0) {
    errors.push('Add at least one control strategy.');
  }

  return { ready: !errors.length, errors, warnings };
}
