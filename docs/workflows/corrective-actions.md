# Workflow: actions and verified reassessment

Current source: `backend/src/modules/action/action.service.ts:1` and the dedicated DFMEA service; [rule register](../../.agents/context/engineering-rule-register.md).

Actions follow open -> in_progress -> completed -> verified -> closed, with reasoned cancellation where supported. Completion/disposition requires notes; verification requires retained evidence, justified integer after ratings and a verifier separate from the owner (product policy). Source/project/trial/revision protection applies before changes. DFMEA stores cause-level optimization actions in its revision aggregate; legacy PFMEA uses action/action_fmea_link.

Initial ratings remain unchanged. Verified after ratings are stored separately as revised ratings; status-only verification uses the stored after values rather than silently failing to propagate them. Verified/closed/cancelled evidence is protected. Neither task closure nor Low AP proves acceptable risk or effectiveness. High AP needs documented team review, not a universal new-task mandate.

POST `/api/v1/actions`, PATCH `/actions/:id`, POST `/actions/:id/evidence`; no separate `/status`, reverse Control Plan update or regulatory signature/hash guarantee is advertised. File validation remains PDF/images up to 50 MB. Review state/evidence invariants in actual service tests before extending these rules.
