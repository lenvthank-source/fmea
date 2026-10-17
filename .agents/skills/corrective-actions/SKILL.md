---
name: "Corrective Actions Optimization & Tracking"
description: "Governs corrective action lifecycles, evidence file storage in Cloudflare R2, and before/after risk scores recalculation."
---

# Corrective Actions Optimization & Tracking Skill

This skill governs the execution, evidence verification, and risk-reduction auditing of corrective actions assigned to resolve FMEA risks.

## 1. Lifecycle States
1. **Open**: Action created and linked to High AP FMEA row. Tenant owner assigned.
2. **InProgress**: Owner commences work.
3. **Completed**: Owner logs completion notes and uploads verification evidence files.
4. **Verified**: Quality Engineer reviews evidence and verifies effectiveness.
5. **Closed**: QE re-rates post-action (After) S/O/D ratings, recalculating AP.
6. **Cancelled**: Actions marked as no longer required.

## 2. Integrity Rules
- **Evidence Mandate**: Transition to `Completed` requires a file upload (S3-compatible R2 upload). Maximum file size is 50MB.
- **Ratings Re-evaluation**: Post-action ratings (after Severity, after Occurrence, after Detection) must be provided upon closure. AP is automatically recalculated and varies.
- **Sync Back**: The new ratings must be transactionally synced back to the source FMEA row to update the document state.
- **Action Types**: Action must be classified as: `corrective`, `preventive`, or `improvement`.

## 3. Key Database Tables
- `action`: Stores the owner, status, action type, description, due date, and closed timestamp.
- `action_evidence`: Stores the reference URL (Cloudflare R2) and upload metadata.
- `action_fmea_link`: Junction table mapping actions to FMEA rows, capturing `before_severity`, `before_occurrence`, `before_detection`, `before_ap` alongside `after_*` ratings.

## 4. API Endpoints
- `POST /api/v1/revisions/:revisionId/actions` — Create a corrective/preventive action linked to a row.
- `POST /api/v1/actions/:actionId/evidence` — Upload evidence file to Cloudflare R2.
- `PATCH /api/v1/actions/:actionId/status` — Transition action status (Open → InProgress → Completed → Verified → Closed / Cancelled).

## 5. Related Skills
- `fmea-authoring`: High AP evaluations trigger action creation.
- `revision-approval`: Restricts status; actions must be completed/closed before submitting revision.
