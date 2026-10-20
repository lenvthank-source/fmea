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
export interface CpDocument {
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
export interface CpEnvelope {
  forkable?:boolean;
  revisionId: string;
  version: number;
  writable: boolean;
  document: CpDocument;
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
  const document = value as CpDocument;
  if (
    document.schemaVersion !== 1 ||
    !document.config ||
    !document.config.safeLaunch ||
    !document.header ||
    !Array.isArray(document.lines) ||
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
  const ids = new Set<string>();
  const sourceKeys = new Set<string>();
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
  document.lines.forEach((line, index) => {
    if (!line || typeof line.id !== "string" || !line.id || ids.has(line.id)) {
      errors.push(`Line ${index + 1}: missing or duplicate identity.`);
      return;
    }
    ids.add(line.id);
    if (line.source) {
      const source = line.source;
      if (
        typeof source.key !== "string" ||
        !source.key ||
        typeof source.revisionId !== "string" ||
        !source.revisionId ||
        !source.snapshot ||
        typeof source.snapshot !== "object" ||
        Array.isArray(source.snapshot) ||
        Object.values(source.snapshot).some(
          (value) => typeof value !== "string",
        )
      )
        errors.push(`Line ${index + 1}: invalid source provenance.`);
      if (sourceKeys.has(source.key))
        errors.push(`Line ${index + 1}: duplicate source mapping.`);
      sourceKeys.add(source.key);
    }
    if (
      line.sourceState &&
      !["current", "changed", "removed", "manual"].includes(line.sourceState)
    )
      errors.push(`Line ${index + 1}: invalid source review state.`);
    lineFields.forEach(([key, label]) => {
      if (typeof line[key] !== "string")
        errors.push(`Line ${index + 1}: ${label} must be text.`);
    });
    if (
      !["product", "process", "unspecified"].includes(
        line.characteristicKind,
      ) ||
      !["prevention", "detection", "unspecified"].includes(line.controlType)
    )
      errors.push(
        `Line ${index + 1}: invalid characteristic or control category.`,
      );
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
