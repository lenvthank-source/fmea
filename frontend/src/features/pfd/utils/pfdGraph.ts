import type { ProcessStep } from '../PfdWorkspace';

export interface PfdNode {
  id: string;
  kind: 'step' | 'start' | 'end' | 'connector' | 'hold' | 'scrap' | 'return';
  stepId?: string;
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
}
export interface PfdGraph {
  schemaVersion: 1;
  notation: 'manufacturing-v1';
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
  return step.stepType === 'combined' || (['operation', 'inspection'].includes(step.stepType) && pfdActivityFromSymbols(step.flowIcons) === 'combined')
    ? 'combined' : step.stepType;
}
export function derivePfdGraph(steps: ProcessStep[]): PfdGraph {
  const sorted = [...steps].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const nodes: PfdNode[] = [{ id: 'boundary-start', kind: 'start', label: 'Process start', x: 260, y: 35 }];
  let y = 190;
  for (const step of sorted) {
    nodes.push({ id: `step-${step.id}`, kind: 'step', stepId: step.id, x: 260, y });
    y += Math.max(185, wrapPfdText(step.name).length * 18 + 105);
  }
  nodes.push({ id: 'boundary-end', kind: 'end', label: 'Process end', x: 260, y });
  return { schemaVersion: 1, notation: 'manufacturing-v1', reviewStatus: 'draft', nodes,
    edges: nodes.slice(1).map((node, i) => ({ id: `derived-${i}`, source: nodes[i].id, target: node.id, kind: 'normal', label: '' })) };
}
export function wrapPfdText(value: string, width = 31): string[] {
  const words = String(value || 'Unnamed operation').match(new RegExp(`.{1,${width}}(?:\\s|$)|.{1,${width}}`, 'g')) || [''];
  return words.map(line => line.trim());
}
export function nodeHeight(node: PfdNode, steps: ProcessStep[]): number {
  const step = steps.find(s => s.id === node.stepId);
  return Math.max(92, wrapPfdText(step?.name || node.label || node.kind, 25).length * 18 + 55);
}
export function graphBounds(graph: PfdGraph, steps: ProcessStep[]) {
  return { width: Math.max(780, ...graph.nodes.map(n => n.x + 650)), height: Math.max(420, ...graph.nodes.map(n => n.y + nodeHeight(n, steps) + 90)) };
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
export function pfdSvg(graph: PfdGraph, steps: ProcessStep[], title = 'Process flow diagram', selected = ''): string {
  const { width, height } = graphBounds(graph, steps);
  const edges = graph.edges.map((e, i) => {
    const from = graph.nodes.find(n => n.id === e.source), to = graph.nodes.find(n => n.id === e.target);
    if (!from || !to) return '';
    const x1 = from.x + 130, y1 = from.y + nodeHeight(from, steps), x2 = to.x + 130, y2 = to.y;
    const back = y2 <= y1;
    const lane = Math.max(from.x, to.x) + 290 + (i % 4) * 35;
    const mid = (y1 + y2) / 2;
    const d = back ? `M${x1},${y1} V${y1 + 24} H${lane} V${y2 - 25} H${x2} V${y2}` : `M${x1},${y1} V${mid} H${x2} V${y2}`;
    const color = e.kind === 'rework' ? '#816729' : e.kind === 'scrap' ? '#9f3838' : '#45664c';
    const lx = back ? lane + 7 : (x1 + x2) / 2 + 8, ly = back ? mid : mid - 8;
    return `<g><title>${xml(e.kind)}: ${xml(e.label || 'Process route')}</title><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" ${graph.reviewStatus === 'draft' ? 'stroke-dasharray="5 4"' : ''} marker-end="url(#pfd-arrow)"/>${e.label ? `<text x="${lx}" y="${ly}" font-size="12" fill="${color}" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">${wrapPfdText(e.label, 27).map((line, k) => `<tspan x="${lx}" dy="${k ? 15 : 0}">${xml(line)}</tspan>`).join('')}</text>` : ''}</g>`;
  }).join('');
  const nodes = graph.nodes.map(n => {
    const step = steps.find(s => s.id === n.stepId), h = nodeHeight(n, steps);
    const type = pfdActivityType(step) || n.kind;
    let symbol = '<circle cx="29" cy="33" r="16"/>';
    if (type === 'combined') symbol = '<rect x="10" y="14" width="38" height="38"/><circle cx="29" cy="33" r="15"/>';
    if (type === 'inspection') symbol = '<rect x="13" y="17" width="32" height="32"/>';
    if (type === 'decision') symbol = '<path d="M29 12L49 33 29 54 9 33Z"/>';
    if (type === 'storage') symbol = '<path d="M10 17H48L29 49Z"/>';
    if (type === 'transport') symbol = '<path d="M9 25H31V17L49 33 31 49V41H9Z"/>';
    if (type === 'delay') symbol = '<path d="M13 17H28A16 16 0 0 1 28 49H13Z"/>';
    if (['start','end'].includes(type)) symbol = '<rect x="7" y="21" width="44" height="25" rx="12"/>';
    if (['rework','repair','hold','scrap','return'].includes(type)) symbol = `<rect x="12" y="16" width="34" height="34"/><text x="29" y="39" text-anchor="middle" stroke="none" fill="#242621" font-size="15">${xml(type === 'rework' ? 'RW' : type === 'repair' ? 'RP' : type === 'hold' ? 'H' : type === 'scrap' ? 'X' : '↩')}</text>`;
    return `<g data-node-id="${xml(n.id)}" role="button" tabindex="0" aria-label="${xml(graphLabel(n, steps))}" transform="translate(${n.x},${n.y})" style="cursor:pointer"><title>${xml(graphLabel(n, steps))}</title><rect width="260" height="${h}" rx="10" fill="${selected === n.id ? '#eff2e8' : '#fff'}" stroke="${selected === n.id ? '#45664c' : '#d8ddd2'}" stroke-width="${selected === n.id ? 2 : 1}"/><g fill="none" stroke="#242621" stroke-width="1.8">${symbol}</g><text x="63" y="24" font-size="12" font-weight="700" fill="#45664c">${xml(step?.stepNumber || type.toUpperCase())}</text><text x="63" y="46" font-size="13" fill="#242621">${wrapPfdText(step?.name || n.label || n.kind, 25).map((line, i) => `<tspan x="63" dy="${i ? 18 : 0}">${xml(line)}</tspan>`).join('')}</text><text x="14" y="${h - 12}" font-size="10" fill="#65685f">${xml(type.replace(/_/g, ' '))}</text></g>`;
  }).join('');
  return `<svg data-pfd-drawing="true" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="group" aria-label="${xml(title)}" font-family="Inter,Arial,sans-serif"><title>${xml(title)} — ${xml(graph.reviewStatus)}</title><defs><marker id="pfd-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4 0 8Z" fill="#45664c"/></marker></defs><rect width="100%" height="100%" fill="#fff"/><text x="24" y="24" font-size="12" fill="#65685f">Manufacturing notation v1 · ${xml(graph.reviewStatus)} · ${steps.length} operations</text>${edges}${nodes}</svg>`;
}
export async function exportPfdWorkbook(graph: PfdGraph, steps: ProcessStep[], project: Record<string, unknown> = {}) {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  workbook.creator = 'FMEApex';
  const sheet = workbook.addWorksheet('Process table');
  sheet.columns = [{ width: 13 }, { width: 34 }, { width: 34 }, { width: 18 }, { width: 20 }, { width: 36 }, { width: 36 }, { width: 36 }];
  const title = String(project.partName || project.name || 'Manufacturing process');
  sheet.mergeCells('A1:H1'); sheet.getCell('A1').value = `${title} — Process Flow Diagram`;
  sheet.mergeCells('A2:H2'); sheet.getCell('A2').value = `Part: ${project.orgPartNumber || '—'} | Revision: ${project.revisionNumber || '—'} | Customer: ${project.customer || '—'}`;
  sheet.mergeCells('A3:H3'); sheet.getCell('A3').value = `Topology: ${graph.reviewStatus} | Manufacturing notation v1 | Draft/example data requires engineering review`;
  sheet.addRow(['Operation', 'Process description', 'Variation sources', 'Special characteristics', 'Activity type', 'Equipment / documents', 'Desired outcome', 'Process characteristics']);
  steps.forEach(s => sheet.addRow([s.stepNumber, s.name, listValue(s.incomingVariation), s.specialCharacteristics || '', pfdActivityType(s),
    listValue(s.machinesEquipmentDocs), listValue(s.desiredOutcome), listValue(s.processCharacteristics)]));
  sheet.views = [{ state: 'frozen', ySplit: 4 }];
  sheet.autoFilter = { from: 'A4', to: `H${Math.max(4, sheet.rowCount)}` };
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
  metadata.addRow(['FMEApex process graph', 'schemaVersion=1']);
  const serialized = JSON.stringify(graph);
  for (let i = 0; i < serialized.length; i += 30000) metadata.addRow([serialized.slice(i, i + 30000)]);
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
      const scale = Math.min(1, 12000 / bounds.height);
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
