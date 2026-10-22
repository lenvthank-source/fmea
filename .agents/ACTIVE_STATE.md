# FMEApex — active handoff

Updated 2026-10-23. Workspace F:/proj-fmea. Release **v0.13.0** (0.13.0), user-confirmed for Git publication. Target `origin/main`; compare its SHA with HEAD when resuming. Release ledger: `versions/v0.13.0.md`. Hosted deployment completion is separate.

## Latest request — consolidated Control Plan evolution (completed)

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
