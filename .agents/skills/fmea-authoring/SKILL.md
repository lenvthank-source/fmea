---
name: "FMEA Authoring & 7-Step Quality Analysis"
description: "Author and review DFMEA/PFMEA structures, functions, failure chains, ratings, and review completeness; distinguish draft integrity from release readiness."
---
# FMEA authoring

Allow incomplete drafts and revisiting planning/preparation, structure, functions, failures, risk, optimization and results documentation. Enforce tenant access, permissions, valid references, integer ratings and protected revisions immediately. Before review/release report missing functions, effect/mode/cause relationships, controls, ratings and coverage instead of blocking all later-stage drafting.

- PFMEA analytical hierarchy: Process Item → Process Step → Work Element; physical PFD edges are separate.
- DFMEA: system/subsystem/component context with boundary/function information as applicable.
- AIAG/VDA errata examples use Man, Machine, Material, Environment. Preserve Method and customer extensions; never silently convert old categories.
- Use measurable functions and actual specifications. Multiple analyses/controls can reference one operation.
- S/O/D: finite integers 1–10 from the applicable profile. AP is calculated/read-only. Current executable profile parity is tested; numerical handbook conformity remains pending independent verification. Never reconstruct lookup thresholds from memory.
- Severity uses worst linked effect where implemented. Better detection alone does not lower effect severity.
- High priority calls for documented team review/action-or-justification per applicable policy. Neither Low AP nor action completion establishes accepted risk.

## Implemented interfaces
Under `/api/v1`: `GET/POST /revisions/:id/pfmea-rows`, `PATCH/DELETE /pfmea-rows/:rowId`, `POST /revisions/:id/sync-from-tree`. Confirm controller/DTO before changing contracts; older generic `/rows` examples were inaccurate. Source: `backend/src/modules/pfmea/pfmea-row.controller.ts:1` and `ap-calculator.ts:1`.

## Rule authority
Read `.agents/context/engineering-rule-register.md` for source applicability and verification status. Separate official requirements, customer additions, product policy and implementation gaps. Do not invent compliance guarantees or rewrite approved records.
