import { validatePfdGraph, PfdGraph } from './pfd-graph';
import { ProjectService } from '../project/project.service';
import symbols from './pfd-symbols.json';
const steps = [
  { id: 'op10', stepType: 'inspection' },
  { id: 'op20', stepType: 'decision' },
  { id: 'op30', stepType: 'rework' },
];
function fixture(): PfdGraph {
  return {
    schemaVersion: 1,
    notation: 'manufacturing-v1',
    reviewStatus: 'reviewed',
    nodes: [
      { id: 'start', kind: 'start', x: 100, y: 0 },
      { id: 'inspect', kind: 'step', stepId: 'op10', x: 100, y: 100 },
      { id: 'decision', kind: 'step', stepId: 'op20', x: 100, y: 200 },
      { id: 'rework', kind: 'step', stepId: 'op30', x: 400, y: 200 },
      { id: 'end', kind: 'end', x: 100, y: 400 },
    ],
    edges: [
      {
        id: 'a',
        source: 'start',
        target: 'inspect',
        kind: 'normal',
        label: '',
      },
      {
        id: 'b',
        source: 'inspect',
        target: 'decision',
        kind: 'normal',
        label: '',
      },
      {
        id: 'c',
        source: 'decision',
        target: 'end',
        kind: 'conditional',
        label: 'Pass',
      },
      {
        id: 'd',
        source: 'decision',
        target: 'rework',
        kind: 'conditional',
        label: 'Fail',
      },
      {
        id: 'e',
        source: 'rework',
        target: 'inspect',
        kind: 'rework',
        label: 'Reinspect',
      },
    ],
  };
}
describe('PFD graph contract', () => {
  it('accepts explicit decisions with a rework and reinspection loop', () =>
    expect(validatePfdGraph(fixture(), steps)).toEqual([]));
  it('rejects references to operations outside the revision', () => {
    const g = fixture();
    g.nodes[1].stepId = 'other-tenant';
    expect(validatePfdGraph(g, steps).join()).toContain(
      'Invalid or repeated operation',
    );
  });
  it('rejects missing edge endpoints and duplicate IDs', () => {
    const g = fixture();
    g.edges[0].target = 'absent';
    g.nodes[2].id = 'inspect';
    const errors = validatePfdGraph(g, steps).join();
    expect(errors).toContain('unique');
    expect(errors).toContain('Invalid endpoints');
  });
  it('allows incomplete drafts but checks completeness on reviewed topology', () => {
    const g = fixture();
    g.reviewStatus = 'draft';
    g.edges = [];
    expect(validatePfdGraph(g, steps)).toEqual([]);
    g.reviewStatus = 'reviewed';
    expect(validatePfdGraph(g, steps).length).toBeGreaterThan(0);
  });
  it('requires labelled distinct decision routes', () => {
    const g = fixture();
    g.edges[2].label = '';
    expect(validatePfdGraph(g, steps).join()).toContain('outcome label');
  });
  it('rejects non-finite positions and unsupported formats', () => {
    const g = fixture();
    g.nodes[0].x = NaN;
    expect(validatePfdGraph(g, steps).join()).toContain('Invalid node');
    expect(validatePfdGraph({}, steps)).toEqual([
      'Unsupported process graph format',
    ]);
  });
  it('does not let a disconnected cyclic island masquerade as reviewed flow', () => {
    const g = fixture();
    g.edges = g.edges.filter((e) => e.id !== 'a');
    expect(validatePfdGraph(g, steps).join()).toContain('reachable');
  });
  it('returns validation errors for malformed reviewed nodes without throwing', () => {
    const g = fixture();
    g.nodes.push(null as any);
    expect(validatePfdGraph(g, steps).join()).toContain('identifiers');
  });
  it('rejects non-text conditions without a server error', () => {
    const g = fixture();
    (g.edges[2] as any).label = 42;
    expect(validatePfdGraph(g, steps).join()).toContain('Invalid connection');
  });
  it('requires a reachable disposition even when a cycle has incoming and outgoing routes', () => {
    const g = fixture();
    g.edges = g.edges.filter((e) => e.id !== 'c');
    expect(validatePfdGraph(g, steps).join()).toContain('reach a process end');
  });
});

describe('PFD v2 symbols and routed geometry', () => {
  const v2 = (): PfdGraph => ({
    ...fixture(),
    schemaVersion: 2,
    displayMode: 'engineering',
    notation: 'engineering-v1',
    layoutDirection: 'horizontal',
  });
  it('retains v1 compatibility without upgrading stored data during validation', () => {
    const g = fixture();
    expect(validatePfdGraph(g, steps)).toEqual([]);
    expect(g.schemaVersion).toBe(1);
  });
  it('accepts explicit engineering mode and orthogonal geometry', () => {
    const g = v2();
    g.edges[0] = {
      ...g.edges[0],
      sourcePort: 'south',
      targetPort: 'north',
      points: [
        { x: 100, y: 36 },
        { x: 100, y: 64 },
      ],
      junctions: [{ x: 100, y: 50 }],
      labelPosition: { x: 105, y: 50 },
    };
    expect(validatePfdGraph(g, steps)).toEqual([]);
  });
  it('requires explicit v2 display and layout choices', () => {
    const g = v2();
    delete g.displayMode;
    expect(validatePfdGraph(g, steps).join()).toContain('display mode');
  });
  it('rejects invalid ports, nonfinite geometry and excessive coordinates', () => {
    for (const patch of [
      { sourcePort: 'middle' },
      { points: [{ x: Infinity, y: 0 }] },
      { junctions: [{ x: 100001, y: 0 }] },
      { labelPosition: { x: 0, y: NaN } },
      { points: 42 },
    ]) {
      const g = v2();
      Object.assign(g.edges[0], patch);
      expect(validatePfdGraph(g, steps).join()).toContain('geometry');
    }
  });
  it('does not permit arbitrary SVG or unregistered graphics in node payloads', () => {
    const g = v2();
    Object.assign(g.nodes[0], { svg: '<script>alert(1)</script>' });
    expect(validatePfdGraph(g, steps).join()).toContain(
      'Unsupported node data',
    );
    delete (g.nodes[0] as any).svg;
    g.nodes[0].symbolId = 'uploaded-custom-svg';
    expect(validatePfdGraph(g, steps).join()).toContain('Invalid symbol');
  });
  it('keeps table-selected operation symbols authoritative', () => {
    const g = v2();
    g.nodes[1].symbolId = 'manufacturing.inspection';
    expect(validatePfdGraph(g, steps).join()).toContain(
      'selected on the PFD table',
    );
  });
  it('rejects a null node alongside valid edges without throwing', () => {
    const g = v2();
    g.nodes.push(null as any);
    expect(validatePfdGraph(g, steps).join()).toContain('identifiers');
  });
  it('rejects symbols as standalone graph format without supported version', () => {
    const g = v2();
    g.schemaVersion = 3 as any;
    expect(validatePfdGraph(g, steps)).toEqual([
      'Unsupported process graph format',
    ]);
  });
});

describe('PFD annotation and cloning integrity', () => {
  const annotationSymbol = symbols.find(
    (symbol) => symbol.kind === 'annotation' || symbol.kind === 'basic',
  )!.id;
  it('keeps decorative annotation nodes outside manufacturing routing completeness', () => {
    const g = fixture();
    Object.assign(g, {
      schemaVersion: 2,
      displayMode: 'manufacturing',
      layoutDirection: 'horizontal',
    });
    g.nodes.push({
      id: 'note',
      kind: 'annotation',
      symbolId: annotationSymbol,
      label: 'Unicode µm 漢字',
      x: 500,
      y: 50,
      width: 120,
      height: 80,
    });
    expect(validatePfdGraph(g, steps)).toEqual([]);
    g.edges.push({
      id: 'fake',
      source: 'note',
      target: 'end',
      kind: 'normal',
      label: '',
    });
    expect(validatePfdGraph(g, steps).join()).toContain(
      'Annotation cannot be a route endpoint',
    );
  });
  it('copies v2 symbol annotations and connector geometry while remapping only operation identities', async () => {
    const source: PfdGraph = {
      ...fixture(),
      schemaVersion: 2,
      displayMode: 'engineering',
      notation: 'engineering-v1',
      layoutDirection: 'vertical',
    };
    source.nodes.push({
      id: 'note',
      kind: 'annotation',
      symbolId: annotationSymbol,
      x: 500,
      y: 50,
      width: 120,
      height: 80,
    });
    source.edges[0] = {
      ...source.edges[0],
      sourcePort: 'south',
      targetPort: 'north',
      points: [
        { x: 100, y: 36 },
        { x: 100, y: 64 },
      ],
      labelPosition: { x: 100, y: 50 },
      junctions: [],
    };
    const tx: any = {
      documentRevision: {
        findUnique: jest.fn().mockResolvedValue({ pfdGraph: source }),
        update: jest.fn(),
      },
    };
    const service = new ProjectService({} as any, {} as any);
    await (service as any).copyProcessGraph(
      tx,
      'source',
      'target',
      new Map([
        ['op10', 'new10'],
        ['op20', 'new20'],
        ['op30', 'new30'],
      ]),
    );
    const saved = tx.documentRevision.update.mock.calls[0][0].data;
    expect(saved.pfdGraph).toMatchObject({
      schemaVersion: 2,
      notation: 'engineering-v1',
      layoutDirection: 'vertical',
      reviewStatus: 'draft',
      edges: source.edges,
    });
    expect(saved.pfdGraphVersion).toBe(0);
    expect(
      saved.pfdGraph.nodes.find((n: any) => n.id === 'inspect').stepId,
    ).toBe('new10');
    expect(saved.pfdGraph.nodes.find((n: any) => n.id === 'note')).toEqual(
      source.nodes.at(-1),
    );
    expect(source.nodes[1].stepId).toBe('op10');
  });
});
