---
plan_id: initialize-dfmea-button
revision: 1
status: completed
created_at: "2026-10-23"
updated_at: "2026-10-23"
completed_at: "2026-10-23"
execution_authorization: user_approved
---

# Plan: One-Click "Initialize Design FMEA" Button

## 1. Scope & Objective
Enable one-click initialization of Design FMEA (`DFMEA`) on programs that were created as Process-only programs (containing only `PFD`, `PFMEA`, and `CONTROL_PLAN`).

## 2. Tasks
- [x] **T01**: Add `initializeDfmea(actor, projectId)` method to `ProjectService` with transactional creation of `Document`, `DocumentRevision`, and `DfmeaDocument` with multi-tenant and archived project guards.
- [x] **T02**: Add `POST /api/v1/projects/:id/initialize-dfmea` endpoint to `ProjectController` with `@Permissions('dfmea.create')`.
- [x] **T03**: Update `DfmeaWorkspace.tsx` to display an active button **"Initialize Design FMEA for this Program"** when `missingDocument === true`, with loading, archived, and permission states.
- [x] **T04**: Add unit tests in backend and run all verification suites (`npm --prefix backend test`, `node --test frontend/src/features/**/*.test.mjs`, `npm --prefix frontend run build`, `npm --prefix backend run build`).
- [x] **T05**: Synchronize directory READMEs and update knowledge graph (`graphify update .`).

## 3. Verification Evidence
- Backend unit test: `src/modules/project/project-history.spec.ts` (17/17 passed, including `initializeDfmea` happy path and idempotency).
- Full backend suite: `npm --prefix backend test` (29/29 suites passed, 210/210 tests passed).
- Frontend tests: `node --test frontend/src/features/**/*.test.mjs` (45/45 passed).
- Builds: Frontend `tsc -b && vite build` and Backend `nest build` completed cleanly with 0 errors.
- Documentation & Graph: `sync_readmes.py` and `graphify update .` completed.
