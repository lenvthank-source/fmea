import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  Check,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  GitBranch,
  Link2,
  MoreHorizontal,
  Network,
  ShieldCheck,
} from "lucide-react";

const views = ["DFMEA", "PFMEA", "Control plan"] as const;
type View = (typeof views)[number];

/** Local, illustrative product model. Interactions never mutate project data. */
export const ConnectedProduct: React.FC = () => {
  const [connected, setConnected] = useState(true);
  const [view, setView] = useState<View>("DFMEA");
  const [selected, setSelected] = useState("Rotor assembly");
  const [updated, setUpdated] = useState(false);
  return (
    <div className="story-product-stage">
      <div className="story-product-orbit" aria-hidden="true" />
      <div
        className="story-product-mode"
        role="group"
        aria-label="Compare ways of working"
      >
        <button aria-pressed={!connected} onClick={() => setConnected(false)}>
          <FileSpreadsheet size={14} aria-hidden="true" />
          Disconnected files
        </button>
        <button aria-pressed={connected} onClick={() => setConnected(true)}>
          <Network size={14} aria-hidden="true" />
          Connected FMEA
        </button>
      </div>
      <div
        className={`story-product-window ${connected ? "" : "is-spreadsheet"}`}
      >
        <div className="story-window-bar">
          <span className="story-window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            {connected
              ? "E-vacuum pump / Engineering workspace"
              : "DFMEA_final_v7_revised.xlsx"}
          </span>
          <span className="story-preview-label">Product preview</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {connected ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="story-product-toolbar">
                <span>
                  <span className="story-mini-logo">
                    <GitBranch size={16} />
                  </span>
                  <strong>E-vacuum pump</strong>
                  <ChevronRight size={13} />
                  <span>Analysis</span>
                </span>
                <span
                  className="story-product-avatars"
                  aria-label="Illustrative project team"
                >
                  <i>AK</i>
                  <i>ML</i>
                  <i>JR</i>
                </span>
              </div>
              <div
                className="story-product-tabs"
                role="group"
                aria-label="Explore connected documents"
              >
                {views.map((item) => (
                  <button
                    key={item}
                    aria-pressed={view === item}
                    onClick={() => setView(item)}
                  >
                    {item}
                    {item === "Control plan" && (
                      <Link2 size={11} aria-hidden="true" />
                    )}
                  </button>
                ))}
                <span>
                  <CheckCircle2 size={12} aria-hidden="true" /> Linked
                </span>
              </div>
              <div className="story-product-body">
                <aside
                  className="story-product-tree"
                  aria-label="Illustrative design structure"
                >
                  <div className="story-mini-heading">Product structure</div>
                  <div className="story-tree-root">
                    <Network size={14} /> Pump system
                  </div>
                  <div className="story-tree-branch">Drive unit</div>
                  {["Motor housing", "Rotor assembly", "Seal interface"].map(
                    (name) => (
                      <button
                        key={name}
                        aria-pressed={selected === name}
                        onClick={() => setSelected(name)}
                      >
                        <span />
                        {name}
                      </button>
                    ),
                  )}
                  <div className="story-tree-count">
                    <span>3</span> connected components
                  </div>
                </aside>
                <div className="story-product-analysis" aria-live="polite">
                  <div className="story-analysis-title">
                    <div>
                      <span className="story-mini-heading">
                        {view === "DFMEA"
                          ? "Focus element"
                          : view === "PFMEA"
                            ? "Process step · OP 030"
                            : "Linked characteristic"}
                      </span>
                      <p className="story-preview-title">
                        {view === "DFMEA"
                          ? selected
                          : view === "PFMEA"
                            ? "Rotor installation"
                            : "Bearing fit control"}
                      </p>
                    </div>
                    <MoreHorizontal size={18} aria-hidden="true" />
                  </div>
                  {view === "DFMEA" ? (
                    <>
                      <div className="story-function">
                        <span>Function</span>
                        <strong>
                          {selected === "Rotor assembly"
                            ? "Maintain smooth rotational motion"
                            : selected === "Motor housing"
                              ? "Support and locate the drive unit"
                              : "Maintain the vacuum boundary"}
                        </strong>
                      </div>
                      <div className="story-failure-chain">
                        <div>
                          <span>Failure cause</span>
                          <strong>
                            {selected === "Rotor assembly"
                              ? "Bearing misalignment"
                              : selected === "Motor housing"
                                ? "Housing distortion"
                                : "Seal compression loss"}
                          </strong>
                        </div>
                        <ArrowDown size={14} />
                        <div className="story-mode-node">
                          <span>Failure mode</span>
                          <strong>
                            {selected === "Rotor assembly"
                              ? "Excessive rotor vibration"
                              : selected === "Motor housing"
                                ? "Drive unit displacement"
                                : "Vacuum leakage"}
                          </strong>
                        </div>
                        <ArrowDown size={14} />
                        <div>
                          <span>Failure effect</span>
                          <strong>Reduced pump performance</strong>
                        </div>
                      </div>
                    </>
                  ) : view === "PFMEA" ? (
                    <>
                      <div className="story-function">
                        <span>Linked from design</span>
                        <strong>Bearing alignment requirement</strong>
                      </div>
                      <div className="story-preview-control">
                        <span>Prevention control</span>
                        <strong>Guided assembly fixture</strong>
                        <span>Detection control</span>
                        <strong>
                          {updated
                            ? "Automated alignment gauge"
                            : "In-station alignment check"}
                        </strong>
                        <span>Process coverage</span>
                        <strong className="story-green">
                          <Check size={14} /> Linked to process flow
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="story-function">
                        <span>Characteristic · SC-03</span>
                        <strong>Bearing alignment</strong>
                      </div>
                      <div className="story-preview-control">
                        <span>Control method</span>
                        <strong>
                          {updated
                            ? "Automated alignment gauge"
                            : "In-station alignment check"}
                        </strong>
                        <span>Inspection frequency</span>
                        <strong>Every assembly</strong>
                        <span>Control plan ↔ PFMEA</span>
                        <strong className="story-green">
                          <Check size={14} />
                          {updated
                            ? "Linked change reflected"
                            : "Controls in sync"}
                        </strong>
                      </div>
                      <button
                        className="story-preview-update"
                        onClick={() => setUpdated(!updated)}
                      >
                        {updated
                          ? "Reset example"
                          : "Try a linked control update"}
                        <Link2 size={13} />
                      </button>
                    </>
                  )}
                  <div className="story-product-risk">
                    <span>Action Priority</span>
                    <strong>
                      H <span>High</span>
                    </strong>
                    <span>Review & mitigate</span>
                  </div>
                </div>
              </div>
              <div className="story-product-bottom">
                <Link2 size={12} aria-hidden="true" />
                <span>DFMEA</span>
                <i />
                <span>PFMEA</span>
                <i />
                <span>Control plan</span>
                <span className="story-product-save">
                  <Check size={12} /> Shared context
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="spreadsheet"
              className="story-sheet-preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="story-sheet-ribbon">
                <FileSpreadsheet size={18} /> File <span>Home</span>
                <span>Insert</span>
                <span>Formulas</span>
                <span>Review</span>
              </div>
              <div className="story-sheet-formula">
                <span>G14</span>
                <i>fx</i> =VLOOKUP(B14,'[Control_plan.xlsx]Sheet1'!A:F,6,0)
              </div>
              <div className="story-sheet-grid">
                <div>
                  <b />
                  {["A", "B", "C", "D"].map((x) => (
                    <b key={x}>{x}</b>
                  ))}
                </div>
                {[
                  "Function|Failure mode|Cause|Control",
                  "Rotation|Vibration|Misalignment|See CP v3",
                  "Vacuum|Leakage|Seal wear|Copy pending",
                  "Support|Distortion|Load variation|#REF!",
                  "||||",
                  "||||",
                  "||||",
                ].map((row, index) => (
                  <div key={index}>
                    <b>{index + 11}</b>
                    {row
                      .split("|")
                      .slice(0, 4)
                      .map((cell, cellIndex) => (
                        <span
                          key={cellIndex}
                          className={cell === "#REF!" ? "story-cell-error" : ""}
                        >
                          {cell}
                        </span>
                      ))}
                  </div>
                ))}
              </div>
              <div className="story-sheet-warning">
                <FileSpreadsheet size={19} />
                <div>
                  <strong>The links live in someone’s memory.</strong>
                  <p>Separate files need separate updates.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.div
        className="story-product-callout"
        key={connected ? view : "files"}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <span>
          {connected ? (
            <ShieldCheck size={21} />
          ) : (
            <FileSpreadsheet size={21} />
          )}
        </span>
        <div>
          <strong>
            {connected
              ? view === "Control plan" && updated
                ? "One change. Shared understanding."
                : "One thread. The whole picture."
              : "Ready to connect the dots?"}
          </strong>
          <p>
            {connected
              ? "Structure, risk, controls & action in context."
              : "Switch to connected FMEA to explore."}
          </p>
        </div>
        <CheckCircle2 size={16} aria-hidden="true" />
      </motion.div>
      <p className="story-product-hint">
        {connected
          ? "Click a document or component to explore"
          : "An illustration of disconnected document work"}
      </p>
    </div>
  );
};
