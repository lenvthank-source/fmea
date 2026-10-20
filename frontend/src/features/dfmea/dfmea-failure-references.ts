import type { DfmeaData } from "./dfmeaDocument";
export type FailureReference = NonNullable<
  DfmeaData["failureReferences"]
>[number];
/** Roles are contextual to the explicitly selected analysis, not inferred from matching narration. */
export function failureReferenceSource(data: DfmeaData, ref: FailureReference) {
  const chain = data.chains.find((c) => c.id === ref.sourceChainId);
  if (!chain) return null;
  if (ref.sourceRole === "mode")
    return ref.sourceFailureId === chain.id
      ? { text: chain.mode, severity: null, elementId: chain.focusElementId }
      : null;
  const effect = chain.effects.find((e) => e.id === ref.sourceFailureId);
  return effect
    ? {
        text: effect.text,
        severity: effect.severity,
        elementId: effect.elementId,
      }
    : null;
}
export function failureReferenceTarget(data: DfmeaData, ref: FailureReference) {
  const chain = data.chains.find((c) => c.id === ref.targetChainId);
  return ref.targetRole === "effect"
    ? chain?.effects.find((e) => e.id === ref.targetFailureId)
    : chain?.causes.find((c) => c.id === ref.targetFailureId);
}
export function failureReferenceChanged(
  data: DfmeaData,
  ref: FailureReference,
) {
  const source = failureReferenceSource(data, ref);
  return (
    !source ||
    source.text !== ref.snapshot.text ||
    source.severity !== ref.snapshot.severity ||
    source.elementId !== ref.snapshot.elementId
  );
}
export function validateFailureReferences(data: DfmeaData): string[] {
  const errors: string[] = [];
  const targets = new Set<string>();
  const edges = new Map<string, string[]>();
  const object = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);
  for (const ref of data.failureReferences ?? []) {
    if (!object(ref)) {
      errors.push("Failure reference: object required.");
      continue;
    }
    const keys = [
      "id",
      "sourceChainId",
      "sourceRole",
      "sourceFailureId",
      "targetChainId",
      "targetRole",
      "targetFailureId",
      "snapshot",
      "reviewedBy",
      "decision",
    ];
    if (
      Object.keys(ref).some((k) => !keys.includes(k)) ||
      keys.some((k) => !(k in ref))
    ) {
      errors.push("Failure reference: unsupported or missing fields.");
      continue;
    }
    if (
      keys
        .filter((k) => k !== "snapshot")
        .some(
          (k) =>
            typeof (ref as unknown as Record<string, unknown>)[k] !==
              "string" ||
            ((ref as unknown as Record<string, unknown>)[k] as string).length >
              10000,
        )
    ) {
      errors.push("Failure reference: text fields required.");
      continue;
    }
    if (
      !["mode", "effect"].includes(ref.sourceRole) ||
      !["effect", "cause"].includes(ref.targetRole)
    ) {
      errors.push("Failure reference: invalid contextual role.");
      continue;
    }
    const snapshot = ref.snapshot;
    if (
      !object(snapshot) ||
      Object.keys(snapshot).some(
        (k) => !["text", "severity", "elementId"].includes(k),
      ) ||
      typeof snapshot.text !== "string" ||
      snapshot.text.length > 10000 ||
      !(
        snapshot.elementId === null || typeof snapshot.elementId === "string"
      ) ||
      !(
        snapshot.severity === null ||
        (Number.isInteger(snapshot.severity) &&
          Number(snapshot.severity) >= 1 &&
          Number(snapshot.severity) <= 10)
      )
    ) {
      errors.push("Failure reference: valid reviewed snapshot required.");
      continue;
    }
    if (ref.sourceChainId === ref.targetChainId)
      errors.push("Failure reference must connect distinct analyses.");
    if (
      !failureReferenceSource(data, ref) ||
      !failureReferenceTarget(data, ref)
    )
      errors.push(
        "Failure reference endpoint does not exist in this design revision.",
      );
    const key =
      ref.targetChainId + ":" + ref.targetRole + ":" + ref.targetFailureId;
    if (targets.has(key))
      errors.push(
        "Failure record can have only one explicit source reference.",
      );
    targets.add(key);
    const sourceIdentity =
      ref.sourceChainId + ":" + ref.sourceRole + ":" + ref.sourceFailureId;
    edges.set(sourceIdentity, [...(edges.get(sourceIdentity) ?? []), key]);
  }
  const done = new Set<string>(),
    active = new Set<string>();
  const visit = (id: string): boolean => {
    if (active.has(id)) return true;
    if (done.has(id)) return false;
    active.add(id);
    if ((edges.get(id) ?? []).some(visit)) return true;
    active.delete(id);
    done.add(id);
    return false;
  };
  if ([...edges.keys()].some(visit))
    errors.push(
      "Failure-reference dependency cycle requires review; circular snapshot dependencies are not allowed (product policy).",
    );
  return [...new Set(errors)];
}
export function failureReferenceIssues(data: DfmeaData) {
  const errors: string[] = [];
  for (const ref of data.failureReferences ?? []) {
    const chain = data.chains.find((c) => c.id === ref.targetChainId);
    const label = chain?.mode || ref.targetChainId;
    const target = failureReferenceTarget(data, ref);
    if (!ref.reviewedBy.trim() || !ref.decision.trim())
      errors.push(
        `${label}: failure reference ${ref.id} needs reviewer and decision.`,
      );
    if (failureReferenceChanged(data, ref))
      errors.push(
        `${label}: source failure changed; review proposal ${ref.id} before submission.`,
      );
    else if (
      target &&
      (target.text !== ref.snapshot.text ||
        target.elementId !== ref.snapshot.elementId ||
        (ref.sourceRole === "effect" &&
          ref.targetRole === "effect" &&
          "severity" in target &&
          target.severity !== ref.snapshot.severity))
    )
      errors.push(
        `${label}: referenced failure ${ref.id} differs from its accepted snapshot; explicitly review or remove the reference.`,
      );
  }
  return errors;
}
/** Explicit acceptance updates one target in this writable revision. It never visits other records/revisions. */
export function acceptFailureReference(
  data: DfmeaData,
  referenceId: string,
  reviewedBy: string,
  decision: string,
): DfmeaData {
  if (!reviewedBy.trim() || !decision.trim())
    throw new Error("Reviewer and decision required.");
  const next = structuredClone(data);
  const ref = next.failureReferences?.find((r) => r.id === referenceId);
  if (!ref) throw new Error("Failure reference not found.");
  const source = failureReferenceSource(next, ref),
    target = failureReferenceTarget(next, ref);
  if (!source || !target)
    throw new Error("Failure reference endpoint not found.");
  target.text = source.text;
  target.elementId = source.elementId;
  if (
    ref.sourceRole === "effect" &&
    ref.targetRole === "effect" &&
    "severity" in target
  )
    target.severity = source.severity;
  ref.snapshot = { ...source };
  ref.reviewedBy = reviewedBy;
  ref.decision = decision;
  const errors = validateFailureReferences(next);
  if (errors.length) throw new Error(errors.join(" "));
  return next;
}
