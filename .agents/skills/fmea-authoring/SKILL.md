---
name: "FMEA Authoring & 7-Step Quality Analysis"
description: "Governs FMEA structural tree compilation, risk assessments (S/O/D), Action Priority lookups, and compliance validation."
---

# FMEA Authoring & 7-Step Quality Analysis Skill

This skill guides the implementation, auditing, and generation of Design and Process FMEA structures following the AIAG-VDA 7-Step FMEA standard.

## 1. Process Overview & Steps
1. **Planning**: Initialize scope, 5T elements (Intent, Timing, Team, Tasks, Tools), and multi-tenant document schema.
2. **Structure Analysis**:
   - For PFMEA: Link Process Item → Process Step → Work Element.
   - For DFMEA: Link System → Subsystem → Component. Include Boundary Diagrams and P-Diagrams.
3. **Function Analysis**: Bind engineering functions and specifications/tolerances.
4. **Failure Analysis**: Establish failure chains in the analytical order: Cause of Failure → Failure Mode → Effect of Failure. Every failure mode must have at least one effect and one cause.
5. **Risk Analysis**: Assign Severity (S), Occurrence (O), and Detection (D) ratings (1-10). Severity is inherited from the highest rating among associated effects. The system automatically calculates Action Priority (AP) as High (H), Medium (M), or Low (L) using standard lookup tables.
6. **Optimization**: Flag High AP items and assign corrective actions.
7. **Results Documentation**: Submit the revision for final review and approval.

## 2. Technical Implementation Rules
- **Prerequisites**: Step N cannot start until Step N-1 is complete (e.g. Step 3 Function Analysis requires Step 2 Structure Analysis to be defined).
- **Rating Constraint**: S, O, and D ratings are integers strictly in [1, 10].
- **Calculated Fields**: The AP rating (H/M/L) must not be written directly by users; it must be calculated using the backend AP lookup rules.

## 3. Key Database Tables
- `project`: Root tenant project metadata.
- `document` / `document_revision`: Tracks drafts, approved, and locked FMEA revisions.
- `process_step` / `work_element`: Core structure analysis elements.
- `function` / `requirement`: Function analysis properties.
- `failure_mode` / `effect` / `cause`: Failure analysis chains.
- `pfmea_row` / `dfmea_row`: Unified representations mapping the relationships between steps, functions, failures, and risks.

## 4. API Endpoints
- `POST /api/v1/projects/:projectId/documents` — Initialize a new FMEA document.
- `GET /api/v1/revisions/:revisionId/rows` — List all active FMEA rows.
- `POST /api/v1/revisions/:revisionId/rows` — Append a row to the active FMEA.
- `PATCH /api/v1/rows/:rowId` — Update FMEA row properties and S/O/D ratings.

## 5. Related Skills
- `pfd-pfmea-linking`: Integrates Process Flow Diagrams with FMEA process steps.
- `control-plan-sync`: Compiles manufacturing Control Plans from FMEA controls.
- `ai-suggestion-review`: Governs AI-generated row proposals and safety thresholds.
- `corrective-actions`: Tracks mitigations for High AP items.
