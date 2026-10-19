import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePackage,packageSearchText} from './packageStructure.ts';
test('legacy aliases produce actual function, cause and control links without mutating fields',()=>{
 const data={custom:'preserved',functions:[{narration:'Locate pin',failures:[{narration:'Radial play',severityRating:8,currentControlPrevention:'Locating fixture',currentControlDetection:'Gauge check',extra:'original'}]}]};
 const before=JSON.stringify(data); const model=normalizePackage(data,'Fixture');
 assert.equal(model.functions,1);assert.equal(model.causes,1);assert.equal(model.controls,2);assert.equal(model.missingControls,0);
 assert.equal(model.nodes.find(n=>n.kind==='cause').parentId,'function-0');
 assert.equal(model.nodes.find(n=>n.kind==='cause').raw.extra,'original');assert.equal(JSON.stringify(data),before);
 assert.equal(model.nodes.some(n=>n.kind==='mode'||n.kind==='effect'),false);
});
test('empty, malformed and missing-control structures stay distinct',()=>{
 assert.equal(normalizePackage({functions:[]}).issues.length,0);
 assert.ok(normalizePackage({functions:'invalid'}).issues.length);
 assert.ok(normalizePackage(null).issues.length);
 const model=normalizePackage({functions:[{name:'Clamp',causes:[{name:'Loose bolt'}]}]});
 assert.equal(model.missingControls,1);assert.equal(model.controls,0);
});
test('search finds nested controls and unknown metadata',()=>{
 assert.ok(packageSearchText({functions:[{failures:[{currentControlDetection:'Laser gauge'}]}]},'Fixture').includes('laser gauge'));
});
