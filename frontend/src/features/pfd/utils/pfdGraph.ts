import type { ProcessStep } from '../PfdWorkspace';
import { getPfdSymbol, resolveStepSymbol, FLOW_SYMBOL_DEFINITIONS } from './pfdSymbols.ts';

export interface PfdNode {
  id: string;
  kind: 'step' | 'start' | 'end' | 'connector' | 'hold' | 'scrap' | 'return' | 'annotation';
  stepId?: string;
  symbolId?: string;
  width?: number;
  height?: number;
  label?: string;
  x: number;
  y: number;
}
export interface PfdEdge {
  id: string;
  source: string;
  target: string;
  kind: 'normal' | 'conditional' | 'parallel' | 'rework' | 'scrap' | 'material';
  label: string;
  sourcePort?: PfdPort;
  targetPort?: PfdPort;
  points?: PfdPoint[];
  junctions?: PfdPoint[];
  labelPosition?: PfdPoint;
}
export type PfdPort = 'north'|'east'|'south'|'west';
export interface PfdPoint { x:number; y:number }
export interface PfdGraph {
  schemaVersion: 1|2;
  notation: 'manufacturing-v1'|'engineering-v1';
  displayMode?: 'manufacturing'|'engineering';
  layoutDirection?: 'horizontal'|'vertical';
  reviewStatus: 'draft' | 'reviewed';
  nodes: PfdNode[];
  edges: PfdEdge[];
}
export const routeKinds: PfdEdge['kind'][] = ['normal', 'conditional', 'parallel', 'rework', 'scrap', 'material'];
/** Only explicit, unambiguous activity marks classify a source row. WIP/reject are annotations. */
export function pfdActivityFromSymbols(icons: Partial<Record<string, boolean>> = {}): string | null {
  const marked = [icons.oper && 'operation', icons.insp && 'inspection', icons.trans && 'transport', (icons.store || icons.recArea) && 'storage', icons.decs && 'decision', icons.rework && 'rework'].filter(Boolean) as string[];
  if (marked.length === 2 && marked.includes('operation') && marked.includes('inspection')) return 'combined';
  return marked.length === 1 ? marked[0] : null;
}
export function pfdActivityType(step?: ProcessStep): string {
  if (!step) return '';
  return step.stepType;
}
export function pfdFormattedActivities(step?: ProcessStep): string {
  if (!step) return '';
  if (step.flowIcons && typeof step.flowIcons === 'object') {
    const active = FLOW_SYMBOL_DEFINITIONS.filter(d => !!step.flowIcons?.[d.key]).map(d => d.name);
    if (active.length > 0) return active.join(', ');
  }
  return step.stepType;
}
export function derivePfdGraph(steps: ProcessStep[]): PfdGraph {
  const sorted = [...steps].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const nodes: PfdNode[] = [{ id: 'boundary-start', kind: 'start', label: 'Process start', x: 40, y: 80 }];
  let x = 360;
  for (const step of sorted) { nodes.push({ id: `step-${step.id}`, kind: 'step', stepId: step.id, x, y: 80 }); x += 340; }
  nodes.push({ id: 'boundary-end', kind: 'end', label: 'Process end', x, y: 80 });
  return { schemaVersion: 2, notation: 'manufacturing-v1', displayMode:'manufacturing', layoutDirection:'horizontal', reviewStatus: 'draft', nodes,
    edges: nodes.slice(1).map((node, i) => ({ id: `derived-${i}`, source: nodes[i].id, target: node.id, kind: 'normal', label: '' })) };
}
export function upgradePfdGraph(graph:PfdGraph):PfdGraph { return {...graph,schemaVersion:2,displayMode:graph.displayMode||'manufacturing',layoutDirection:graph.layoutDirection||'horizontal'}; }
export function pfdDiagramFindings(graph:PfdGraph,steps:ProcessStep[]):string[] {
  const findings:string[]=[];
  for(const node of graph.nodes) {
    const step=steps.find(s=>s.id===node.stepId); if(!step)continue;
    for(const finding of resolveStepSymbol(step,graph.displayMode||'manufacturing').findings) findings.push(`${step.stepNumber}: ${finding}`);
    if(pfdActivityType(step)==='decision' && graph.edges.filter(e=>e.source===node.id).length<2) findings.push(`${step.stepNumber}: Decision branches need explicit engineering review`);
    if(!graph.edges.some(e=>e.source===node.id||e.target===node.id))findings.push(`${step.stepNumber}: Operation is not connected`);
  }
  const junctionCounts=new Map<string,Set<string>>();for(const edge of graph.edges)for(const point of edge.junctions||[]){const key=`${point.x},${point.y}`;if(!junctionCounts.has(key))junctionCounts.set(key,new Set());junctionCounts.get(key)!.add(edge.id);}for(const [coordinate,incidents] of junctionCounts)if(incidents.size<2)findings.push(`Junction ${coordinate}: Explicit incident route references require review`);
  return findings;
}
export function wrapPfdText(value: string, width = 31): string[] {
  // Count wide Unicode glyphs as two Latin-width units and never split surrogate pairs.
  const weight=(value:string)=>Array.from(value).reduce((sum,char)=>sum+(/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7af\uf900-\ufaff\ufe10-\ufe6f\uff00-\uff60\u{1f000}-\u{1ffff}]/u.test(char)?2:1),0);
  const lines:string[]=[];let line='';
  for(const word of String(value||'Unnamed operation').trim().split(/\s+/u)){
    if(line&&weight(`${line} ${word}`)>width){lines.push(line);line='';}
    for(const char of Array.from(word)){if(weight(line+char)>width&&line){lines.push(line);line='';}line+=char;}
    line+=' ';
  }
  if(line.trim())lines.push(line.trim());return lines.map(line=>line.trim());
}
export function nodeWidth(node:PfdNode,direction:'horizontal'|'vertical'='horizontal'):number { return Math.max(node.width||0,direction==='vertical'?400:260); }
export function nodeHeight(node: PfdNode, steps: ProcessStep[], direction:'horizontal'|'vertical'='horizontal'): number {
  const step = steps.find(s => s.id === node.stepId);
  const symbolLabel=getPfdSymbol(step?.engineeringSymbolId || node.symbolId)?.label||step?.stepType||node.kind;
  const secondaryLines=wrapPfdText(symbolLabel,direction==='vertical'?30:36).length;
  return Math.max(node.height||0,174, wrapPfdText(step?.name || node.label || node.kind, direction==='vertical'?25:30).length * 18 + 145 + (secondaryLines-1)*13);
}
export function nodeLabelBounds(node:PfdNode,steps:ProcessStep[],direction:'horizontal'|'vertical'='horizontal') {return {x:node.x+(direction==='vertical'?210:0),y:node.y+100,width:direction==='vertical'?nodeWidth(node,direction)-210:nodeWidth(node,direction),height:nodeHeight(node,steps,direction)-100};}
export function graphBounds(graph: PfdGraph, steps: ProcessStep[]) {
  const points=graph.edges.flatMap(e=>[...(e.points||[]),...(e.junctions||[]),...(e.labelPosition?[e.labelPosition]:[])]);
  return { width: Math.max(780, ...graph.nodes.map(n => n.x + nodeWidth(n,graph.layoutDirection)+80),...points.map(p=>p.x+240)), height: Math.max(420, ...graph.nodes.map(n => n.y + nodeHeight(n, steps,graph.layoutDirection) + 90),...points.map(p=>p.y+90)) };
}
export function graphLabel(node: PfdNode, steps: ProcessStep[]) {
  if (!node) return 'Missing node — review routing';
  const step = steps.find(s => s.id === node.stepId);
  return step ? `${step.stepNumber} · ${step.name}` : node.label || node.kind;
}
export function listValue(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(listValue).join('\n');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
function xml(value: unknown): string { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!)); }
export function nodeSymbol(node:PfdNode,steps:ProcessStep[],mode:'manufacturing'|'engineering'='manufacturing') {
  const step=steps.find(s=>s.id===node.stepId);return step?resolveStepSymbol(step,mode).symbol:getPfdSymbol(node.symbolId)||getPfdSymbol(['start','end'].includes(node.kind)?'basic.terminator':node.kind==='connector'?'basic.connector':`manufacturing.${node.kind}`);
}
export function nodePortPoint(node:PfdNode,port:PfdPort,steps:ProcessStep[],mode:'manufacturing'|'engineering'='manufacturing',direction:'horizontal'|'vertical'='horizontal'):PfdPoint {
  const symbol=nodeSymbol(node,steps,mode);
  const position=symbol?.ports?.[port] || ({north:[48,0],east:[96,36],south:[48,72],west:[0,36]} as const)[port];
  const width=nodeWidth(node,direction), symbolX=direction==='vertical'?74:(width-112)/2;
  return {x:node.x+symbolX+position[0]*112/96,y:node.y+12+position[1]*84/72};
}
export function edgePoints(graph:PfdGraph,edge:PfdEdge,steps:ProcessStep[]):PfdPoint[] {
  if(edge.points?.length)return edge.points;
  const from=graph.nodes.find(n=>n.id===edge.source),to=graph.nodes.find(n=>n.id===edge.target);if(!from||!to)return [];
  const horizontal=graph.layoutDirection!=='vertical';
  const start=nodePortPoint(from,edge.sourcePort||(horizontal?'east':'south'),steps,graph.displayMode,graph.layoutDirection),end=nodePortPoint(to,edge.targetPort||(horizontal?'west':'north'),steps,graph.displayMode,graph.layoutDirection);
  if(horizontal) { if(end.x>start.x) {const mid=(start.x+end.x)/2;return [start,{x:mid,y:start.y},{x:mid,y:end.y},end];} const lane=Math.max(from.y+nodeHeight(from,steps,graph.layoutDirection),to.y+nodeHeight(to,steps,graph.layoutDirection))+40+graph.edges.indexOf(edge)*8;return [start,{x:start.x+32,y:start.y},{x:start.x+32,y:lane},{x:end.x-32,y:lane},{x:end.x-32,y:end.y},end]; }
  const mid=(start.y+end.y)/2;return [start,{x:start.x,y:mid},{x:end.x,y:mid},end];
}
export interface PfdViewport {x:number;y:number;width:number;height:number}
export function pfdSvg(graph: PfdGraph, steps: ProcessStep[], title = 'Process flow diagram', selected = '',clip?:PfdViewport): string {
  const { width, height } = graphBounds(graph, steps),mode=graph.displayMode||'manufacturing';
  const intersects=(x:number,y:number,w:number,h:number)=>!clip||(x+w>clip.x&&x<clip.x+clip.width&&y+h>clip.y&&y<clip.y+clip.height);
  const paths=graph.edges.map(e=>({edge:e,points:edgePoints(graph,e,steps)})).filter(({edge,points})=>{if(!points.length)return false;const xs=points.map(p=>p.x),ys=points.map(p=>p.y);const geometry=intersects(Math.min(...xs)-8,Math.min(...ys)-8,Math.max(...xs)-Math.min(...xs)+16,Math.max(...ys)-Math.min(...ys)+16);const label=edge.label||(edge.kind!=='normal'?edge.kind:'');const middle=points[Math.floor(points.length/2)],p=edge.labelPosition||{x:middle.x+8,y:middle.y-8};return geometry||!!label&&intersects(p.x,p.y-12,200,wrapPfdText(label,27).length*15+3);});
  const edges=paths.map(({edge:e,points})=>{
    if(!points.length)return '';
    const path=points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' '),middle=points[Math.floor(points.length/2)],lp=e.labelPosition||{x:middle.x+8,y:middle.y-8};
    const routeLabel=e.label || (e.kind!=='normal'?e.kind:'');
    return `<g><title>${xml(e.kind)}: ${xml(e.label||'Process route')}</title><path d="${path}" fill="none" stroke="#45664c" stroke-width="2" ${e.kind==='material'?'stroke-dasharray="2 4"':e.kind==='rework'?'stroke-dasharray="8 4"':''} marker-end="url(#pfd-arrow)"/>${routeLabel?`<text x="${lp.x}" y="${lp.y}" font-size="12" fill="#242621" paint-order="stroke" stroke="#fff" stroke-width="5">${wrapPfdText(routeLabel,27).map((line,k)=>`<tspan x="${lp.x}" dy="${k?15:0}">${xml(line)}</tspan>`).join('')}</text>`:''}${(e.junctions||[]).map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#45664c"/>`).join('')}</g>`;
  }).join('');
  // Explicit junctions are solid dots. Unconnected orthogonal crossings receive a white halo / bridge.
  const crossings:string[]=[];
  paths.forEach((a,ai)=>paths.slice(ai+1).forEach(b=>{for(let i=1;i<a.points.length;i++)for(let j=1;j<b.points.length;j++){
    const p=a.points[i-1],q=a.points[i],r=b.points[j-1],s=b.points[j];let x:number,y:number;
    if(p.y===q.y&&r.x===s.x){x=r.x;y=p.y;if(!(x>Math.min(p.x,q.x)&&x<Math.max(p.x,q.x)&&y>Math.min(r.y,s.y)&&y<Math.max(r.y,s.y)))continue;}
    else if(p.x===q.x&&r.y===s.y){x=p.x;y=r.y;if(!(x>Math.min(r.x,s.x)&&x<Math.max(r.x,s.x)&&y>Math.min(p.y,q.y)&&y<Math.max(p.y,q.y)))continue;}else continue;
    if([...a.edge.junctions||[],...b.edge.junctions||[]].some(v=>Math.abs(v.x-x)<2&&Math.abs(v.y-y)<2))continue;
    crossings.push(`<path d="M${x-7},${y} Q${x},${y-12} ${x+7},${y}" fill="none" stroke="#fff" stroke-width="6"/><path d="M${x-7},${y} Q${x},${y-12} ${x+7},${y}" fill="none" stroke="#45664c" stroke-width="2"/>`);
  }}));
  const nodes=graph.nodes.filter(n=>intersects(n.x,n.y,nodeWidth(n,graph.layoutDirection),nodeHeight(n,steps,graph.layoutDirection))).map(n=>{
    const step=steps.find(s=>s.id===n.stepId),type=pfdActivityType(step)||n.kind,w=nodeWidth(n,graph.layoutDirection),h=nodeHeight(n,steps,graph.layoutDirection),vertical=graph.layoutDirection==='vertical',textX=vertical?210:w/2,anchor=vertical?'start':'middle';
    const resolved=step?resolveStepSymbol(step,mode):undefined;
    const symbol=resolved?.symbol||nodeSymbol(n,steps,mode);
    const shape=symbol?.svg||'<rect x="12" y="12" width="72" height="48" rx="20"/>';
    const secondary=mode==='engineering'&&step?`Activity: ${type}`:symbol?.label||type;
    return `<g data-node-id="${xml(n.id)}" data-activity="${xml(type)}" role="button" tabindex="0" aria-label="${xml(graphLabel(n,steps))}" transform="translate(${n.x},${n.y})" style="cursor:pointer"><title>${xml(graphLabel(n,steps))} · ${xml(secondary)}</title>${selected===n.id?`<rect width="${w}" height="${h}" rx="8" fill="#eff2e8" stroke="#45664c" stroke-dasharray="3 3"/>`:''}<svg x="${vertical?74:(w-112)/2}" y="12" width="112" height="84" viewBox="0 0 96 72" fill="white" stroke="#242621" stroke-width="1.7" stroke-linejoin="round">${shape}</svg><text x="${textX}" y="111" text-anchor="${anchor}" font-size="11" font-weight="700" fill="#45664c">${xml(step?.stepNumber||type.toUpperCase())}</text><text x="${textX}" y="131" text-anchor="${anchor}" font-size="13" fill="#242621">${wrapPfdText(step?.name||n.label||n.kind,vertical?25:30).map((line,i)=>`<tspan x="${textX}" dy="${i?18:0}">${xml(line)}</tspan>`).join('')}</text><text x="${textX}" y="${h-8-(wrapPfdText(secondary,vertical?30:36).length-1)*13}" text-anchor="${anchor}" font-size="10" fill="#65685f">${wrapPfdText(secondary,vertical?30:36).map((line,i)=>`<tspan x="${textX}" dy="${i?13:0}">${xml(line)}</tspan>`).join('')}</text></g>`;
  }).join('');
  return `<svg data-pfd-drawing="true" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="group" aria-label="${xml(title)}" font-family="Inter,Arial,sans-serif"><title>${xml(title)} — ${xml(graph.reviewStatus)}</title><defs><marker id="pfd-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8Z" fill="#45664c"/></marker></defs><rect width="100%" height="100%" fill="#fff"/><text x="24" y="24" font-size="12" fill="#65685f">${mode==='engineering'?'General engineering symbols':'Manufacturing notation'} · ${xml(graph.reviewStatus)} · ${steps.length} operations · ● Junction · bridge = crossing without connection</text>${edges}${crossings.join('')}${nodes}</svg>`;
}
/** Excel cells must not split UTF-16 surrogate pairs between metadata chunks. */
export function chunkPfdMetadata(value: string, size = 30000): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < value.length;) {
    let end = Math.min(value.length, start + Math.max(2, size));
    const last = value.charCodeAt(end - 1), next = value.charCodeAt(end);
    if (end < value.length && last >= 0xd800 && last <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) end--;
    chunks.push(value.slice(start, end)); start = end;
  }
  return chunks;
}
export async function exportPfdWorkbook(graph: PfdGraph, steps: ProcessStep[], project: Record<string, unknown> = {}) {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  workbook.creator = 'FMEApex';
  const sheet = workbook.addWorksheet('Process table');
  sheet.columns = [{ width: 13 }, { width: 34 }, { width: 34 }, { width: 18 }, { width: 20 }, { width: 36 }, { width: 36 }, { width: 36 }, {width:30}, {width:30}];
  const title = String(project.partName || project.name || 'Manufacturing process');
  sheet.mergeCells('A1:J1'); sheet.getCell('A1').value = `${title} — Process Flow Diagram`;
  sheet.mergeCells('A2:J2'); sheet.getCell('A2').value = `Part: ${project.orgPartNumber || '—'} | Revision: ${project.revisionNumber || '—'} | Customer: ${project.customer || '—'}`;
  sheet.mergeCells('A3:J3'); sheet.getCell('A3').value = `Topology: ${graph.reviewStatus} | ${graph.displayMode || 'manufacturing'} | Draft/example data requires engineering review`;
  sheet.addRow(['Operation', 'Process description', 'Variation sources', 'Special characteristics', 'Activity type', 'Equipment / documents', 'Desired outcome', 'Process characteristics', 'Manufacturing symbol ID', 'Engineering symbol ID']);
  steps.forEach(s => sheet.addRow([s.stepNumber, s.name, listValue(s.incomingVariation), s.specialCharacteristics || '', pfdFormattedActivities(s),
    listValue(s.machinesEquipmentDocs), listValue(s.desiredOutcome), listValue(s.processCharacteristics), s.manufacturingSymbolId || '', s.engineeringSymbolId || '']));
  sheet.views = [{ state: 'frozen', ySplit: 4 }];
  sheet.autoFilter = { from: 'A4', to: `J${Math.max(4, sheet.rowCount)}` };
  sheet.eachRow((row, index) => {
    row.height = index < 5 ? 26 : Math.max(38, ...(Array.isArray(row.values) ? row.values : []).map(v => String(v || '').split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 28)), 0) * 15 + 12));
    row.eachCell({ includeEmpty: true }, cell => {
      cell.font = { name: 'Calibri', size: 11, bold: index === 1 || index === 4 };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin', color: { argb: 'FFE3E4DB' } }, bottom: { style: 'thin', color: { argb: 'FFE3E4DB' } } };
      if (index === 4) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF2E8' } };
    });
  });
  sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:4' };
  const routes = workbook.addWorksheet('Connections');
  routes.addRow(['Connection ID', 'Source node', 'Target node', 'Route type', 'Outcome / condition']);
  graph.edges.forEach(e => routes.addRow([e.id, e.source, e.target, e.kind, e.label]));
  routes.columns.forEach(c => { c.width = 32; });
  const metadata = workbook.addWorksheet('FMEApex graph');
  metadata.addRow(['FMEApex process graph', `schemaVersion=${graph.schemaVersion}`]);
  const serialized = JSON.stringify(graph);
  chunkPfdMetadata(serialized).forEach(chunk => metadata.addRow([chunk]));
  metadata.addRow(['END GRAPH']);
  metadata.addRow(['operation-id', 'operation-number']);
  steps.forEach(s => metadata.addRow([s.id, s.stepNumber]));
  const drawing = workbook.addWorksheet('Diagram');
  drawing.addRow([`${title} — ${graph.reviewStatus}`]);
  drawing.addRow(['See the connections sheet for editable routing. Diagram is a graphical snapshot.']);
  {
    const bounds = graphBounds(graph, steps);
    const url = URL.createObjectURL(new Blob([pfdSvg(graph, steps, title)], { type: 'image/svg+xml' }));
    try {
      const img = new Image(); img.src = url;
      await img.decode();
      const scale = Math.min(1, 12000 / bounds.height, 12000 / bounds.width, Math.sqrt(40000000 / (bounds.width*bounds.height)));
      const canvas = document.createElement('canvas'); canvas.width = bounds.width * scale; canvas.height = bounds.height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageId = workbook.addImage({ base64: canvas.toDataURL('image/png'), extension: 'png' });
        drawing.addImage(imageId, { tl: { col: 0, row: 3 }, ext: { width: canvas.width, height: canvas.height } });
      }
    } finally { URL.revokeObjectURL(url); }
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a'); a.href = url; a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_PFD.xlsx`; a.click(); URL.revokeObjectURL(url);
}
