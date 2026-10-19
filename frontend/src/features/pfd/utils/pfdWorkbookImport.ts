import type { PfdGraph } from "./pfdGraph";
export interface WorkbookTopology {
  graph: PfdGraph;
  operationNumbers: Record<string, string>;
}
/** Parse only the versioned metadata sheet; never guess topology from visible symbols. */
export function parseWorkbookTopology(
  rows: unknown[][],
): WorkbookTopology | null {
  if (!rows.length || rows[0]?.[0] !== "FMEApex process graph") return null;
  if (rows[0]?.[1] !== "schemaVersion=1")
    throw new Error("Unsupported FMEApex graph version");
  const end = rows.findIndex((row) => row[0] === "END GRAPH");
  if (end < 2) throw new Error("Incomplete graph metadata");
  const graph = JSON.parse(
    rows
      .slice(1, end)
      .map((row) => String(row[0] || ""))
      .join(""),
  ) as PfdGraph;
  if (
    graph.schemaVersion !== 1 ||
    graph.notation !== "manufacturing-v1" ||
    !Array.isArray(graph.nodes) ||
    !Array.isArray(graph.edges)
  )
    throw new Error("Invalid graph metadata");
  if (graph.nodes.length > 5000 || graph.edges.length > 15000)
    throw new Error("Process graph exceeds supported size");
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (
      !node ||
      typeof node.id !== "string" ||
      !node.id || node.id.length > 150 ||
      ids.has(node.id) ||
      ![
        "step",
        "start",
        "end",
        "connector",
        "hold",
        "scrap",
        "return",
      ].includes(node.kind) ||
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y)
      || Math.abs(node.x) > 100000 || Math.abs(node.y) > 100000
      || (node.label !== undefined && (typeof node.label !== 'string' || node.label.length > 1000))
    )
      throw new Error("Invalid or repeated graph node");
    if (node.kind === "step" && typeof node.stepId !== "string")
      throw new Error("Operation graph node has no reference");
    ids.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (
      !edge ||
      typeof edge.id !== "string" ||
      !edge.id || edge.id.length > 150 ||
      edgeIds.has(edge.id) ||
      !ids.has(edge.source) ||
      !ids.has(edge.target) ||
      ![
        "normal",
        "conditional",
        "parallel",
        "rework",
        "scrap",
        "material",
      ].includes(edge.kind) ||
      typeof edge.label !== "string" || edge.label.length > 500 || edge.source === edge.target
    )
      throw new Error("Invalid graph connection");
    edgeIds.add(edge.id);
  }
  if (rows[end + 1]?.[0] !== "operation-id")
    throw new Error("Missing operation mapping");
  const operationNumbers: Record<string, string> = {};
  for (const row of rows.slice(end + 2))
    if (row[0] && row[1] !== undefined)
      operationNumbers[String(row[0])] = String(row[1]);
  return { graph, operationNumbers };
}
export function remapWorkbookTopology(
  source: WorkbookTopology,
  destination: { id: string; stepNumber: string }[],
  includedOperationNumbers: string[],
) {
  const included = new Set(includedOperationNumbers);
  const byNumber = new Map<string, string>();
  for (const step of destination) {
    if (byNumber.has(step.stepNumber))
      throw new Error(
        `Operation ${step.stepNumber} is ambiguous in the destination; topology was not changed`,
      );
    byNumber.set(step.stepNumber, step.id);
  }
  const removed = new Set<string>();
  const nodes = source.graph.nodes.flatMap((node) => {
    if (node.kind !== "step") return [{ ...node }];
    const number = source.operationNumbers[node.stepId || ""];
    const id = byNumber.get(number);
    if (!number || !included.has(number) || !id) {
      removed.add(node.id);
      return [];
    }
    return [{ ...node, stepId: id }];
  });
  const edges = source.graph.edges
    .filter((edge) => !removed.has(edge.source) && !removed.has(edge.target))
    .map((edge) => ({ ...edge }));
  const omittedConnections = source.graph.edges.length - edges.length;
  return {
    graph: { ...source.graph, reviewStatus: "draft" as const, nodes, edges },
    omittedNodes: removed.size,
    omittedConnections,
  };
}
