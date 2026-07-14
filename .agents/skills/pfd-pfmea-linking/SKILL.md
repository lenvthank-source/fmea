---
name: "PFD-PFMEA Bidirectional Linking & Gap Analysis"
description: "Maintains synchronization between PFD steps and PFMEA grids, detecting coverage gaps and sequence mismatches."
---

# PFD-PFMEA Bidirectional Linking & Gap Analysis Skill

This skill governs the integration between Process Flow Diagrams (PFD) and Process FMEAs (PFMEA), ensuring that every manufactured process step is fully mapped and analyzed.

## 1. Workflow Mechanics
1. **Flow Definition**: PFD steps are defined layout-wise (React Flow canvas positioning using `position_x`, `position_y` and `graphical_data` JSONB) and sequence-wise.
2. **Dynamic Mapping**: PFMEA rows must map back to active PFD process steps using `pfmea_row.process_step_id`.
3. **Gap Detection**: The consistency engine runs background validations to verify coverage.

## 2. Integrity Rules
- **Orphan Prevention**: Any PFMEA row pointing to a non-existent or deleted PFD step must trigger a database validation error.
- **Coverage Warning**: If a process step exists in the PFD but has zero rows in the PFMEA grid, raise a warning: `Process step '{step_number}' has no mapped failure analysis.`
- **Audit Rules (Agent 4 Checks)**:
  - *PFMEA without controls* (Critical)
  - *High AP without action* (Warning)
  - *CP without PFMEA link* (Warning)
  - *DFMEA special characteristic without PFMEA coverage* (Critical)
  - *Severity inconsistency* (Warning)
  - *Missing reaction plan* (Warning)
  - *Orphan entities* (Info)
- **Sequence Audit**: Mismatches between PFD sequences and PFMEA row numbers must be flagged.

## 3. Key Database Tables
- `process_step` / `pfd_step`: Defines the sequence, title, type, and React Flow positioning of process operations.
- `pfmea_row`: Stores failure modes, causes, effects, and controls mapped to a process step.
- `trace_link`: Maps bidirectional relationships with `link_type = 'pfmea_to_pfd'`.

## 4. API Endpoints
- `GET /api/v1/revisions/:revisionId/pfd` — Retrieve all steps and layout coordinates for a document revision.
- `PATCH /api/v1/revisions/:revisionId/pfd` — Update PFD sequence and layout data.
- `GET /api/v1/revisions/:revisionId/linking-gap` — Trigger the consistency engine to run gap audits.

## 5. Related Skills
- `fmea-authoring`: Authoring failures mapped to PFD steps.
- `control-plan-sync`: Exports characteristics and controls from FMEA rows.
