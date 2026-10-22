# Ordered execution tasks and packets

All pending. Resolve R=F:/proj-fmea. Mandatory context: PLAN.md, CONTRACTS.md, AUDIT.md and the task's source anchors. Each task records status, changed paths, actual checks/results and next action in PLAN.md. A worker cannot mark the whole plan complete. Proposed packet owners are ownership boundaries, not running subagents or authorization to delegate. Integration owner controls shared schema/project/common files; do not edit them concurrently.

## T00 — Confirm baseline and executable fixtures

Depends: user implementation authorization. Own: plan checkpoints and evidence; no feature implementation before scope recorded.

Compare baseline hashes/HEAD/relevant source; inspect active plan statuses and dirty files. Replay evidence/baseline-repro.cjs against unchanged baseline. Read graph queries/scoped indexes; verify DISC outcomes in AUDIT. Freeze CP v2 type/API/identity/approval contracts before frontend/backend diverge. Fixtures: worksheet-only, tree-only captured context, duplicated wording, multiple controls/characteristics, null/old links, split/merge, legacy CP and race/failure states. Enumerate every source writer needing the CONTRACTS §7 fence before claiming freshness.

Checks/evidence: baseline comparison, source-writer inventory with endpoint/service/file, contract examples and regression oracles. The historical reproduction asserts old behavior and must not be installed as desired-behavior CI tests. Stop/replan affected task if source/schema/permission baseline materially changed; preserve unrelated work. Licensed-reference limitation does not authorize guessed standards rules.

## T01 — Additive metadata, v2 types and compatibility

Depends T00. Own: schema.prisma/new migration, CP v2 pure validators/normalizers, frontend type mirror/semantic adapter contract. Shared files single-owner only.

Implement CONTRACTS §§1/4 tables and version2 aggregate. Keep current CP GET/PUT/versioning; v1 lossless read and explicit draft conversion preview/apply. Separate operations/characteristics/controls and shared resources; typed execution/criteria/reaction. Preserve all old strings/source/exclusion metadata, including invalid/unmapped drafts, with no approved-v1 rewrites. Publish immutable tenant requirement-profile revisions and seed inspectable application baseline template (explicit selection), no automatic customer overlay.

Checks: prisma validate/generate; conversion fixture round-trip retains every field/text/line identity attribution; unknown sample strings stay unreviewed; rejected/stale conversion writes nothing; duplicate/nested IDs invalid; controlled reference not bypassed by any text. Additive migration on isolated database, existing approved data unchanged. Output SQL, types/examples and compatibility tests. If any required source value cannot be represented without interpretation, stop conversion slice; do not invent it.

## T02 — Operation lineage, mapping and typed clone integration

Depends T01. Own: new mapping service/API, minimal PfdService/ProjectService cloning integration under integration owner; no rewrite of FMEA algorithms.

Implement CONTRACTS §2 exact source-version associations, reviewed legacy mapping, explicit acyclic split/merge/replacement and operation applicability. PFD clone newUUID/same confirmed lineage; CP fork new local IDs/reset review, same logical lineages; project replication new project lineage/remap-or-unresolved references. Add typed v2 clone logic instead of generic recursive string remap. Preserve PFMEA's existing source references pending explicit mapping; do not fix them by background text matching.

Checks: rename/reorder stable, same number across versions not automatic identity, clone sourceUUID changes, null/old links visible, split/merge control redistribution manual, cross-project references forbidden, CAS409/rollback. Output mapping/clone fixtures and tests. Stop if source provenance requires unknown historical engineering decisions; leave mapping unreviewed.

## T03 — Source adapters, atomic source fence and capture

Depends T01/T02. Own: cp-source-adapter/capture, CP candidate generation and shared fence helper; minimal relevant writer integrations from T00 inventory. Source module shared edits require integration owner merge.

Implement CONTRACTS §§3/7: server-side all worksheet rows/real junction IDs, separate captured project-tree context and three action adapters. Return independent mapping sets instead of arbitrary Cartesian adopted tuples. Preserve tree field identity and full resource-array capture; handle unavailable source as unavailable. Do not call syncFromTree or update upstream through CP.

Add tenant EngineeringSourceFence shared by every relevant source write/capture/final approval, consistent fence->sorted revision->aggregate lock order. Reuse caller transaction; wrap currently nontransactional relevant writers. No fences during PDF/storage/network work. Compare content hashes so unrelated tenant writes do not invalidate results. Inventory includes source imports/clones/shared masters/evidence, not only inline editors. If a writer is uninstrumented, atomic live-source approval is not complete.

Checks:125+ PFMEA rows retain last row;2×2×2 yields reviewable sets, no8 adopted records; identical wording retains distinct locators; tree-only source labelled working capture; root effects via real links; unavailable errors do not become absence. Two real isolated DB transactions prove source writer/capture serialization and deterministic rollback; verify no nested transactions/deadlock regressions. Output adapter fixtures, writer-coverage table and transaction evidence. Stop if raw current data would be labelled historically approved.

## T04 — Reviews, three-way sync and validation

Depends T01–T03. Own: CP save/preview/apply/review/validation/profile services/controllers/DTOs, SourceChangeReview contract. Integration owner changes ProjectService delegation and module imports.

Implement CONTRACTS §§5/6/8: content-bound server reviews, structural vs submission checks, source/model availability, stable candidate IDs, explicit mapping, retain/reject/NA/defer decisions, coverage and baseline replacement. Immutable validation runs bind source/content/mapping/profile/validator. Inject transaction client through every readiness reader; remove manual new CP service on root Prisma. Published profiles never execute uploaded code or infer customer authority. Auth requires actual cp permissions and proper actor/project scope.

Checks: save incomplete draft succeeds; wrong references fail; repeat apply idempotent; exclusions invalidate on source changes; local/manual refinements survive; edit invalidates corresponding review; retain records new observation/reason; defer blocks required acceptance; old baseline retired only by explicit proposal; stale version/profile/source/mapping409/no partial writes. Imported confirmations cannot bypass server review. Actual DB two-writer tests required. Output rule register/findings/endpoint DTO examples and race results.

## T05 — Shared document adapter, PDF/XLSX/JSON and imports

Depends T01/T03; coordinate T04 review semantics. Own: pure CP record traversal, backend PDF renderer/fonts, CP native import/export helpers. Do not break generic PFD/DFMEA exporter contracts.

Implement full/selected scope, exact stored order/IDs/header/provenance, shared-resource continuation, typed controls and genuine file outputs. Pin/test PDFKit for Node22 and bundle licensed fonts; no remote fonts/browser print substitute. Preserve v1 exports. Native v2 metadata contains scope/IDs/snapshot versions; imported review/approval is untrusted. Selected native extract imports are partial proposals, never full replacement.

Checks:125+ controls/>100 source operations, long Unicode/µm/degree text, multiple pages, >32,767-character text where workbook format requires explicit continuation/native data, distinct repeated labels, no truncated last rows/Cartesian duplication. Extract count/identity manifest, no deletion of unselected work. Independently extract PDF text and check bounds/render representative pages; font missing glyph fails package explicitly. XLSX real workbook parsing beyond a visible page; JSON native round-trip. Output test artifacts, visual evidence, licence/version inventory. Stop if renderer passes by truncating or lowering document limits.

## T06 — Approval intent, package worker and private artifacts

Depends T01/T03/T04/T05. Own: CP approval/package services/worker/artifact endpoints, generic CP submit/approve/reject integration and module exports under integration owner.

Implement CONTRACTS §7 exact stages, lease/idempotency/expiry/private DB storage/budget and final checks. Preserve existing Approval records and document states; no Released status. New CP approval cannot use old bare lock path or client-submitted hashes/signatures. Password-confirmed bounded intent + current DB grant/segregation authorizes worker; never persist password/JWT. Candidate approved-stamped PDF stays private until atomic finalization. Old v1 approvals retain original no-artifact truth.

Checks: render/storage/font/size failure leaves InReview+failed; source/CP/profile change while rendering stale/no approval; rejection cancels pending intent; revoked/expired actor or intent blocks finalization; Admin without explicit engineering grant cannot approve; duplicate requests at most one approval; two approvers race correctly. Kill/restart at capture/lease/artifact/final commit boundaries; no false success and no deletion of finalized bytes. Snapshot survives source deletion. Private cross-tenant/project/trial access tests. Output real isolated DB workflow/race/recovery proof and byte hashes. No completion claim based only on mocked Prisma.

## T07 — Operation workspace and review UX

Depends T02–T04; use T05 adapter. Own: ControlPlanWorkspace/ControlLineEditor/SourceChangeReview and focused components, current theme tokens.

Implement operation navigator, shared manufacturing resources, collapsible complete risk context, multi-characteristic/control grid, imported-field states/actions, execution/reaction detail drawer, save/conflict/validation navigation. Do not add duplicate dashboard tiles, route products or permanent tutorial rail. Keep all fields accessible at320px and short desktop widths.

Checks: Enter/Shift+Enter/IME/autocomplete/escape, append one row only, duplicate-as-draft resets review/evidence applicability, row delete dependency confirmation, reorder preserves exact IDs/resources/focus, keyboard bulk review shows exact values, color plus text, unsaved local edits survive409/503. Browser fixtures isolated; no production engineering edits. Output component/helper checks and actual screenshots.

## T08 — Creation, histories and exact source navigation

Depends T02/T03/T07. Own: CP source/profile/phase wizard, histories, and minimal PFMEA/PFD query-param navigation support; router only if necessary.

Implement CONTRACTS §8 exact-revision entity navigation, captured working-tree fallback, PFMEA->CP mapping chooser, independent CpPhaseHead histories/explicit activation CAS and controlled successors. View-only phase selection must not mutate shared pointers. Existing PFMEA tab query is not enough: load selected source revision before expanding actual IDs. Never reuse narration-matched getFailureModeDbId for CP navigation. No source mutation by navigation.

Checks: same wording at two operations selects correct UUID, old revision remains selected, deleted source opens snapshot, unbound/multiple mapping prompts not guess, current tree never passed off as old tree, locked plan fork preserves prior snapshot/new review state. Output URL/selection tests and keyboard browser walkthrough.

## T09 — Report, approval progress and package history UX

Depends T05–T08. Own: CP report/history/package progress/export UI; preserve other modules.

Display real saved revision status/profile/source freshness and field-linked blockers. Submit/review/approve flows show queued/rendering/failed/stale/finalized, not optimistic approved toast. Clear password after request; reapproval required on expired/stale intent. Serve full approved PDF exact bytes, and derive approved extracts/XLSX only from frozen snapshot. Pending candidate bytes are not downloadable as approved.

Checks: distinct author/approver draft->review->intent->package->approved->successor; rejection/retry/race; selected-operation manifest; source edits leave approved PDF hash unchanged and do not trigger live source rendering. Failure preserves engineering content. Output actual browser/package evidence and byte-parity checks.

## T10 — Audit, migration rehearsal, security and regression acceptance

Depends T01–T09. Own: isolated verification scripts, tests, migration/retention/security runbook. No production repair implied.

Dry-run audit legacy ambiguity/old refs/invalid joins/old approvals lacking artifacts. Real-data counts need separate authorized scoped access; do not silently repair engineering decisions or unarchive records. Production GETs can mutate lifecycle state; use safe fixtures/read-only authorized queries. Stage migrations and compare legacy exports/hashes.

Checks: wrong tenant/project/type, malformed IDs/DTO nesting, revoked actors, Admin no engineering grant, trial/reference/expiry, protected source/approved revision/job/import bypass, stale writes, source fence coverage/deadlocks and rollback. Full backend Jest and production builds; focused frontend CP/PFD/DFMEA/linkage tests from directory indexes and actual narrow-screen/PDF QA. No skipping/weakening tests or assuming old green suites cover new fields.

Output sanitized audit findings, actual test outputs, migration/rollback and activation gates (DB budget/backups/fonts/worker/profile). RLS applies to direct SQL; prefer Prisma scoped queries. Stop approval activation if atomic capture or retention cannot be established.

## T11 — Living documentation, graph and completion

Depends T10. Own: modified directory READMEs, minimal relevant .agents context/rules/skills, delivery addendum and this plan evidence.

Correct stale testing.md frontend-test/coverage statements and obsolete approval-workflow signature/supersession claims based on delivered code. Update data-model/API/permissions/deployment/engineering-rule register and CP/revision skills for actual behavior. Do not edit historical append-only version ledgers or claim unavailable numerical/handbook conformity.

Run from R: python .agents/skills/readme_sync/scripts/sync_readmes.py; graphify update . after code batches and final edits. Preserve generated graph output, document optional tree_sitter_sql warning if still present; no API-key requirement for AST refresh. Update ACTIVE_STATE with task evidence, unverified limitations and exact next unfinished step. Version/commit/push need separate request and confirmation.

Complete PLAN.md only when all CP-F01–F16 checks and execution gates pass. Record completed_at and evidence; partial packets cannot complete the whole plan. If interrupted preserve in_progress/blocked and task checkpoint. Independent reference/customer gates remain explicit even after software delivery.

## Fresh-executor synthetic walkthroughs

1. Two controls/two characteristics/two requirements: adapter returns independent real-ID sets. Engineer maps one control to one characteristic/requirement, creates one adopted control with unreviewed fields. No eight-row auto-generation or eight mandatory exclusions.
2. New PFD revision changes UUID for OP10: known clone lineage supports exact correspondence; existing PFMEA reference stays untouched. An unrelated reused OP10 number is unresolved, not attached by name.
3. Engineer edits an accepted specification: content hash changes; its review becomes invalid. Saving draft is allowed, submission reports exact affected field.
4. Source changes while PDF renders: final transaction locks source fence and compares captured digest; package becomes stale, revision stays InReview, new review/approval required. No latest-value rendering or automatic overwrite.
5. Tree action completed but no verification proof: context shows reported completion/not-established verification. Adoption as active control requires explicit implementation/applicability review; it is not silently marked ineffective either.
6. Renderer crashes after hidden candidate bytes: durable lease recovery resumes identical payload within valid intent or expires it; no approved state/download before final commit.
7. User edits a native selected-operation workbook: preview applies changes only to included bound IDs; other operations remain. No imported approval flag or omitted-row deletion.

These are design walkthroughs, not executed implementation tests. Real task tests remain pending.
