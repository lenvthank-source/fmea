export type JsonRecord = Record<string, unknown>;
const record = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
export interface NamedReference {
  id: string;
  name: string;
}
export interface LinkagePfmeaRow {
  id: string;
  revisionId: string;
  processStepId: string;
  rowNumber: string;
  severity: string;
  ap: string;
  functions: NamedReference[];
  failureModes: NamedReference[];
  effects: NamedReference[];
  causes: NamedReference[];
}
export interface LinkageControl {
  id: string;
  operationId: string;
  operationNumber: string;
  operationName: string;
  characteristicName: string;
  controlMethod: string;
  reactionPlan: string;
  sourceRevisionId: string;
  pfmeaRowId: string;
  sourceState: string;
}
export interface OperationContext {
  revisionId: string;
  steps: { id: string; stepNumber: string; name: string }[];
}
export function namedReferences(
  value: unknown,
  junction: string,
): NamedReference[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const outer = record(entry);
      const entity =
        outer[junction] && typeof outer[junction] === "object"
          ? record(outer[junction])
          : outer;
      return {
        id: String(entity.id ?? ""),
        name: String(entity.name ?? entity.narration ?? ""),
      };
    })
    .filter((entry) => entry.name || entry.id);
}
export function normalizePfmeaRows(
  value: unknown,
  revisionId: string,
): LinkagePfmeaRow[] {
  const values = Array.isArray(value) ? value : record(value).data;
  if (!Array.isArray(values))
    throw new Error("PFMEA response does not contain an analysis row list.");
  return values.map((value) => {
    const row = record(value);
    return {
      id: String(row.id ?? ""),
      revisionId,
      processStepId: String(row.processStepId ?? ""),
      rowNumber: String(row.rowNumber ?? ""),
      severity: String(row.severity ?? ""),
      ap: String(row.ap ?? ""),
      functions: namedReferences(row.functions, "function"),
      failureModes: namedReferences(row.failureModes, "failureMode"),
      effects: namedReferences(row.effects, "effect"),
      causes: namedReferences(row.causes, "cause"),
    };
  });
}
/** The canonical endpoint already adapts preserved legacy records; legacy input is supported for fixtures/imports. */
export function normalizeControls(value: unknown): LinkageControl[] {
  const payload = record(value);
  const document = record(payload.document);
  const values = Array.isArray(document.lines)
    ? document.lines
    : Array.isArray(value)
      ? value
      : payload.data;
  if (!Array.isArray(values))
    throw new Error("Control Plan response does not contain control lines.");
  return values.map((value) => {
    const row = record(value),
      source = record(row.source),
      step = record(row.processStep),
      characteristic = record(row.characteristic);
    return {
      id: String(row.id ?? ""),
      operationId: String(row.operationId ?? row.processStepId ?? ""),
      operationNumber: String(row.operationNumber ?? step.stepNumber ?? ""),
      operationName: String(row.operationName ?? step.name ?? ""),
      characteristicName: String(
        row.characteristicName ?? characteristic.name ?? "",
      ),
      controlMethod: String(row.controlMethod ?? ""),
      reactionPlan: String(row.reactionPlan ?? ""),
      sourceRevisionId: String(source.revisionId ?? ""),
      pfmeaRowId: String(source.pfmeaRowId ?? ""),
      sourceState: String(
        row.sourceState ?? (row.source ? "current" : "manual"),
      ),
    };
  });
}
export function controlsForPfmeaRow(
  controls: LinkageControl[],
  row: LinkagePfmeaRow,
): LinkageControl[] {
  return controls.filter(
    (control) =>
      control.pfmeaRowId === row.id &&
      control.sourceRevisionId === row.revisionId &&
      control.operationId === row.processStepId &&
      control.sourceState !== "removed",
  );
}
/** Revision and identity both matter. Never join on operation names or display numbers. */
export function controlOperationKey(
  control: LinkageControl,
  contexts: OperationContext[],
  baselineIds: string[],
): string | null {
  if (!control.operationId || control.sourceState === "removed") return null;
  if (control.sourceRevisionId) {
    const context = contexts.find(
      (context) => context.revisionId === control.sourceRevisionId,
    );
    return context?.steps.some((step) => step.id === control.operationId)
      ? `${context.revisionId}:${control.operationId}`
      : null;
  }
  const candidates = contexts.filter(
    (context) =>
      (!baselineIds.length || baselineIds.includes(context.revisionId)) &&
      context.steps.some((step) => step.id === control.operationId),
  );
  return candidates.length === 1
    ? `${candidates[0].revisionId}:${control.operationId}`
    : null;
}
