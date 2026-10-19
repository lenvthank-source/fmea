# Workflow: explicit control-plan generation and traceability

Current source: `backend/src/modules/control-plan/control-plan-row.service.ts:143`. See the [rule register](../../.agents/context/engineering-rule-register.md).

1. Confirm target revision is writable and source project/revision is accessible.
2. Explicitly trigger `/api/v1/revisions/:id/control-plan-rows/sync` for PFMEA or `/sync-pfd` for process operations.
3. Review generated characteristics, specification/tolerance, control classification, measurement methods and source links.
4. Review/edit sampling, frequency and reaction plans using applicable engineering requirements.
5. Check completeness and source coverage before review/release.

Current sync is source-to-CP; ordinary CP PATCH edits CP only. No automatic reverse database hooks, BullMQ listeners, or universal bidirectional collision resolver is implemented. Re-sync can replace generated rows/mappings: inspect its consequences and preserve approved revisions. Future reverse sync requires explicit field ownership, conflict handling, audits and revision guards before being advertised.

Multiple analyses/controls per operation are valid. Generated defaults are reviewable suggestions rather than proof of customer or standard compliance.
