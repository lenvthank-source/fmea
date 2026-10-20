import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePfdGraph, pfdSvg, pfdActivityFromSymbols, pfdDiagramFindings, chunkPfdMetadata } from './pfdGraph.ts';

test('large workbook metadata preserves surrogate-pair Unicode at Excel cell boundaries', () => {
  const value = 'x'.repeat(29999) + '🛠️温度'.repeat(15000);
  const chunks = chunkPfdMetadata(value);
  assert.equal(chunks.join(''), value);
  assert.ok(chunks.length > 2);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 30000);
    assert.ok(!/[\uD800-\uDBFF]$/.test(chunk));
    assert.ok(!/^[\uDC00-\uDFFF]/.test(chunk));
  }
});

const steps = [{id:'op',stepNumber:'OP10',name:'Press <housing> & inspect',stepType:'combined',sequenceOrder:1,machinesEquipmentDocs:['Servo press'],flowIcons:{oper:true,insp:true}}];
test('manufacturing flow labels the process and retains explicit combined activity', () => {
  const svg=pfdSvg(derivePfdGraph(steps),steps);
  assert.ok(svg.includes('Press &lt;housing&gt; &amp; inspect'));
  assert.ok(svg.includes('combined'));
  assert.ok(svg.includes('<circle') && svg.includes('<rect'));
  assert.ok(!svg.includes('Servo press'));
});
test('legacy activity conflict remains a finding without changing declared operation', () => {
  const legacy=[{...steps[0],stepType:'operation'}];
  assert.ok(pfdSvg(derivePfdGraph(legacy),legacy).includes('data-activity="operation"'));
  assert.ok(pfdDiagramFindings(derivePfdGraph(legacy),legacy).some(f=>f.includes('differs')));
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
