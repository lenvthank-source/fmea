---
name: "Corrective Actions Optimization & Tracking"
description: "Track action ownership, evidence and justified before/after ratings without confusing task status with verified effectiveness or overstating existing enforcement."
---
# Corrective actions

Inspect `backend/src/modules/action/action.service.ts:190` and controller before relying on lifecycle enforcement.

- Current APIs: `POST /api/v1/actions`, `PATCH /api/v1/actions/:actionId`, evidence POST under the action, and user/project list routes. A separate `/status` endpoint is not implemented.
- Status values include open, in_progress, completed, verified, closed, cancelled. A fully enforced transition matrix and evidence prerequisite are not established by current updateAction.
- Evidence upload endpoint validates PDF/image types and 50 MB maximum. Do not confuse upload validation with enforced closure prerequisites.
- updateAction computes supplied after ratings and propagates them when sent with a verified/closed state. A status-only update does not guarantee prior stored ratings are propagated.
- Evidence review, justified reassessment and protected source revisions are required product-quality policies; audit gaps explicitly rather than claiming implementation.
- High AP needs team review/action-or-justification per applicable customer/company policy, not an invented universal command to create a new task.
- Ratings remain finite integers 1–10, calculated AP read-only. Never automatically reduce severity due to better detection or assert that closing a task proves risk reduction.
- Preserve tenant ownership and historical evidence; never silently mutate approved records.

## Rule authority
Read `.agents/context/engineering-rule-register.md` for source applicability and verification status. Separate official requirements, customer additions, product policy and implementation gaps. Do not invent compliance guarantees or rewrite approved records.
