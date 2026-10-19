import { validatePfdGraph, PfdGraph } from './pfd-graph';
const steps = [{ id: 'op10', stepType: 'inspection' }, { id: 'op20', stepType: 'decision' }, { id: 'op30', stepType: 'rework' }];
function fixture(): PfdGraph { return { schemaVersion: 1, notation: 'manufacturing-v1', reviewStatus: 'reviewed', nodes: [
  { id:'start',kind:'start',x:100,y:0 }, { id:'inspect',kind:'step',stepId:'op10',x:100,y:100 },
  { id:'decision',kind:'step',stepId:'op20',x:100,y:200 }, { id:'rework',kind:'step',stepId:'op30',x:400,y:200 },
  { id:'end',kind:'end',x:100,y:400 },
], edges: [
  { id:'a',source:'start',target:'inspect',kind:'normal',label:'' },
  { id:'b',source:'inspect',target:'decision',kind:'normal',label:'' },
  { id:'c',source:'decision',target:'end',kind:'conditional',label:'Pass' },
  { id:'d',source:'decision',target:'rework',kind:'conditional',label:'Fail' },
  { id:'e',source:'rework',target:'inspect',kind:'rework',label:'Reinspect' },
] }; }
describe('PFD graph contract', () => {
  it('accepts explicit decisions with a rework and reinspection loop',()=>expect(validatePfdGraph(fixture(),steps)).toEqual([]));
  it('rejects references to operations outside the revision',()=>{const g=fixture();g.nodes[1].stepId='other-tenant';expect(validatePfdGraph(g,steps).join()).toContain('Invalid or repeated operation');});
  it('rejects missing edge endpoints and duplicate IDs',()=>{const g=fixture();g.edges[0].target='absent';g.nodes[2].id='inspect';const errors=validatePfdGraph(g,steps).join();expect(errors).toContain('unique');expect(errors).toContain('Invalid endpoints');});
  it('allows incomplete drafts but checks completeness on reviewed topology',()=>{const g=fixture();g.reviewStatus='draft';g.edges=[];expect(validatePfdGraph(g,steps)).toEqual([]);g.reviewStatus='reviewed';expect(validatePfdGraph(g,steps).length).toBeGreaterThan(0);});
  it('requires labelled distinct decision routes',()=>{const g=fixture();g.edges[2].label='';expect(validatePfdGraph(g,steps).join()).toContain('outcome label');});
  it('rejects non-finite positions and unsupported formats',()=>{const g=fixture();g.nodes[0].x=NaN;expect(validatePfdGraph(g,steps).join()).toContain('Invalid node');expect(validatePfdGraph({},steps)).toEqual(['Unsupported process graph format']);});
  it('does not let a disconnected cyclic island masquerade as reviewed flow',()=>{const g=fixture();g.edges=g.edges.filter(e=>e.id!=='a');expect(validatePfdGraph(g,steps).join()).toContain('reachable');});
  it('returns validation errors for malformed reviewed nodes without throwing',()=>{const g=fixture();g.nodes.push(null as any);expect(validatePfdGraph(g,steps).join()).toContain('identifiers');});
  it('rejects non-text conditions without a server error',()=>{const g=fixture();(g.edges[2] as any).label=42;expect(validatePfdGraph(g,steps).join()).toContain('Invalid connection');});
  it('requires a reachable disposition even when a cycle has incoming and outgoing routes',()=>{const g=fixture();g.edges=g.edges.filter(e=>e.id!=='c');expect(validatePfdGraph(g,steps).join()).toContain('reach a process end');});
});
