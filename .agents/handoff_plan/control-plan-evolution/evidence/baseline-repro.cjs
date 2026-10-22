// Historical baseline reproduction, NOT desired-behavior CI assertions.
// Run from repository root. Loads real services/functions with memory stubs only.
const path = require('node:path');
const {createRequire} = require('node:module');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../../..');
const req = createRequire(path.join(root,'backend/package.json'));
req('ts-node').register({project:path.join(root,'backend/tsconfig.json'),transpileOnly:true});
const {ControlPlanDocumentService}=req(path.join(root,'backend/src/modules/control-plan/control-plan-document.service.ts'));
const cp=req(path.join(root,'backend/src/modules/control-plan/control-plan-document.ts'));
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const actor={tenantId:id(1),userId:id(2)};
const doc={id:id(3),tenantId:id(1),projectId:id(4),type:'PFMEA',project:{id:id(4),status:'active',createdById:id(2),createdAt:new Date()}};
const op={id:id(5),stepNumber:'OP10',name:'Synthetic operation',machinesEquipmentDocs:[]};
const rows=[{id:id(6),rowNumber:1,processStepId:op.id,processStep:op,
 controls:[7,8].map(n=>({controlId:id(n),control:{id:id(n),tenantId:actor.tenantId,name:`Control ${n}`,type:'detection'}})),
 characteristics:[9,10].map(n=>({characteristicId:id(n),characteristic:{id:id(n),tenantId:actor.tenantId,name:`Characteristic ${n}`}})),
 requirements:[11,12].map(n=>({requirementId:id(n),requirement:{id:id(n),tenantId:actor.tenantId,name:`Requirement ${n}`}}))}];
const db={documentRevision:{findFirst:async()=>({id:id(13),document:doc,status:'draft',lockedAt:null})},user:{findFirst:async()=>({status:'active',isGuest:false})},pfmeaRow:{findMany:async()=>rows},processStep:{findMany:async()=>[{id:op.id}]}};
const service=new ControlPlanDocumentService({});
service.context=async()=>({document:doc});
(async()=>{
 const result=await service.candidates(db,actor,id(14),id(13));
 assert.equal(result.candidates.length,8);
 console.log('REPRODUCED: 2 controls x 2 characteristics x 2 requirements creates 8 tuple candidates without explicit control-to-characteristic relationships.');
 const preview=cp.previewCp(cp.emptyCpDocument(),[result.candidates[0]],id(13));
 const applied=cp.applyCpChanges(cp.emptyCpDocument(),preview,[{key:preview[0].key,action:'add'}]);
 assert.equal(applied.lines[0].sourceState,'current');
 assert.equal(applied.lines[0].fieldReviews,undefined);
 console.log('CONFIRMED: accepted addition is sourceState=current; schema v1 carries no content-bound field review records.');
 console.log('ISOLATION: actual service/pure functions with in-memory DB stubs only; no real database, HTTP, account or source mutation.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
