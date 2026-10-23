export const lineFields = [
  ["operationId", "Operation ID"],
  ["operationNumber", "Operation number"],
  ["operationName", "Operation name"],
  ["equipment", "Equipment / tooling"],
  ["characteristicId", "Characteristic ID"],
  ["characteristicNumber", "Characteristic number"],
  ["characteristicName", "Characteristic"],
  ["characteristicKind", "Characteristic kind"],
  ["classification", "Classification"],
  ["unit", "Unit"],
  ["specification", "Specification"],
  ["tolerance", "Tolerance"],
  ["evaluationMethod", "Evaluation technique"],
  ["gauge", "Gauge / measurement system"],
  ["sampleSize", "Sample quantity"],
  ["frequency", "Sampling frequency"],
  ["volumeBasis", "Volume basis"],
  ["controlMethod", "Control method"],
  ["controlType", "Control type"],
  ["responsible", "Responsible function"],
  ["reactionPlan", "Reaction actions"],
  ["reactionOwner", "Reaction owner"],
  ["reactionProcedure", "Reaction procedure"],
  ["recordReference", "Record reference"],
  ["containmentRationale", "Containment rationale"],
  ["passThrough", "Pass-through characteristic"],
  ["errorProofing", "Error-proofing confirmation"],
  ["reworkRepair", "Rework / repair control"],
  ["alternativeControl", "Alternative control"],
  ["systemReference", "Controlled system reference"],
  ["sourceRequirement", "Source requirement"],
  ["notes", "Notes"],
] as const;
export type LineField = (typeof lineFields)[number][0];
export type CpLine = Record<LineField, string> & {
  id: string;
  source?: {
    key: string;
    revisionId: string;
    snapshot: Record<string, string>;
    pfmeaRowId?: string;
    controlId?: string;
    characteristicId?: string;
    requirementId?: string;
  };
  sourceState?: string;
};
export interface CpDocumentV1 {
  schemaVersion: 1;
  config: {
    phase: string;
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
  sourceBaselines: { revisionId: string; type: string }[];
  sourceExclusions?: {
    key: string;
    revisionId: string;
    reason: string;
    sourceFingerprint: string;
  }[];
  lines: CpLine[];
}
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
    phase: string;
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
    type: string;
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

export type CpDocument = CpDocumentV2;
export type AnyCpDocument = CpDocumentV2;

export function isCpDocumentV2(doc: any): doc is CpDocumentV2 {
  return Boolean(doc && doc.schemaVersion === 2);
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

export function applyV1ToV2Conversion(doc: any): CpDocumentV2 {
  const v2: CpDocumentV2 = {
    schemaVersion: 2,
    config: {
      phase: doc?.config?.phase ?? 'unspecified',
      safeLaunch: structuredClone(doc?.config?.safeLaunch ?? {
        enabled: false,
        entryCriteria: '',
        exitCriteria: '',
        additionalControls: '',
      }),
      standardProfile: doc?.config?.standardProfile || 'fmeapex-cp-baseline-v1',
      customerRequirements: doc?.config?.customerRequirements || '',
      sourceExceptionJustification: doc?.config?.sourceExceptionJustification || '',
    },
    header: structuredClone(doc?.header ?? {}),
    sourceBaselines: (doc?.sourceBaselines ?? []).map((b: any) => ({
      revisionId: b.revisionId,
      type: b.type,
      capturedScope: 'revision',
    })),
    operations: [],
    sourceExclusions: structuredClone(doc?.sourceExclusions ?? []),
  };

  const lines: CpLine[] = Array.isArray(doc?.lines) ? doc.lines : [];
  const opGroups = new Map<string, CpLine[]>();
  for (const line of lines) {
    const key = line.operationId?.trim() || `op_${line.operationNumber?.trim() || 'unassigned'}`;
    if (!opGroups.has(key)) opGroups.set(key, []);
    opGroups.get(key)!.push(line);
  }

  let opOrder = 1;
  for (const [, opLines] of opGroups.entries()) {
    const first = opLines[0];
    const opId = first.operationId?.trim() ? first.operationId : `op_${first.operationNumber?.trim() || opOrder}`;
    const resources: CpResourceV2[] = [];
    const resourceTexts = new Set<string>();

    let resIdx = 1;
    for (const line of opLines) {
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
    for (const [lineIdx, line] of opLines.entries()) {
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
        controlType: (line.controlType as any) ?? 'unspecified',
        method: line.controlMethod ?? '',
        evaluationMethod: line.evaluationMethod ?? '',
        measurementEquipment: line.gauge ?? '',
        executionRule: {
          mode: 'unspecified',
          legacySampleSize: line.sampleSize ?? '',
          legacyFrequency: line.frequency ?? '',
          legacyVolumeBasis: line.volumeBasis ?? '',
        },
        reaction: {
          trigger: '',
          plan: line.reactionPlan ?? '',
          procedure: line.reactionProcedure ?? '',
          responsible: line.reactionOwner || line.responsible || '',
          containment: line.containmentRationale ?? '',
          recordReference: line.recordReference ?? '',
        },
        responsibility: line.responsible ?? '',
        recordReference: line.recordReference ?? '',
        sourceBindings,
        legacyFields: {
          notes: line.notes ?? '',
          passThrough: line.passThrough ?? '',
          errorProofing: line.errorProofing ?? '',
          reworkRepair: line.reworkRepair ?? '',
          alternativeControl: line.alternativeControl ?? '',
          systemReference: line.systemReference ?? '',
          sourceRequirement: line.sourceRequirement ?? '',
        },
      };

      const char: CpCharacteristicV2 = {
        id: charId,
        number: line.characteristicNumber ?? '',
        name: line.characteristicName ?? '',
        kind: (line.characteristicKind as any) ?? 'unspecified',
        classification: line.classification ?? '',
        criteria: {
          kind: line.specification || line.tolerance ? 'legacy_text' : 'unspecified',
          specification: line.specification ?? '',
          tolerance: line.tolerance ?? '',
          unit: line.unit ?? '',
        },
        sources: sourceBindings,
        controls: [ctrl],
      };
      characteristics.push(char);
    }

    v2.operations.push({
      id: opId,
      order: opOrder++,
      number: first.operationNumber ?? '',
      name: first.operationName ?? '',
      resources,
      characteristics,
    });
  }

  return v2;
}

export interface CpEnvelope {
  forkable?:boolean;
  revisionId: string;
  version: number;
  writable: boolean;
  document: AnyCpDocument;
  legacyReviewRequired: boolean;
}
export interface SyncPreview {
  expectedVersion: number;
  sourceRevisionId: string;
  sourceFingerprint: string;
  changes: {
    key: string;
    kind: "add" | "change" | "remove";
    candidate: CpLine;
    lineId?: string;
    conflicts: string[];
  }[];
  warnings: string[];
}
export function getDocLines(doc: AnyCpDocument | null | undefined): CpLine[] {
  if (!doc) return [];
  if ('lines' in (doc as any)) return ((doc as any).lines as CpLine[]) ?? [];
  const result: CpLine[] = [];
  for (const op of doc.operations ?? []) {
    for (const char of op.characteristics ?? []) {
      for (const ctrl of char.controls ?? []) {
        const line = blankLine();
        line.id = ctrl.id;
        line.operationId = op.id;
        line.operationNumber = op.number;
        line.operationName = op.name;
        line.equipment = op.resources?.map((r: CpResourceV2) => r.text).join(', ') ?? '';
        line.characteristicId = char.id;
        line.characteristicNumber = char.number;
        line.characteristicName = char.name;
        line.characteristicKind = char.kind;
        line.classification = char.classification;
        line.specification = char.criteria?.specification ?? '';
        line.tolerance = char.criteria?.tolerance ?? '';
        line.unit = char.criteria?.unit ?? '';
        line.controlMethod = ctrl.method;
        line.controlType = ctrl.controlType;
        line.evaluationMethod = ctrl.evaluationMethod;
        line.gauge = ctrl.measurementEquipment ?? '';
        line.sampleSize = ctrl.executionRule?.legacySampleSize ?? (ctrl.executionRule?.sampleSize ? String(ctrl.executionRule.sampleSize) : '');
        line.frequency = ctrl.executionRule?.legacyFrequency ?? ctrl.executionRule?.frequency ?? '';
        line.volumeBasis = ctrl.executionRule?.legacyVolumeBasis ?? ctrl.executionRule?.volumeBasis ?? '';
        line.reactionPlan = ctrl.reaction?.plan ?? '';
        line.reactionOwner = ctrl.reaction?.responsible ?? '';
        line.reactionProcedure = ctrl.reaction?.procedure ?? '';
        line.responsible = ctrl.responsibility;
        line.recordReference = ctrl.recordReference ?? '';
        result.push(line);
      }
    }
  }
  return result;
}

export const blankLine = (): CpLine =>
  ({
    ...Object.fromEntries(lineFields.map(([key]) => [key, ""])),
    id: crypto.randomUUID(),
    characteristicKind: "unspecified",
    controlType: "unspecified",
    sourceState: "manual",
  }) as CpLine;
export function validateImport(value: unknown): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== "object")
    return ["Expected a versioned Control Plan document."];
  const document = value as CpDocumentV2;
  if (
    document.schemaVersion !== 2 ||
    !document.config ||
    !document.config.safeLaunch ||
    !document.header ||
    !Array.isArray(document.operations) ||
    !Array.isArray(document.sourceBaselines)
  )
    return ["Invalid document structure or unsupported schema version."];
  if (
    !["prototype", "pre-launch", "production", "unspecified"].includes(
      document.config.phase,
    )
  )
    errors.push("Invalid plan phase.");
  if (
    typeof document.config.safeLaunch.enabled !== "boolean" ||
    ["entryCriteria", "exitCriteria", "additionalControls"].some(
      (key) =>
        typeof (
          document.config.safeLaunch as unknown as Record<string, unknown>
        )[key] !== "string",
    )
  )
    errors.push("Invalid safe-launch configuration.");
  if (
    [
      "standardProfile",
      "customerRequirements",
      "sourceExceptionJustification",
    ].some(
      (key) =>
        typeof (document.config as unknown as Record<string, unknown>)[key] !==
        "string",
    ) ||
    Object.values(document.header).some((value) => typeof value !== "string")
  )
    errors.push("Invalid header or standard configuration.");

  const opIds = new Set<string>();
  const charIds = new Set<string>();
  const ctrlIds = new Set<string>();

  document.sourceBaselines.forEach((baseline, index) => {
    if (
      !baseline ||
      typeof baseline.revisionId !== "string" ||
      !baseline.revisionId ||
      !["PFD", "PFMEA"].includes(baseline.type)
    )
      errors.push(
        `Source baseline ${index + 1}: valid revision and document type required.`,
      );
  });

  document.operations.forEach((op, opIdx) => {
    if (!op || typeof op.id !== "string" || !op.id || opIds.has(op.id)) {
      errors.push(`Operation ${opIdx + 1}: missing or duplicate identity.`);
      return;
    }
    opIds.add(op.id);
    op.characteristics?.forEach((char, charIdx) => {
      if (!char || typeof char.id !== "string" || !char.id || charIds.has(char.id)) {
        errors.push(`Operation ${opIdx + 1}, Characteristic ${charIdx + 1}: missing or duplicate identity.`);
        return;
      }
      charIds.add(char.id);
      char.controls?.forEach((ctrl, ctrlIdx) => {
        if (!ctrl || typeof ctrl.id !== "string" || !ctrl.id || ctrlIds.has(ctrl.id)) {
          errors.push(`Operation ${opIdx + 1}, Control ${ctrlIdx + 1}: missing or duplicate identity.`);
          return;
        }
        ctrlIds.add(ctrl.id);
      });
    });
  });

  if (document.sourceExclusions !== undefined) {
    if (!Array.isArray(document.sourceExclusions))
      errors.push("Source exclusions must be a list.");
    else
      document.sourceExclusions.forEach((entry, index) => {
        if (
          !entry ||
          ["key", "revisionId", "reason", "sourceFingerprint"].some(
            (key) =>
              typeof (entry as Record<string, unknown>)[key] !== "string",
          ) ||
          !entry.reason.trim()
        )
          errors.push(
            `Source exclusion ${index + 1}: a source identity and reason are required.`,
          );
      });
  }
  return errors;
}

/** An edited worksheet retains explicit identities; never silently remap linked controls. */
export function importControlRows(rows: Record<string, unknown>[]): CpLine[] {
  return rows.map((row) => ({
    ...blankLine(),
    ...(row["Line ID"] ? { id: String(row["Line ID"]) } : {}),
    ...Object.fromEntries(
      lineFields.map(([key, label]) => [key, String(row[label] ?? "")]),
    ),
    ...(row["Source provenance"]
      ? { source: JSON.parse(String(row["Source provenance"])) }
      : {}),
    ...(row["Source review state"]
      ? { sourceState: String(row["Source review state"]) }
      : {}),
  }));
}

export const editorSections = [
  {
    title: "Operation and characteristic",
    description:
      "Identify what is controlled and the actual engineering requirement.",
    fields: [
      "operationNumber",
      "operationName",
      "equipment",
      "characteristicNumber",
      "characteristicName",
      "characteristicKind",
      "classification",
      "unit",
      "specification",
      "tolerance",
      "sourceRequirement",
    ],
  },
  {
    title: "Control and evaluation",
    description:
      "Define the method, measurement system and justified sampling basis.",
    fields: [
      "controlType",
      "controlMethod",
      "evaluationMethod",
      "gauge",
      "sampleSize",
      "frequency",
      "volumeBasis",
      "responsible",
      "recordReference",
    ],
  },
  {
    title: "Reaction and additional controls",
    description:
      "Define who responds, containment and applicable special controls.",
    fields: [
      "reactionPlan",
      "reactionOwner",
      "reactionProcedure",
      "containmentRationale",
      "passThrough",
      "errorProofing",
      "reworkRepair",
      "alternativeControl",
      "systemReference",
      "notes",
    ],
  },
] as const;
