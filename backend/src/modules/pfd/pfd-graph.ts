import symbols from './pfd-symbols.json';

export type PfdPort = 'north' | 'east' | 'south' | 'west';
export interface PfdPoint {
  x: number;
  y: number;
}
export interface PfdNode {
  id: string;
  kind:
    | 'step'
    | 'start'
    | 'end'
    | 'connector'
    | 'hold'
    | 'scrap'
    | 'return'
    | 'annotation';
  stepId?: string;
  label?: string;
  x: number;
  y: number;
  symbolId?: string;
  width?: number;
  height?: number;
}
export interface PfdEdge {
  id: string;
  source: string;
  target: string;
  kind: 'normal' | 'conditional' | 'parallel' | 'rework' | 'scrap' | 'material';
  label: string;
  sourcePort?: PfdPort;
  targetPort?: PfdPort;
  points?: PfdPoint[];
  junctions?: PfdPoint[];
  labelPosition?: PfdPoint;
}
export interface PfdGraph {
  schemaVersion: 1 | 2;
  notation: 'manufacturing-v1' | 'engineering-v1';
  displayMode?: 'manufacturing' | 'engineering';
  layoutDirection?: 'horizontal' | 'vertical';
  reviewStatus: 'draft' | 'reviewed';
  nodes: PfdNode[];
  edges: PfdEdge[];
}

/** Structural checks apply to drafts too. Completeness checks apply at review. */
export function validatePfdGraph(
  value: unknown,
  steps: { id: string; stepType: string }[],
): string[] {
  const g = value as PfdGraph;
  if (
    !g ||
    ![1, 2].includes(g.schemaVersion) ||
    !['manufacturing-v1', 'engineering-v1'].includes(g.notation) ||
    !['draft', 'reviewed'].includes(g.reviewStatus) ||
    !Array.isArray(g.nodes) ||
    !Array.isArray(g.edges)
  ) {
    return ['Unsupported process graph format'];
  }
  if (g.nodes.length > 5000 || g.edges.length > 15000)
    return ['Process graph exceeds supported size'];
  const errors: string[] = [];
  if (
    g.schemaVersion === 2 &&
    (!['manufacturing', 'engineering'].includes(g.displayMode || '') ||
      !['horizontal', 'vertical'].includes(g.layoutDirection || ''))
  )
    errors.push('Version 2 graphs require display mode and layout direction');
  if (g.schemaVersion === 1 && g.notation !== 'manufacturing-v1')
    errors.push('Legacy graphs require manufacturing notation');
  const pointValid = (p: PfdPoint) =>
    p &&
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    Math.abs(p.x) <= 100000 &&
    Math.abs(p.y) <= 100000;
  const symbolIds = new Set(symbols.map((s) => s.id));
  const ids = new Set<string>();
  const stepIds = new Set(steps.map((s) => s.id));
  const represented = new Set<string>();
  for (const n of g.nodes) {
    if (
      !n ||
      typeof n.id !== 'string' ||
      !n.id ||
      n.id.length > 150 ||
      ids.has(n.id)
    ) {
      errors.push('Node identifiers must be unique, non-empty strings');
      continue;
    }
    ids.add(n.id);
    if (
      Object.keys(n).some(
        (key) =>
          ![
            'id',
            'kind',
            'stepId',
            'label',
            'x',
            'y',
            'symbolId',
            'width',
            'height',
          ].includes(key),
      )
    )
      errors.push(`Unsupported node data on ${n.id}`);
    if (
      ![
        'step',
        'start',
        'end',
        'connector',
        'hold',
        'scrap',
        'return',
        ...(g.schemaVersion === 2 ? ['annotation'] : []),
      ].includes(n.kind) ||
      !Number.isFinite(n.x) ||
      !Number.isFinite(n.y) ||
      Math.abs(n.x) > 100000 ||
      Math.abs(n.y) > 100000 ||
      (n.label !== undefined &&
        (typeof n.label !== 'string' || n.label.length > 1000))
    )
      errors.push(`Invalid node ${n.id}`);
    if (
      (n.symbolId !== undefined &&
        (!symbolIds.has(n.symbolId) || n.symbolId.length > 120)) ||
      (n.width !== undefined &&
        (!Number.isFinite(n.width) || n.width < 16 || n.width > 2000)) ||
      (n.height !== undefined &&
        (!Number.isFinite(n.height) || n.height < 16 || n.height > 2000))
    )
      errors.push(`Invalid symbol or bounds on ${n.id}`);
    if (
      n.kind === 'annotation' &&
      (!n.symbolId ||
        !symbols.some(
          (s) =>
            s.id === n.symbolId &&
            ['basic', 'arrow', 'annotation'].includes(s.kind),
        ))
    )
      errors.push(`Annotation ${n.id} needs an annotation-library symbol`);
    if (n.kind === 'step' && n.symbolId !== undefined)
      errors.push(
        'Operation symbols must be selected on the PFD table, not overridden in a graph',
      );
    if (n.kind === 'step') {
      if (!n.stepId || !stepIds.has(n.stepId) || represented.has(n.stepId))
        errors.push(`Invalid or repeated operation reference on ${n.id}`);
      if (n.stepId) represented.add(n.stepId);
    } else if (n.stepId)
      errors.push('Boundary and disposition nodes cannot reference operations');
  }
  const edgeIds = new Set<string>();
  for (const e of g.edges) {
    if (
      !e ||
      typeof e.id !== 'string' ||
      !e.id ||
      e.id.length > 150 ||
      edgeIds.has(e.id)
    ) {
      errors.push('Connection identifiers must be unique');
      continue;
    }
    edgeIds.add(e.id);
    if (
      Object.keys(e).some(
        (key) =>
          ![
            'id',
            'source',
            'target',
            'kind',
            'label',
            'sourcePort',
            'targetPort',
            'points',
            'junctions',
            'labelPosition',
          ].includes(key),
      )
    )
      errors.push(`Unsupported connection data on ${e.id}`);
    if (
      g.nodes.some(
        (n) => n?.kind === 'annotation' && [e.source, e.target].includes(n.id),
      )
    )
      errors.push(`Annotation cannot be a route endpoint on ${e.id}`);
    if (
      [e.sourcePort, e.targetPort].some(
        (p) =>
          p !== undefined && !['north', 'east', 'south', 'west'].includes(p),
      ) ||
      [e.points, e.junctions].some(
        (points) =>
          points !== undefined &&
          (!Array.isArray(points) ||
            points.length > 1000 ||
            points.some((p) => !pointValid(p))),
      ) ||
      (e.labelPosition !== undefined && !pointValid(e.labelPosition))
    )
      errors.push(`Invalid connector geometry on ${e.id}`);
    if (!ids.has(e.source) || !ids.has(e.target) || e.source === e.target)
      errors.push(`Invalid endpoints on ${e.id}`);
    if (
      ![
        'normal',
        'conditional',
        'parallel',
        'rework',
        'scrap',
        'material',
      ].includes(e.kind) ||
      typeof e.label !== 'string' ||
      e.label.length > 500
    )
      errors.push(`Invalid connection ${e.id}`);
    if (
      e.kind === 'conditional' &&
      (typeof e.label !== 'string' || !e.label.trim())
    )
      errors.push(`Conditional route ${e.id} needs an outcome label`);
  }
  if (errors.length) return [...new Set(errors)];
  if (g.reviewStatus === 'reviewed') {
    if (steps.length === 0)
      errors.push('A reviewed flow needs manufacturing operations');
    if (represented.size !== stepIds.size)
      errors.push('Include every operation before marking the flow reviewed');
    if (
      !g.nodes.some((n) => n.kind === 'start') ||
      !g.nodes.some((n) => n.kind === 'end')
    )
      errors.push('A reviewed flow needs explicit start and end boundaries');
    for (const n of g.nodes.filter((n) => n.kind !== 'annotation')) {
      if (n.kind !== 'start' && !g.edges.some((e) => e.target === n.id))
        errors.push(`${n.label || n.id} has no incoming route`);
      if (
        !['end', 'scrap', 'return', 'hold'].includes(n.kind) &&
        !g.edges.some((e) => e.source === n.id)
      )
        errors.push(`${n.label || n.id} has no outgoing route`);
      if (steps.find((s) => s.id === n.stepId)?.stepType === 'decision') {
        const routes = g.edges.filter((e) => e.source === n.id);
        if (
          routes.length < 2 ||
          routes.some((e) => !e.label.trim()) ||
          new Set(routes.map((e) => e.target)).size < 2
        )
          errors.push(
            'Decision operations need at least two labelled routes to different destinations',
          );
      }
    }
    const startIds = g.nodes.filter((n) => n.kind === 'start').map((n) => n.id);
    const reachable = new Set(startIds);
    for (let pass = 0; pass < g.nodes.length; pass++) {
      const before = reachable.size;
      g.edges.forEach((e) => {
        if (reachable.has(e.source)) reachable.add(e.target);
      });
      if (reachable.size === before) break;
    }
    if (g.nodes.some((n) => n.kind !== 'annotation' && !reachable.has(n.id)))
      errors.push(
        'Every reviewed node must be reachable from a start boundary',
      );
    const exits = new Set(
      g.nodes
        .filter((n) => ['end', 'scrap', 'return', 'hold'].includes(n.kind))
        .map((n) => n.id),
    );
    for (let pass = 0; pass < g.nodes.length; pass++) {
      const before = exits.size;
      g.edges.forEach((e) => {
        if (exits.has(e.target)) exits.add(e.source);
      });
      if (exits.size === before) break;
    }
    if (g.nodes.some((n) => n.kind !== 'annotation' && !exits.has(n.id)))
      errors.push(
        'Every reviewed route must be able to reach a process end or recorded disposition',
      );
  }
  return [...new Set(errors)];
}
