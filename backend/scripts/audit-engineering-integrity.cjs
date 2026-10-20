// Read-only audit. Historical matching values are findings, never proof of their origin.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const report={crossProjectAnalysis:[],crossProjectControlPlan:[],samplingDefaultsForReview:[],canonicalDocuments:0};
  const tenants=await prisma.tenant.findMany({select:{id:true}});
  for(const {id:tenantId} of tenants){
    const rows=await prisma.pfmeaRow.findMany({where:{revision:{document:{tenantId}}},include:{revision:{include:{document:true}},processStep:{include:{revision:{include:{document:true}}}}}});
    for(const row of rows)if(row.processStep&&(row.processStep.revision.document.tenantId!==tenantId||row.processStep.revision.document.projectId!==row.revision.document.projectId))report.crossProjectAnalysis.push(row.id);
    const controls=await prisma.controlPlanRow.findMany({where:{revision:{document:{tenantId}}},include:{revision:{include:{document:true}},processStep:{include:{revision:{include:{document:true}}}}}});
    for(const row of controls){
      if(row.processStep.revision.document.tenantId!==tenantId||row.processStep.revision.document.projectId!==row.revision.document.projectId)report.crossProjectControlPlan.push(row.id);
      if(row.sampleSize==='5 pcs'&&row.frequency==='1 per shift')report.samplingDefaultsForReview.push(row.id);
    }
    report.canonicalDocuments+=await prisma.dfmeaDocument.count({where:{tenantId}})+await prisma.controlPlanDocument.count({where:{tenantId}});
  }
  console.log(JSON.stringify({...report,notice:'Read-only findings. No engineering decision or historical record was changed.'},null,2));
}
main().catch(()=>{console.error('Engineering audit failed; check database access.');process.exitCode=1;}).finally(()=>prisma.$disconnect());
