# FMEApex — active handoff

Updated 2026-10-20. OpenAI Codex; workspace `F:/proj-fmea`. Release version **0.11.0**, explicitly confirmed by the user on 2026-10-20 for commit and push to origin/main. This handoff accompanies the authorized release commit; use git log and origin/main for its exact publication identity. Ledger: versions/v0.11.0.md.

## Objective and status
User-approved controlled DFMEA and Control Plan rebuild implemented and integration checked. Same specialists resumed: `dfmea_audit`, `cp_workspace`, `control_plan_audit`; all completed. Full plan/evidence matrix: `docs/specs/controlled-engineering-delivery.md`. Do not claim independent standards conformity: exact authorized S/O/D and all-1,000 expected AP results remain unavailable.

## Delivered
- Shared actual actor/tenant/project/type/trial ownership/expiry/reference/archived checks and independent document permissions. Revision locks inside mutation transactions, canonical optimistic versions, recoverable conflicts. SQL triggers protect aggregate tenant/type and approved content.
- Dedicated `DfmeaDocument`: stable design hierarchy, interfaces, measurable functions, explicit failure chains/cause controls, action evidence, paired reassessment, reviewed downstream characteristics, legacy mappings and scope exclusions. Seven revisitable activities; structure/focus/worksheet, boundary/parameter diagrams, results. Reviewed failureReferences use actual identities/snapshots; stale links are findings, no automatic propagation. Historical partial reassessment remains unreviewed with null AP. Criteria visibly `legacy-configured-unverified`, `verifiedEdition:null`.
- `ControlPlanDocument`: complete phase histories and frozen approved headers; characteristic/evaluation/sampling/reaction/ownership fields; safe launch and applicable alternatives/system references. Explicit sources, preview→resolve→apply, per-field decisions, fingerprinted reasoned exclusions, manual/refinement preservation, removed-source review and idempotency. Approved baseline/coverage release gates are declared product policies. Destructive legacy writes retired.
- Canonical lineage loads full PFMEA/actions and CP sources, historical contexts and no-PFMEA projects; strict revision/row/operation joins, unresolved controls separate.
- Full revision XLSX/model import preview and typed print/PDF adapter, stable IDs/provenance, long Unicode, labelled oversized-row continuation. Never accept imported AP or infer many-to-many design links from edited narration.
- Removed narration-based severity propagation and simulated manufacturing AI autofill. PFMEA integer/order/current-row fixes; complete canonical/legacy revision/project clone/remapping. Readiness loads actual relationships.
- Atomic independent password-confirmed approval and correction cycle, immutable approved baselines, protected action evidence. Admin deletion cannot bypass history; project deletion rejects protected documents; source-dependent draft deletion rejected. Active/last constraints, pointers, project metadata and audit checked atomically with parameterized tenant/user-context locks. Approved baseline activation requires project write access.
- Missing DFMEA shows explicit guidance instead of fake editor. Login supports explicit workspace for registered users; trial entry remains its established flow.

## Verification
- **Backend production build PASS; 154 tests / 20 suites PASS**, including 31 DFMEA, 29 CP and 15 project-history tests (overlap full count).
- **Frontend production build/TypeScript PASS; 17 focused tests PASS**: 6 DFMEA, 5 CP, 6 lineage. Scoped DFMEA lint clean. Nonfatal MUI barrel/large chunk warnings remain.
- `backend/scripts/verify-controlled-engineering.cjs` real configured DB PASS: save/stale conflict, correction, segregated approval, locks, full forks, safe source review/idempotency/manual preservation, phase histories, admin/project protected deletion, approved activation, isolation and SQL guards. All synthetic records rolled back; no test tenant remains.
- Additive migration `20261019190000_controlled_engineering_documents` applied; six migrations current. No legacy reset/deletion. Read-only audit: zero cross-project analysis/CP links; **11 sampling-default candidates** need human review, unchanged.
- Actual browser author→reviewer return→author correction→password-confirmed approver workflow completed for both modules. Approved documents read only. DFMEA1.1 retained 30 analyses/planning; CP1.1 pre-launch retained105 lines/source baseline, old1.0 remained approved. Genuine downloaded XLSX retained all30/105 rows and Unicode. Keyboard submission/results and320px layouts passed. Lineage displayed105 controls/3 operations and honest no-PFMEA state. Trial/reference and missing-document states checked.
- Actual adapter HTML independently rendered with official WeasyPrint70.0: DFMEA30 rows/6 pages; CP105 rows/37 pages. Row identities/final fields/Unicode retained; all-page geometry within margins, oversized continuation text exact. Customer-specific form acceptance is separate.
- Browser QA tenant/manifest cleaned with exact marker validation; first cleanup rolled back on FK restriction, fixed dependency order then cleanup passed. Global reservations untouched. QA127 session signed out and tab closed; user's localhost session preserved. Temporary responsive harness removed.

## Runtime and reproduction
Existing Vite :5173 retained. Final built API :3000 running hidden task-owned PID **36308**, node `dist/main.js`; verify current port/process identity before restarting. Ignored stdout/stderr under backend/local-api.*. REDIS_URL absent means existing inert development queues.
Run backend `npm run build`, `npm test -- --runInBand`; frontend `npm run build` plus node --test for controlPlanDocument.test.mjs, dfmea-diagrams.test.cjs, linkageData.test.mjs. DB rollback/audit/browser fixture/render scripts documented in backend/scripts/README.md. Never log credentials or environments.
Proof artifacts under `C:/Users/Palak/.codex/visualizations/2026/10/18/01a15026-af67-7522-87fc-f43cefdb4e2b`: control-plan-final-browser.png, dfmea-approved-browser.png, 320px screenshots and qa-prints/ PDFs.

## Remaining gates / next harness
1. Authorized complete independent rating/AP references and expected1000 results; no reconstructed tables or conformity claims.
2. Human review of11 preserved sampling candidates and ambiguous legacy design mappings. Customer extensions unconfigured.
3. Deployment/customer-form acceptance separate. FMEA-MSR/reverse CP sync excluded by scope.
Read this and AGENTS; use graphify query before discovery. README sync and Graphify refreshed. Known optional missing tree_sitter_sql warning; TS/TSX graph works. Preserve generated graph output. Future releases need their own confirmed version. README synchronization rerun for publication; prior implementation verification remains valid because final release edits only change versions/documentation.
