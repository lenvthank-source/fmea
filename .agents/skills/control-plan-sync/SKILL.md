---
name: "Control Plan Generation & Bidirectional Sync"
description: "Handles dynamic creation of Control Plans from FMEA controls and characteristics and propagates updates bidirectionally."
---

# Control Plan Generation & Bidirectional Sync Skill

This skill governs the auto-generation and bidirectional synchronization of manufacturing Control Plans based on process controls and characteristics defined in the PFMEA.

## 1. Sync Mechanics
1. **Auto-Generation**: Select FMEA rows containing prevention or detection controls. For each unique process characteristic, generate a corresponding Control Plan row.
2. **Field Mapping**:
   - `pfmea_row.controls (type: detection)` → `control_plan_row.measurement_method`.
   - `pfmea_row.characteristic` → `control_plan_row.characteristic`.
   - Populates default template-based values for `sample_size`, `frequency`, and `reaction_plan`.
3. **Bidirectional Listeners**: Trigger database hooks or background BullMQ jobs to keep both sheets in sync when cell values are mutated.

## 2. Integrity Rules
- **Link Integrity**: Every Control Plan row must hold a valid `control_plan_pfmea_link` referencing the source FMEA row.
- **Categorization**: Prevention controls (preventing causes) and detection controls (inspecting modes) must remain segregated.
- **Auditing**: Missing reaction plans or measurement methods generate validation warnings.

## 3. Key Database Tables
- `control_plan_row`: Defines characteristics, specifications, tolerances, sample sizes, frequencies, measurement methods, and reaction plans.
- `control_plan_pfmea_link` / `trace_link`: Stores connection mapping with `link_type = 'pfmea_to_cp'`.
- `pfmea_row` / `control` / `characteristic`: Source FMEA tables.

## 4. API Endpoints
- `POST /api/v1/revisions/:revisionId/generate-cp-from-pfmea` — Initialize CP from active FMEA controls and characteristics.
- `GET /api/v1/revisions/:revisionId/control-plan` — Retrieve the Control Plan grid rows.
- `PATCH /api/v1/control-plan-rows/:rowId` — Update Control Plan cells (which propagates back to linked PFMEA controls).

## 5. Related Skills
- `fmea-authoring`: Direct source of controls and tolerances.
- `revision-approval`: Restricts edits; if a revision is locked, sync changes are blocked.
