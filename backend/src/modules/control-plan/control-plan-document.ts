import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
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
  recordReference: string;
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
export interface CpDocument {
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
): CpDocument {
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
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
/** Backward-compatible v1 drafts: add blank optional authoring fields, never engineering values. */
export function normalizeCpDocument(value: unknown): CpDocument {
  if (!record(value) || value.schemaVersion !== 1)
    throw new BadRequestException('Unsupported control-plan document version.');
  const d = structuredClone(value);
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
  validateCpDocument(d);
  return d;
}
export function validateCpDocument(
  value: unknown,
): asserts value is CpDocument {
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
  document: CpDocument,
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
export function applyCpChanges(
  document: CpDocument,
  changes: CpChange[],
  decisions: {
    key: string;
    action: string;
    reason?: string;
    resolutions?: Record<string, 'source' | 'current'>;
  }[],
): CpDocument {
  const result = structuredClone(document),
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
  const d = value;
  // Public IATF SI25 Annex A.2 general data; stored values are never guessed.
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
  if (!d.config.standardProfile.trim())
    errors.push('Record standard/profile and edition.');
  if (
    !d.sourceBaselines.length &&
    !d.config.sourceExceptionJustification.trim()
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
      if (!l[k].trim())
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
