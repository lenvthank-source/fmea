import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const source=await readFile(new URL('./pfdPrint.ts',import.meta.url),'utf8');
const executable=stripTypeScriptTypes(source).replace(/from ["']\.\/pfdGraph["']/g,`from '${new URL('./pfdGraph.ts',import.meta.url).href}'`);
const {pfdPrintPages,openPfdPrint}=await import('data:text/javascript;base64,'+Buffer.from(executable).toString('base64'));
const steps=[{id:'a',stepNumber:'10',name:'Inspect full description <safe>',stepType:'inspection',sequenceOrder:1,incomingVariation:['Alloy hardness'],machinesEquipmentDocs:['Gauge'],desiredOutcome:'20 ± 0.1 mm',processCharacteristics:'Temperature 20 °C'},{id:'b',stepNumber:'20',name:'Rework',stepType:'rework',sequenceOrder:2}];
const graph={schemaVersion:1,notation:'manufacturing-v1',reviewStatus:'draft',nodes:[{id:'a',kind:'step',stepId:'a',x:900,y:660},{id:'b',kind:'step',stepId:'b',x:0,y:1400}],edges:[{id:'edge',source:'a',target:'b',kind:'rework',label:'Not accepted <inspect again>'}]};
test('page boundaries avoid cutting operation boxes',()=>{
 const pages=pfdPrintPages(graph,steps);assert.ok(pages.length>1);
 for(const node of graph.nodes){const page=pages.find(p=>node.x>=p.x&&node.x<p.x+p.width&&node.y>=p.y&&node.y<p.y+p.height);assert.ok(page);assert.ok(node.x+260<=page.x+page.width);assert.ok(node.y+92<=page.y+page.height);}
});
test('print document preserves escaped full descriptions, engineering fields, and routing appendix',()=>{
 let html='';globalThis.window={open:()=>({document:{write:value=>{html=value;},close(){}}})};
 assert.equal(openPfdPrint(graph,steps,{name:'Pump <example>',orgPartNumber:'8610'}),true);
 assert.ok(html.includes('Pump &lt;example&gt;'));assert.ok(html.includes('Inspect full description &lt;safe&gt;'));assert.ok(html.includes('20 ± 0.1 mm'));assert.ok(html.includes('Not accepted &lt;inspect again&gt;'));assert.ok(html.includes('Routing register'));assert.ok(html.includes('pfd-arrow-page-0'));assert.equal((html.match(/id="pfd-arrow"/g)||[]).length,0);assert.ok(html.includes('continuation'));
 globalThis.window={open:()=>null};assert.equal(openPfdPrint(graph,steps),false);
});

test('large printable diagram emits only tile-visible geometry and keeps the complete operation index',()=>{
 let html='';globalThis.window={open:()=>({document:{write:value=>{html=value;},close(){}}})};
 const manySteps=Array.from({length:105},(_,i)=>({...steps[0],id:`op-${i}`,stepNumber:`OP${i}`,name:`日本語 operation ${i}`}));
 const manyGraph={schemaVersion:2,notation:'manufacturing-v1',displayMode:'manufacturing',layoutDirection:'horizontal',reviewStatus:'draft',nodes:manySteps.map((s,i)=>({id:`node-${i}`,kind:'step',stepId:s.id,x:40+i*340,y:60})),edges:[]};
 assert.equal(openPfdPrint(manyGraph,manySteps),true);
 assert.equal((html.match(/data-node-id="node-104"/g)||[]).length,1);assert.equal((html.match(/data-node-id=/g)||[]).length,105);assert.ok(html.includes('日本語 operation 104'));assert.ok(html.includes('Operation / node index'));assert.ok(html.length<600000,'tiles must not duplicate the entire graph');
});

test('a localized wide cycle does not add empty diagram columns throughout a tall process',()=>{
 const tallSteps=Array.from({length:105},(_,i)=>({...steps[0],id:`op-${i}`,stepNumber:`OP${i}`,name:`Operation ${i}`}));
 const tall={schemaVersion:2,notation:'engineering-v1',displayMode:'engineering',layoutDirection:'vertical',reviewStatus:'draft',nodes:tallSteps.map((step,i)=>({id:`n-${i}`,kind:'step',stepId:step.id,x:40,y:60+i*240})),edges:[]};
 const baseline=pfdPrintPages(tall,tallSteps),wide={...tall,edges:[{id:'cycle',source:'n-2',target:'n-4',kind:'rework',label:'Review return',points:[{x:170,y:620},{x:1200,y:620},{x:1200,y:1100},{x:170,y:1100}]}]};
 const pages=pfdPrintPages(wide,tallSteps);assert.ok(pages.length<=baseline.length+4,`${pages.length} tiles should be near ${baseline.length} baseline, without empty columns`);assert.ok(pages.some(page=>page.x>800),'actual route-only continuation tiles must remain');
 for(const node of tall.nodes)assert.ok(pages.some(page=>node.x>=page.x&&node.x<page.x+page.width&&node.y>=page.y&&node.y<page.y+page.height));
});
