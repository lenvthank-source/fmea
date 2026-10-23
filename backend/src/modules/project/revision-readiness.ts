import { validatePfdGraph } from '../pfd/pfd-graph';

export interface RevisionReadinessInput {
  type: string;
  graph?: unknown;
  steps: { id: string; stepType: string }[];
  rows: { rowNumber: number; processStepId?: string | null; severity?: number | null; occurrence?: number | null; detection?: number | null; functions: unknown[]; requirements: unknown[]; failureModes: unknown[]; effects: unknown[]; causes: unknown[]; controls: unknown[] }[];
  controlRows?: { rowNumber: number; processStepId?: string | null; measurementMethod?: string | null; controlMethod?: string | null; reactionPlan?: string | null }[];
}
/** Product submission policy: drafts remain iterative; release artifacts must be coherent. */
export function revisionReadiness(input: RevisionReadinessInput) {
  const errors: string[] = [];
  if (input.type === 'PFD') {
    const graph = input.graph as { reviewStatus?: string } | null;
    if (!graph || graph.reviewStatus !== 'reviewed') errors.push('Review and save actual PFD topology before submission.');
    if (graph) errors.push(...validatePfdGraph(graph, input.steps));
  }
  if (['PFMEA','DFMEA'].includes(input.type)) {
    if (!input.rows.length) errors.push('Add at least one complete analysis row before submission.');
    for (const row of input.rows) {
      const label = `Row ${row.rowNumber}`;
      if (input.type === 'PFMEA' && !row.processStepId) errors.push(`${label}: link a manufacturing operation.`);
      for (const field of ['functions','requirements','failureModes','effects','causes','controls'] as const) {
        if (!row[field]?.length || row[field].some(value => !value || typeof (value as {name?:unknown}).name !== 'string' || !(value as {name:string}).name.trim())) errors.push(`${label}: ${field} missing or blank.`);
      }
      if ([row.severity,row.occurrence,row.detection].some(v => !Number.isInteger(v) || v! < 1 || v! > 10)) errors.push(`${label}: assign integer S/O/D ratings from 1 to 10.`);
    }
  }
  if (input.type === 'CONTROL_PLAN') {
    const cRows = input.controlRows || []; if (!cRows.length) errors.push('Add control-plan operations and controls before submission.');
    for (const row of cRows) {
      if (!row.processStepId) errors.push(`Control row ${row.rowNumber}: link a manufacturing operation.`);
      if (!row.measurementMethod?.trim() && !row.controlMethod?.trim()) errors.push(`Control row ${row.rowNumber}: record a control or measurement method.`);
      if (!row.reactionPlan?.trim()) errors.push(`Control row ${row.rowNumber}: record a reaction plan.`);
    }
  }
  return { ready: errors.length === 0, errors, warnings: ['Application completeness checks are product policy, not certification. Numerical AP handbook conformity remains unverified.'] };
}
