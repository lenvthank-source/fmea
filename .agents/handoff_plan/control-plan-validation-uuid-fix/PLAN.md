---
plan_id: control-plan-validation-uuid-fix
revision: 1
status: completed
created_at: "2026-10-23"
updated_at: "2026-10-23"
completed_at: "2026-10-23"
execution_authorization: user_approved
---

# Plan: Fix Control Plan Validation UUID Crash & Canonical Save

## 1. Scope & Objective
Resolve the PostgreSQL `500 Internal Server Error` on `POST /api/v1/revisions/:id/control-plan-document/validate` caused by passing a string constant (`profile.key = 'fmeapex-cp-baseline-v1'`) into UUID column `profile_revision_id` in `cp_validation_run`. In addition, allow newly initialized in-memory Control Plans (`version === 0`) to be explicitly persisted via "Save initial plan" to unblock revision submission readiness.

## 2. Tasks
- [x] **T01**: Add UUID format sanitization helper (`toUuidOrNull`) in `cp-review.service.ts` and set `profileRevisionId: dbProfileRevisionId` (null for baseline profile) and `actorId: dbActorId` when inserting `cpValidationRun`.
- [x] **T02**: Sanitize `profileRevisionId` in `cp-approval-package.service.ts` to prevent invalid non-UUID propagation into `cpApprovalPackage`.
- [x] **T03**: Update `ControlPlanToolbar.tsx` to enable saving initial canonical plans (`props.version === 0`) even when `!props.dirty`, displaying "Save initial plan".
- [x] **T04**: Add unit tests in `cp-review.service.spec.ts` and update `cp-approval-package.service.spec.ts`.
- [x] **T05**: Run verification suites (`npm --prefix backend test`, `node --test frontend/src/features/**/*.test.mjs`, `npm --prefix frontend run build`, `npm --prefix backend run build`).
- [x] **T06**: Update directory READMEs and knowledge graph (`graphify update .`).

## 3. Verification Evidence
- Targeted backend tests: `cp-review.service.spec.ts` and `cp-approval-package.service.spec.ts` (8/8 passed).
- Full backend suite: `npm --prefix backend test` (29/29 suites passed, 211/211 tests passed).
- Frontend tests: `node --test frontend/src/features/**/*.test.mjs` (45/45 passed).
- Production builds: Backend Nest build PASS; Frontend Vite build PASS (0 errors).
- Directory READMEs synchronized and Graphify knowledge graph updated.
