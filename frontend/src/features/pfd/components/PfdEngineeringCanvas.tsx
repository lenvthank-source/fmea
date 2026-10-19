import React, { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../../config';
import type { ProcessStep } from '../PfdWorkspace';
import { derivePfdGraph, graphBounds, graphLabel, pfdSvg, routeKinds, exportPfdWorkbook, listValue, pfdActivityType } from '../utils/pfdGraph';
import type { PfdGraph, PfdNode, PfdEdge } from '../utils/pfdGraph';
import './pfd-engineering.css';
import { openPfdPrint } from '../utils/pfdPrint';
interface Props { steps: ProcessStep[]; revisionId: string | null; token: string | null; project?: Record<string, unknown>; onSelectStep: (step: ProcessStep) => void; [key: string]: unknown; }
export const PfdEngineeringCanvas: React.FC<Props> = ({ steps, revisionId, token, project = {}, onSelectStep, reloadKey }) => {
  const [graph, setGraph] = useState<PfdGraph>(() => derivePfdGraph(steps));
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState(0), [writable, setWritable] = useState(false), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [selected, setSelected] = useState(''), [zoom, setZoom] = useState(.85);
  const [source, setSource] = useState(''), [target, setTarget] = useState(''), [kind, setKind] = useState<PfdEdge['kind']>('normal'), [label, setLabel] = useState('');
  const [tab, setTab] = useState<'details'|'routes'|'list'>('details');
  const [boundaryKind, setBoundaryKind] = useState<PfdNode['kind']>('hold'), [boundaryLabel, setBoundaryLabel] = useState('');
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id:string; x:number; y:number; cx:number; cy:number } | null>(null);
  const stepIds = steps.map(s => s.id).join(',');
  const storageKey = `pfd-graph-draft:${revisionId}`;
  useEffect(() => {
    if (!revisionId || !token) return;
    const abort = new AbortController(); setBusy(true); setLoaded(false); setError('');
    fetch(`${API_BASE_URL}/revisions/${revisionId}/pfd-graph`, { headers:{ Authorization:`Bearer ${token}` }, signal:abort.signal })
      .then(async r => {
        if (r.status === 404) {
          return { graph: null, version: 0, writable: true };
        }
        if (!r.ok) throw new Error('Could not load the saved process flow. Retry before editing.');
        return r.json();
      })
      .then(data => {
        let current: PfdGraph = data.graph || derivePfdGraph(steps);
        const missing = steps.filter(s => !current.nodes.some(n => n.stepId === s.id));
        if (missing.length) current = {...current, reviewStatus:'draft', nodes:[...current.nodes,...missing.map((s,i) => ({id:`step-${s.id}`,kind:'step' as const,stepId:s.id,x:600,y:80+i*230}))]};
        let restored = false;
        try { const draft = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
          if (draft?.version === data.version && draft?.graph?.schemaVersion === 1 && draft.graph.nodes.filter((n:PfdNode) => n.kind==='step').every((n:PfdNode) => steps.some(s=>s.id===n.stepId)) && steps.every(s=>draft.graph.nodes.some((n:PfdNode)=>n.stepId===s.id))) {current=draft.graph;restored=true;}
        } catch { /* Optional local recovery, never a server override. */ }
        setLoaded(true);setGraph(current);setVersion(data.version);setWritable(Boolean(data.writable));setDirty(restored||missing.length>0);
        setNotice(restored?'Unsaved draft restored from this session.':!data.graph?'Sequence-derived draft. Confirm actual routes, decisions and boundaries before marking reviewed.':missing.length?'New operations need connections. Existing routing is preserved.':'Saved flow loaded.');
      }).catch(e=>{if(e.name!=='AbortError'){setError(e.message);setWritable(false);}}).finally(()=>{if(!abort.signal.aborted)setBusy(false);});
    return ()=>abort.abort();
    // Operation identity changes require a reload; narration changes do not rewrite topology.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[revisionId,token,stepIds,reloadKey]);
  useEffect(()=>{if(dirty)try{sessionStorage.setItem(storageKey,JSON.stringify({version,graph}));}catch{/* Saving remains available without local storage. */}},[dirty,graph,version,storageKey]);
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  const change=(next:PfdGraph)=>{if(!writable)return;setGraph({...next,reviewStatus:'draft'});setDirty(true);setError('');};
  const bounds=graphBounds(graph,steps), node=graph.nodes.find(n=>n.id===selected), step=steps.find(s=>s.id===node?.stepId);
  const move=(id:string,x:number,y:number)=>change({...graph,nodes:graph.nodes.map(n=>n.id===id?{...n,x:Math.max(15,Math.round(x)),y:Math.max(45,Math.round(y))}:n)});
  const save=async()=>{setBusy(true);setError('');try{
    const r=await fetch(`${API_BASE_URL}/revisions/${revisionId}/pfd-graph`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({version,graph})});
    const data=await r.json();if(!r.ok)throw new Error(Array.isArray(data.message)?data.message.join('; '):data.message||'Save failed');
    setVersion(data.version);setDirty(false);sessionStorage.removeItem(storageKey);setNotice('Flow saved. Operation numbering and table order are unchanged.');
  }catch(e){setError(e instanceof Error?e.message:'Save failed. Your draft is retained.');}finally{setBusy(false);}};
  const addEdge=()=>{if(!source||!target||source===target){setError('Choose two different nodes.');return;}if(kind==='conditional'&&!label.trim()){setError('Describe the decision outcome, such as Pass or Fail.');return;}change({...graph,edges:[...graph.edges,{id:crypto.randomUUID(),source,target,kind,label:label.trim()}]});setLabel('');};
  const download=()=>{const url=URL.createObjectURL(new Blob([pfdSvg(graph,steps,String(project.partName||'Process flow'))],{type:'image/svg+xml'}));const a=document.createElement('a');a.href=url;a.download='Process_Flow_Diagram.svg';a.click();URL.revokeObjectURL(url);};
  const print=()=>{if(!openPfdPrint(graph,steps,project))setError('Allow a print window to export PDF.');};
  const optionNodes=graph.nodes.map(n=><option key={n.id} value={n.id}>{graphLabel(n,steps)}</option>);
  return <section className="pfd-engineering" aria-label="Manufacturing process flow editor">
    <div className="pfd-toolbar"><div><strong>Manufacturing process flow</strong><span>{graph.reviewStatus==='reviewed'?'Reviewed topology':'Draft topology'} · {steps.length} operations{dirty?' · Unsaved':''}</span></div><div className="pfd-tools">
      <button aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(.35,z-.15))}>−</button><span>{Math.round(zoom*100)}%</span><button aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(2,z+.15))}>+</button>
      <button onClick={()=>setZoom(Math.max(.35,Math.min(1,(canvas.current?.clientWidth||800)/bounds.width)))}>Fit width</button>
      <button disabled={!writable||busy} onClick={()=>change({...graph,nodes:graph.nodes.map((n,i)=>({...n,x:['step','start','end'].includes(n.kind)?260:650,y:60+i*300}))})}>Arrange nodes</button>
      <button disabled={!loaded||busy} onClick={download}>SVG</button><button disabled={!loaded||busy} onClick={print}>Print / PDF</button><button disabled={!loaded||busy} onClick={()=>exportPfdWorkbook(graph,steps,project).catch(e=>setError(e.message))}>Excel</button><button className="pfd-primary" disabled={!writable||busy} onClick={save}>{busy?'Working…':'Save flow'}</button>
    </div></div>
    {error&&<div className="pfd-message pfd-error" role="alert">{error}<button onClick={()=>window.location.reload()}>Reload saved flow</button></div>}
    {notice&&<div className="pfd-message" role="status">{notice}</div>}
    <div className="pfd-legend">○ Operation <span>□ Inspection · ▣ Combined</span><span>▽ Storage</span><span>➜ Transport</span><span>D Delay</span><span>◇ Decision</span><span>RW Rework · RP Repair</span><span>H Hold · X Scrap</span></div>
    <div className="pfd-editor-layout"><div className="pfd-canvas" ref={canvas}><div style={{width:bounds.width*zoom,height:bounds.height*zoom}}><div style={{transform:`scale(${zoom})`,transformOrigin:'top left',width:bounds.width}} dangerouslySetInnerHTML={{__html:pfdSvg(graph,steps,'Process flow diagram',selected)}}
      onClick={e=>{const id=(e.target as Element).closest('[data-node-id]')?.getAttribute('data-node-id');if(id)setSelected(id);}}
      onKeyDown={e=>{const id=(e.target as Element).closest('[data-node-id]')?.getAttribute('data-node-id');if(!id)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(id);}if(e.altKey&&e.key.startsWith('Arrow')){e.preventDefault();const n=graph.nodes.find(n=>n.id===id)!;move(id,n.x+(e.key==='ArrowRight'?20:e.key==='ArrowLeft'?-20:0),n.y+(e.key==='ArrowDown'?20:e.key==='ArrowUp'?-20:0));}}}
      onPointerDown={e=>{if(!writable||e.button!==0)return;const id=(e.target as Element).closest('[data-node-id]')?.getAttribute('data-node-id');const n=graph.nodes.find(n=>n.id===id);if(n){setSelected(n.id);drag.current={id:n.id,x:n.x,y:n.y,cx:e.clientX,cy:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}}
      onPointerMove={e=>{const d=drag.current;if(d)move(d.id,d.x+(e.clientX-d.cx)/zoom,d.y+(e.clientY-d.cy)/zoom);}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} /></div></div>
    <aside className="pfd-inspector"><nav aria-label="Process editor panels">{(['details','routes','list'] as const).map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t==='list'?'Node list':t==='routes'?'Connections':'Details'}</button>)}</nav>
      {tab==='details'&&<><h3>{node?graphLabel(node,steps):'Select an operation'}</h3><p>Select a node to see its complete information. Drag to position it, or use Alt + arrow keys.</p>
        {step&&<><dl>{[['Activity',pfdActivityType(step)],['Equipment / documents',listValue(step.machinesEquipmentDocs)],['Variation sources',listValue(step.incomingVariation)],['Inputs',step.inputs],['Outputs',step.outputs],['Desired outcome',listValue(step.desiredOutcome)],['Characteristics',listValue(step.processCharacteristics)],['Special characteristics',step.specialCharacteristics]].map(([key,val])=><React.Fragment key={key}><dt>{key}</dt><dd>{val||'Not recorded'}</dd></React.Fragment>)}</dl><button onClick={()=>onSelectStep(step)}>{writable?'Edit operation details':'View operation details'}</button></>}
        {node&&<><label>Horizontal position<input type="number" disabled={!writable} value={node.x} onChange={e=>move(node.id,Number(e.target.value),node.y)}/></label><label>Vertical position<input type="number" disabled={!writable} value={node.y} onChange={e=>move(node.id,node.x,Number(e.target.value))}/></label>{node.kind!=='step'&&<><label>Marker label<input disabled={!writable} value={node.label||''} onChange={e=>change({...graph,nodes:graph.nodes.map(n=>n.id===selected?{...n,label:e.target.value}:n)})}/></label><button disabled={!writable} onClick={()=>{change({...graph,nodes:graph.nodes.filter(n=>n.id!==selected),edges:graph.edges.filter(e=>e.source!==selected&&e.target!==selected)});setSelected('');}}>Remove marker and its connections</button></>}</>}
        <hr/><h3>Topology review</h3><label><input type="checkbox" disabled={!writable} checked={graph.reviewStatus==='reviewed'} onChange={e=>{setGraph({...graph,reviewStatus:e.target.checked?'reviewed':'draft'});setDirty(true);}}/> Actual routes reviewed</label><p>This reviews topology only. It does not approve the FMEA or accept risk. The server checks connectivity when saving.</p></>}
      {tab==='routes'&&<><h3>Connect actual process routes</h3><label>From<select disabled={!writable} value={source} onChange={e=>setSource(e.target.value)}><option value="">Choose source</option>{optionNodes}</select></label><label>To<select disabled={!writable} value={target} onChange={e=>setTarget(e.target.value)}><option value="">Choose destination</option>{optionNodes}</select></label><label>Route type<select disabled={!writable} value={kind} onChange={e=>setKind(e.target.value as PfdEdge['kind'])}>{routeKinds.map(k=><option key={k}>{k}</option>)}</select></label><label>Outcome / condition<input disabled={!writable} maxLength={500} value={label} onChange={e=>setLabel(e.target.value)} placeholder="Pass, Fail, Line A…"/></label><button disabled={!writable} onClick={addEdge}>Add connection</button>
        <ul className="pfd-route-list">{graph.edges.map(e=><li key={e.id}><strong>{graphLabel(graph.nodes.find(n=>n.id===e.source)!,steps)}</strong><span>→ {graphLabel(graph.nodes.find(n=>n.id===e.target)!,steps)}</span><label>Condition<input disabled={!writable} value={e.label} onChange={event=>change({...graph,edges:graph.edges.map(edge=>edge.id===e.id?{...edge,label:event.target.value}:edge)})}/></label><small>{e.kind}</small><button disabled={!writable} onClick={()=>change({...graph,edges:graph.edges.filter(edge=>edge.id!==e.id)})}>Remove connection</button></li>)}</ul></>}
      {tab==='list'&&<><h3>Process nodes</h3><ul className="pfd-node-list">{graph.nodes.map(n=><li key={n.id}><button aria-pressed={selected===n.id} onClick={()=>{setSelected(n.id);setTab('details');}}>{graphLabel(n,steps)}</button></li>)}</ul><h3>Add boundary / disposition</h3><label>Marker type<select disabled={!writable} value={boundaryKind} onChange={e=>setBoundaryKind(e.target.value as PfdNode['kind'])}>{['start','end','connector','hold','scrap','return'].map(k=><option key={k}>{k}</option>)}</select></label><label>Label<input disabled={!writable} value={boundaryLabel} onChange={e=>setBoundaryLabel(e.target.value)}/></label><button disabled={!writable} onClick={()=>{const n:PfdNode={id:crypto.randomUUID(),kind:boundaryKind,label:boundaryLabel||boundaryKind,x:650,y:80};change({...graph,nodes:[...graph.nodes,n]});setSelected(n.id);setTab('details');}}>Add marker</button></>}
      {!writable&&<p role="status">{loaded?'Read-only revision. Viewing and exports remain available.':'Saved flow unavailable. Reload before editing or exporting.'}</p>}
    </aside></div>
  </section>;
};
