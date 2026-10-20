import catalog from '../symbols/pfd-symbols.json' with { type: 'json' };

export type PfdSymbolMode = 'manufacturing' | 'engineering';
export interface PfdSymbol {
  id: string; label: string; category: string; aliases: string[]; svg: string;
  ports: Record<'north' | 'east' | 'south' | 'west', number[]>;
  viewBox: string; kind: 'manufacturing' | 'engineering' | 'basic' | 'arrow' | 'annotation';
  activityTypes?: string[];
}
export const PFD_SYMBOLS = catalog as PfdSymbol[];
export const CLASSIC_MANUFACTURING_IDS = [
  'manufacturing.classic.operation',
  'manufacturing.classic.inspection',
  'manufacturing.classic.transport',
  'manufacturing.classic.storage',
  'manufacturing.classic.decision',
  'manufacturing.classic.rework',
  'manufacturing.classic.combined',
] as const;

export function getClassicManufacturingSymbol(stepType: string): PfdSymbol | undefined {
  return getPfdSymbol(`manufacturing.classic.${stepType}`) || getPfdSymbol(`manufacturing.${stepType}`);
}

export function getMarkerSymbol(marker: string): PfdSymbol | undefined {
  return getPfdSymbol(`marker.${marker.toLowerCase()}`);
}

export function getPfdSymbol(id?: string | null): PfdSymbol | undefined {
  return id ? PFD_SYMBOLS.find(symbol => symbol.id === id) : undefined;
}
export function isManufacturingSymbolCompatible(id: string | null | undefined, stepType: string): boolean {
  if (!id) return true;
  const symbol = getPfdSymbol(id);
  return symbol?.kind === 'manufacturing' && !!symbol.activityTypes?.includes(stepType);
}
export function isEngineeringSymbol(id: string | null | undefined): boolean {
  if (!id) return true;
  return getPfdSymbol(id)?.kind === 'engineering';
}
interface SymbolStep {
  stepType?: string; manufacturingSymbolId?: string | null; engineeringSymbolId?: string | null;
  flowIcons?: Record<string, boolean> | null;
}
/** Read-only translation. WIP/reject annotate a route and never classify an operation. */
export function legacyManufacturingSymbol(icons: Record<string, boolean> = {}) {
  const activities = [icons.oper && 'operation', icons.insp && 'inspection', icons.trans && 'transport',
    (icons.store || icons.recArea) && 'storage', icons.decs && 'decision', icons.rework && 'rework'].filter(Boolean) as string[];
  const activity = activities.length === 2 && activities.includes('operation') && activities.includes('inspection')
    ? 'combined' : activities.length === 1 ? activities[0] : null;
  return { id: activity ? `manufacturing.${activity}` : null, ambiguous: activities.length > 1 && activity !== 'combined',
    annotations: ['wip', 'reject'].filter(key => icons[key]) };
}

/** Synchronizes flowIcons boolean flags upon an explicit engineering edit. */
export function syncFlowIcons(
  existing: Record<string, boolean> = {},
  stepType: string,
  markers?: { wip?: boolean; reject?: boolean }
): Record<string, boolean> {
  const updated: Record<string, boolean> = { ...existing };
  updated.oper = false;
  updated.insp = false;
  updated.trans = false;
  updated.store = false;
  updated.decs = false;
  updated.rework = false;

  if (stepType === 'operation') updated.oper = true;
  else if (stepType === 'inspection') updated.insp = true;
  else if (stepType === 'transport') updated.trans = true;
  else if (stepType === 'storage') updated.store = true;
  else if (stepType === 'decision') updated.decs = true;
  else if (stepType === 'rework') updated.rework = true;
  else if (stepType === 'combined') {
    updated.oper = true;
    updated.insp = true;
  }

  if (markers?.wip !== undefined) updated.wip = markers.wip;
  if (markers?.reject !== undefined) updated.reject = markers.reject;

  return updated;
}

export function resolveStepSymbol(step: SymbolStep, mode: PfdSymbolMode) {
  const findings: string[] = [];
  const legacy = legacyManufacturingSymbol(step.flowIcons || {});
  if (legacy.ambiguous) findings.push('Legacy activity symbols are ambiguous; confirm the manufacturing activity.');
  const declaredType = step.stepType || 'operation';
  const legacyCompatible = legacy.id && isManufacturingSymbolCompatible(legacy.id, declaredType);
  if (!step.manufacturingSymbolId && legacy.id && !legacyCompatible) findings.push('Legacy activity symbol differs from the declared activity; review required.');
  let manufacturing = getPfdSymbol(step.manufacturingSymbolId);
  if (manufacturing && !isManufacturingSymbolCompatible(manufacturing.id, declaredType)) {
    findings.push('Selected manufacturing symbol is incompatible with the declared activity.'); manufacturing = undefined;
  }
  if (step.manufacturingSymbolId && !getPfdSymbol(step.manufacturingSymbolId)) findings.push('Selected manufacturing symbol is unavailable.');
  manufacturing ||= (legacyCompatible ? getPfdSymbol(legacy.id) : undefined)
    || getPfdSymbol(`manufacturing.${declaredType}`)
    || getPfdSymbol(`manufacturing.classic.${declaredType}`)
    || getPfdSymbol('manufacturing.operation')!;
  let symbol = manufacturing;
  if (mode === 'engineering') {
    const selected = getPfdSymbol(step.engineeringSymbolId);
    if (selected && isEngineeringSymbol(selected.id)) symbol = selected;
    else findings.push('Equipment symbol not selected');
  }
  return { symbol, manufacturingSymbol: manufacturing, findings, legacy: !step.manufacturingSymbolId && !!legacyCompatible,
    annotations: legacy.annotations };
}
/** Plain labels are escaped for exported SVG/XML; SVG geometry comes only from the bundled registry. */
export function escapePfdSymbolLabel(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]!));
}
