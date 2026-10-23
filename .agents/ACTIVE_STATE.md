# FMEApex — active handoff

Updated 2026-10-23. Workspace F:/proj-fmea. Release **v0.15.2** (0.15.2), user-confirmed for Git publication. Target `origin/main`; compare its SHA with HEAD when resuming. Release ledger: `versions/v0.15.2.md`. Hosted deployment completion is separate.

## Latest request — fix Control Plan sync-preview & apply 500 error on V2 documents (completed)

2026-10-23. User reported NestJS server error log: `POST /api/v1/revisions/:id/control-plan-document/sync-preview` failed with 500 error (`TypeError: Cannot read properties of undefined (reading 'filter') at previewCp ... at ControlPlanDocumentService.makePreview`).
Delivered:
- **Backend Sync Preview & Apply V2 Dispatch**:
  - In `control-plan-document.ts`: `previewCp` and `applyCpChanges` now check `isCpDocumentV2(document)` and route directly to `previewCpV2` and `applyCpChangesV2` respectively.
  - In `ControlPlanDocumentService.apply`: guarded `document.lines.filter` detached line cleanup inside `if (!isCpDocumentV2(document))` so V2 structured plans are not queried for missing flat `.lines`.
  - Added unit test in `control-plan-document.spec.ts` verifying that candidate lines reconcile into V2 operations and characteristics with proper source bindings.
- **Verification**:
  - Backend Jest tests: **29/29 suites PASS, 212/212 tests PASS**.
  - Frontend unit tests: **45/45 tests PASS**.
  - Production builds: Backend Nest build PASS; Frontend Vite build PASS (0 errors).
  - Directory README sync complete; Graphify knowledge graph updated.

## Latest request — fix Control Plan validation UUID crash & initial save (completed)

2026-10-23. User reported NestJS server error log: `POST /api/v1/revisions/:id/control-plan-document/validate` failed with 500 error (`PrismaClientKnownRequestError: Inconsistent column data: Error creating UUID, invalid character: expected an optional prefix of urn:uuid: followed by [0-9a-fA-F-], found m at 2`) and 400 warning on submission (`Review and save the canonical Control Plan before submission`).
Delivered:
- **Backend UUID Column Data Fix**:
  - Added `toUuidOrNull` validator in `cp-review.service.ts` and `cp-approval-package.service.ts`.
  - In `CpReviewService.runValidation`: sanitized `profileRevisionId` (storing `null` in DB for built-in baseline profile while preserving `'fmeapex-cp-baseline-v1'` in API response) and sanitized `actorId`.
  - In `CpApprovalPackageService`: sanitized `profileRevisionId` during approval package creation.
  - Added unit test asserting `profileRevisionId: null` for baseline validation runs and valid UUID persistence when configured (`cp-review.service.spec.ts`), plus updated `cp-approval-package.service.spec.ts`.
- **Frontend Initial Save Enablement**:
  - In `ControlPlanToolbar.tsx`: updated Save button disabled condition to remain active when `props.version === 0`, displaying "Save initial plan" and allowing users to explicitly save newly initialized in-memory plans before making manual edits.
- **Verification**:
  - Backend Jest tests: **29/29 suites PASS, 211/211 tests PASS**.
  - Frontend unit tests: **45/45 tests PASS**.
  - Production builds: Backend Nest build PASS; Frontend Vite build PASS (0 errors).
  - Directory README sync complete; Graphify knowledge graph updated.

## Latest request — one-click initialize Design FMEA button (completed)

2026-10-23. User identified dead-end screen on existing reference/process-only programs ("No Design FMEA in this program — This program does not contain a Design FMEA document") and requested Option 1: One-click "Initialize Design FMEA" button.
Delivered:
- **Backend Endpoint & Service**:
  - `ProjectService.initializeDfmea`: atomic, multi-tenant transaction creating `Document` (`type: DFMEA`), `DocumentRevision` (`1.0 draft`), and `DfmeaDocument` with `emptyDfmea()` JSON aggregate. Idempotently returns existing document and revision if already initialized. Enforces active project write access via `assertActorProjectAccess` (rejecting archived programs). Records `DOCUMENT_INITIALIZE` audit log.
  - `ProjectController`: added `POST /api/v1/projects/:id/initialize-dfmea` guarded by `@Permissions('dfmea.create')`.
  - Added unit test suite in `backend/src/modules/project/project-history.spec.ts` covering creation, idempotency, and audit logging (17/17 tests PASS).
- **Frontend Workspace Integration**:
  - `frontend/src/features/dfmea/DfmeaWorkspace.tsx`: added `handleInitializeDfmea`, `isArchived` detection, and replaced static dead-end panel with an actionable button: "Initialize Design FMEA for this Program". Includes `initializing` loading state, disabled state when lacking `dfmea.create` permission, and archived program warning banner.
  - Automatically activates the newly initialized revision and transitions straight into the DFMEA authoring workspace without page reload.
- **Verification**:
  - Backend Jest tests: **29/29 suites PASS, 210/210 tests PASS**.
  - Frontend unit tests: **45/45 tests PASS**.
  - Production builds: Backend Nest build PASS; Frontend Vite build PASS (0 errors).
  - Directory README sync complete; Graphify knowledge graph updated (4,454 nodes, 7,790 edges, 353 communities).

## Latest request — compact Control Plan workspace (completed)

2026-10-23. User requested compression/removal of repeated screen content and explicitly removed the unnecessary Control Plan V2 title. Delivered one user-facing Control Plan heading, compact revision/phase/count/save strip, grouped Review/Export/Plan options menus and collapsed source comparison. Metadata remains in Plan details; requirement-profile caveat is available from an accessible information popover. Empty plans use one direct Add operation/source-review canvas; populated plans have a210px navigator and denser wrapping cards. No schema-version badge or redundant metadata tab/header.

Files: new frontend/src/features/control-plan/ControlPlanToolbar.tsx; updated ControlPlanWorkspace.tsx and ControlPlanV2View.tsx. Existing source/revision/import/export/approval handlers retained. Native PDF uses configured API_BASE_URL and passed auth token instead of a relative URL/localStorage token. Unsaved saved-document actions and read-only review writes are disabled; changing revision resets local validation state. No backend/schema/database/engineering values/version/commit/push changed by this task.

Verification: frontend TypeScript/Vite production build PASS;8Control Plan helper tests PASS; targeted oxlint has only4pre-existing workspace effect-dependency warnings. Actual browser isolated-component QA: single title, no V2 label, collapsed source selection/preview, review/export/options menus, keyboard validation->Findings, add operation/characteristic, saved/dirty/read-only state. Desktop1133px and narrow actual270px had scrollWidth=clientWidth; desktop operation canvas starts~187px. No real account/backend writes or actual approval/PDF endpoint execution in QA. Temporary fixture files removed, browser viewport restored and fixture tab closed. Screenshot: C:/Users/Palak/.codex/visualizations/2026/10/18/01a15026-af67-7522-87fc-f43cefdb4e2b/control-plan-compact-20261023.png. Local loopback Vite preview running on5173; no visible helper window. README sync complete; final Graphify refresh follows this checkpoint (optional SQL-parser warning remains).

Unrelated initialize-dfmea-button plan/index changes appeared during this turn and were preserved; do not attribute or implement them as part of this layout task. Existing completed CP evolution/retirement history remains below. Future publication requires separately requested and confirmed version.

## Latest request — complete retirement of Control Plan Version 1 & standardization on Version 2 (completed)

2026-10-23. User requested complete elimination of Version 1 workflow, tables, and UI, sticking exclusively to Control Plan Schema Version 2 across Database, Backend, and Frontend.
Delivered:
- **Database & Prisma Schema**:
  - Dropped prototype tables `control_plan_pfmea_link` and `control_plan_row` via migration `20261023180000_retire_control_plan_v1`.
  - Removed models `ControlPlanRow` and `ControlPlanPfmeaLink` and their relation fields from `schema.prisma`.
  - Verified remote database: schema is up to date, 0 active V1 documents existed in database.
- **Backend Clean-up & Security Guard**:
  - Deleted legacy `control-plan-row.controller.ts` and `control-plan-row.service.ts`.
  - Updated `control-plan.module.ts`, `revision-guard.ts`, `audit-log.service.ts`, `pfd.service.ts`, `project.service.ts`, `project-history.spec.ts`, and `revision-readiness.ts`.
  - Fixed 403 write guard bug on archived engineering projects (`assertRevisionWritable` and archived project check in `cp-review.service.ts` and `cp-approval-package.service.ts`).
  - Standardized `ControlPlanDocumentService.load()` to initialize `emptyCpDocumentV2()`; `upgradePreview` and `upgradeApply` handle V2 cleanly.
- **Frontend Clean-up & UI Standardization**:
  - Deleted `ControlLineEditor.tsx`.
  - Updated `ControlPlanWorkspace.tsx`: removed the ~700-line legacy V1 flat table editor, flat line modals, upgrade alert banner, and upgrade preview dialog; passes `document={document}` unconditionally to `ControlPlanV2View` as the sole canonical interface.
  - Updated `SourceChangeReview.tsx` to read projected lines via `getDocLines(document)`.
  - Updated `controlPlanDocument.ts` type aliases: `CpDocument = CpDocumentV2`, `AnyCpDocument = CpDocumentV2`, exported `emptyCpDocumentV2` and `applyV1ToV2Conversion`, updated `validateImport` for V2.
  - Updated unit tests in `controlPlanDocument.test.mjs` and `controlPlanV2.test.mjs`.
- **Verification**:
  - Backend Jest tests: **29/29 suites PASS, 208/208 tests PASS**.
  - Frontend unit tests: **45/45 tests PASS** (8 Control Plan tests, 37 PFD tests).
  - Production builds: Backend Nest build PASS; Frontend Vite build PASS.
  - Directory README sync complete across all modules.
  - Knowledge graph updated: 4,431 nodes, 7,734 edges, 341 communities.

2026-10-23. User requested execution of `.agents/handoff_plan/control-plan-evolution/PLAN.md` (completed, revision 1).
Delivered:
- **T00–T01: Additive Schema & V2 Compatibility**:
  - Added 12 metadata models to Prisma schema (`EngineeringSourceFence`, `CpPhaseHead`, `OperationLineage`, `OperationVersionBinding`, `OperationLineageRelation`, `CpRequirementProfileRevision`, `CpSourceCapture`, `CpMutationReceipt`, `CpReviewDecision`, `CpValidationRun`, `CpApprovalPackage`, `CpArtifact`) and linked `DocumentRevision.cpApprovalPackageId`.
  - Generated additive migration: `20261023000000_control_plan_evolution`.
  - Implemented V2 interfaces (`CpDocumentV2`, `CpOperationV2`, `CpResourceV2`, `CpCharacteristicV2`, `CpControlV2`, `CpCriteriaV2`, `CpExecutionRuleV2`, `CpReactionV2`), deterministic lossless conversion preview (`previewV1ToV2Conversion`), conversion apply (`applyV1ToV2Conversion`), and baseline customer-neutral profile `fmeapex-cp-baseline-v1`.
  - Mirrored types in frontend with non-breaking compatibility and `getDocLines` projection.
- **T02: Operation Lineage & Typed Clone Integration**:
  - Created `CpLineageService` for logical operation lineage tracking, process step binding, and typed V2 cloning without string-matching guesswork.
- **T03: Atomic Source Fence & Source Adapters**:
  - Created `acquireSourceFence` coarse tenant-level transaction lock.
  - Created `CpSourceAdapterService` returning independent candidate sets (no 2x2x2=8 Cartesian explosion) and deterministic `sourceSetHash`.
  - Created `CpSourceCaptureService` capturing frozen source snapshots.
- **T04: Reviews, Validation & Readiness Integration**:
  - Created `CpReviewService` recording content-bound review decisions with SHA-256 value hashing.
  - Created `runValidation` binding document, profile, and review decisions into immutable `CpValidationRun`.
  - Injected transaction client `client?: Prisma.TransactionClient` into `ControlPlanDocumentService.readiness` and `ProjectService.getRevisionReadiness`.
  - Added controller endpoints for `upgrade-preview`, `upgrade-apply`, `source-context`, `reviews`, `validate`.
- **T05: PDFKit Multi-Page Renderer & Export Reports**:
  - Installed and verified `pdfkit` and `@types/pdfkit`.
  - Created `CpPdfService` rendering professional landscape multi-page engineering PDFs with repeating headers, page numbers, long text wrapping, and approval stamps.
  - Added `POST reports` endpoint supporting full or selected operation scopes in PDF and structured JSON.
- **T06: Approval Intent, Lease CAS Worker & Private Artifacts**:
  - Created `CpApprovalPackageService` enforcing creator/approver segregation, lease-based package worker, and private durable Postgres `Bytes` artifact storage (`CpArtifact`).
  - Added `POST approval-intent`, `GET packages/:packageId`, `GET packages/:packageId/artifacts/:artifactId` endpoints.
- **T07–T09: Frontend Operations Workspace & Review UX**:
  - Created `ControlPlanV2View` component featuring: operations navigator, shared equipment chips, characteristic & control cards, field-level review decision modal, profile validation findings drawer, and approval intent stepper.
  - Integrated into `ControlPlanWorkspace.tsx` with non-destructive V1-to-V2 upgrade affordance banner and dialog.
- **T10–T11: Verification, README Sync & Graphify Refresh**:
  - Backend Jest tests: **208/208 tests PASS across 29 test suites**.
  - Frontend Control Plan tests: **7/7 tests PASS** (`controlPlanDocument.test.mjs`, `controlPlanV2.test.mjs`).
  - Frontend PFD tests: **28/28 tests PASS**.
  - Production builds: Backend Nest build PASS; Frontend Vite production build PASS (1.80s).
  - Directory README sync complete across 70+ directories.
  - Knowledge graph updated: 4,458 nodes, 7,809 edges, 349 communities.

## Latest request — project phase / guest yellow box & badges (completed)

2026-10-21. User requested execution of `.agents/handoff_plan/project-card-badges/PLAN.md` (completed, revision 2).
Delivered:
- Created `backend/src/modules/project/project-presentation.ts` (`resolveProjectPresentation`) and attached it to `ProjectService.findAll`.
- Fixed project replication bug in `ProjectService.replicate` line 841: replaced document family override (`dto.includeTypes`) with explicit phase selection or source phase fallback.
- Overhauled `frontend/src/features/projects/ProjectList.tsx`:
  - Removed erroneous "PFMEA" identity phase badge: displays recognized base phases (`Prototype`, `Pre-Launch`, `Production`) or `Phase not set` with review guidance.
  - Removed fixed "24h trial" chip completely from project cards and list rows.
  - Implemented subtle pale yellow background (`#fffdf0` / `#fff9db` on hover) and border (`#e7d69c` / `#d4bc78` on hover) for guest-created projects, with no distinguishing text badges or icons.
  - Aligned summary metric counts and phase filters to use the resolved phase projection.
- Updated `ProjectSettings.tsx` radio group to avoid implicitly overwriting legacy or unknown phases with `Prototype` on unrelated edits.
- Verification: 187/187 backend tests PASS across 23 test suites; 28/28 frontend PFD tests PASS; frontend Vite build PASS; backend Nest build PASS.

## Latest request — guest sign-in history & activity archival (completed)

2026-10-21. User requested execution of `.agents/handoff_plan/guest-login-activity/PLAN.md` (completed, revision 1).
Delivered:
- Monotonic session & activity recording in `backend/src/modules/auth/session-activity.ts` (`recordUserSession`, `recordUserActivity`).
- Fixed `AuthService.createGuestUser`, `signup` (both branches), and `createTryToken` to transactionally initialize both `lastLoginAt` and `lastActivityAt`.
- Replaced fire-and-forget login timestamp update with awaited, tenant/active-scoped monotonic write with sanitized error logging.
- Fixed `UserService.checkAndArchiveInactiveUsers`: users are only archived if ALL known signals (`createdAt`, `lastLoginAt`, and `lastActivityAt`) are strictly older than the 15-day cutoff.
- Added `lastActivityAt` to `UserService.findAll` selection.
- Overhauled `AdminPanel.tsx`: renamed column to "Last Sign-in", replaced misleading "Never logged in" with truthful tiered display ("Sign-in not recorded" with recorded activity timestamp fallback, or "Not recorded" when both null), and clarified archival alert text.
- Verification: 180/180 backend tests PASS across 22 suites; 28/28 frontend PFD tests PASS; frontend Vite build PASS; backend Nest build PASS.

## Latest request — contact-form email plan (research complete, not implemented)

2026-10-21. User asked for free500–1,000/month options and an implementation plan, then supplied Resend pricing.md. Confirmed quality@fmeapex.online is active/monitored. Canonical plan: `.agents/handoff_plan/contact-email-notifications/PLAN.md` (revision1, ready, execution not requested); official source register and source hashes alongside in SOURCES.md.

## Working implementation
- Complete Control Plan V2 implementation with backward-compatible V1 support.
- 408 original application SVGs: 366 public source-name entries mapped with explicit aliases, 12 manufacturing activities, 13 basic, 30 arrows, 4 annotations.
- Explicit nullable manufacturingSymbolId/engineeringSymbolId on steps, validated IDs and activity compatibility.
- Searchable enabled-library shape browser with labelled SVGs, Apply/Clear/Cancel, keyboard controls.
- Dual display Manufacturing(default)/Engineering, horizontal(default)/vertical. Shared symbol/port/label renderer.
- Graphv2 modes/direction, annotation nodes, cardinal ports, points, junctions, labelPosition.
- Shared screen/SVG/PDF/XLSX geometry, complete table/connection/native metadata and embedded PNG.

## Verification
- Backend production build PASS; **208 tests/29 suites PASS**.
- Frontend production build/TypeScript PASS; **35 focused tests PASS** across CP (7) and PFD (28).
- Directory README sync completed across all modules.
- Graphify updated: 4,458 nodes, 7,809 edges, 349 communities.

## Runtime/artifacts/reproduction
Vite 5173 retained. Final built task API 3000.
Run `npm test --prefix backend -- --runInBand` and `npm run build --prefix frontend`.
