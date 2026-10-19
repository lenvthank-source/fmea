# Workflow: iterative FMEA authoring and review

Rule authority: [.agents/context/engineering-rule-register.md](../../.agents/context/engineering-rule-register.md).

1. Establish scope, planning context, team and applicable customer/profile requirements.
2. Model structure: design system/subsystem/component or process item/step/work element. Keep PFD routing distinct from analytical hierarchy.
3. Add measurable functions and actual requirements.
4. Build effect/mode/cause relationships across levels.
5. Assign justified integer S/O/D and calculate read-only AP with the configured profile.
6. Record optimization decisions, owners, evidence and reassessment.
7. Document results, unresolved issues and applicable approvals.

Revisit activities as knowledge changes. Incomplete drafts are permitted; valid references, permissions, tenant boundaries, integer inputs and protected revisions remain immediate constraints. Before review/release, report completeness findings without automatically inserting placeholder analysis. Graphical connectors are not manufacturing activities.

Current numerical AP mapping is preserved and browser/backend parity is tested over 1,000 valid combinations. Licensed-reference numerical conformity remains pending. Do not equate documentation with locking, Low AP with risk acceptance, or action completion with effectiveness.

Implemented row APIs use `/api/v1/revisions/:id/pfmea-rows` and `/pfmea-rows/:rowId`; verify controller/DTO contracts. Earlier blanket stage-edit rejection and mandatory configuration-table claims were not accurate universal implementation descriptions.
