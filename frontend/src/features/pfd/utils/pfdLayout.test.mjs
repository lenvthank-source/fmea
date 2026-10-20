import test from 'node:test';
import assert from 'node:assert/strict';
import ELK from 'elkjs/lib/elk.bundled.js';
import { layoutInput,applyLayoutResult } from './pfdLayout.ts';
import {derivePfdGraph,pfdSvg,pfdDiagramFindings,nodeHeight,nodeWidth,nodeLabelBounds} from './pfdGraph.ts';
const steps=Array.from({length:105},(_,i)=>({id:`op-${i}`,stepNumber:`OP${i}`,name:`Étanchéité 日本語 µm ${i} ${'Long readable operation '.repeat(i===5?8:1)}`,sequenceOrder:i,stepType:i===2?'decision':'operation',engineeringSymbolId:i===0?'engineering.pump':null}));
test('ELK preserves 105+ operations and explicit route identities with orthogonal geometry',async()=>{
 const graph=derivePfdGraph(steps);graph.edges.push({id:'reviewed-return',source:'step-op-7',target:'step-op-1',kind:'rework',label:'Fail → rework'});
 const original=JSON.stringify(graph),result=await new ELK().layout(layoutInput(graph,steps,'horizontal'));
 const arranged=applyLayoutResult(graph,result,'horizontal',steps);
 assert.equal(JSON.stringify(graph),original,'preview must not mutate authored drawing');assert.deepEqual(arranged.edges.map(e=>e.id),graph.edges.map(e=>e.id));assert.equal(arranged.nodes.length,107);assert.equal(arranged.reviewStatus,'draft');assert.equal(arranged.schemaVersion,2);
 for(const edge of arranged.edges){assert.ok(edge.points.length>=2);for(let i=1;i<edge.points.length;i++)assert.ok(edge.points[i].x===edge.points[i-1].x||edge.points[i].y===edge.points[i-1].y);}
 for(let i=0;i<arranged.nodes.length;i++)for(let j=i+1;j<arranged.nodes.length;j++){const a=arranged.nodes[i],b=arranged.nodes[j];assert.ok(a.x+nodeWidth(a)<=b.x||b.x+nodeWidth(b)<=a.x||a.y+nodeHeight(a,steps)<=b.y||b.y+nodeHeight(b,steps)<=a.y,'node labels must not overlap');}
 const svg=pfdSvg(arranged,steps);assert.ok(svg.includes('OP104'));assert.ok(svg.includes('日本語'));assert.ok(svg.includes('Fail → rework'));
});
test('vertical layout retains disconnected new operations and annotations without inventing routes',async()=>{
 const graph=derivePfdGraph(steps.slice(0,4));graph.nodes.push({id:'new-op',kind:'step',stepId:steps[4].id,x:900,y:20},{id:'note',kind:'annotation',symbolId:'arrow.right',label:'Flow note',x:1200,y:400});
 const result=await new ELK().layout(layoutInput(graph,steps,'vertical')),arranged=applyLayoutResult(graph,result,'vertical',steps);
 assert.equal(arranged.edges.length,graph.edges.length);assert.ok(!arranged.edges.some(e=>e.source==='new-op'||e.target==='new-op'));assert.deepEqual(arranged.nodes.find(n=>n.id==='note'),graph.nodes.find(n=>n.id==='note'));assert.equal(arranged.layoutDirection,'vertical');
 assert.ok(pfdDiagramFindings(arranged,steps).some(f=>f.includes('Decision branches')));assert.ok(pfdDiagramFindings(arranged,steps).some(f=>f.includes('not connected')));
});
test('engineering mode requires explicit selection and renders registry SVG with escaped labels',()=>{
 const graph={...derivePfdGraph(steps.slice(1,3)),displayMode:'engineering'};
 assert.ok(pfdDiagramFindings(graph,steps).some(f=>f.includes('Equipment symbol not selected')));
 const malicious=[{...steps[1],name:'<script>alert(1)</script>'}];const svg=pfdSvg(derivePfdGraph(malicious),malicious);assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));
});

test('authored shared junctions use temporary layout nodes and preserve authored edge IDs',async()=>{
 const graph=derivePfdGraph(steps.slice(0,3));graph.edges=[{id:'main',source:'step-op-0',target:'step-op-1',kind:'normal',label:'Main',points:[{x:0,y:0},{x:100,y:0},{x:200,y:0}],junctions:[{x:100,y:0}]},{id:'branch',source:'step-op-0',target:'step-op-2',kind:'parallel',label:'Branch',points:[{x:0,y:0},{x:100,y:0},{x:100,y:100}],junctions:[{x:100,y:0}]},{id:'crossing',source:'boundary-start',target:'boundary-end',kind:'material',label:'Unconnected crossing',points:[{x:100,y:-100},{x:100,y:100}]}];
 const input=layoutInput(graph,steps,'horizontal');assert.equal(input.children.length,graph.nodes.length+1);assert.equal(input.edges.length,5);
 const result=await new ELK().layout(input),arranged=applyLayoutResult(graph,result,'horizontal',steps);
 assert.deepEqual(arranged.edges.map(e=>e.id),graph.edges.map(e=>e.id));assert.equal(arranged.nodes.length,graph.nodes.length);assert.deepEqual(arranged.edges[0].junctions,arranged.edges[1].junctions);assert.equal(arranged.edges[2].junctions,undefined);
 for(const edge of arranged.edges.slice(0,2)){const j=edge.junctions[0];assert.ok(edge.points.some((p,i,a)=>i>0&&((p.x===a[i-1].x&&j.x===p.x&&j.y>=Math.min(p.y,a[i-1].y)&&j.y<=Math.max(p.y,a[i-1].y))||(p.y===a[i-1].y&&j.y===p.y&&j.x>=Math.min(p.x,a[i-1].x)&&j.x<=Math.max(p.x,a[i-1].x)))));}
 assert.ok(pfdSvg(arranged,steps).includes('r="4"'));
});
test('orphan dots fail layout without inventing incident relationships or changing geometry',()=>{
 const graph=derivePfdGraph(steps.slice(0,2));graph.edges[0].junctions=[{x:5,y:5}];const original=JSON.stringify(graph);assert.throws(()=>layoutInput(graph,steps,'horizontal'),/lack shared explicit incident/);assert.equal(JSON.stringify(graph),original);
});

test('browser worker transport uses the published ELK request protocol and terminates after layout',async()=>{
 const {createLayoutJob}=await import('./pfdLayout.ts');const previous=globalThis.Worker;const requests=[];let terminated=false;
 class LocalProtocolWorker {postMessage(message){requests.push(message.cmd);if(message.cmd==='register')queueMicrotask(()=>this.onmessage({data:{id:message.id,data:{}}}));else if(message.cmd==='layout')new ELK().layout(message.graph).then(data=>this.onmessage({data:{id:message.id,data}}));}terminate(){terminated=true;}}
 globalThis.Worker=LocalProtocolWorker;
 try{const graph=derivePfdGraph(steps.slice(0,4)),result=await createLayoutJob(graph,steps,'horizontal').promise;assert.deepEqual(requests,['register','layout']);assert.equal(result.nodes.length,graph.nodes.length);assert.equal(terminated,true);}finally{globalThis.Worker=previous;}
});
test('unresponsive browser worker times out and cancellation rejects without altering the draft',async(t)=>{
 const {createLayoutJob,PFD_LAYOUT_TIMEOUT_MS}=await import('./pfdLayout.ts');const previous=globalThis.Worker;let terminations=0;
 class SilentWorker {postMessage(){}terminate(){terminations++;}}
 globalThis.Worker=SilentWorker;t.mock.timers.enable({apis:['setTimeout']});
 try{const graph=derivePfdGraph(steps.slice(0,2)),original=JSON.stringify(graph),job=createLayoutJob(graph,steps,'horizontal');const rejection=assert.rejects(job.promise,/timed out/);t.mock.timers.tick(PFD_LAYOUT_TIMEOUT_MS);await rejection;assert.equal(JSON.stringify(graph),original);const cancelled=createLayoutJob(graph,steps,'horizontal');cancelled.cancel();await assert.rejects(cancelled.promise,/cancelled/);assert.equal(terminations,2);}finally{t.mock.timers.reset();globalThis.Worker=previous;}
});

test('vertical connector segments avoid the full operation label column, including explicit horizontal ports',async()=>{
 const inputGraph=derivePfdGraph(steps.slice(0,8));inputGraph.edges=inputGraph.edges.map((edge,i)=>({...edge,sourcePort:i===2?'east':undefined,targetPort:i===2?'west':undefined}));inputGraph.edges.push({id:'return',source:'step-op-6',target:'step-op-1',kind:'rework',label:'Recheck 日本語 acceptance condition — explicit routing review'});
 const result=await new ELK().layout(layoutInput(inputGraph,steps,'vertical')),graph=applyLayoutResult(inputGraph,result,'vertical',steps);
 for(const edge of graph.edges)for(let i=1;i<edge.points.length;i++){const a=edge.points[i-1],b=edge.points[i];for(const node of graph.nodes){const r=nodeLabelBounds(node,steps,'vertical');const crosses=a.x===b.x?(a.x>r.x&&a.x<r.x+r.width&&Math.max(a.y,b.y)>r.y&&Math.min(a.y,b.y)<r.y+r.height):a.y===b.y?(a.y>r.y&&a.y<r.y+r.height&&Math.max(a.x,b.x)>r.x&&Math.min(a.x,b.x)<r.x+r.width):true;assert.equal(crosses,false,`${edge.id} crosses ${node.id} label area`);}}
 for(const edge of graph.edges){if(!edge.labelPosition)continue;const p=edge.labelPosition;for(const node of graph.nodes){const r=nodeLabelBounds(node,steps,'vertical');assert.ok(p.x+200<=r.x||p.x>=r.x+r.width||p.y+70<=r.y||p.y-12>=r.y+r.height,'route condition label must stay outside operation text');}}
 const svg=pfdSvg(graph,steps);assert.ok(svg.includes('x="210" y="111" text-anchor="start"'));assert.ok(svg.includes('x="74" y="12" width="112"'));
});
