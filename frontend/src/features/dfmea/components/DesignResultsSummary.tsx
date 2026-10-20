import type { DfmeaData } from "../dfmeaDocument";
type Evaluation = {
  chainId: string;
  causeId: string;
  severity: number | null;
  ap: string | null;
  revisedAp: string | null;
};
export function DesignResultsSummary({
  data,
  evaluations,
  dirty,
  onRecord,
}: {
  data: DfmeaData;
  evaluations: Evaluation[];
  dirty: boolean;
  onRecord: (elementId: string, phase: number, recordId?: string) => void;
}) {
  const covered = data.functions.filter((f) =>
    data.chains.some((c) => c.functionId === f.id),
  );
  const actions = data.chains.flatMap((c) =>
    c.causes.flatMap((cause) =>
      cause.actions.map((action) => ({ action, chain: c, cause })),
    ),
  );
  const open = actions.filter(
    (x) => x.action.status === "open" || x.action.status === "in_progress",
  );
  const pending = actions.filter((x) => x.action.status === "completed");
  const verified = actions.filter((x) => x.action.status === "verified");
  const high = evaluations.filter((e) => e.ap === "H");
  const missing = data.functions.filter(
    (f) => !covered.some((x) => x.id === f.id),
  );
  return (
    <section className="df-results-summary" aria-label="Design results summary">
      <h3>Analysis at a glance</h3>
      <div className="df-summary-metrics">
        <div>
          <strong>
            {covered.length}/{data.functions.length}
          </strong>
          <span>functions analyzed</span>
        </div>
        <div>
          <strong>
            {data.chains.reduce((n, c) => n + c.causes.length, 0)}
          </strong>
          <span>cause evaluations</span>
        </div>
        <div>
          <strong>{open.length}</strong>
          <span>open actions</span>
        </div>
        <div>
          <strong>{pending.length}</strong>
          <span>awaiting effectiveness review</span>
        </div>
        <div>
          <strong>{verified.length}</strong>
          <span>verified actions</span>
        </div>
        <div>
          <strong>{dirty ? "—" : high.length}</strong>
          <span>High AP · unverified criteria</span>
        </div>
      </div>
      <p className="df-note">
        {dirty
          ? "Save the current draft to refresh server-calculated priorities."
          : "Priorities use legacy-configured-unverified. Counts are not acceptance of risk or proof of conformity."}
      </p>
      {missing.length > 0 && (
        <>
          <h4>Function coverage gaps</h4>
          <ul>
            {missing.map((f) => (
              <li key={f.id}>
                <button onClick={() => onRecord(f.elementId, 3)}>
                  {data.elements.find((e) => e.id === f.elementId)?.name}:{" "}
                  {f.text || "Unnamed function"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {!dirty && high.length > 0 && (
        <>
          <h4>High-priority team review</h4>
          <ul>
            {high.map((e) => {
              const c = data.chains.find((c) => c.id === e.chainId);
              return c ? (
                <li key={e.causeId}>
                  <button onClick={() => onRecord(c.focusElementId, 4, c.id)}>
                    {c.mode || "Unnamed mode"} ·{" "}
                    {c.causes.find((x) => x.id === e.causeId)?.text ||
                      "Unnamed cause"}
                  </button>
                  <span className="df-note">
                    {" "}
                    ·{" "}
                    {c.reviewDecision.trim()
                      ? "Team decision recorded"
                      : "Team decision missing"}
                  </span>
                </li>
              ) : null;
            })}
          </ul>
        </>
      )}
      {pending.length > 0 && (
        <>
          <h4>Completed actions awaiting review</h4>
          <ul>
            {pending.map((x) => (
              <li key={x.action.id}>
                <button
                  onClick={() =>
                    onRecord(x.chain.focusElementId, 5, x.action.id)
                  }
                >
                  {x.action.description || "Unnamed action"} ·{" "}
                  {x.action.owner || "Owner missing"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <details>
        <summary>Recorded effectiveness decisions ({verified.length})</summary>
        {verified.map((x) => (
          <article key={x.action.id}>
            <button
              onClick={() => onRecord(x.chain.focusElementId, 5, x.action.id)}
            >
              {x.action.description || "Unnamed action"}
            </button>
            <p>{x.action.decision}</p>
            <p className="df-note">
              Evidence: {x.action.evidence} · Completed:{" "}
              {x.action.completionDate} · Reassessment:{" "}
              {(x.action.revisedOccurrence===null)!==(x.action.revisedDetection===null)?'Historical partial pair — unreviewed, not used for reassessed AP':x.action.revisedOccurrence===null?'No numerical reassessment recorded':`Complete O/D snapshot ${x.action.revisedOccurrence}/${x.action.revisedDetection}`}
            </p>
          </article>
        ))}
      </details>
    </section>
  );
}
