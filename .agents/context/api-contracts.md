# API Contracts — /api/v1 (global prefix `main.ts:33`)

Auth: `Authorization: Bearer <access 15m>`; refresh via `POST /auth/refresh {refresh_token}` → `{access_token, refresh_token}`; reuse allowed till `7d` (stateless). Inactivity guard `auth.service:437` rejects refresh if `now-lastActivityAt>72h`. 401 → `frontend/src/features/auth/AuthContext.tsx:136` fetch interceptor retries once with refresh else `logout() → /`.

Pagination: `{data:[T], total, page, limit}` → `frontend/src/lib/pagination.ts:1 unwrapPaginated`. Errors: JSON `{message, statusCode}` via `lib/api parseApiError` + `ToastProvider getToastSeverity` (warning 6s for locked/draft, error 7s).

## Auth (all @Public except /me)
- `POST /auth/signup {email,password,subdomain,tenantName?,name}` → `{user,tenant,access_token,refresh_token}`
- `POST /auth/login {email,password,subdomain}` → `{user,tenant,session{ id,email,name,tenantId,roles,permissions,isGuest }, access_token, refresh_token}` (`auth.service:393` returns session to avoid extra /me RTT; `lastActivityAt` bumped fire-and-forget)
- `POST /auth/guest` → `{user,tenant,isGuest:true, access_token, refresh_token}`
- `POST /auth/refresh {refresh_token}` → tokens (72h check, `lastActivityAt` bump)
- `GET /auth/me` Bearer → `UserSession{ id,email,name,tenantId,roles,permissions,isGuest }` (throttled bump >5min)
- `GET /auth/users` tenant users list (per `action.service` assignment)
- `GET /health` public keep-alive (`AuthContext:179` every 5min visible-only)

## Projects & documents
- `GET /projects?page&limit&search&status` paginated ILIKE OR search, indexes `[tenantId,status,createdAt]` (`project.service:35`, `schema:165`)
- `POST /projects` body includes quality headers (`Project` 30 fields, `documentTypes[]`); creates 4 `Document` of type + initial `DocumentRevision draft 1.0` via transaction deep clone.
- `GET /projects/:id` & `GET /projects/:id/documents` → documents with `currentRevisionId`
- `POST /projects/:id/replicate {targetSubdomain?}` deep clone with `stepIdMap` remap.

## Revisions (workflow 21 CFR Part 11)
- `POST /projects/:id/revisions {changeDesc, revisionNumber? X.Y, summary?, effectiveFrom?, effectiveTo?}` → deep clone per-doc `processSteps/pfmeaRows(7 junctions)/controlPlanRows` (`project.service:780`), `project.revisionNumber=nextRev` (`1.9→1.10` via split), audit `create`. Regex `^\d+\.\d+$` (`742,1320`).
- `GET /projects/:id/revisions` → `[DocumentRevision _count + creator + document]` desc `createdAt` (not paginated)
- `GET /projects/:id/revisions/:revId` single
- `GET /projects/admin/revisions` tenant-wide (admin)
- `PATCH /projects/revisions/:revId {revisionNumber?, summary?, changeDescription?, effectiveFrom?, effectiveTo?}` — only if `!lockedAt && status==draft` & `effectiveTo>=effectiveFrom`
- `DELETE /projects/revisions/:revId` (admin: also bypass) — blocks if `active||locked||last` except admin route
- `POST /projects/revisions/:revId/activate` → pointer swap `document.currentRevisionId=revId`, `project.revisionNumber=rev.revisionNumber`, audit `activate` (direct rollback; clone-on-activate backlog)
- `POST /projects/revisions/:revId/submit` `draft→in_review` sets `submittedAt`
- `POST /projects/revisions/:revId/approve {password,comment}` segregation `createdById!=userId`, `bcrypt.compare`, sets `approvedAt+lockedAt`, creates `Approval approved`, audit `approve`
- `POST /projects/revisions/:revId/reject {comment}` segregation → `rejected`, `Approval rejected`
- Guard: `RevisionGuard` + `assertRevisionWritable` (`project.service:1631`) block writes when `lockedAt!=null || status!='draft'` — applied to all `pfd.service`, `pfmea-row`, `control-plan-row` mutations.
- `GET /revisions/:revId/audit-logs` & `GET /audit-logs?entityType&entityId` — `audit_log` partitioned append-only.

## PFD
- `GET /revisions/:id/pfd-steps` → `[ProcessStep]` ordered `sequenceOrder`
- `POST /revisions/:id/pfd-steps {stepNumber,name,stepType,incomingVariation[],specialCharacteristics,flowIcons,machinesEquipmentDocs[],desiredOutcome,processCharacteristics:String}` guarded
- `POST /revisions/:id/pfd-steps/batch dto[]` transactional batch with auto `OP<10*n>` dedup
- `POST /revisions/:id/import-pfd-steps {sourceRevisionId}` cross-revision clone (used by PFMEA import prompt)
- `PATCH /pfd-steps/:stepId` inline fields; `DELETE /pfd-steps/:stepId` hard orphan `isOrphaned` if master
- `POST /revisions/:id/pfd-steps/reorder {orderedStepIds}`

## PFMEA
- `GET /revisions/:id/pfmea-rows?page&limit` paginated
- `POST /revisions/:id/pfmea-rows {processStepId?, workElementName?, functions[], requirements[], failureModes[], effects[], causes[], controls[], characteristics[], S/O/D[1..10], ap read-only?}` — writes junctions via transaction
- `PATCH /pfmea-rows/:rowId` & `DELETE /pfmea-rows/:rowId` cascade junctions + links
- `POST /revisions/:id/sync-from-tree` derives rows from `structureFunction/Failure` tree.

## Control Plan
- `GET/POST /revisions/:id/control-plan-rows`, `PATCH/DELETE /control-plan-rows/:rowId`, `POST /revisions/:id/sync` + `sync-pfd` — bidirectional field mapping `detection→measurement_method`.

## Structure linkage (PFMEA tree ↔ grid)
- `POST /structure-functions` `{projectId,parentType,parentId,narration,location}` + `DELETE /structure-functions/:id` cascade failures→links→actions
- `POST /structure-failures` `{functionId, role, narration, S/O/D, controls}` + `DELETE /structure-failures/:id` cascade
- `GET /failure-modes/:id/linkage-candidates` → `{mode, effects[], causes[], linkedEffectIds, linkedCauseIds}` (7.3.2 tree)
- `POST /failure-modes/:id/link {effectIds[],causeIds[]}` upsert `FailureLink`
- `DELETE /failure-links/:id` → cascade `LinkAction`, clear `isLinked`
- `POST/DELETE /link-actions/:id` leaf.

## Actions (Corrective)
- `GET/POST /projects/:id/actions`, `PATCH/DELETE /actions/:id`, `POST /actions/:id/link-fmea` with before/after ap, `POST /actions/:id/evidence` R2 presigned 50MB, `GET /actions/evidence/:id`.

## Rating config (Simple Groups)
- `GET /rating-scales` @Public `{severity,occurrence,detection:[{value1..10,label,criteria,color}]}` seeds on first call
- `PUT /rating-scales/:scale/:value` @Permissions('admin.config') `dto {label?,criteria?,color?}` upsert.

## Other
- `POST /repository/packages` guest contributions (pending→approved via `AdminPanel`)
- `POST /auth/feedback` auto-extracted URL/title/browser context.
- Health: `GET /health` returns `{status, uptime}`.
