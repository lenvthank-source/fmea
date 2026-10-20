---
name: "Corrective Actions Optimization & Tracking"
description: "Maintain explicit action transitions, evidence, protected sources and separate justified reassessment without overwriting baseline ratings."
---
# Corrective actions

Inspect `backend/src/modules/action/action.service.ts:1` and dedicated DFMEA service before extending the lifecycle.

- Legacy PFMEA: POST `/api/v1/actions`, PATCH `/actions/:id`, evidence POST and action list routes. No separate /status endpoint. DFMEA optimization lives at each cause in its revision-owned model.
- Enforce ordered lifecycle open -> in_progress -> completed -> verified -> closed; supported cancellation needs a reason. Completion/disposition needs notes; verification needs retained evidence, integer after ratings, effectiveness decision and independent owner/verifier under product policy.
- Resolve both newly supplied and stored reassessment values. Preserve initial ratings; write verified reassessment separately. Better detection never itself lowers severity.
- Project/trial/tenant/type/revision checks apply to linked engineering writes. Verified/closed/cancelled evidence is protected; serialize evidence mutation and verification to prevent races. Existing PDF/image 50MB validation remains.
- Preserve owner/date/results/evidence history. High AP requires documented team review/action-or-justification under applicable policy, not a universal new-task mandate. Neither task closure nor Low AP proves acceptable risk.
- AP remains calculated/read-only from the identified configured profile, with independent handbook numerical verification pending.

Authority: `.agents/context/engineering-rule-register.md`. Distinguish software/product policies, source-backed requirements and customer overlays; no regulatory certification guarantee.
