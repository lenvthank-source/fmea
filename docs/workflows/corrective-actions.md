# Workflow: actions, evidence and effectiveness

Current source: `backend/src/modules/action/action.service.ts:190`; [rule register](../../.agents/context/engineering-rule-register.md).

1. Review priority and record an engineering decision under applicable customer/company policy.
2. Create an action with description, owner, due date and source link when needed.
3. Record execution notes and supporting evidence.
4. Review effectiveness and justify after ratings using the applicable criteria.
5. Record the disposition and preserve protected source documents.

Supported statuses include open, in_progress, completed, verified, closed and cancelled. These labels do not by themselves prove a fully enforced transition matrix or effective mitigation. Evidence upload validates supported files and 50 MB size, but current updateAction does not enforce an upload prerequisite for every completion/closure transition.

When after ratings are included in verified/closed updates, current service calculates AP and propagates ratings. A status-only update does not guarantee propagation of previously stored values. Full linked-revision/evidence/state enforcement remains a declared gap. Do not lower severity merely because detection improved or claim that closing a task proves risk reduction.

AP is calculated/read-only. High AP requires documented review, not an invented universal new-task rule. Existing APIs are POST `/api/v1/actions`, PATCH `/actions/:actionId`, and POST `/actions/:actionId/evidence`; no separate `/status` route or verified daily socket alert exists in the inspected service.
