---
name: "FMEA Authoring & 7-Step Quality Analysis"
description: "Author and review DFMEA/PFMEA structures, functions, failure chains, ratings, and review completeness; distinguish draft integrity from release readiness."
---
# FMEA authoring

Allow incomplete drafts and revisiting planning/preparation, structure, functions, failures, risk, optimization and results documentation. Enforce tenant access, permissions, valid references, integer ratings and protected revisions immediately. Before review/release report missing functions, effect/mode/cause relationships, controls, ratings and coverage instead of blocking all later-stage drafting.

- PFMEA analytical hierarchy: Process Item → Process Step → Work Element; physical PFD edges are separate.
- DFMEA: dedicated revision-owned DfmeaDocument with stable system/subsystem/component identities, explicit functions/requirements/interfaces/failure chains and cause-level evaluations. Never store design hierarchy in PFD equipment strings. Boundary/parameter diagrams display actual authored context and apply as appropriate.
- AIAG/VDA errata examples use Man, Machine, Material, Environment. Preserve Method and customer extensions; never silently convert old categories.
- Use measurable functions and actual specifications. Multiple analyses/controls can reference one operation.
- S/O/D: finite integers 1–10 from the applicable profile. AP is calculated/read-only. Current executable profile parity is tested; numerical handbook conformity remains pending independent verification. Never reconstruct lookup thresholds from memory.
- Severity uses worst linked effect where implemented. Better detection alone does not lower effect severity.
- High priority calls for documented team review/action-or-justification per applicable policy. Neither Low AP nor action completion establishes accepted risk.

## Canonical DFMEA implementation
GET/PUT `/api/v1/revisions/:id/dfmea-document`; PUT requires expectedVersion/data. POST `/fork` preserves prior approved content. Services use dfmea permissions, shared transactional actor/revision checks and audit records. Legacy rows remain unreviewed, read-only sources; explicit chain mapping records source row identity without inferring ambiguous relationships. Reviewed downstreamLinks reference actual PFMEA revision/characteristic IDs or applicability decisions.

AP evaluations identify legacy-configured-unverified profile; strict 1..10 ratings, maximum linked effect severity, separate after evaluations and High AP review decisions. Independent full numerical handbook verification remains pending. Actions have explicit lifecycle, ownership/evidence/effectiveness and protected verified records; do not equate completion with verification.

Structure/focus/worksheet, boundary/interface and parameter views share canonical data. Exports include complete revisions/actions/results; native full-model import previews validate identities/ratings, and edited narrative sheets cannot silently reconstruct many-to-many relationships.

## Implemented PFMEA interfaces
Under `/api/v1`: `GET/POST /revisions/:id/pfmea-rows`, `PATCH/DELETE /pfmea-rows/:rowId`, `POST /revisions/:id/sync-from-tree`. Confirm controller/DTO before changing contracts; older generic `/rows` examples were inaccurate. Source: `backend/src/modules/pfmea/pfmea-row.controller.ts:1` and `ap-calculator.ts:1`.

## Rule authority
Read `.agents/context/engineering-rule-register.md` for source applicability and verification status. Separate official requirements, customer additions, product policy and implementation gaps. Do not invent compliance guarantees or rewrite approved records.

## Reviewed failure identities and reassessment
Optional failureReferences connect actual mode/effect identities to effect/cause targets within the same revision. Preview and accept source/target snapshot updates individually; stale references are readiness findings. Do not propagate narration or silently update linked targets. Complete reassessment requires an explicit O/D pair in one verified snapshot; no ratings means unassessed, historical partial snapshots remain unreviewed with null revised AP. Preserve initial ratings and old evidence.
