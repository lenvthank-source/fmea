---
name: "Control Plan Generation & Traceability"
description: "Maintain implemented PFMEA/PFD-to-control-plan generation, field mapping and revision-safe traceability; distinguish future reverse synchronization from current behavior."
---
# Control plan generation and traceability

Current source: `backend/src/modules/control-plan/control-plan-row.service.ts:143` and controller. Ordinary CP PATCH updates CP only. Automatic reverse propagation, database listeners and BullMQ sync jobs are not implemented; do not advertise or assume them.

## Current interfaces
Under `/api/v1`: `GET/POST /revisions/:id/control-plan-rows`, `PATCH/DELETE /control-plan-rows/:rowId`, `POST /revisions/:id/control-plan-rows/sync` (PFMEA), and `/sync-pfd` (PFD). Inspect mappings before changing generation.

- Retain prevention/detection categorization and source links. One operation may produce multiple CP rows.
- Check target writability and tenant access before synchronization.
- Existing re-sync may replace generated mappings/rows. Preview/review consequences and preserve approved records rather than promising lossless continuous updates.
- Sampling/frequency/reaction defaults are suggestions requiring engineering review, not universal requirements.
- Report missing methods, reactions, characteristics or source coverage at review; allow incomplete drafts.
- Future reverse synchronization requires explicit field ownership, multi-link conflict handling, auditability and protected-revision checks. Document it as future behavior until implemented/tested.

## Rule authority
Read `.agents/context/engineering-rule-register.md` for source applicability and verification status. Separate official requirements, customer additions, product policy and implementation gaps. Do not invent compliance guarantees or rewrite approved records.
