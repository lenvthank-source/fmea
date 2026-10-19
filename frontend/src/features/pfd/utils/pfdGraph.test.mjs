import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePfdGraph, pfdSvg, pfdActivityFromSymbols } from './pfdGraph.ts';

const steps = [{id:'op',stepNumber:'OP10',name:'Press <housing> & inspect',stepType:'combined',sequenceOrder:1,machinesEquipmentDocs:['Servo press'],flowIcons:{oper:true,insp:true}}];
test('manufacturing flow labels the process and retains explicit combined activity', () => {
  const svg=pfdSvg(derivePfdGraph(steps),steps);
  assert.ok(svg.includes('Press &lt;housing&gt; &amp; inspect'));
  assert.ok(svg.includes('combined'));
  assert.ok(svg.includes('<circle') && svg.includes('<rect'));
  assert.ok(!svg.includes('Servo press'));
});
test('legacy explicit operation plus inspection is combined without equipment inference', () => {
  const legacy=[{...steps[0],stepType:'operation'}];
  assert.ok(pfdSvg(derivePfdGraph(legacy),legacy).includes('combined'));
  const unclassified=[{...steps[0],stepType:'operation',name:'Visual inspection',flowIcons:{}}];
  const svg=pfdSvg(derivePfdGraph(unclassified),unclassified);
  assert.ok(svg.includes('operation'));
  assert.ok(!svg.includes('>inspection<'));
});
test('sequence drafts never invent decision outcomes or reviewed topology', () => {
  const graph=derivePfdGraph([{...steps[0],stepType:'decision'}]);
  assert.equal(graph.reviewStatus,'draft');
  assert.equal(graph.edges.filter(edge=>edge.kind==='conditional').length,0);
  assert.ok(graph.edges.every(edge=>edge.label===''));
});
test('WIP and rejection alone never become storage, rework, or scrap', () => {
  assert.equal(pfdActivityFromSymbols({wip:true,reject:true}),null);
  assert.equal(pfdActivityFromSymbols({oper:true,insp:true,decs:true}),null);
  assert.equal(pfdActivityFromSymbols({oper:true,insp:true}), 'combined');
  assert.equal(pfdActivityFromSymbols({rework:true,reject:true}),'rework');
});
