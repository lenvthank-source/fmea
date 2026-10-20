// Integration verification uses an isolated tenant and ALWAYS rolls back.
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {PrismaClient}=require('@prisma/client');
const bcrypt=require('bcryptjs');
const {DfmeaService}=require('../dist/modules/dfmea/dfmea.service');
const {emptyDfmea}=require('../dist/modules/dfmea/dfmea-document');
const {ControlPlanDocumentService}=require('../dist/modules/control-plan/control-plan-document.service');
const {ProjectService}=require('../dist/modules/project/project.service');
const {RevisionGuard}=require('../dist/common/revision-guard');
const prisma=new PrismaClient();
const rollback=new Error('CONTROLLED_ENGINEERING_TEST_ROLLBACK');
const tenantId=randomUUID();
async function main(){
 let triggerVerified=false;
 try{await prisma.$transaction(async tx=>{
  const db=new Proxy(tx,{get(target,key){if(key==='$transaction')return async fn=>fn(db);return target[key];}});
  await tx.tenant.create({data:{id:tenantId,name:'Transactional engineering verification',subdomain:`verify-${tenantId.slice(0,12)}`}});
  const passwordHash=await bcrypt.hash('isolated-test-password',4);
  const author=await tx.user.create({data:{tenantId,name:'Test author',email:`author-${tenantId}@invalid.test`,passwordHash}});
  const reviewer=await tx.user.create({data:{tenantId,name:'Test reviewer',email:`reviewer-${tenantId}@invalid.test`,passwordHash}});
  const project=await tx.project.create({data:{tenantId,name:'Synthetic verification only',createdById:author.id,documentTypes:['DFMEA','PFD','CONTROL_PLAN'],cftMembers:[]}});
  const actor={tenantId,userId:author.id};
  async function document(type){const doc=await tx.document.create({data:{tenantId,projectId:project.id,type,name:type,createdById:author.id}});const rev=await tx.documentRevision.create({data:{documentId:doc.id,revisionNumber:'1.0',createdById:author.id}});await tx.document.update({where:{id:doc.id},data:{currentRevisionId:rev.id}});return rev;}
  const design=await document('DFMEA'),flow=await document('PFD'),plan=await document('CONTROL_PLAN');
  const designs=new DfmeaService(db,new RevisionGuard(db));
  const plans=new ControlPlanDocumentService(db);
  const audit={createEntry:async data=>tx.auditLog.create({data})};
  const projects=new ProjectService(db,audit);
  const data=emptyDfmea();data.planning={scope:'Synthetic verification',boundary:'Test boundary',team:'Test team',timing:'Test gate',criteriaProfile:'legacy-configured-unverified'};
  for(let i=0;i<3;i++){data.elements.push({id:`e${i}`,parentId:i?`e${i-1}`:null,kind:['system','subsystem','component'][i],name:`Test element ${i}`,description:'Synthetic'});data.functions.push({id:`f${i}`,elementId:`e${i}`,text:`Test function ${i}`,requirement:'Synthetic requirement'});data.chains.push({id:`c${i}`,focusElementId:`e${i}`,functionId:`f${i}`,mode:'Synthetic failure',effects:[{id:`ef${i}`,elementId:null,text:'Synthetic effect',severity:2}],causes:[{id:`ca${i}`,elementId:null,text:'Synthetic cause',preventionControl:'Test prevention',detectionControl:'Test detection',occurrence:2,detection:2,actions:[]}],reviewDecision:'Synthetic team review',specialCharacteristicRefs:[]});}
  const saved=await designs.save(actor,design.id,0,data);assert.equal(saved.version,1);assert.equal(saved.evaluations.length,3);
  await assert.rejects(()=>designs.save(actor,design.id,0,data),/changed/);
  const readable=await designs.get(actor,design.id);assert.deepEqual(readable.data,data);
  await projects.submitRevision(tenantId,author.id,design.id);
  await assert.rejects(()=>projects.approveRevision(tenantId,author.id,design.id,{password:'isolated-test-password',comment:'test'}),/own revision/);
  await projects.rejectRevision(tenantId,reviewer.id,design.id,{comment:'Synthetic correction cycle'});
  assert.equal((await tx.documentRevision.findUnique({where:{id:design.id}})).status,'draft');
  await projects.submitRevision(tenantId,author.id,design.id);
  await projects.approveRevision(tenantId,reviewer.id,design.id,{password:'isolated-test-password',comment:'Synthetic review only'});
  await assert.rejects(()=>designs.save(actor,design.id,1,data),/locked|draft|protected/);
  const fork=await designs.fork(actor,design.id,{revisionNumber:'1.1',summary:'Synthetic clone'});assert.deepEqual((await designs.get(actor,fork.revisionId)).data,data);
  const item=await tx.processItem.create({data:{tenantId,projectId:project.id,name:'Synthetic operations'}});
  const operation=await tx.processStep.create({data:{revisionId:flow.id,processItemId:item.id,name:'Synthetic operation',stepNumber:'OP10',stepType:'operation',sequenceOrder:1}});
  const preview=await plans.preview(actor,plan.id,flow.id);assert.equal(preview.changes.length,1);assert.equal(preview.changes[0].candidate.sampleSize,'');
  let cp=await plans.apply(actor,plan.id,{...preview,decisions:[{key:preview.changes[0].key,action:'add'}]});
  const line=cp.document.lines[0];Object.assign(line,{characteristicName:'Synthetic feature',characteristicKind:'product',specification:'Test requirement',controlType:'detection',controlMethod:'Reviewed test method',evaluationMethod:'Test instrument',sampleSize:'Test quantity',frequency:'Test volume frequency',volumeBasis:'Test containment basis',responsible:'Test function',reactionOwner:'Test owner',reactionPlan:'Test stop and contain procedure'});
  Object.assign(cp.document.header,{controlPlanNumber:'TEST-CP',issueDate:'2026-10-19',customer:'Synthetic customer',organisationName:'Synthetic organisation',organisationPlant:'Synthetic site',orgPartNumber:'TEST-PART',partName:'Synthetic part',engineeringChangeLevel:'TEST-1',keyContact:'Test contact'});
  cp.document.config.phase='prototype';cp.document.config.standardProfile='AIAG Control Plan 1st edition; test';
  cp=await plans.save(actor,plan.id,{expectedVersion:cp.version,document:cp.document});
  await tx.processStep.update({where:{id:operation.id},data:{name:'Changed synthetic operation'}});
  const change=await plans.preview(actor,plan.id,flow.id);assert.equal(change.changes.length,1);
  cp=await plans.apply(actor,plan.id,{...change,decisions:[{key:change.changes[0].key,action:'update'}]});assert.equal(cp.document.lines[0].controlMethod,'Reviewed test method');assert.equal(cp.document.lines[0].operationName,'Changed synthetic operation');assert.equal((await plans.preview(actor,plan.id,flow.id)).changes.length,0);
  await tx.documentRevision.update({where:{id:flow.id},data:{status:'approved',lockedAt:new Date()}});
  await projects.submitRevision(tenantId,author.id,plan.id);
  await projects.approveRevision(tenantId,reviewer.id,plan.id,{password:'isolated-test-password',comment:'Synthetic CP review only'});
  await assert.rejects(()=>plans.apply(actor,plan.id,{...change,decisions:[]}),/protected/);
  const phase=await plans.fork(actor,plan.id,{revisionNumber:'1.1',phase:'pre-launch',summary:'Synthetic phase'});assert.equal((await plans.get(actor,phase.revisionId)).document.config.phase,'pre-launch');assert.equal((await plans.get(actor,plan.id)).document.config.phase,'prototype');
  await assert.rejects(()=>plans.get({tenantId:randomUUID(),userId:author.id},plan.id),/not found/);
  // History mutations must preserve protected baselines even through administrative routes.
  await assert.rejects(()=>projects.adminDeleteRevision(tenantId,author.id,design.id),/draft|protected|locked/i);
  await assert.rejects(()=>projects.adminDeleteRevision(tenantId,author.id,plan.id),/draft|protected|locked/i);
  await assert.rejects(()=>projects.remove(tenantId,project.id,true,author.id),/protected|approved|history|draft|locked/i);
  await projects.switchActiveRevision(tenantId,author.id,design.id);
  assert.equal((await tx.document.findUnique({where:{id:design.documentId}})).currentRevisionId,design.id);
  assert.equal((await tx.documentRevision.findUnique({where:{id:design.id}})).status,'approved');
  await projects.switchActiveRevision(tenantId,author.id,fork.revisionId);
  assert.equal((await tx.document.findUnique({where:{id:design.documentId}})).currentRevisionId,fork.revisionId);
  // Final SQL guard failure aborts this disposable transaction; no test records commit.
  try{await tx.controlPlanDocument.update({where:{revisionId:plan.id},data:{version:999}});}catch(error){assert.match(String(error),/protected/);triggerVerified=true;}
  assert.equal(triggerVerified,true);throw rollback;
 },{timeout:120000,isolationLevel:'Serializable'});}catch(error){if(error!==rollback)throw error;}
 assert.equal(await prisma.tenant.count({where:{id:tenantId}}),0);
 console.log('PASS: DFMEA/CP save, stale conflict, review return, segregated approval, locks, cloning, source review, phase history, protected administrative history, baseline activation, tenant isolation, SQL guard. All synthetic data rolled back.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
