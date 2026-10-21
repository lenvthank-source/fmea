import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Link2,
  RotateCcw,
} from "lucide-react";
import {
  homeStory,
  type ReviewState,
  type StoryStage,
} from "./home-story-content";

export function EngineeringTeaser() {
  return (
    <div className="home-teaser" aria-label="Illustrative engineering thread">
      <div className="home-preview-heading">
        <GitBranch size={20} aria-hidden="true" />
        <div>
          <strong>{homeStory.project}</strong>
          <span>An engineering thread</span>
        </div>
        <span className="home-preview-label">Product preview</span>
      </div>
      <div className="home-teaser-thread">
        <div className="home-teaser-node">
          <span>Design requirement</span>
          <strong>Keep the rotor aligned.</strong>
          <small>Rotor assembly · DFMEA</small>
        </div>
        <div className="home-teaser-link">
          <ArrowDown size={17} aria-hidden="true" /> Reviewed relationship
        </div>
        <div className="home-teaser-node">
          <span>Process risk</span>
          <strong>What could disturb it?</strong>
          <small>Pump assembly · PFMEA</small>
        </div>
        <div className="home-teaser-link">
          <ArrowDown size={17} aria-hidden="true" /> Linked detection control
        </div>
        <div className="home-teaser-node home-teaser-result">
          <span>Production control</span>
          <strong>Make the check traceable.</strong>
          <small>Central control plan</small>
        </div>
      </div>
      <div className="home-teaser-footer">
        <Link2 size={14} aria-hidden="true" /> The context stays with the
        decision.
      </div>
    </div>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="home-detail-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function TraceWorkbench({
  stage,
  onStage,
  applied,
}: {
  stage: StoryStage;
  onStage: (stage: StoryStage) => void;
  applied: boolean;
}) {
  const current = homeStory.stages.find((item) => item.id === stage)!;
  const control = applied
    ? homeStory.proposedControl
    : homeStory.originalControl;
  return (
    <div className="home-workbench">
      <div className="home-workbench-header">
        <span>
          <GitBranch size={17} aria-hidden="true" />
          <strong>{homeStory.project}</strong>
          <span className="home-workspace-label"> / Connected workspace</span>
        </span>
        <small>Illustrative project</small>
      </div>
      <nav
        className="home-document-nav"
        aria-label="Explore the engineering thread"
      >
        {homeStory.stages.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={stage === item.id}
            onClick={() => onStage(item.id)}
          >
            <strong>{item.document}</strong>
            <span>{item.title}</span>
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        ))}
      </nav>
      <div className="home-record" aria-live="polite" aria-atomic="true">
        <div className="home-record-title">
          <span className="home-record-type">{current.document}</span>
          <span>
            {stage === "design" ? "Rotor assembly" : "OP20 · Pump assembly"}
          </span>
        </div>
        <h3>{current.title}</h3>
        <p>{current.description}</p>
        {stage === "design" && (
          <>
            <div className="home-structure-path">
              Pump system <ChevronRight size={13} /> Drive unit{" "}
              <ChevronRight size={13} /> Rotor assembly
            </div>
            <dl className="home-detail-grid">
              <DetailField label="Intended function">
                Maintain smooth rotational motion
              </DetailField>
              <DetailField label="Failure mode">
                Excessive rotor vibration
              </DetailField>
              <DetailField label="Higher-level effect">
                Reduced pump performance
              </DetailField>
              <DetailField label="Linked characteristic">
                {homeStory.characteristic}
              </DetailField>
            </dl>
          </>
        )}
        {stage === "process" && (
          <>
            <svg
              className="home-mini-pfd"
              viewBox="0 0 470 130"
              role="img"
              aria-label="Illustrative sequence: material storage, pump assembly, alignment check"
            >
              <defs>
                <marker
                  id="home-pfd-arrow"
                  markerWidth="7"
                  markerHeight="7"
                  refX="6"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0 0L7 3.5L0 7" fill="currentColor" />
                </marker>
              </defs>
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M42 24H82L62 60Z" />
                <circle cx="235" cy="42" r="22" />
                <rect x="386" y="20" width="44" height="44" />
                <path
                  d="M90 42H200M265 42H374"
                  markerEnd="url(#home-pfd-arrow)"
                />
              </g>
              <g textAnchor="middle" fill="currentColor" fontSize="12">
                <text x="62" y="98">
                  Material storage
                </text>
                <text x="235" y="98">
                  Pump assembly
                </text>
                <text x="408" y="98">
                  Alignment check
                </text>
              </g>
            </svg>
            <dl className="home-detail-grid">
              <DetailField label="Operation">OP20 · Pump assembly</DetailField>
              <DetailField label="Resource">
                Guided assembly fixture
              </DetailField>
              <DetailField label="Analysis link">PFMEA · OP20</DetailField>
              <DetailField label="Characteristic">
                {homeStory.characteristic}
              </DetailField>
            </dl>
          </>
        )}
        {stage === "risk" && (
          <>
            <div className="home-failure-chain">
              {[
                ["Cause", "Bearing positioned incorrectly"],
                ["Failure mode", "Misaligned rotor assembly"],
                ["Effect", "Reduced pump performance"],
              ].map(([label, text], index) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{text}</strong>
                  {index < 2 && <ArrowRight size={16} aria-hidden="true" />}
                </div>
              ))}
            </div>
            <dl className="home-detail-grid">
              <DetailField label="Prevention control">
                Guided assembly fixture
              </DetailField>
              <DetailField label="Detection control">{control}</DetailField>
            </dl>
          </>
        )}
        {stage === "control" && (
          <>
            <dl className="home-detail-grid">
              <DetailField label="Characteristic">
                {homeStory.characteristic}
              </DetailField>
              <DetailField label="Operation">OP20 · Pump assembly</DetailField>
              <DetailField label="Evaluation technique">{control}</DetailField>
              <DetailField label="Source">
                Linked PFMEA detection control
              </DetailField>
            </dl>
            <div className="home-record-note">
              <Link2 size={16} aria-hidden="true" />
              <span>
                {applied
                  ? "Reviewed example applied. Execution decisions remain under team control."
                  : "A source change needs review before it changes this control."}{" "}
                <a href="#review">Try the review below</a>
              </span>
            </div>
          </>
        )}
        {stage === "action" && (
          <>
            <div className="home-action-record">
              <span className="home-record-type">
                Open for engineering review
              </span>
              <h4>Evaluate the alignment gauge</h4>
              <p>
                Record implementation evidence, then review effectiveness before
                reassessing the risk.
              </p>
            </div>
            <dl className="home-detail-grid">
              <DetailField label="Responsible function">
                Quality engineering
              </DetailField>
              <DetailField label="Implementation evidence">
                Awaiting evidence
              </DetailField>
              <DetailField label="Effectiveness review">
                Not yet verified
              </DetailField>
              <DetailField label="Linked control">{control}</DetailField>
            </dl>
          </>
        )}
      </div>
      <aside className="home-relationship">
        <Link2 size={19} aria-hidden="true" />
        <h4>Why this connection matters</h4>
        <p>{current.relation}</p>
        <div>
          <span>Shared characteristic</span>
          <strong>{homeStory.characteristic}</strong>
        </div>
      </aside>
      <div className="home-workbench-footer">
        <span>
          <Check size={13} aria-hidden="true" /> One relationship, different
          views
        </span>
        <span>Local preview. No production data changes.</span>
      </div>
    </div>
  );
}

export function ReviewChange({
  state,
  onChange,
}: {
  state: ReviewState;
  onChange: (state: ReviewState) => void;
}) {
  const proposed = state !== "baseline";
  const actionRef = useRef<HTMLButtonElement>(null);
  const previousState = useRef(state);
  useEffect(() => {
    if (previousState.current !== state)
      actionRef.current?.focus({ preventScroll: true });
    previousState.current = state;
  }, [state]);
  return (
    <div className={`home-review is-${state}`}>
      <div className="home-review-heading">
        <strong>Follow a detection-control update</strong>
        <span>
          {state === "baseline"
            ? "Current baseline"
            : state === "proposed"
              ? "Review required"
              : "Applied to preview"}
        </span>
      </div>
      <div className="home-review-grid">
        <div className="home-review-source">
          <span className="home-record-type">PFMEA</span>
          <small>OP20 · Detection control</small>
          <strong>
            {proposed ? homeStory.proposedControl : homeStory.originalControl}
          </strong>
          <p>
            {state === "applied"
              ? "The reviewed source control is reflected in this preview."
              : proposed
                ? "A proposed source change is ready for review."
                : "This is the source control linked to the plan."}
          </p>
        </div>
        <div className="home-review-connector" aria-hidden="true">
          <Link2 size={18} />
          <ArrowRight size={24} />
        </div>
        <div className="home-review-target">
          <span className="home-record-type">Control plan</span>
          <small>{homeStory.characteristic}</small>
          {state === "proposed" ? (
            <div className="home-review-diff">
              <del>{homeStory.originalControl}</del>
              <ins>{homeStory.proposedControl}</ins>
            </div>
          ) : (
            <strong>
              {state === "applied"
                ? homeStory.proposedControl
                : homeStory.originalControl}
            </strong>
          )}
          <p>
            {state === "applied"
              ? "The reviewed change is now visible in both preview views."
              : state === "proposed"
                ? "Compare the proposed update. Your existing plan stays intact until you apply it."
                : "The plan retains its own execution decisions."}
          </p>
        </div>
      </div>
      <div className="home-review-actions">
        <div role="status">
          {state === "baseline" ? (
            "Start with a change. See what needs your decision."
          ) : state === "proposed" ? (
            "Apply the proposal, or keep the existing control."
          ) : (
            <>
              <CheckCircle2 size={16} aria-hidden="true" /> Applied locally.
              Ratings and action states are unchanged.
            </>
          )}
        </div>
        <div>
          {state === "baseline" && (
            <button
              ref={actionRef}
              type="button"
              className="story-button story-button-small"
              onClick={() => onChange("proposed")}
            >
              Propose a change <ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
          {state === "proposed" && (
            <>
              <button
                type="button"
                className="home-secondary-button"
                onClick={() => onChange("baseline")}
              >
                Keep existing control
              </button>
              <button
                ref={actionRef}
                type="button"
                className="story-button story-button-small"
                onClick={() => onChange("applied")}
              >
                Apply to preview <Check size={15} aria-hidden="true" />
              </button>
            </>
          )}
          {state === "applied" && (
            <button
              ref={actionRef}
              type="button"
              className="home-secondary-button"
              onClick={() => onChange("baseline")}
            >
              <RotateCcw size={14} aria-hidden="true" /> Reset example
            </button>
          )}
        </div>
      </div>
      <p className="home-demo-caption">
        Illustrative control change. Your engineering team defines the actual
        specification, sampling, reaction and evaluation criteria.
      </p>
    </div>
  );
}
