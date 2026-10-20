import { useState } from "react";
import type { DfmeaData } from "../dfmeaDocument";
import {
  acceptFailureReference,
  failureReferenceChanged,
  failureReferenceSource,
  failureReferenceTarget,
} from "../dfmea-failure-references";
export function FailureReferenceReview({
  data,
  writable,
  onChange,
  onTrace,
}: {
  data: DfmeaData;
  writable: boolean;
  onChange: (next: DfmeaData) => void;
  onTrace: (chainId: string) => void;
}) {
  const [sourceKey, setSourceKey] = useState(""),
    [targetKey, setTargetKey] = useState(""),
    [reviewedBy, setReviewedBy] = useState(""),
    [decision, setDecision] = useState(""),
    [proposal, setProposal] = useState(""),
    [error, setError] = useState("");
  const sources = data.chains.flatMap((c) => [
    {
      key: JSON.stringify([c.id, "mode", c.id]),
      chainId: c.id,
      role: "mode" as const,
      id: c.id,
      label:
        (data.elements.find((e) => e.id === c.focusElementId)?.name ?? "") +
        " / mode: " +
        c.mode,
    },
    ...c.effects.map((e) => ({
      key: JSON.stringify([c.id, "effect", e.id]),
      chainId: c.id,
      role: "effect" as const,
      id: e.id,
      label:
        (data.elements.find((x) => x.id === c.focusElementId)?.name ?? "") +
        " / effect: " +
        e.text,
    })),
  ]);
  const targets = data.chains.flatMap((c) => [
    ...c.effects.map((e) => ({
      key: JSON.stringify([c.id, "effect", e.id]),
      chainId: c.id,
      role: "effect" as const,
      id: e.id,
      label: c.mode + " / effect: " + e.text,
    })),
    ...c.causes.map((x) => ({
      key: JSON.stringify([c.id, "cause", x.id]),
      chainId: c.id,
      role: "cause" as const,
      id: x.id,
      label: c.mode + " / cause: " + x.text,
    })),
  ]);
  const add = () => {
    try {
      const source = sources.find((x) => x.key === sourceKey),
        target = targets.find((x) => x.key === targetKey);
      if (!source || !target)
        throw new Error("Choose real source and target failure identities.");
      const ref = {
        id: crypto.randomUUID(),
        sourceChainId: source.chainId,
        sourceRole: source.role,
        sourceFailureId: source.id,
        targetChainId: target.chainId,
        targetRole: target.role,
        targetFailureId: target.id,
        snapshot: { text: "", severity: null, elementId: null },
        reviewedBy: "",
        decision: "",
      };
      const next = structuredClone(data);
      next.failureReferences = [...(next.failureReferences ?? []), ref];
      onChange(acceptFailureReference(next, ref.id, reviewedBy, decision));
      setSourceKey("");
      setTargetKey("");
      setError("");
    } catch (e) {
      setError(String(e));
    }
  };
  const chosenSource = sources.find((x) => x.key === sourceKey),
    chosenTarget = targets.find((x) => x.key === targetKey);
  return (
    <section
      className="df-panel df-reference-review"
      aria-label="Explicit failure relationships"
    >
      <h3>Shared effects and multi-level failure references</h3>
      <p className="df-note">
        Connect exact failure identities within this revision. A source
        mode/effect can be reviewed as an effect or cause in another focus
        analysis. References never use matching text and never update other
        records automatically. Circular snapshot dependencies are excluded by
        product policy.
      </p>
      {error && (
        <p className="df-alert error" role="alert">
          {error}
        </p>
      )}
      <fieldset disabled={!writable}>
        <div className="df-grid">
          <label className="df-field">
            Source failure identity
            <select
              value={sourceKey}
              onChange={(e) => setSourceKey(e.target.value)}
            >
              <option value="">Choose source analysis / failure</option>
              {sources.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label || x.id}
                </option>
              ))}
            </select>
          </label>
          <label className="df-field">
            Target contextual failure identity
            <select
              value={targetKey}
              onChange={(e) => setTargetKey(e.target.value)}
            >
              <option value="">Choose target analysis / effect or cause</option>
              {targets
                .filter((x) => x.chainId !== chosenSource?.chainId)
                .map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.label || x.id}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <div className="df-grid">
          <label className="df-field">
            Reviewed by
            <input
              value={reviewedBy}
              onChange={(e) => setReviewedBy(e.target.value)}
            />
          </label>
          <label className="df-field">
            Relationship / change decision
            <textarea
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              rows={2}
            />
          </label>
        </div>
        {chosenSource && chosenTarget && (
          <p className="df-note">
            Preview: {chosenSource.label} → {chosenTarget.label}. Accepting
            replaces only this target's text and element context; an
            effect-to-effect reference also copies the source severity. Mode
            references leave target severity under its own assessment. Other
            causes and evaluations remain unchanged.
          </p>
        )}
        <button
          disabled={
            !sourceKey || !targetKey || !reviewedBy.trim() || !decision.trim()
          }
          onClick={add}
        >
          Review and create reference
        </button>
      </fieldset>
      {(data.failureReferences ?? []).map((ref) => {
        const source = failureReferenceSource(data, ref),
          target = failureReferenceTarget(data, ref);
        const sourceChain = data.chains.find((c) => c.id === ref.sourceChainId),
          targetChain = data.chains.find((c) => c.id === ref.targetChainId);
        const changed = failureReferenceChanged(data, ref);
        const targetChanged =
          !!target &&
          (target.text !== ref.snapshot.text ||
            target.elementId !== ref.snapshot.elementId ||
            (ref.sourceRole === "effect" &&
              ref.targetRole === "effect" &&
              "severity" in target &&
              target.severity !== ref.snapshot.severity));
        return (
          <article className="df-cause" key={ref.id}>
            <div className="df-row">
              <strong>
                {sourceChain?.mode || ref.sourceChainId} →{" "}
                {targetChain?.mode || ref.targetChainId}
              </strong>
              <span className="df-note">
                {changed
                  ? "Source changed — review required"
                  : targetChanged
                    ? "Target differs — review required"
                    : "Accepted snapshot current"}
              </span>
            </div>
            <p className="df-note">
              Source {ref.sourceRole} ID: {ref.sourceFailureId} · Target{" "}
              {ref.targetRole} ID: {ref.targetFailureId}
            </p>
            <p>
              Accepted: {ref.snapshot.text}{" "}
              {ref.snapshot.severity !== null
                ? " · S " + ref.snapshot.severity
                : ""}
            </p>
            <p className="df-note">
              Reviewed by {ref.reviewedBy || "Unrecorded"} ·{" "}
              {ref.decision || "Decision missing"}
            </p>
            <div className="df-tools">
              <button onClick={() => onTrace(ref.sourceChainId)}>
                Open source analysis
              </button>
              <button onClick={() => onTrace(ref.targetChainId)}>
                Open target analysis
              </button>
              <button
                disabled={!writable}
                onClick={() => setProposal(proposal === ref.id ? "" : ref.id)}
              >
                Preview reviewed change
              </button>
              <button
                disabled={!writable}
                onClick={() => {
                  if (
                    window.confirm(
                      "Remove this relationship? The local target analysis will retain its present text and ratings.",
                    )
                  ) {
                    const next = structuredClone(data);
                    next.failureReferences = next.failureReferences?.filter(
                      (x) => x.id !== ref.id,
                    );
                    onChange(next);
                  }
                }}
              >
                Remove relationship
              </button>
            </div>
            {proposal === ref.id && (
              <div className="df-action">
                <h4>Change proposal — one target snapshot</h4>
                <div className="df-grid">
                  <div>
                    <b>Current target</b>
                    <p>{target?.text ?? "Missing"}</p>
                    <p className="df-note">
                      {"severity" in (target ?? {})
                        ? "S " +
                          (target as { severity: number | null }).severity
                        : "Cause evaluation is preserved"}
                    </p>
                  </div>
                  <div>
                    <b>Proposed source</b>
                    <p>{source?.text ?? "Missing"}</p>
                    <p className="df-note">
                      {ref.sourceRole === "effect" &&
                      ref.targetRole === "effect"
                        ? "S " + source?.severity
                        : "Target severity / cause O/D stay unchanged"}
                    </p>
                  </div>
                </div>
                <p className="df-note">
                  The reviewer and decision fields above must describe this
                  change. Saving commits only the explicitly accepted snapshot
                  in this editable revision; approved history remains protected.
                </p>
                <button
                  disabled={!writable || !reviewedBy.trim() || !decision.trim()}
                  onClick={() => {
                    try {
                      onChange(
                        acceptFailureReference(
                          data,
                          ref.id,
                          reviewedBy,
                          decision,
                        ),
                      );
                      setProposal("");
                      setError("");
                    } catch (e) {
                      setError(String(e));
                    }
                  }}
                >
                  Accept this target update
                </button>
              </div>
            )}
          </article>
        );
      })}
      {!data.failureReferences?.length && (
        <p className="df-empty">
          No explicit failure references. Inline analyses remain independent
          until the team creates a reviewed relationship.
        </p>
      )}
    </section>
  );
}
