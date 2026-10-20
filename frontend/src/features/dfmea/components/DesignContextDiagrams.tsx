import { useId, useState } from "react";
import type { DfmeaData } from "../dfmeaDocument";

/** Only explicitly authored containment and interfaces are displayed. Position has no analytical meaning. */
export function DesignContextDiagrams({
  data,
  onFocus,
}: {
  data: DfmeaData;
  onFocus: (id: string) => void;
}) {
  const marker = useId().replace(/:/g, "");
  const [rootId, setRootId] = useState("");
  const roots = data.elements.filter((e) => e.parentId === null);
  const root = data.elements.find((e) => e.id === rootId) ?? roots[0];
  const descendants = new Set<string>();
  if (root) {
    descendants.add(root.id);
    let changed = true;
    while (changed) {
      changed = false;
      for (const e of data.elements)
        if (
          e.parentId &&
          descendants.has(e.parentId) &&
          !descendants.has(e.id)
        ) {
          descendants.add(e.id);
          changed = true;
        }
    }
  }
  const internal = data.elements.filter((e) => descendants.has(e.id));
  const links = data.interfaces.filter(
    (l) => descendants.has(l.sourceId) || descendants.has(l.targetId),
  );
  const external = data.elements.filter(
    (e) =>
      !descendants.has(e.id) &&
      links.some((l) => l.sourceId === e.id || l.targetId === e.id),
  );
  const width = 960,
    height = Math.max(
      300,
      Math.ceil(internal.length / 3) * 116 + 80,
      external.length * 100 + 60,
    );
  const point = (id: string) => {
    const index = internal.findIndex((e) => e.id === id);
    return index >= 0
      ? { x: 50 + (index % 3) * 205, y: 70 + Math.floor(index / 3) * 116 }
      : { x: 735, y: 70 + external.findIndex((e) => e.id === id) * 100 };
  };
  const lines = (text: string, n = 24) => {
    const words = text.split(/\s+/);
    const result: string[] = [];
    let line = "";
    for (const word of words) {
      if (line.length && line.length + word.length + 1 > n) {
        result.push(line);
        line = word;
      } else line += (line ? " " : "") + word;
    }
    if (line) result.push(line);
    return result;
  };
  return (
    <section
      className="df-diagrams"
      aria-label="Authored design context diagrams"
    >
      <div className="df-row">
        <h3>Boundary and interface diagram</h3>
        <label className="df-field">
          Boundary element
          <select
            value={root?.id ?? ""}
            onChange={(e) => setRootId(e.target.value)}
          >
            {data.elements.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name || e.id}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="df-note">
        Inside: selected element and its descendants. Outside: explicitly linked
        elements. Solid arrows are authored interfaces; the tree defines
        containment. Select a node to edit its structure.
      </p>
      {!root ? (
        <p className="df-empty">
          Add design elements and explicit interfaces to build this diagram.
        </p>
      ) : (
        <>
          <div className="df-diagram-scroll">
            <svg
              viewBox={"0 0 " + width + " " + height}
              width={width}
              height={height}
              role="img"
              aria-label={"Boundary diagram for " + root.name}
            >
              <defs>
                <marker
                  id={marker}
                  markerWidth="7"
                  markerHeight="7"
                  refX="7"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0,0 L7,3.5 L0,7" fill="#617251" />
                </marker>
              </defs>
              <rect
                x="20"
                y="20"
                width="650"
                height={height - 40}
                rx="14"
                fill="#f8faf4"
                stroke="#a4b497"
                strokeDasharray="5 4"
              />
              <text x="34" y="43" fontSize="12" fill="#56634b">
                {root.name} · authored boundary
              </text>
              {links.map((l) => {
                const a = point(l.sourceId),
                  b = point(l.targetId);
                const dx = b.x - a.x,
                  dy = b.y - a.y;
                const fraction =
                  1 / Math.max(Math.abs(dx) / 85, Math.abs(dy) / 35);
                return (
                  <g key={l.id}>
                    <path
                      d={
                        "M" +
                        (a.x + 85 + dx * fraction) +
                        "," +
                        (a.y + 35 + dy * fraction) +
                        " L" +
                        (b.x + 85 - dx * fraction) +
                        "," +
                        (b.y + 35 - dy * fraction)
                      }
                      stroke="#617251"
                      strokeWidth="1.5"
                      fill="none"
                      markerEnd={"url(#" + marker + ")"}
                    />
                    <title>
                      {l.description || "Interface description missing"}
                    </title>
                  </g>
                );
              })}
              {[...internal, ...external].map((e) => {
                const p = point(e.id);
                return (
                  <g
                    key={e.id}
                    role="button"
                    tabIndex={0}
                    aria-label={"Edit " + e.name}
                    onClick={() => onFocus(e.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onFocus(e.id);
                      }
                    }}
                    className="df-diagram-node"
                  >
                    <title>{e.name + "\n" + e.description}</title>
                    <rect
                      x={p.x}
                      y={p.y}
                      width="170"
                      height="70"
                      rx="8"
                      fill="white"
                      stroke={descendants.has(e.id) ? "#879b72" : "#be865c"}
                    />
                    {lines(e.name || "Unnamed element")
                      .slice(0, 2)
                      .map((text, i) => (
                        <text
                          key={i}
                          x={p.x + 10}
                          y={p.y + 22 + i * 15}
                          fontSize="12"
                          fill="#252820"
                        >
                          {text}
                        </text>
                      ))}
                    <text
                      x={p.x + 10}
                      y={p.y + 59}
                      fontSize="10"
                      fill="#66745a"
                    >
                      {e.kind}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <details>
            <summary>Accessible interface and containment list</summary>
            <ul>
              {internal.map((e) => (
                <li key={e.id}>
                  <button onClick={() => onFocus(e.id)}>{e.name}</button> ·
                  parent:{" "}
                  {data.elements.find((p) => p.id === e.parentId)?.name ??
                    "Root"}
                </li>
              ))}
            </ul>
            <ul>
              {links.map((l) => (
                <li key={l.id}>
                  {data.elements.find((e) => e.id === l.sourceId)?.name} →{" "}
                  {data.elements.find((e) => e.id === l.targetId)?.name}:{" "}
                  {l.description || "Description missing"}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
      <h3>Parameter diagram</h3>
      <p className="df-note">
        Displays only recorded parameter context. Missing inputs remain visibly
        unrecorded.
      </p>
      <div className="df-parameter" aria-label="Parameter diagram">
        <div className="df-parameter-noise">
          <b>Noise factors and conditions</b>
          <p>{data.parameterContext.noiseFactors || "Not recorded"}</p>
        </div>
        <div className="df-parameter-input">
          <b>Inputs / energy / signals</b>
          <p>{data.parameterContext.inputs || "Not recorded"}</p>
        </div>
        <div className="df-parameter-function">
          <b>Ideal function</b>
          <p>{data.parameterContext.idealFunction || "Not recorded"}</p>
        </div>
        <div className="df-parameter-output">
          <b>Intended outputs</b>
          <p>{data.parameterContext.outputs || "Not recorded"}</p>
        </div>
        <div className="df-parameter-control">
          <b>Design control factors</b>
          <p>{data.parameterContext.controlFactors || "Not recorded"}</p>
        </div>
        <div className="df-parameter-errors">
          <b>Error states / authored failure modes</b>
          <p>
            {data.chains
              .map((c) => c.mode)
              .filter(Boolean)
              .join("\n") || "No failure modes recorded"}
          </p>
        </div>
      </div>
    </section>
  );
}
