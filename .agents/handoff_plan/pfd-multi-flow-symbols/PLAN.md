# Implementation Plan — PFD Multi-Flow Symbols Restoration & Architectural Invariants

**Slug**: `pfd-multi-flow-symbols`  
**Status**: `completed`  
**Created**: `2026-10-21T00:33:00+05:30`  
**Started**: `2026-10-21T00:34:00+05:30`  
**Completed**: `2026-10-21T00:43:00+05:30`  
**Author**: Antigravity  

---

## 1. Executive Summary & Root Cause Investigation

### The Problem
The current PFD table restricts each process step row to a single manufacturing activity symbol. In real-world manufacturing engineering (AIAG-VDA 2019, ASME Standard for Process Charts, ISO 9001/IATF 16949), a single process step frequently encompasses **multiple simultaneous flow activities** (e.g., Operation + In-Process Inspection, Receiving Area + Incoming Inspection, Conveyor Transport + Wash Operation, In-Line Inspection + Automated Reject Routing, Hold/WIP + Buffer Storage). Restricting a PFD table row to only one symbol violates industrial PFD standards and breaks engineering workflows.

### How It Occurred in the First Place
1. **Historical State (v0.1.0 – v0.11.0)**:
   - The PostgreSQL schema (`ProcessStep.flowIcons Json?`) was designed to store a dictionary of active boolean flags (`{ oper: true, insp: true, trans: true, store: true, wip: true, ... }`).
   - The frontend PFD table (`PfdWorkspace.tsx`) originally contained a dedicated `FLOW_ICON_COLUMNS` configuration.
   - In the table cell, **all active flow symbols** were rendered side-by-side as distinct badges.
   - Clicking the cell opened a multi-select popover where engineers could independently toggle any combination of symbols.
2. **The Breaking Change in v0.12.0 (Automatic Diagrams & SVG Shapes)**:
   - In `v0.12.0`, an agent added automatic ELK graph layout and a library of 408 SVG shapes for the graphical diagram canvas.
   - On the diagram canvas, each flowchart node is a geometric shape (1:1).
   - **The Conflation / Architectural Lapse**: The agent conflated the **Diagram Node Primary Geometric Shape** with the **PFD Table's Multi-Activity Flow Symbols**.
   - The agent replaced the multi-icon table cell and picker with `<PfdStepSymbolFields>`, which enforced a single `stepType` and single `manufacturingSymbolId`.
   - The agent demoted `flowIcons` to a "legacy read-only translation", and wrote code in `pfdSymbols.ts` (`legacyManufacturingSymbol`, `syncFlowIcons`) that flagged any step with multiple active symbols as "ambiguous / conflict", and forcibly wiped other icons whenever `stepType` was updated.
3. **The Subsequent v0.12.1 Patch**:
   - `v0.12.1` restored authentic vector outlines and reduced table row height, but preserved the flawed single-symbol premise of `v0.12.0`, only treating WIP and Reject as secondary route markers.

### Where Was the Documentation / Governance Lapse?
- **No PFD Invariants in `.agents/AGENTS.md`**: Section 2.1 only governed PFD↔PFMEA linking and orphan detection. It contained zero specifications regarding PFD table row structure or flow symbol multiplicity.
- **No PFD Invariants in `.agents/agents/pfd/AGENT.md`**: The PFD specialist agent prompt did not mention ASME/AIAG-VDA multi-symbol rules.
- **No Separation of Concerns in `.agents/rules/architecture.md`**: It did not explicitly document the distinction between diagram graph node geometry (1:1) vs. table process flow attributes (1:N).

---

## 2. Governance & Rules Updates (Preventing Recurrence)

1. **`.agents/AGENTS.md` §2.1**:
   - Add **Rule 2.1.1 (PFD Flow Symbol Multiplicity)**:
     - *In standard industrial PFD worksheets (AIAG-VDA, ASME Standard for Process Charts), a single process step may possess multiple simultaneous flow symbols (Operation, Inspection, Transport, Storage, Delay/WIP, Decision, Rework, Reject). The PFD Table "Flow Symbols" column must support multi-selection and display all active flow symbols side-by-side. A single-symbol restriction in the PFD table is strictly prohibited.*
     - *Diagram Canvas Mapping: Diagram flowchart nodes derive their primary geometry from active flow symbols (e.g., Operation + Inspection = Combined circle-in-square) or explicit selection, while preserving the full multi-symbol set in `flowIcons`.*
2. **`.agents/agents/pfd/AGENT.md`**:
   - Add hard invariant: *Enforce multi-flow symbol support in PFD tables; never restrict a step row to a single flow symbol.*
3. **`.agents/rules/architecture.md` & `.agents/context/domain.md`**:
   - Add explicit architectural separation between Diagram Node Shapes (graph layout) and PFD Table Flow Symbols (process analysis).

---

## 3. Implementation Tasks & Technical Plan

### Task 1: Refactor Symbol Resolver & Utilities (`frontend/src/features/pfd/utils/pfdSymbols.ts`)
- **Remove false "ambiguity" / "conflict"**: Multiple active flow symbols are valid standard manufacturing behavior, not conflicts.
- **Support Multi-Select `syncFlowIcons`**: Allow adding/removing individual symbols in `flowIcons` without resetting or zeroing out the others.
- **Intelligent Diagram Shape Fallback**:
  - If `oper` + `insp` active -> `combined` (circle-in-square).
  - If `oper` active -> `operation` (circle).
  - If `insp` active -> `inspection` (square).
  - If `trans` active -> `transport` (arrow).
  - If `store` / `recArea` active -> `storage` (inverted triangle).
  - If `decs` active -> `decision` (diamond).
  - If `rework` active -> `rework` (pentagon).
  - If multiple activities (e.g. `oper` + `trans`) -> primary diagram node is `operation`, while all symbols remain active in `flowIcons`.

### Task 2: Multi-Symbol Flow Cell & Popover in PFD Table (`frontend/src/features/pfd/PfdWorkspace.tsx`)
- **Flow Symbols Cell Display**:
  - Render all active flow symbols side-by-side using authentic SVG vector outlines.
  - Compact, high-density layout: neat row of symbol badges (size 22–24px) with tooltip showing symbol name.
  - If empty, display a clean "+ Add symbols" placeholder.
- **Multi-Symbol Interactive Popover/Picker**:
  - Clicking the Flow Symbols cell opens a compact, floating multi-select palette directly anchored to the cell.
  - Presents all standard flow symbols as clickable toggle buttons:
    - `◯` Operation
    - `□` Inspection
    - `⇨` Transport
    - `▽` Storage
    - `📥` Receiving Area
    - `☉` WIP / Delay
    - `◇` Decision
    - `⬠` Rework
    - `✕` Reject
  - Multiple buttons can be active simultaneously with clear highlighted toggle states.
  - Instant toggle or Confirm (Save) button updating `flowIcons` directly via `PATCH /api/v1/pfd-steps/:id`.

### Task 3: Step Creation & Edit Drawers (`PfdWorkspace.tsx`, `StepFormDialog.tsx`)
- In `handleOpenAddDrawer` and `StepFormDialog`:
  - Replace the single-select stepType dropdown as the sole icon driver with a multi-select flow symbol button group / checkboxes.
  - Allow users to select multiple flow symbols when creating or editing a step.

### Task 4: Excel Export & Import Parity (`pfdGraph.ts`, `ExcelImportWizard.tsx`)
- In `exportPfdWorkbook`: format all active flow symbols in the Activity Type / Flow Symbols column (e.g., "Operation, Inspection, Transport").
- In `ExcelImportWizard`: ensure columns mapped to flow symbols correctly populate all active keys in `flowIcons`.

### Task 5: Testing & Verification
- Unit tests in `pfdSymbols.test.mjs`:
  - Test multi-symbol combinations (e.g. Operation + Inspection, Operation + Transport + WIP, Inspection + Decision + Reject).
  - Verify `flowIcons` retains all active keys and resolves appropriate primary diagram symbol.
- Regression tests: backend test suite (`174/174` pass), frontend test suite (`27+` pass).
- Production build verification (`tsc -b && vite build`, `nest build`).

---

## 4. Acceptance Criteria
1. Any PFD table row can have 1, 2, 3, or more Flow Symbols active simultaneously.
2. In the PFD table, all active symbols are displayed side-by-side with authentic SVG outlines.
3. Clicking the Flow Symbols cell allows toggling multiple symbols on/off without one wiping out the others.
4. Adding a step allows selecting multiple flow symbols.
5. All tests pass, production builds remain green, and `.agents/AGENTS.md` is updated with hard rules.

---

## 5. Execution Summary & Verification Evidence

- **Governance Updates**:
  - Added Rule 2.1.1 in `.agents/AGENTS.md` establishing PFD Flow Symbol Multiplicity (AIAG-VDA 2019 / ASME process chart standards).
  - Added invariant in `.agents/agents/pfd/AGENT.md` forbidding single-symbol restrictions in PFD tables.
  - Added multi-symbol mapping specification in `.agents/skills/pfd-pfmea-linking/SKILL.md`.
- **Code Modifications**:
  - `pfdSymbols.ts`: Added `FLOW_SYMBOL_DEFINITIONS` with 9 standard flow activities, `getActiveFlowSymbols`, `toggleFlowIcon`, non-destructive multi-select `syncFlowIcons`, and smart diagram geometry fallback (`derivePrimaryStepType`).
  - `BrowseShapesDialog.tsx`: Redesigned `BrowseShapesDialog` into a responsive multi-select toggle grid with active counters; redesigned `PfdStepSymbolFields` table row view into an authentic side-by-side SVG badge cluster with tooltips and quick "+ Add symbols" affordance.
  - `PfdWorkspace.tsx`: Multi-flow-symbol toggle integration in Drawer and Table; atomic patch updates via `patchStep(step.id, { flowIcons: updatedIcons })`.
  - `StepFormDialog.tsx`: Added multi-flow-symbol toggle bar with active visual states.
  - `pfdGraph.ts`: Preserved single geometry type for SVG canvas nodes while formatting all active symbols for Excel export (`pfdFormattedActivities`).
- **Verification Evidence**:
  - Frontend Unit Tests: 28/28 tests PASS (`node --test frontend/src/features/pfd/utils/*.test.mjs`).
  - Backend Integration/Unit Tests: 174/174 tests across 20 test suites PASS (`npm --prefix backend test -- --runInBand`).
  - Frontend Production Build: Clean Vite build (`tsc -b && vite build`) in 10.33s.
  - Backend Production Build: Clean Nest build (`nest build`).
  - Knowledge Graph: Refreshed with `graphify update .` (4,065 nodes, 7,051 edges, 320 communities).

