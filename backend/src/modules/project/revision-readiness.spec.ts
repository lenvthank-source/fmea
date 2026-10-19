import { revisionReadiness } from './revision-readiness';
describe('Revision submission policy',()=>{
  const empty = { steps:[],rows:[],controlRows:[] };
  it('reports incomplete PFMEA and CP at submission rather than imposing draft stage locks',()=>{
    expect(revisionReadiness({...empty,type:'PFMEA'}).ready).toBe(false);
    expect(revisionReadiness({...empty,type:'CONTROL_PLAN'}).ready).toBe(false);
  });
  it('requires explicit reviewed PFD topology',()=>expect(revisionReadiness({...empty,type:'PFD'}).errors[0]).toContain('topology'));
  it('accepts complete structured rows and preserves source-verification disclosure',()=>{
    const row={rowNumber:1,processStepId:'p1',severity:7,occurrence:3,detection:4,functions:[{name:'Recorded engineering content'}],requirements:[{name:'Recorded engineering content'}],failureModes:[{name:'Recorded engineering content'}],effects:[{name:'Recorded engineering content'}],causes:[{name:'Recorded engineering content'}],controls:[{name:'Recorded engineering content'}]};
    const result=revisionReadiness({...empty,type:'PFMEA',rows:[row]}); expect(result.ready).toBe(true);expect(result.warnings[0]).toContain('unverified');
  });
  it('rejects blank placeholder content at submission',()=>{
    const row={rowNumber:1,severity:7,occurrence:3,detection:4,functions:[{name:' '}],requirements:[],failureModes:[],effects:[],causes:[],controls:[]};
    expect(revisionReadiness({...empty,type:'DFMEA',rows:[row]}).errors.join()).toContain('blank');
  });
  it('rejects fractional ratings and missing reaction plans',()=>{
    const row={rowNumber:1,severity:7.5,occurrence:3,detection:4,functions:[],requirements:[],failureModes:[],effects:[],causes:[],controls:[]};
    expect(revisionReadiness({...empty,type:'DFMEA',rows:[row]}).errors.join()).toContain('integer');
    expect(revisionReadiness({...empty,type:'CONTROL_PLAN',controlRows:[{rowNumber:1,processStepId:'p1',measurementMethod:'Gauge'}]}).errors.join()).toContain('reaction plan');
  });
});
