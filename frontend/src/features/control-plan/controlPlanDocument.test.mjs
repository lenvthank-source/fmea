import test from 'node:test';
import assert from 'node:assert/strict';
import {blankLine,importControlRows,lineFields,validateImport} from './controlPlanDocument.ts';

const document = () => ({schemaVersion:1,config:{phase:'prototype',safeLaunch:{enabled:false,entryCriteria:'',exitCriteria:'',additionalControls:''},standardProfile:'',customerRequirements:'',sourceExceptionJustification:''},header:{},sourceBaselines:[],lines:[blankLine()]});

test('incomplete engineering drafts are structurally valid without guessed control decisions',()=>{
 const draft=document();assert.deepEqual(validateImport(draft),[]);assert.equal(draft.lines[0].sampleSize,'');assert.equal(draft.lines[0].reactionPlan,'');
});
test('edited native worksheets preserve line identity, source provenance and explicit review state',()=>{
 const line=blankLine();line.id='stable-line';line.characteristicName='流量 µm';line.source={key:'source-key',revisionId:'source-revision',snapshot:{controlMethod:'Original'}};line.sourceState='changed';
 const row={...Object.fromEntries(lineFields.map(([key,label])=>[label,line[key]])),'Line ID':line.id,'Source provenance':JSON.stringify(line.source),'Source review state':line.sourceState};
 const [imported]=importControlRows([{...row,'Control method':'Reviewed new method'}]);assert.equal(imported.id,line.id);assert.deepEqual(imported.source,line.source);assert.equal(imported.sourceState,'changed');assert.equal(imported.controlMethod,'Reviewed new method');assert.equal(imported.characteristicName,'流量 µm');
});
test('imports report duplicate identity, bad source mapping and invalid baseline rather than repairing them',()=>{
 const draft=document();draft.lines.push({...draft.lines[0]});draft.sourceBaselines=[{revisionId:'',type:'DFMEA'}];draft.lines[0].source={key:'key',revisionId:'revision',snapshot:{field:42}};
 const errors=validateImport(draft);assert.ok(errors.some(error=>error.includes('duplicate identity')));assert.ok(errors.some(error=>error.includes('invalid source provenance')));assert.ok(errors.some(error=>error.includes('Source baseline')));
});
test('exclusions require review justification and retain exact source fingerprint',()=>{
 const draft=document();draft.sourceExclusions=[{key:'key',revisionId:'revision',reason:' ',sourceFingerprint:'fingerprint'}];assert.ok(validateImport(draft).some(error=>error.includes('Source exclusion')));draft.sourceExclusions[0].reason='Not applicable to this controlled product family';assert.deepEqual(validateImport(draft),[]);
});
test('all rows are retained when importing more than a page of controls',()=>{
 const rows=Array.from({length:125},(_,index)=>({...Object.fromEntries(lineFields.map(([key,label])=>[label,blankLine()[key]])),'Line ID':`line-${index}`}));const imported=importControlRows(rows);assert.equal(imported.length,125);assert.equal(imported.at(-1).id,'line-124');
});
