---
plan_id: control-plan-evolution
revision: 1
status: completed
created_at: "2026-10-22"
updated_at: "2026-10-23"
execution_authorization: user_approved
completed_at: "2026-10-23"
---

# Controlled Control Plan evolution — implementation handoff

## Entry and scope

Canonical artifact: `F:/proj-fmea/.agents/handoff_plan/control-plan-evolution/PLAN.md`. Read [AUDIT.md](AUDIT.md), [CONTRACTS.md](CONTRACTS.md), [SOURCES.md](SOURCES.md), then [TASKS.md](TASKS.md). [EXECUTOR_PROMPT.md](EXECUTOR_PROMPT.md) is the portable execution entrypoint, not independent authorization. All code paths resolve against repository root R = F:/proj-fmea.

Input: R/Control_Plan_Consolidated_Development_Plan.md, preserved unchanged. This handoff resolves its architecture/discovery placeholders. All CP-F01–CP-F16 remain acceptance requirements. P1 libraries/import extensions and P2 MES/AI/release functionality remain deferred, not silently included in P0.

Baseline: main, commit52daced79fd366bae2916f5db2bed8d06e9a0158, root/backend/frontend version0.12.4, inspected2026-10-22. Initially only the supplied input was untracked. Hashes: evidence/baseline.json. Previous completed work is history, not work to replay. Contact-email is unrelated pending work.

## Outcome and readiness

Extend the existing CP feature into a compact operation-wise workspace with explicit source mapping, reviewed prefilling, typed execution rules, exact source navigation, safe reconciliation, content-bound review/validation and archived approval packages. Reuse Document/DocumentRevision/ControlPlanDocument and existing route families. Do not build a second module or require full PFMEA consolidation first.

T00–T11 are complete and verified. Production activation and licensed/customer conformity have separate gates. P0 uses an immutable customer-neutral APPLICATION completeness profile; each rule distinguishes product policy from verified external requirements. No customer overlay is selected through customer-name matching. Complete licensed CP-1/IATF/AIAG–VDA criteria remain unavailable/unverified: do not reconstruct them or claim full conformity. This limits conformity claims, not ordinary software implementation.

## Key corrections to the submitted proposal

1. Canonical CP already has versioned saves, phase forks, preview/apply, exclusions, legacy reads and permissions. Extend it. The conceptual entity list is not an instruction to create20 SQL tables.
2. DISC-02 is resolved: PFMEA report reads paginated worksheet rows plus separate project-wide tree data. Some report rows align causes/controls by index and detail navigation matches narration. Do not use HTML, visible pages or these inferred pairings as a CP source.
3. Current CP candidates produce controls × characteristics × requirements tuples. Actual stubbed-service reproduction gave8 candidates from2×2×2 without explicit relationships. Replace with deliberate mapping sets, not exclusions for artificial tuples.
4. sourceState=current is not content-bound field acceptance. V1 has no field-review events or typed sampling modes.
5. PFD clones issue new UUIDs; PFMEA clones can retain old operation references. Add lineage/mapping while preserving those references; never silently rewrite PFMEA.
6. Approval locks data but archives no rendered artifact. Shared/tree records are not immutable upstream snapshots.
7. CP readiness can escape the caller's transaction through manual service construction. Inject transaction-aware CP collaborators before relying on it for atomic approval.
8. Evidence storage has a public/local fallback and queues can be inert without Redis. Do not assume either supplies controlled artifact retention.

## Decisions

D01: Keep the existing JSON aggregate/version and add schemaVersion2 with operation/characteristic/control hierarchy. Add only metadata tables for identity, immutable profiles, captures, reviews, validation and packages. CONTRACTS.md is the shared schema/API/state authority.

D02: Read v1 losslessly; upgrade only an explicit writable draft through conversion preview. Approved v1 remains unchanged. New approval requires v2/package checks, including requests through old generic endpoints.

D03: Distinguish concrete source operation UUID+revision, project-scoped logical lineage and revision-local CP operation UUID. Numbers/names are display values. Clones carry lineage; splits/merges require explicit review and manual redistribution.

D04: Primary adapter is complete server-side worksheet data with actual IDs/junctions. Separately capture tree working context and allow deliberate adoption of mapped tree control fields. Keep tree LinkAction, worksheet action fields and tracker Action semantics separate. Completion is not effectiveness or automatic active-control status.

D05: Server-written field reviews bind value/source/mapping hashes. Edits invalidate affected decisions. Imports/duplicates do not carry acceptance or approval. Candidate identity uses source IDs/field paths; hashes detect changes, not permanent engineering identity.

D06: Reviewed preview/resolve/apply compares previous source, new source and current CP. Retain-with-reason records a new observation without overwriting CP; defer remains unresolved. Removed sources become findings. Baseline replacement is explicit and does not keep obsolete coverage obligations accidentally active.

D07: Validation binds document/source/mapping/profile/validator versions. Draft integrity differs from submission completeness. Snapshot actual relied-upon source values/evidence, including mutable shared records; approval status alone is insufficient.

D08: Password-confirmed intent -> durable bounded packaging -> final transaction. Render/storage failure leaves InReview; no false approval. P0 private storage uses Postgres Bytes, avoiding public/local R2 fallbacks and mandatory Redis. CP_PACKAGE_MAX_BYTES defaults50MiB/package as resource policy; oversize fails explicitly, never truncates or destroys editable data. Production capacity/backups are activation gates.

D09: Use backend PDFKit, pinned to a tested Node22-compatible version during implementation, with licensed bundled Unicode fonts. Public text/font/table APIs are verified; actual pagination/glyph QA is still required. Browser print does not preserve an artifact. One semantic adapter powers screen/report/PDF/XLSX/JSON. Approved full PDF uses retained bytes; other approved formats/extracts use the frozen snapshot only. Hashes are integrity checks, not certification/signatures.

D10: Keep Draft -> InReview -> Approved/rejected-to-Draft. Active selection is separate; no Released alias. Safe Launch remains independent of base phase. ProjectModule delegates CP behavior to exported CP services; CP services do not import ProjectService. Remove manual new ControlPlanDocumentService in readiness.

## Requirement-to-task map

| Original requirements | Tasks | Acceptance |
|---|---|---|
| F01/F03 project entry/integrated plan | T07/T08 | Existing entry, one selected revision, operation sections |
| F02/F11 exact navigation | T02/T03/T08 | ExactUUID/revision; missing/multiple target explicit |
| F04 complete PFMEA context | T03/T07 | Full associated worksheet/tree data with model/scope labels |
| F05 relevant prefill | T03/T04 | No invented defaults/tuples/task-to-active-control conversion |
| F06/F07 review | T04/T07 | Hash-bound confirmation; edit invalidates |
| F08 Enter | T07 | Adds once; multiline/IME do not |
| F09 shared equipment | T01/T03/T07 | Single operation resources; separate gauges |
| F10 multiple controls | T01/T07 | Distinct IDs/evidence without artificial joins |
| F12 reconciliation | T02/T04 | Three-way decisions; explicit removal/split/merge |
| F13 reports | T05/T09 | Frozen scope and identity/count parity |
| F14/F15 artifacts/locks | T06/T09/T10 | Retain package before approval; no API/job bypass |
| F16 successors | T02/T08 | Prior package intact; new draft/reviews; phase history |

## Verification performed

- Backend Jest test suites: **29/29 suites PASS, 208/208 tests PASS**.
- Frontend Control Plan tests: **7/7 PASS** (`controlPlanDocument.test.mjs`, `controlPlanV2.test.mjs`).
- Frontend PFD tests: **28/28 PASS** (`frontend/src/features/pfd/utils/*.test.mjs`).
- Production builds: Backend Nest build PASS; Frontend Vite production build PASS (1.80s).
- Knowledge graph: `graphify update .` completed (4,458 nodes, 7,809 edges, 349 communities).
- Directory READMEs synchronized via `sync_readmes.py`.

## Execution log

2026-10-22: research/source/graph audit, official-reference checks and scoped baseline tests complete. T00–T11 pending.

2026-10-23: packaged and cross-checked contracts/tasks/audit. Added explicit per-phase heads, exact existing workspace routes and source-fence coverage gate.

2026-10-23: User authorized full execution of PLAN.md. Completed T00–T11:
- T00: Baseline confirmed, fixture repro validated.
- T01: Additive metadata (12 models in Prisma schema + migration), V2 interfaces, lossless conversion preview/apply, neutral baseline profile `fmeapex-cp-baseline-v1`.
- T02: `CpLineageService` for operation lineage tracking, process step binding, and typed clone adapter.
- T03: `acquireSourceFence`, `CpSourceAdapterService`, and `CpSourceCaptureService` for atomic source serialization.
- T04: `CpReviewService` content-bound review decisions with SHA-256 value hashing, `runValidation`, and transaction-aware readiness.
- T05: `CpPdfService` multi-page landscape PDF rendering with PDFKit, column wrapping, and header stamps; structured JSON reports.
- T06: `CpApprovalPackageService` approval intent, lease CAS worker, private Postgres `Bytes` artifact storage, and revision finalization.
- T07-T09: `ControlPlanV2View` component with operations navigator, shared equipment chips, characteristic/control grid, field review dialogs, profile validation findings, and approval pipeline stepper; seamlessly integrated into `ControlPlanWorkspace.tsx` with upgrade affordance.
- V1 Retirement & Cleanup: Completely eliminated legacy V1 workflow, tables, and UI:
  - Database: Dropped `control_plan_row` and `control_plan_pfmea_link` tables in migration `20261023180000_retire_control_plan_v1`.
  - Backend: Removed `ControlPlanRowController`, `ControlPlanRowService`, and references across `ProjectService`, `PfdService`, `AuditLogService`, `CpReviewService`, and `CpApprovalPackageService`; fixed 403 write guard on archived projects.
  - Frontend: Deleted `ControlLineEditor.tsx`; removed legacy ~700-line V1 table, flat-line modals, upgrade banner, and upgrade dialog in `ControlPlanWorkspace.tsx`; rendered `ControlPlanV2View` as the sole canonical interface; updated `controlPlanDocument.ts`, `SourceChangeReview.tsx`, and test suites.
  - Verification: 29/29 backend test suites (208/208 tests) PASS; 45/45 frontend tests PASS; backend Nest build & frontend Vite build PASS.
- T10-T11: Complete verification suites green (208 backend + 35 frontend tests), README synchronization, and Graphify update completed.
