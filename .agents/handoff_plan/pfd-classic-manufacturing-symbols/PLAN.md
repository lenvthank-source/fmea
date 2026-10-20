---
plan_id: pfd-classic-manufacturing-symbols
revision: 1
status: completed
created_at: "2026-10-20T23:50:19+05:30"
updated_at: "2026-10-21T00:07:00+05:30"
execution_authorization: granted
completed_at: "2026-10-21T00:07:00+05:30"
---

# Restore the original manufacturing symbols as the default

## 1. Outcome and scope

Restore the original manufacturing symbols in the PFD table, add/edit forms and manufacturing diagram view. Keep the expanded library available through **More symbols**.

Confirmed choices:
- Original manufacturing palette is the default.
- Each operation has **one primary activity symbol**.
- WIP and Reject are optional, separate markers.

Preserve operation identities, PFMEA/Control Plan links, authored routing and existing equipment selections.

**Baseline:** release `0.12.0`, commit `6986f53`. Preserve the current unrelated planning and feasibility-report changes.

**Status:** planning complete; implementation not started. The user's current request authorizes creation of this directory and saved handoff only, not execution of the product changes.

Canonical location: `F:/proj-fmea/.agents/handoff_plan/pfd-classic-manufacturing-symbols/PLAN.md`.

## 2. Findings and desired interface

The original assets remain under `frontend/public/icons/pfd/`.

| Activity or marker | Original asset |
|---|---|
| Operation | operation.svg |
| Inspection | inspect.svg |
| Transport | transportation.svg |
| Storage | Storage.svg |
| Decision | Decision.svg |
| Rework | rework.svg |
| WIP | WIP.svg |
| Reject | reject.svg |

The earlier interface is available in commit `a19a3bb`. Receiving Area reused the Storage asset. Combined Operation + Inspection needs a circle-in-square representation.

Restore the actual asset outlines. In particular, the original Rework outline is pentagonal and Reject is hexagonal; do not replace them with the newer textual RW or X representations.

The current resolver (`frontend/src/features/pfd/utils/pfdSymbols.ts:36`) selects one manufacturing symbol and reports conflicting historical marks underneath. The table selector (`frontend/src/features/pfd/components/BrowseShapesDialog.tsx:55`) displays separate manufacturing and equipment buttons plus repeated diagnostic text. This explains the changed appearance and excessive row height. It does not prove which legacy activity classifications are correct.

### Intended interaction

- Display one compact primary symbol, activity label and edit affordance.
- Open the original manufacturing palette first.
- Offer More symbols for additional activity variants and equipment choices.
- Remove the permanently visible equipment-selection button from compact table cells.
- Display selected WIP/Reject markers beside the primary symbol.
- Replace repeated warning paragraphs with a labelled Needs review indicator that opens the complete findings.
- Require explicit Apply/Cancel; closing the picker saves nothing.
- Preserve keyboard access, accessible names, focus return and narrow-screen usability.

Label the palette Manufacturing symbols. Treat the restored glyphs as the project's established notation; do not claim universal AIAG/ASME certification. Public reference reviewed: https://asq.org/quality-resources/flowchart (general process representation guidance; it does not independently certify the project's historical automotive glyphs).

## 3. Implementation contract

### Original symbol registry

Add these stable variants through the existing registry generator:
- manufacturing.classic.operation
- manufacturing.classic.inspection
- manufacturing.classic.transport
- manufacturing.classic.storage
- manufacturing.classic.decision
- manufacturing.classic.rework
- manufacturing.classic.combined

Keep all existing symbol IDs valid. Delay, Repair, Hold and other supported activities remain accessible through the expanded library.

Extract clean vector outlines from the trusted original assets and normalize them into the existing registry geometry and connection-port system. The original SVG wrappers contain embedded image/pattern definitions; do not copy those wrappers into the registry.

Update the generator, frontend/backend registries and coverage metadata together. Preserve existing source-catalog coverage records.

Default resolution:
1. Respect an existing valid explicit manufacturingSymbolId.
2. Otherwise use the original variant matching the declared activity when available.
3. Retain the supported current representation for activities without an original variant.
4. Expose invalid/conflicting data instead of guessing from operation narration.

No database migration or graph-schema version change is expected.

### Primary activity editing

Selecting a different activity is an explicit engineering edit.

Preview the proposed change and save compatible stepType and manufacturingSymbolId together through the existing PATCH endpoint. Do not use separate requests that can leave them inconsistent.

During this explicit save, synchronize known primary flowIcons bits:
- A single activity sets its corresponding legacy bit.
- Combined sets Operation and Inspection.
- Activities without legacy counterparts receive no fabricated mapping.
- Preserve independent markers and unknown legacy keys.

Retain backend transaction, authorization and compatibility checks. Update client state from the server response. A failed save retains the previous selection.

### Legacy data and optional markers

- Reading or displaying a row must never rewrite its flags or activity.
- WIP must not automatically become Delay.
- Reject must not automatically become Scrap.
- Receiving Area must not automatically become Inspection.
- Preserve historical Receiving Area marks as context, rather than a second primary activity.
- Conflicting historical marks require a visible review indicator showing the saved activity and previous marks.
- Reconcile those conflicts only after an explicit user selection.
- Never resolve ambiguous rows by silently converting them to Operation.
- Record previous values through the existing audit mechanism where supported; do not invent an audit guarantee.

### Diagram and export consistency

Manufacturing remains the default for new diagrams. Respect previously saved Engineering mode.

Use the same resolved registry geometry for screen, SVG, PDF and XLSX. Optional markers remain secondary and must not create process nodes, branches, rework loops or rejection routes.

Palette and display changes must preserve graph coordinates, edges, identities and downstream links. Keep equipment selections intact; show equipment prominently when Engineering mode is selected.

## 4. Ordered implementation tasks

Use one integration owner and implement sequentially because the resolver, selector and exports share contracts.

| Task | Work and ownership | Required evidence |
|---|---|---|
| T0 — Persist and baseline | Save/register this plan, record implementation authorization when granted and inspect relevant existing changes. | Accurate metadata/baseline; unrelated work preserved. |
| T1 — Geometry and defaults | Update scripts/build-pfd-symbols.py, generated registries, coverage metadata and pfdSymbols.ts. | Original-outline comparisons, identical registry copies, valid ports and resolver tests. |
| T2 — Selection interface | Update BrowseShapesDialog.tsx, PfdWorkspace.tsx and StepFormDialog.tsx. Implement one primary activity, optional markers, More symbols and atomic save handling. | Consistent table/add/edit behavior; Apply/Cancel, failed-save and compatibility checks. |
| T3 — Compatibility and exports | Update affected legacy mapping, shared rendering and import/export paths. | Reload, clone and workbook round trips preserve symbols, markers, identities and routing. |
| T4 — Integration and handoff | Run regressions/builds, inspect desktop/narrow layouts, update documentation and run Graphify. | Actual results, visual evidence, limitations and completion state recorded. |

Do not expand this work into the multi-harness coordinator project. No version bump, commit, push or production deployment is included.

## 5. Verification and assumption safeguards

**Baseline already checked:** the existing five pfdSymbols.test.mjs tests pass. These are baseline results, not evidence that the proposed change is implemented.

Required checks:
- A new Operation uses the original outline.
- Every original activity can be selected, saved and reloaded.
- Existing explicit newer symbols and equipment selections remain unchanged.
- Operation + Inspection is one combined primary activity.
- WIP/Reject toggles do not change the primary activity or routing.
- Conflicting legacy flags remain unchanged until explicitly reconciled.
- Changing Operation to Inspection saves compatible activity and symbol together.
- Cancel and failed saves preserve the original row.
- Approved, reference-project and trial protections remain enforced.
- Manufacturing/Engineering switching preserves graph geometry and equipment choices.
- Clone and native XLSX round trips retain original variants and markers.
- Screen, SVG, PDF and XLSX show matching outlines, including Rework and Reject.
- Narrow-screen symbol cells remain contained without repeated warning paragraphs inflating rows.

Run focused PFD symbol, graph, layout, print and workbook tests, relevant backend PFD tests, and both production builds. Compare actual rendered results with the original assets. Example scoped frontend command (cwd frontend): node --test src/features/pfd/utils/pfdSymbols.test.mjs; full PFD regression command: node --test src/features/pfd/utils/*.test.mjs. Build each package with npm run build in its own directory; backend tests with npm test -- --runInBand.

### Stop conditions

Stop the affected task and revise the plan if:
- A schema change unexpectedly becomes necessary.
- Existing identifiers or downstream relationships cannot be preserved.
- Legacy reconciliation requires an engineering decision not specified here.

Do not work around these conditions by weakening validation or inventing defaults.

### Completion

After integration and all required acceptance checks pass, update this same PLAN.md with status completed, completed_at, implementation summary, verification commands/actual results and artifact or commit references when available. If required work or verification remains incomplete, preserve an unfinished status and document the exact next action.

## Execution log

- 2026-10-20: User confirmed original palette as default and one main activity only, with optional markers. Research used current source, original SVG assets and historical commit a19a3bb; five baseline symbol tests passed.
- 2026-10-20: User requested creation of the missing directory. Saved this plan and registered it. Product implementation remains pending and unapproved; no completion claimed.
- 2026-10-20: User authorized implementation ("check this and help me to implement it"). Baseline verified (5/5 tests PASS).
- 2026-10-21: Implemented Task T1 (geometry & defaults): added 7 classic manufacturing symbols (`manufacturing.classic.*`) and route markers (`marker.wip`, `marker.reject`), restored pentagonal rework outline, updated generator and catalogs (417 symbols total). 6/6 symbol tests PASS.
- 2026-10-21: Implemented Task T2 (selection interface): overhauled `BrowseShapesDialog.tsx` with default Manufacturing Palette tab, optional WIP/Reject route marker toggles, "Needs review" tooltip chip, and atomic PATCH (`handleAtomicStepChange`) in `PfdWorkspace.tsx`.
- 2026-10-21: Implemented Task T3 (compatibility & exports): verified workbook import/export validation, SVG/PDF rendering. All 27 frontend PFD regression tests PASS.
- 2026-10-21: Implemented Task T4 (integration & verification): all 174 backend tests (20 suites) PASS, frontend production build PASS (`tsc -b && vite build`), backend build PASS (`nest build`). Synced directory READMEs and updated Graphify knowledge graph (3986 nodes, 6960 edges).

## Task checkpoints

- T0: Completed. Plan registered, execution authorized, baseline verified.
- T1: Completed. Generator updated with clean classic outlines; 417 symbols in identical frontend/backend registries.
- T2: Completed. Compact table cell with single primary symbol, marker badges, Needs review chip, and atomic save.
- T3: Completed. Full compatibility with v2 graph persistence, print tiles, native XLSX and SVG rendering.
- T4: Completed. 174 backend tests PASS, 27 frontend tests PASS, clean production builds, README sync, Graphify update complete.
