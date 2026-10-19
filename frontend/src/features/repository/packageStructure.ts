export type PackageRecord = Record<string, unknown>;
export interface PackageNode {
  id: string;
  kind: "package" | "function" | "cause" | "prevention" | "detection";
  label: string;
  parentId?: string;
  raw: PackageRecord;
  children: PackageNode[];
}
export interface PackageStructure {
  root: PackageNode;
  nodes: PackageNode[];
  functions: number;
  causes: number;
  controls: number;
  missingControls: number;
  issues: string[];
}
const record = (value: unknown): PackageRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as PackageRecord)
    : {};
const label = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
/** Display aliases preserve the original payload and never create missing relationships. */
export function normalizePackage(
  data: unknown,
  name = "Work-element package",
): PackageStructure {
  const raw = record(data);
  const root: PackageNode = {
    id: "package",
    kind: "package",
    label: name,
    raw,
    children: [],
  };
  const result: PackageStructure = {
    root,
    nodes: [root],
    functions: 0,
    causes: 0,
    controls: 0,
    missingControls: 0,
    issues: [],
  };
  if (!data || typeof data !== "object" || Array.isArray(data))
    result.issues.push("Package structure is unavailable or malformed.");
  if (raw.functions !== undefined && !Array.isArray(raw.functions))
    result.issues.push("Functions must be an array.");
  const append = (parent: PackageNode, node: PackageNode) => {
    parent.children.push(node);
    result.nodes.push(node);
  };
  (Array.isArray(raw.functions) ? raw.functions : []).forEach(
    (value, index) => {
      const fn = record(value);
      if (!Object.keys(fn).length) {
        result.issues.push(`Function ${index + 1} is malformed.`);
        return;
      }
      const node: PackageNode = {
        id: `function-${index}`,
        kind: "function",
        parentId: root.id,
        label: label(fn.name ?? fn.narration, `Unnamed function ${index + 1}`),
        raw: fn,
        children: [],
      };
      append(root, node);
      result.functions++;
      const failures = fn.failures ?? fn.causes;
      if (failures !== undefined && !Array.isArray(failures))
        result.issues.push(`${node.label}: causes must be an array.`);
      (Array.isArray(failures) ? failures : []).forEach((value, causeIndex) => {
        const cause = record(value);
        if (!Object.keys(cause).length) {
          result.issues.push(
            `${node.label}: cause ${causeIndex + 1} is malformed.`,
          );
          return;
        }
        const child: PackageNode = {
          id: `${node.id}-cause-${causeIndex}`,
          kind: "cause",
          parentId: node.id,
          label: label(
            cause.name ?? cause.narration,
            `Unnamed cause ${causeIndex + 1}`,
          ),
          raw: cause,
          children: [],
        };
        append(node, child);
        result.causes++;
        (["prevention", "detection"] as const).forEach((kind) => {
          const control =
            cause[
              kind === "prevention" ? "preventionControl" : "detectionControl"
            ] ??
            cause[
              kind === "prevention"
                ? "currentControlPrevention"
                : "currentControlDetection"
            ];
          if (typeof control === "string" && control.trim()) {
            append(child, {
              id: `${child.id}-${kind}`,
              parentId: child.id,
              kind,
              label: control.trim(),
              raw: { control },
              children: [],
            });
            result.controls++;
          }
        });
        if (!child.children.length) result.missingControls++;
      });
    },
  );
  return result;
}
export const packageSearchText = (
  data: unknown,
  name: string,
  description?: string,
) => `${name} ${description || ""} ${JSON.stringify(data) || ""}`.toLowerCase();
