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
 assert.ok(html.includes('Pump &lt;example&gt;'));assert.ok(html.includes('Inspect full description &lt;safe&gt;'));assert.ok(html.includes('20 ± 0.1 mm'));assert.ok(html.includes('Not accepted &lt;inspect again&gt;'));assert.ok(html.includes('Routing register'));assert.ok(html.includes('continuation'));
 globalThis.window={open:()=>null};assert.equal(openPfdPrint(graph,steps),false);
});
