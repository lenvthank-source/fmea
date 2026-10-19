import { useEffect, useMemo, useRef, useState } from "react";
import { normalizePackage, type PackageNode } from "./packageStructure";
import "./repository.css";
interface Props {
  packageData: unknown;
  packageName: string;
}
const kinds = {
  package: "Package",
  function: "Function",
  cause: "Failure cause",
  prevention: "Prevention control",
  detection: "Detection control",
};
export function PackagePreviewCard({ packageData, packageName }: Props) {
  const model = useMemo(
    () => normalizePackage(packageData, packageName),
    [packageData, packageName],
  );
  const [selection, setSelection] = useState("package");
  const [expanded, setExpanded] = useState<string[] | null>(null);
  const [tree, setTree] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [details, setDetails] = useState(false);
  const selected = model.nodes.find((n) => n.id === selection) || model.root;
  const path = new Set<string>();
  let cursor: PackageNode | undefined = selected;
  while (cursor) {
    path.add(cursor.id);
    cursor = model.nodes.find((n) => n.id === cursor?.parentId);
  }
  const small = model.nodes.length <= 26;
  const canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const resize = () => setZoom(window.innerWidth <= 800 ? 1 : Math.min(1, Math.max(0.75, (element.clientWidth - 36) / 560)));
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const isExpanded = (id: string) =>
    expanded === null ? small : expanded.includes(id);
  const fit = () => {
    const width = canvas.current?.clientWidth || 600;
    setZoom(Math.min(1, Math.max(0.75, (width - 36) / 560)));
  };
  const node = (n: PackageNode) => (
    <button
      type="button"
      className={`repo-node repo-node-${n.kind} ${path.has(n.id) ? "repo-path" : ""}`}
      aria-pressed={selected.id === n.id}
      onClick={() => {
        setSelection(n.id);
        setDetails(true);
      }}
    >
      <span>{kinds[n.kind]}</span>
      <strong>{n.label}</strong>
      {!!n.children.length && (
        <small>
          {n.children.length}{" "}
          {n.kind === "function"
            ? "causes"
            : n.kind === "cause"
              ? "controls"
              : "functions"}
        </small>
      )}
      {n.kind === "cause" && !n.children.length && (
        <small className="repo-gap">No controls recorded</small>
      )}
    </button>
  );
  const branch = (n: PackageNode): React.ReactNode => (
    <li key={n.id}>
      {node(n)}
      {!!n.children.length && <ul>{n.children.map(branch)}</ul>}
    </li>
  );
  return (
    <section className="repo-viewer" aria-label={`Structure of ${packageName}`}>
      <header className="repo-viewer-header">
        <div>
          <span className="repo-eyebrow">Structure overview</span>
          <h2>{packageName}</h2>
        </div>
        <div className="repo-tools">
          <button aria-pressed={!tree} onClick={() => setTree(false)}>
            Graph
          </button>
          <button aria-pressed={tree} onClick={() => setTree(true)}>
            Tree
          </button>
        </div>
      </header>
      <div className="repo-counts">
        <span>
          <b>{model.functions}</b> functions
        </span>
        <span>
          <b>{model.causes}</b> causes
        </span>
        <span>
          <b>{model.controls}</b> controls
        </span>
        <span className={model.missingControls ? "repo-gap" : ""}>
          <b>{model.missingControls}</b> causes without controls
        </span>
      </div>
      {!!model.issues.length && (
        <p role="status" className="repo-warning">
          {model.issues.join(" ")}
        </p>
      )}
      {!model.functions && (
        <p className="repo-empty">
          No functions recorded. This package has no reusable analysis structure
          yet.
        </p>
      )}
      <div className="repo-viewer-body">
        <div className="repo-canvas-area">
          <div className="repo-tools repo-canvas-tools">
            <button
              onClick={() => {
                setZoom(1);
                setExpanded(null);
                setSelection("package");
              }}
            >
              Reset view
            </button>
            <button onClick={fit}>Fit width</button>
            <button
              onClick={() => setExpanded(model.root.children.map((n) => n.id))}
            >
              Expand all
            </button>
            <button onClick={() => setExpanded([])}>Collapse branches</button>
            <button
              aria-label="Zoom out"
              disabled={zoom <= 0.75}
              onClick={() => setZoom((z) => Math.max(0.75, z - 0.1))}
            >
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              aria-label="Zoom in"
              disabled={zoom >= 1.5}
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            >
              +
            </button>
          </div>
          <div
            className="repo-canvas"
            ref={canvas}
            tabIndex={0}
            aria-label="Scrollable package structure"
          >
            {tree ? (
              <ul className="repo-tree">{branch(model.root)}</ul>
            ) : (
              <div className="repo-graph" style={{ zoom }}>
                <div className="repo-graph-root">
                  {node(model.root)}
                  <small>contains ↓</small>
                </div>
                <div className="repo-column-labels">
                  <span>Function</span>
                  <span>Failure cause</span>
                  <span>Prevention / detection</span>
                </div>
                {model.root.children.map((fn) => (
                  <div className="repo-branch" key={fn.id}>
                    <div>
                      {node(fn)}
                      {
                        <button
                          className="repo-branch-toggle"
                          aria-expanded={isExpanded(fn.id)}
                          onClick={() =>
                            setExpanded((prev) => {
                              const current =
                                prev ??
                                (small
                                  ? model.root.children.map((n) => n.id)
                                  : []);
                              return current.includes(fn.id)
                                ? current.filter((id) => id !== fn.id)
                                : [...current, fn.id];
                            })
                          }
                        >
                          {isExpanded(fn.id)
                            ? "Collapse causes"
                            : `Show ${fn.children.length} causes →`}
                        </button>
                      }
                    </div>
                    {isExpanded(fn.id) ? (
                      <div className="repo-causes">
                        {fn.children.map((c) => (
                          <div className="repo-cause-row" key={c.id}>
                            <div>{node(c)}</div>
                            <div className="repo-control-stack">
                              {c.children.map((control) => (
                                <div key={control.id}>{node(control)}</div>
                              ))}
                              {!c.children.length && (
                                <span className="repo-gap">
                                  No controls recorded
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {!fn.children.length && (
                          <span className="repo-gap">No causes recorded</span>
                        )}
                      </div>
                    ) : (
                      <div className="repo-collapsed">
                        {fn.children.length} causes ·{" "}
                        {fn.children.reduce(
                          (sum, c) => sum + c.children.length,
                          0,
                        )}{" "}
                        controls
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <aside
          className={`repo-inspector ${details ? "repo-inspector-open" : ""}`}
          aria-label="Selected node details"
        >
          <button
            className="repo-close-details"
            onClick={() => setDetails(false)}
          >
            Close details
          </button>
          <span className="repo-eyebrow">{kinds[selected.kind]}</span>
          <h3>{selected.label}</h3>
          <p className="repo-note">
            Package ratings are starting information. Review them in the
            destination process context.
          </p>
          {Object.entries(selected.raw)
            .filter(
              ([k, v]) =>
                !["functions", "failures", "causes"].includes(k) &&
                v !== null &&
                typeof v !== "object",
            )
            .map(([k, v]) => (
              <dl className="repo-field" key={k}>
                <dt>{k.replace(/([A-Z])/g, " $1")}</dt>
                <dd>{String(v)}</dd>
              </dl>
            ))}
          <details>
            <summary>All stored fields</summary>
            <pre>{JSON.stringify(selected.raw, null, 2)}</pre>
          </details>
        </aside>
      </div>
    </section>
  );
}
