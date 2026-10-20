import {
  validateFailureReferences,
  failureReferenceIssues,
} from "./dfmea-failure-references";
/** Revision-owned design analysis. Ratings are engineering input; no unlicensed AP table is implied. */
export interface DesignElement {
  id: string;
  parentId: string | null;
  kind: "system" | "subsystem" | "component";
  name: string;
  description: string;
}
export interface DesignFunction {
  id: string;
  elementId: string;
  text: string;
  requirement: string;
}
export interface DesignLink {
  id: string;
  sourceId: string;
  targetId: string;
  description: string;
}
export interface DesignAction {
  id: string;
  type: "prevention" | "detection";
  description: string;
  owner: string;
  targetDate: string;
  status: "open" | "in_progress" | "completed" | "verified";
  taken: string;
  completionDate: string;
  evidence: string;
  decision: string;
  revisedOccurrence: number | null;
  revisedDetection: number | null;
}
export interface DesignEffect {
  id: string;
  elementId: string | null;
  text: string;
  severity: number | null;
}
export interface DesignCause {
  id: string;
  elementId: string | null;
  text: string;
  preventionControl: string;
  detectionControl: string;
  occurrence: number | null;
  detection: number | null;
  actions: DesignAction[];
}
export interface DesignChain {
  id: string;
  focusElementId: string;
  functionId: string;
  mode: string;
  effects: DesignEffect[];
  causes: DesignCause[];
  reviewDecision: string;
  specialCharacteristicRefs: {
    id: string;
    characteristic: string;
    classification: string;
    source: string;
    reviewedBy: string;
  }[];
}
export interface DfmeaData {
  failureReferences?: {
    id: string;
    sourceChainId: string;
    sourceRole: "mode" | "effect";
    sourceFailureId: string;
    targetChainId: string;
    targetRole: "effect" | "cause";
    targetFailureId: string;
    snapshot: {
      text: string;
      severity: number | null;
      elementId: string | null;
    };
    reviewedBy: string;
    decision: string;
  }[];
  scopeExclusions?: { elementId: string; reason: string }[];
  downstreamLinks?: {
    designCharacteristicId: string;
    targetRevisionId: string;
    targetCharacteristicId: string;
    reviewDecision: string;
  }[];
  legacyMappings?: { sourceRowId: string; chainId: string }[];
  schemaVersion: 1;
  planning: {
    scope: string;
    boundary: string;
    team: string;
    timing: string;
    criteriaProfile: string;
  };
  elements: DesignElement[];
  functions: DesignFunction[];
  functionLinks: DesignLink[];
  interfaces: DesignLink[];
  parameterContext: {
    idealFunction: string;
    inputs: string;
    outputs: string;
    noiseFactors: string;
    controlFactors: string;
  };
  chains: DesignChain[];
}
export const emptyDfmea = (): DfmeaData => ({
  schemaVersion: 1,
  planning: {
    scope: "",
    boundary: "",
    team: "",
    timing: "",
    criteriaProfile: "",
  },
  elements: [],
  functions: [],
  functionLinks: [],
  interfaces: [],
  parameterContext: {
    idealFunction: "",
    inputs: "",
    outputs: "",
    noiseFactors: "",
    controlFactors: "",
  },
  chains: [],
});

/** Strict shape and referential integrity checks allow incomplete, but never internally corrupt, drafts. */
export function validateDfmea(value: unknown): string[] {
  const errors: string[] = [];
  const obj = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  const exact = (
    v: unknown,
    keys: string[],
    label: string,
  ): v is Record<string, unknown> => {
    if (!obj(v)) {
      errors.push(`${label}: object required.`);
      return false;
    }
    for (const key of Object.keys(v))
      if (!keys.includes(key)) errors.push(`${label}: unknown field ${key}.`);
    for (const key of keys)
      if (!(key in v)) errors.push(`${label}: missing field ${key}.`);
    return true;
  };
  const str = (v: unknown, label: string, max = 10000) => {
    if (typeof v !== "string" || v.length > max)
      errors.push(`${label}: text up to ${max} characters required.`);
  };
  const rating = (v: unknown, label: string) => {
    if (v !== null && (!Number.isInteger(v) || Number(v) < 1 || Number(v) > 10))
      errors.push(`${label}: null or integer 1–10 required.`);
  };
  const array = (v: unknown, label: string): unknown[] => {
    if (!Array.isArray(v) || v.length > 2000) {
      errors.push(`${label}: array of at most 2000 records required.`);
      return [];
    }
    return v;
  };
  if (
    !exact(
      value,
      [
        "schemaVersion",
        "planning",
        "elements",
        "functions",
        "functionLinks",
        "interfaces",
        "parameterContext",
        "chains",
        ...(obj(value) && "failureReferences" in value
          ? ["failureReferences"]
          : []),
        ...(obj(value) && "scopeExclusions" in value
          ? ["scopeExclusions"]
          : []),
        ...(obj(value) && "legacyMappings" in value ? ["legacyMappings"] : []),
        ...(obj(value) && "downstreamLinks" in value
          ? ["downstreamLinks"]
          : []),
      ],
      "Document",
    )
  )
    return errors;
  if (value.schemaVersion !== 1)
    errors.push("Unsupported DFMEA schema version.");
  for (const [key, keys] of Object.entries({
    planning: ["scope", "boundary", "team", "timing", "criteriaProfile"],
    parameterContext: [
      "idealFunction",
      "inputs",
      "outputs",
      "noiseFactors",
      "controlFactors",
    ],
  })) {
    const v = value[key];
    if (exact(v, keys, key)) for (const k of keys) str(v[k], `${key}.${k}`);
  }
  const allIds = new Set<string>();
  const identify = (v: Record<string, unknown>, label: string) => {
    str(v.id, `${label}.id`, 100);
    if (typeof v.id !== "string" || !v.id.trim())
      errors.push(`${label}: nonempty ID required.`);
    else if (allIds.has(v.id)) errors.push(`${label}: duplicate ID ${v.id}.`);
    else allIds.add(v.id);
  };
  const elements = array(value.elements, "Elements").filter(
    (v): v is Record<string, unknown> =>
      exact(v, ["id", "parentId", "kind", "name", "description"], "Element"),
  );
  const elementIds = new Set(elements.map((e) => e.id));
  if (value.scopeExclusions !== undefined) {
    const excluded = new Set<unknown>();
    for (const exclusion of array(value.scopeExclusions, "Scope exclusions")) {
      if (!exact(exclusion, ["elementId", "reason"], "Scope exclusion"))
        continue;
      if (!elementIds.has(exclusion.elementId))
        errors.push("Scope exclusion element does not exist.");
      if (excluded.has(exclusion.elementId))
        errors.push("Scope exclusion element must be unique.");
      excluded.add(exclusion.elementId);
      str(exclusion.reason, "Scope exclusion reason");
    }
  }
  for (const e of elements) {
    identify(e, "Element");
    str(e.name, "Element name", 500);
    str(e.description, "Element description");
    if (!["system", "subsystem", "component"].includes(String(e.kind)))
      errors.push("Invalid element kind.");
    if (e.parentId !== null && !elementIds.has(e.parentId))
      errors.push("Element parent does not exist.");
    const seen = new Set<unknown>([e.id]);
    let parent = e.parentId;
    while (parent !== null && elementIds.has(parent)) {
      if (seen.has(parent)) {
        errors.push("Design hierarchy must not contain cycles.");
        break;
      }
      seen.add(parent);
      parent = elements.find((x) => x.id === parent)?.parentId ?? null;
    }
  }
  const functions = array(value.functions, "Functions").filter(
    (v): v is Record<string, unknown> =>
      exact(v, ["id", "elementId", "text", "requirement"], "Function"),
  );
  const functionIds = new Set(functions.map((f) => f.id));
  for (const f of functions) {
    identify(f, "Function");
    if (!elementIds.has(f.elementId))
      errors.push("Function element does not exist.");
    str(f.text, "Function text");
    str(f.requirement, "Function requirement");
  }
  for (const key of ["interfaces", "functionLinks"])
    for (const raw of array(value[key], key)) {
      if (!exact(raw, ["id", "sourceId", "targetId", "description"], key))
        continue;
      identify(raw, key);
      str(raw.description, `${key} description`);
      const ids = key === "interfaces" ? elementIds : functionIds;
      if (
        !ids.has(raw.sourceId) ||
        !ids.has(raw.targetId) ||
        raw.sourceId === raw.targetId
      )
        errors.push(`${key}: two distinct existing endpoints required.`);
    }
  const elementRef = (v: unknown, label: string) => {
    if (v !== null && !elementIds.has(v))
      errors.push(`${label}: unknown design element.`);
  };
  for (const raw of array(value.chains, "Chains")) {
    if (
      !exact(
        raw,
        [
          "id",
          "focusElementId",
          "functionId",
          "mode",
          "effects",
          "causes",
          "reviewDecision",
          "specialCharacteristicRefs",
        ],
        "Chain",
      )
    )
      continue;
    identify(raw, "Chain");
    str(raw.mode, "Failure mode");
    str(raw.reviewDecision, "Team review decision");
    if (!elementIds.has(raw.focusElementId))
      errors.push("Chain focus element does not exist.");
    if (
      !functions.some(
        (f) => f.id === raw.functionId && f.elementId === raw.focusElementId,
      )
    )
      errors.push("Chain function must belong to its focus element.");
    for (const ref of array(
      raw.specialCharacteristicRefs,
      "Characteristic references",
    )) {
      if (
        !exact(
          ref,
          ["id", "characteristic", "classification", "source", "reviewedBy"],
          "Characteristic reference",
        )
      )
        continue;
      identify(ref, "Characteristic reference");
      for (const key of [
        "characteristic",
        "classification",
        "source",
        "reviewedBy",
      ])
        str(ref[key], key);
    }
    for (const effect of array(raw.effects, "Effects")) {
      if (!exact(effect, ["id", "elementId", "text", "severity"], "Effect"))
        continue;
      identify(effect, "Effect");
      elementRef(effect.elementId, "Effect");
      str(effect.text, "Effect text");
      rating(effect.severity, "Severity");
    }
    for (const cause of array(raw.causes, "Causes")) {
      if (
        !exact(
          cause,
          [
            "id",
            "elementId",
            "text",
            "preventionControl",
            "detectionControl",
            "occurrence",
            "detection",
            "actions",
          ],
          "Cause",
        )
      )
        continue;
      identify(cause, "Cause");
      elementRef(cause.elementId, "Cause");
      for (const k of ["text", "preventionControl", "detectionControl"])
        str(cause[k], `Cause ${k}`);
      rating(cause.occurrence, "Occurrence");
      rating(cause.detection, "Detection");
      for (const action of array(cause.actions, "Actions")) {
        if (
          !exact(
            action,
            [
              "id",
              "type",
              "description",
              "owner",
              "targetDate",
              "status",
              "taken",
              "completionDate",
              "evidence",
              "decision",
              "revisedOccurrence",
              "revisedDetection",
            ],
            "Action",
          )
        )
          continue;
        identify(action, "Action");
        for (const k of [
          "description",
          "owner",
          "targetDate",
          "taken",
          "completionDate",
          "evidence",
          "decision",
        ])
          str(action[k], `Action ${k}`);
        if (!["prevention", "detection"].includes(String(action.type)))
          errors.push("Invalid action type.");
        if (
          !["open", "in_progress", "completed", "verified"].includes(
            String(action.status),
          )
        )
          errors.push("Invalid action status.");
        rating(action.revisedOccurrence, "Revised occurrence");
        rating(action.revisedDetection, "Revised detection");
        for (const k of ["targetDate", "completionDate"])
          if (
            typeof action[k] === "string" &&
            action[k] &&
            (!/^\d{4}-\d{2}-\d{2}$/.test(action[k] as string) ||
              !Number.isFinite(
                Date.parse((action[k] as string) + "T00:00:00Z"),
              ) ||
              new Date((action[k] as string) + "T00:00:00Z")
                .toISOString()
                .slice(0, 10) !== action[k])
          )
            errors.push(`Action ${k}: ISO date required.`);
        if (
          action.status === "verified" &&
          [
            "description",
            "owner",
            "targetDate",
            "taken",
            "completionDate",
            "evidence",
            "decision",
          ].some(
            (k) =>
              typeof action[k] !== "string" || !(action[k] as string).trim(),
          )
        )
          errors.push(
            "Verified action requires description, owner, target date, results, completion date, evidence and effectiveness decision.",
          );
        if (
          (action.revisedOccurrence !== null ||
            action.revisedDetection !== null) &&
          action.status !== "verified"
        )
          errors.push("Revised ratings require verified action and evidence.");
      }
    }
  }
  if (value.legacyMappings !== undefined)
    for (const mapping of array(value.legacyMappings, "Legacy mappings")) {
      if (!exact(mapping, ["sourceRowId", "chainId"], "Legacy mapping"))
        continue;
      str(mapping.sourceRowId, "Legacy source row", 100);
      if (
        !Array.isArray(value.chains) ||
        !value.chains.some(
          (chain: unknown) => obj(chain) && chain.id === mapping.chainId,
        )
      )
        errors.push("Legacy mapping analysis does not exist.");
    }
  if (value.downstreamLinks !== undefined)
    for (const link of array(value.downstreamLinks, "Downstream links")) {
      if (
        !exact(
          link,
          [
            "designCharacteristicId",
            "targetRevisionId",
            "targetCharacteristicId",
            "reviewDecision",
          ],
          "Downstream link",
        )
      )
        continue;
      for (const field of [
        "designCharacteristicId",
        "targetRevisionId",
        "targetCharacteristicId",
        "reviewDecision",
      ])
        str(link[field], field);
      if (
        !Array.isArray(value.chains) ||
        !value.chains.some(
          (chain: unknown) =>
            obj(chain) &&
            Array.isArray(chain.specialCharacteristicRefs) &&
            chain.specialCharacteristicRefs.some(
              (ref: unknown) =>
                obj(ref) && ref.id === link.designCharacteristicId,
            ),
        )
      )
        errors.push(
          "Downstream link requires an existing design characteristic",
        );
      if (
        Boolean(link.targetRevisionId) !== Boolean(link.targetCharacteristicId)
      )
        errors.push("Select both downstream revision and characteristic");
    }
  if (value.failureReferences !== undefined) {
    for (const ref of array(value.failureReferences, "Failure references"))
      if (obj(ref)) identify(ref, "Failure reference");
  }
  if (!errors.length)
    errors.push(...validateFailureReferences(value as unknown as DfmeaData));
  return [...new Set(errors)];
}

export function dfmeaReadiness(data: DfmeaData) {
  const errors = validateDfmea(data);
  if (errors.length)
    return {
      ready: false,
      errors,
      warnings: ["Repair document integrity before review."],
    };
  for (const key of [
    "scope",
    "boundary",
    "team",
    "timing",
    "criteriaProfile",
  ] as const)
    if (!data.planning[key]?.trim()) errors.push(`Planning: record ${key}.`);
  if (!data.elements.length) errors.push("Add design structure.");
  for (const exclusion of data.scopeExclusions ?? [])
    if (!exclusion.reason.trim())
      errors.push(
        `${data.elements.find((e) => e.id === exclusion.elementId)?.name || exclusion.elementId}: scope exclusion requires a documented reason.`,
      );
  for (const e of data.elements) {
    if (!e.name.trim()) errors.push("Name every design element.");
    if (
      !data.functions.some((f) => f.elementId === e.id) &&
      !data.scopeExclusions?.some(
        (x) => x.elementId === e.id && x.reason.trim(),
      )
    )
      errors.push(
        `${e.name || e.id}: add a function for this element in the authored analysis structure.`,
      );
  }
  for (const f of data.functions) {
    if (!f.text.trim() || !f.requirement.trim())
      errors.push("Functions need measurable requirements.");
    if (!data.chains.some((c) => c.functionId === f.id))
      errors.push(`${f.text || f.id}: failure analysis missing.`);
  }
  if (!data.chains.length) errors.push("Add failure analysis.");
  errors.push(...failureReferenceIssues(data));
  for (const c of data.chains) {
    if (!c.mode.trim() || !c.effects.length || !c.causes.length)
      errors.push(`${c.mode || c.id}: mode, effects and causes required.`);
    for (const reference of c.specialCharacteristicRefs) {
      const links = (data.downstreamLinks ?? []).filter(
        (l) => l.designCharacteristicId === reference.id,
      );
      if (
        !links.some(
          (l) =>
            l.reviewDecision.trim() &&
            ((l.targetRevisionId && l.targetCharacteristicId) ||
              l.reviewDecision.trim()),
        )
      )
        errors.push(
          `${c.mode || c.id}: review downstream coverage or exclusion for ${reference.characteristic || reference.id}.`,
        );
    }
    if (c.effects.some((e) => !e.text.trim() || e.severity === null))
      errors.push(`${c.mode}: complete effects and severity.`);
    if (
      c.causes.some(
        (x) =>
          !x.text.trim() ||
          !x.preventionControl.trim() ||
          !x.detectionControl.trim() ||
          x.occurrence === null ||
          x.detection === null,
      )
    )
      errors.push(`${c.mode}: complete each cause, controls and O/D.`);
    for (const cause of c.causes)
      if (
        cause.actions.some(
          (a) =>
            a.status === "verified" &&
            (a.revisedOccurrence === null) !== (a.revisedDetection === null),
        ) &&
        !cause.actions.some(
          (a) =>
            a.status === "verified" &&
            a.revisedOccurrence !== null &&
            a.revisedDetection !== null,
        )
      )
        errors.push(
          `${c.mode || c.id}: action reassessment for cause ${cause.id} is historical/partial and needs a complete reviewed O/D snapshot before release.`,
        );
    for (const cause of c.causes)
      for (const action of cause.actions) {
        if (
          !action.description.trim() ||
          !action.owner.trim() ||
          !action.targetDate.trim()
        )
          errors.push(
            `${c.mode || c.id}: action ${action.id} needs description, responsible person and target date.`,
          );
        if (
          action.status === "completed" &&
          (!action.taken.trim() || !action.completionDate.trim())
        )
          errors.push(
            `${c.mode || c.id}: completed action ${action.id} needs results and completion date before review.`,
          );
      }
    for (const ref of c.specialCharacteristicRefs)
      if (
        [
          ref.characteristic,
          ref.classification,
          ref.source,
          ref.reviewedBy,
        ].some((value) => !value.trim())
      )
        errors.push(
          `${c.mode || c.id}: complete characteristic, customer classification, source and reviewer for ${ref.id}.`,
        );
  }
  return {
    ready: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [
      "Calculated AP uses legacy-configured-unverified criteria; independent handbook verification is pending.",
      "Completeness checks are application review policy; the engineering team remains responsible for analysis and applicable customer requirements.",
    ],
  };
}
