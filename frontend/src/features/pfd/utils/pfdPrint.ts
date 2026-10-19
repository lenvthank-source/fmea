import type { ProcessStep } from "../PfdWorkspace";
import {
  graphBounds,
  graphLabel,
  listValue,
  nodeHeight,
  pfdSvg,
  type PfdGraph,
} from "./pfdGraph";
const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function pfdPrintPages(graph: PfdGraph, steps: ProcessStep[]) {
  const bounds = graphBounds(graph, steps);
  const pages: { x: number; y: number; width: number; height: number }[] = [];
  let y = 0;
  while (y < bounds.height) {
    let end = Math.min(bounds.height, y + 700);
    const crossing = graph.nodes.filter(
      (n) => n.y < end && n.y + nodeHeight(n, steps) > end,
    );
    if (crossing.length) {
      const before = Math.min(...crossing.map((n) => n.y)) - 16;
      end =
        before > y + 180
          ? before
          : Math.max(...crossing.map((n) => n.y + nodeHeight(n, steps))) + 20;
    }
    let x = 0;
    while (x < bounds.width) {
      let right = Math.min(bounds.width, x + 1000);
      const cut = graph.nodes.filter((n) => n.x < right && n.x + 260 > right);
      if (cut.length) {
        const before = Math.min(...cut.map((n) => n.x)) - 16;
        right =
          before > x + 300
            ? before
            : Math.max(...cut.map((n) => n.x + 260)) + 20;
      }
      pages.push({ x, y, width: right - x, height: end - y });
      x = right;
    }
    y = end;
  }
  return pages;
}
/** Open a self-contained paginated print document; the user can save it as PDF. */
export function openPfdPrint(
  graph: PfdGraph,
  steps: ProcessStep[],
  project: Record<string, unknown> = {},
  targetWindow?: Window,
) {
  const popup = targetWindow || window.open("", "_blank");
  if (!popup) return false;
  const pages = pfdPrintPages(graph, steps);
  const title = String(
    project.partName || project.name || "Manufacturing process",
  );
  const fullSvg = pfdSvg(graph, steps, title);
  const pageForNode = (id: string) => {
    const node = graph.nodes.find((n) => n.id === id);
    return node
      ? pages.findIndex(
          (p) =>
            node.x >= p.x &&
            node.x < p.x + p.width &&
            node.y >= p.y &&
            node.y < p.y + p.height,
        ) + 1
      : 0;
  };
  const sections = pages
    .map((page, index) => {
      const svg = fullSvg.replace(
        /width="[^"]+" height="[^"]+" viewBox="[^"]+"/,
        `width="100%" height="100%" viewBox="${page.x} ${page.y} ${page.width} ${page.height}"`,
      );
      const continuations = graph.edges.filter(
        (e) =>
          pageForNode(e.source) !== pageForNode(e.target) &&
          [pageForNode(e.source), pageForNode(e.target)].includes(index + 1),
      );
      return `<section class="sheet">${project.watermark ? `<div class="watermark">${escape(project.watermark)}</div>` : ''}<header><h1>${escape(title)} — Process Flow Diagram</h1><p>Part ${escape(project.orgPartNumber || "—")} · Revision ${escape(project.revisionNumber || "—")} · Customer ${escape(project.customer || "—")} · ${escape(graph.reviewStatus)}</p></header><div class="drawing">${svg}</div><footer><p>Legend: ○ Operation · □ Inspection · ▣ Combined · ◇ Decision · ▽ Storage · → Transport · D Delay · RW Rework · RP Repair · H Hold · X Scrap</p><p>Page ${index + 1} of ${pages.length} diagram sheets · Manufacturing notation v1</p>${continuations
        .slice(0, 3)
        .map(
          (e) =>
            `<p class="continuation">${escape(e.id)}: page ${pageForNode(e.source)} → page ${pageForNode(e.target)} · ${escape(e.label || e.kind)}</p>`,
        )
        .join(
          "",
        )}${continuations.length > 3 ? "<p>Additional continuation routes are listed in the complete routing register.</p>" : ""}</footer></section>`;
    })
    .join("");
  const operations = graph.nodes
    .map((n) => {
      const step = steps.find((s) => s.id === n.stepId);
      const details = step
        ? `Activity: ${step.stepType}\nEquipment / documents: ${listValue(step.machinesEquipmentDocs)}\nVariation sources: ${listValue(step.incomingVariation)}\nSpecial characteristics: ${step.specialCharacteristics || ""}\nDesired outcome: ${listValue(step.desiredOutcome)}\nProcess characteristics: ${listValue(step.processCharacteristics)}`
        : n.kind;
      return `<tr><td>${escape(n.id)}</td><td>${escape(graphLabel(n, steps))}</td><td>${escape(details)}</td><td>${pageForNode(n.id)}</td></tr>`;
    })
    .join("");
  const connections = graph.edges
    .map(
      (e) =>
        `<tr><td>${escape(e.id)}</td><td>${escape(graphLabel(graph.nodes.find((n) => n.id === e.source)!, steps))}</td><td>${escape(graphLabel(graph.nodes.find((n) => n.id === e.target)!, steps))}</td><td>${escape(e.kind)}</td><td>${escape(e.label)}</td></tr>`,
    )
    .join("");
  popup.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)} — PFD</title><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font:11px Arial,sans-serif;color:#242621;margin:0}h1{font-size:16px;margin:0 0 5px}p{margin:4px 0;overflow-wrap:anywhere}.watermark{position:absolute;inset:45% 0;text-align:center;font-size:64px;color:#777;opacity:.12;transform:rotate(-25deg);pointer-events:none}.sheet{position:relative;height:186mm;break-after:page;display:flex;flex-direction:column}header{border-bottom:1px solid #ddd;padding-bottom:6px}.drawing{flex:1;min-height:0;padding:8px 0}.drawing svg{display:block}footer{font-size:9px;border-top:1px solid #ddd;padding-top:5px}.continuation{font-size:8px}.appendix{break-before:page}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #ddd;padding:6px;text-align:left;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}.toolbar{padding:12px;background:#eef2e8}@media print{.toolbar{display:none}}</style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save PDF</button> Complete routing and full-text operation details follow the diagram sheets.</div>${sections}<section class="appendix"><h1>Operation / node index</h1><table><thead><tr><th>Node</th><th>Full operation / boundary description</th><th>Engineering details</th><th>Diagram page</th></tr></thead><tbody>${operations}</tbody></table></section><section class="appendix"><h1>Routing register</h1><table><thead><tr><th>Connection</th><th>From</th><th>To</th><th>Route</th><th>Full condition / outcome</th></tr></thead><tbody>${connections}</tbody></table></section></body></html>`,
  );
  popup.document.close();
  return true;
}
