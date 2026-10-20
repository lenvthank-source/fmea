/** Disposable browser QA only. No admin roles, global permission writes or authentication bypasses.
 * node scripts/browser-engineering-fixture.cjs validate|seed|cleanup <manifest-path>
 */
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { DfmeaService } = require('../dist/modules/dfmea/dfmea.service');
const { emptyDfmea, validateDfmea, dfmeaReadiness } = require('../dist/modules/dfmea/dfmea-document');
const { ControlPlanDocumentService } = require('../dist/modules/control-plan/control-plan-document.service');
const { blankCpLine, emptyCpDocument, validateCpDocument, controlPlanReadiness } = require('../dist/modules/control-plan/control-plan-document');
const { ProjectService } = require('../dist/modules/project/project.service');
const { PfdService } = require('../dist/modules/pfd/pfd.service');
const { RevisionGuard } = require('../dist/common/revision-guard');
const MARKER = 'fmeapex-browser-engineering-qa-v1';
const roleCodes = {
  'Quality Engineer': ['project.view','project.create','project.edit','pfmea.view','pfmea.create','pfmea.edit','dfmea.view','dfmea.create','dfmea.edit','cp.view','cp.create','cp.edit','revision.create','revision.submit','action.view','action.create','action.edit','action.close'],
  Reviewer: ['project.view','pfmea.view','dfmea.view','cp.view','revision.review','action.view'],
  Approver: ['project.view','pfmea.view','dfmea.view','cp.view','revision.approve','action.view'],
};
const unicode = 'SYNTHETIC QA — Δ pressure ±0.05 kPa; 温度測定; Prüfmaß; contrôle; ضغط — long text verifies wrapping and full export retention.';
function makeDesign() {
  const d = emptyDfmea();
  d.planning = {scope:`Synthetic browser acceptance only. ${unicode}`,boundary:'Bench-only fictional assembly; no real product or production approval.',team:'QA Author / QA Reviewer / QA Approver',timing:'Disposable end-to-end review cycle',criteriaProfile:'legacy-configured-unverified'};
  d.parameterContext={idealFunction:'Maintain fictional bench pressure within synthetic requirement.',inputs:'Synthetic 12 V input',outputs:'Synthetic pressure signal',noiseFactors:'Fictional vibration and temperature variation',controlFactors:'Synthetic seal geometry and sensor range'};
  for(let i=0;i<30;i++) {
    const id=`element-${i}`,parentId=i===0?null:i===1?'element-0':'element-1';
    d.elements.push({id,parentId,kind:i===0?'system':i===1?'subsystem':'component',name:`QA ${i===0?'system':i===1?'subsystem':'component'} ${i+1}`,description:unicode});
    d.functions.push({id:`function-${i}`,elementId:id,text:`Maintain synthetic function ${i+1}`,requirement:`QA requirement ${i+1}: ±0.05 kPa on fictional bench only. ${unicode}`});
    d.chains.push({id:`chain-${i}`,focusElementId:id,functionId:`function-${i}`,mode:`QA fictional failure mode ${i+1}`,effects:[{id:`effect-${i}`,elementId:null,text:`Synthetic downstream effect ${i+1}. ${unicode}`,severity:2}],causes:[{id:`cause-${i}`,elementId:null,text:`Fictional design cause ${i+1}. ${unicode}`,preventionControl:'Synthetic design review procedure QA-D01',detectionControl:'Synthetic bench validation procedure QA-V01',occurrence:2,detection:2,actions:[]}],reviewDecision:'QA fixture team review only. This is not an actual engineering assessment.',specialCharacteristicRefs:[]});
  }
  return d;
}
function completeLine(line,index) {
  Object.assign(line,{characteristicNumber:`QA-C${index+1}`,characteristicName:`Synthetic controlled feature ${index+1} — 温度 / Druck`,characteristicKind:index%2?'process':'product',classification:'standard',unit:'kPa',specification:`Fictional 10.00 kPa nominal; synthetic QA only. ${unicode}`,tolerance:'±0.05 kPa (fictional test input)',evaluationMethod:'Fictional QA bench measurement',gauge:'QA-GAUGE-01 (synthetic reference)',sampleSize:'QA fixture: 1 synthetic unit',frequency:'QA fixture: every synthetic unit',volumeBasis:'Synthetic acceptance dataset, not a production sampling recommendation.',controlMethod:`Fictional QA instruction ${index+1}. ${unicode}`,controlType:'detection',reactionPlan:`Synthetic stop, identify and contain procedure QA-R01. ${unicode}`,responsible:'QA execution group',reactionOwner:'QA containment owner',reactionProcedure:'QA-R01 fictional controlled procedure',containmentRationale:'Synthetic fixture exercises full field retention, not real containment engineering.',recordReference:`QA-RECORD-${index+1}`,notes:unicode,passThrough:'Not applicable: synthetic bench fixture.',errorProofing:'Synthetic function-check reference QA-EP01; no production claim.',reworkRepair:'No rework in this fictional dataset.',alternativeControl:'No alternate control selected for this synthetic test.',systemReference:'',sourceRequirement:`QA requirement ${index+1}`});
  return line;
}
function validate() {
  const d=makeDesign();assert.equal(d.chains.length,30);assert.deepEqual(validateDfmea(d),[]);assert.equal(dfmeaReadiness(d).ready,true);
  const cp=emptyCpDocument({controlPlanNumber:'QA-CP-001',issueDate:'2026-10-20',customer:'Synthetic QA customer',organisationName:'Synthetic QA organisation',organisationPlant:'Synthetic QA bench',orgPartNumber:'QA-ONLY-001',partName:'Fictional bench assembly',engineeringChangeLevel:'QA-A',keyContact:'QA Author'});
  cp.config.phase='prototype';cp.config.standardProfile='AIAG Control Plan 1st edition (2024); synthetic acceptance data, not conformity evidence';cp.config.sourceExceptionJustification='Pure fixture validation only; seeded plan uses an actually approved PFD baseline.';
  for(let i=0;i<105;i++){const l=completeLine(blankCpLine(randomUUID()),i);Object.assign(l,{operationId:randomUUID(),operationNumber:`QA-OP${i+1}`,operationName:'Fictional QA operation'});cp.lines.push(l);}
  validateCpDocument(cp);assert.equal(controlPlanReadiness(cp).ready,true);assert.equal(cp.lines.length,105);
  assert(Object.values(roleCodes).every(codes=>!codes.includes('admin.users')));return {design:d,plan:cp};
}
function transactionClient(tx) {let db;db=new Proxy(tx,{get(target,key){if(key==='$transaction')return async fn=>fn(db);const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});return db;}
async function seed(prisma) {
  const data=validate(),id=randomUUID(),subdomain=`qa-engineering-${id.slice(0,12)}`,manifestPath=path.join(os.tmpdir(),`fmeapex-browser-fixture-${id}.json`),password=`QA!${randomBytes(24).toString('base64url')}`;
  const permissions=await prisma.permission.findMany();const needed=[...new Set(Object.values(roleCodes).flat())];assert.deepEqual(needed.filter(code=>!permissions.some(p=>p.code===code)),[],'Global permissions must already exist; this script never creates them.');
  const hash=await bcrypt.hash(password,12);
  const manifest={schemaVersion:1,marker:MARKER,tenantId:id,subdomain,tenantName:`Synthetic Browser QA ${id}`,projectId:null,createdAt:new Date().toISOString(),credentials:{password,users:{}},revisions:{},counts:{dfmeaChains:30,controlPlanLines:105}};
  // Reserve the manifest before any database mutation, so interrupted QA can always be scoped for cleanup.
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2),{encoding:'utf8',flag:'wx',mode:0o600});
  try {
    await prisma.$transaction(async tx=>{
      const db=transactionClient(tx);
      await tx.tenant.create({data:{id,name:manifest.tenantName,subdomain,settings:{qaFixture:{marker:MARKER,tenantId:id}}}});
      for(const [roleName,codes] of Object.entries(roleCodes)) {
        const role=await tx.role.create({data:{tenantId:id,name:roleName,description:`${MARKER}: synthetic browser acceptance role`,isSystem:false}});
        await tx.rolePermission.createMany({data:permissions.filter(p=>codes.includes(p.code)).map(p=>({roleId:role.id,permissionId:p.id}))});
        const key=roleName==='Quality Engineer'?'author':roleName.toLowerCase();
        const user=await tx.user.create({data:{tenantId:id,email:`${key}@browser-qa.invalid`,name:`Synthetic QA ${key}`,passwordHash:hash,isGuest:false,userRoles:{create:{roleId:role.id}}}});
        manifest.credentials.users[key]={id:user.id,email:user.email,role:roleName};
      }
      const author=manifest.credentials.users.author,approver=manifest.credentials.users.approver,actor={tenantId:id,userId:author.id,isGuest:false};
      const project=await tx.project.create({data:{tenantId:id,name:`Synthetic Engineering Acceptance ${id.slice(0,8)}`,description:`${MARKER}; disposable fictional data only. ${unicode}`,createdById:author.id,documentTypes:['Prototype'],cftMembers:['Synthetic QA author','Synthetic QA reviewer','Synthetic QA approver'],partName:'Fictional QA bench assembly',orgPartNumber:'QA-ONLY-001',customer:'Synthetic QA customer',organisationName:'Synthetic QA organisation',organisationPlant:'Synthetic QA bench',controlPlanNumber:'QA-CP-001',latestChangeLevel:'QA-A',keyContact:'QA Author',uiSettings:{qaFixtureMarker:MARKER}}});manifest.projectId=project.id;
      async function document(type){const doc=await tx.document.create({data:{tenantId:id,projectId:project.id,type,name:`Synthetic ${type}`,createdById:author.id}});const rev=await tx.documentRevision.create({data:{documentId:doc.id,revisionNumber:'1.0',createdById:author.id,summary:'Disposable browser acceptance draft'}});await tx.document.update({where:{id:doc.id},data:{currentRevisionId:rev.id}});manifest.revisions[type]=rev.id;return rev;}
      const design=await document('DFMEA'),flow=await document('PFD'),plan=await document('CONTROL_PLAN');
      const designs=new DfmeaService(db,new RevisionGuard(db)),plans=new ControlPlanDocumentService(db),pfd=new PfdService(db,new RevisionGuard(db));
      const audit={createEntry:async entry=>tx.auditLog.create({data:entry})};const projects=new ProjectService(db,audit);
      const item=await tx.processItem.create({data:{tenantId:id,projectId:project.id,name:'Synthetic QA operation container'}}),operations=[];
      for(let i=0;i<3;i++)operations.push(await tx.processStep.create({data:{revisionId:flow.id,processItemId:item.id,name:`Synthetic QA operation ${i+1}`,stepNumber:`QA-OP${(i+1)*10}`,stepType:'operation',sequenceOrder:i+1,description:unicode,machinesEquipmentDocs:['QA fictional bench','QA fictional gauge']}}));
      const graph={schemaVersion:1,notation:'manufacturing-v1',reviewStatus:'reviewed',nodes:[{id:'start',kind:'start',x:20,y:100,label:'Synthetic QA input'},...operations.map((op,i)=>({id:`node-${i}`,kind:'step',stepId:op.id,x:250+i*280,y:100})),{id:'end',kind:'end',x:1150,y:100,label:'Synthetic QA output'}],edges:[{id:'edge-0',source:'start',target:'node-0',kind:'normal',label:''},{id:'edge-1',source:'node-0',target:'node-1',kind:'normal',label:''},{id:'edge-2',source:'node-1',target:'node-2',kind:'normal',label:''},{id:'edge-3',source:'node-2',target:'end',kind:'normal',label:''}]};
      await pfd.saveGraph(id,flow.id,{version:0,graph});
      await projects.submitRevision(id,author.id,flow.id);await projects.approveRevision(id,approver.id,flow.id,{password,comment:'Synthetic QA source approval only; no real manufacturing authority.'});
      const preview=await plans.preview(actor,plan.id,flow.id);assert.equal(preview.changes.length,3);let savedPlan=await plans.apply(actor,plan.id,{...preview,decisions:preview.changes.map(c=>({key:c.key,action:'add'}))});
      savedPlan.document.header=data.plan.header;savedPlan.document.config=data.plan.config;savedPlan.document.config.sourceExceptionJustification='';
      const mapped=savedPlan.document.lines;
      savedPlan.document.lines=[];
      for(let opIndex=0;opIndex<mapped.length;opIndex++)for(let j=0;j<35;j++){const line=j===0?mapped[opIndex]:{...structuredClone(mapped[opIndex]),id:randomUUID(),source:undefined,sourceState:'manual'};completeLine(line,opIndex*35+j);savedPlan.document.lines.push(line);}
      // completeLine changes source-owned summaries intentionally; keep actual source snapshot for reviewed provenance.
      await plans.save(actor,plan.id,{expectedVersion:savedPlan.version,document:savedPlan.document});
      await designs.save(actor,design.id,0,data.design);
      for(const revisionId of [design.id,plan.id]){const ready=await projects.getRevisionReadiness(id,revisionId,author.id);assert.equal(ready.ready,true,JSON.stringify(ready.errors));}
      assert.equal((await tx.documentRevision.findUnique({where:{id:design.id}})).status,'draft');assert.equal((await tx.documentRevision.findUnique({where:{id:plan.id}})).status,'draft');
    },{timeout:120000,isolationLevel:'Serializable'});
    fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2),{encoding:'utf8',mode:0o600});
    console.log(JSON.stringify({marker:MARKER,tenantId:id,subdomain,projectId:manifest.projectId,revisions:manifest.revisions,counts:manifest.counts,manifestPath}));
  } catch(error){fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2),{encoding:'utf8',mode:0o600});throw error;}
}
function readManifest(file){if(!file)throw new Error('Cleanup requires exact manifest path.');const resolved=path.resolve(file);assert.equal(path.dirname(resolved).toLowerCase(),path.resolve(os.tmpdir()).toLowerCase(),'Manifest must reside directly in OS temporary directory.');const m=JSON.parse(fs.readFileSync(resolved,'utf8'));assert.equal(m.marker,MARKER);assert.match(m.tenantId,/^[0-9a-f-]{36}$/i);assert.equal(path.basename(resolved),`fmeapex-browser-fixture-${m.tenantId}.json`);assert.equal(m.subdomain,`qa-engineering-${m.tenantId.slice(0,12)}`);assert.equal(m.tenantName,`Synthetic Browser QA ${m.tenantId}`);return{manifest:m,file:resolved};}
async function cleanup(prisma,file){const{manifest:m,file:resolved}=readManifest(file);await prisma.$transaction(async tx=>{const tenant=await tx.tenant.findUnique({where:{id:m.tenantId}});if(!tenant)return;assert.equal(tenant.name,m.tenantName);assert.equal(tenant.subdomain,m.subdomain);assert.equal(tenant.settings?.qaFixture?.marker,MARKER);assert.equal(tenant.settings?.qaFixture?.tenantId,m.tenantId);const projects=await tx.project.findMany({where:{tenantId:m.tenantId}});assert(projects.every(p=>p.uiSettings?.qaFixtureMarker===MARKER),'Refusing cleanup: tenant contains non-fixture projects.');assert((await tx.user.findMany({where:{tenantId:m.tenantId}})).every(u=>!u.isGuest&&u.email.endsWith('@browser-qa.invalid')),'Refusing cleanup: unexpected tenant users.');await tx.auditLog.deleteMany({where:{tenantId:m.tenantId}});await tx.project.deleteMany({where:{tenantId:m.tenantId}});await tx.tenant.delete({where:{id:m.tenantId}});},{timeout:60000,isolationLevel:'Serializable'});assert.equal(await prisma.tenant.count({where:{id:m.tenantId}}),0);fs.unlinkSync(resolved);console.log(JSON.stringify({cleaned:true,tenantId:m.tenantId,globalHandleReservations:'untouched'}));}
async function main(){const command=process.argv[2];if(command==='validate'){validate();console.log('PASS: synthetic DFMEA 30 chains and Control Plan 105 lines pass canonical validation and readiness; no database mutation.');return;}if(!['seed','cleanup'].includes(command))throw new Error('Usage: browser-engineering-fixture.cjs validate|seed|cleanup <manifest-path>');const prisma=new PrismaClient();try{if(command==='seed')await seed(prisma);else await cleanup(prisma,process.argv[3]);}finally{await prisma.$disconnect();}}
main().catch(error=>{console.error(`Browser QA fixture failed: ${error.message}`);process.exitCode=1;});
