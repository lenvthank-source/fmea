import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWorkbookTopology,remapWorkbookTopology} from './pfdWorkbookImport.ts';
const graph={schemaVersion:1,notation:'manufacturing-v1',reviewStatus:'reviewed',nodes:[{id:'start',kind:'start',x:0,y:0},{id:'a',kind:'step',stepId:'old-a',x:10,y:100},{id:'b',kind:'step',stepId:'old-b',x:300,y:100}],edges:[{id:'e1',source:'start',target:'a',kind:'normal',label:''},{id:'e2',source:'a',target:'b',kind:'rework',label:'Fail → inspect again'}]};
const rows=[['FMEApex process graph','schemaVersion=1'],[JSON.stringify(graph)],['END GRAPH'],['operation-id','operation-number'],['old-a','10'],['old-b','20']];
test('metadata chunks parse and operation IDs remap without changing positions or labels',()=>{
 const data=parseWorkbookTopology(rows);const result=remapWorkbookTopology(data,[{id:'new-a',stepNumber:'10'},{id:'new-b',stepNumber:'20'}],['10','20']);
 assert.equal(result.graph.nodes[1].stepId,'new-a');assert.equal(result.graph.nodes[2].x,300);assert.equal(result.graph.edges[1].label,'Fail → inspect again');assert.equal(result.graph.reviewStatus,'draft');assert.equal(result.omittedNodes,0);
});
test('partial selection reports omitted topology without inventing bypass routes',()=>{
 const result=remapWorkbookTopology(parseWorkbookTopology(rows),[{id:'new-a',stepNumber:'10'}],['10']);assert.equal(result.omittedNodes,1);assert.equal(result.omittedConnections,1);assert.deepEqual(result.graph.edges.map(e=>e.id),['e1']);
});
test('malformed metadata and ambiguous destination operation numbers reject',()=>{
 assert.throws(()=>parseWorkbookTopology(rows.slice(0,2)),/Incomplete/);
 assert.throws(()=>remapWorkbookTopology(parseWorkbookTopology(rows),[{id:'1',stepNumber:'10'},{id:'2',stepNumber:'10'}],['10']),/ambiguous/);
 const bad={...graph,edges:[{id:'bad',source:'missing',target:'a',kind:'normal',label:''}]};assert.throws(()=>parseWorkbookTopology([rows[0],[JSON.stringify(bad)],...rows.slice(2)]),/connection/);
 assert.equal(parseWorkbookTopology([['Regular Excel file']]),null);
});
