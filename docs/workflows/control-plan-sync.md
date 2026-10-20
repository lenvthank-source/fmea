# Workflow: controlled Control Plan source review

Authority: [engineering rule register](../../.agents/context/engineering-rule-register.md). Canonical API: `backend/src/modules/control-plan/control-plan-document.controller.ts:1`.

1. Select the Control Plan revision and phase. Enter the actual revision header, applicable standard/customer profile and safe-launch applicability/criteria.
2. Select explicit PFD/PFMEA source baselines from the same project. Allow draft sources for authoring; release requires approved sources or a documented product-policy exception.
3. Preview source changes. Multiple characteristic/requirement/control combinations are candidates requiring deliberate applicability review, not assumed relationships.
4. Add selected candidates; resolve each conflict by retaining the current decision or accepting the source value. Unchanged previews do not duplicate lines. Removed sources remain review findings until explicitly detached or otherwise resolved.
5. Record sampling, volume/containment basis, evaluation technique, reaction actions/owner or controlled procedure/system references from actual engineering requirements. No defaults are generated.
6. Document reasoned exclusions for uncovered selected-source candidates. Exclusions are invalidated by source changes. This release coverage gate is application policy, not a claim that every candidate combination is universally required by a standard.
7. Save using expectedVersion, check readiness, submit, obtain a separate authorized decision, and fork a new phase/revision when needed. Approved plans and headers remain immutable.

GET/PUT `/api/v1/revisions/:id/control-plan-document`; POST suffixes `/sync-preview`, `/sync-apply`, `/fork`. Old row reads remain for legacy access; old row mutation/generation routes are retired with an explicit error. CP edits never reverse-propagate to FMEA.

JSON/native XLSX preserve the full model/provenance. Review imports before saving; worksheet-only CP imports map explicit columns and retain identities where supplied. PDF uses readable repeated-identity column sections and every row.
