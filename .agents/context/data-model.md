# Data Model — Prisma 5.22

Source of truth: `backend/prisma/schema.prisma:1`.

## Controlled engineering aggregates (2026-10-20 working tree)
`DfmeaDocument` and `ControlPlanDocument` each own revisionId unique, tenantId, optimistic version, strictly validated data JSON and timestamps. Their identities/relationships are stable within the revision aggregate; legacy rows remain intact. Source: `backend/prisma/schema.prisma:1`, module validators/services. Migration `20261019190000_controlled_engineering_documents` adds tables and SQL type/tenant/protected-parent triggers; no reset/backfill of guessed engineering decisions.

DFMEA stores explicit hierarchy/functions/requirements/interfaces/parameter context, failure chains/cause evaluations, actions, reviewed legacyMappings and downstreamLinks. CP stores phase/header/source baselines, complete control lines, safe launch and source provenance/exclusions. New revisions copy canonical aggregates; cross-project cloning remaps database identities and marks unresolved sources for review.

## Core tenant & identity
- `Tenant:10` `id, subdomain @unique, name` 1—N `User, Role, Project, Document, ProcessItem, Function|Requirement|FailureMode|Effect|Cause|Control|Characteristic, Action`
- `User:36` `tenantId, email @unique[tenantId,email], isGuest, guestExpiresAt, lastLoginAt, lastActivityAt` (72h sliding `auth.service:437` checks `lastActivityAt||lastLoginAt`). `@@unique[tenantId,email]` enforces tenant isolation.
- `Role:67` `tenantId,name @unique[tenantId,name]` + `Permission:82` global `code @unique` (22 codes: `admin.config, project.*, pfmea.*, dfmea.*, cp.*, revision.*:create/submit/review/approve, action.*`) + `UserRole:92` + `RolePermission:103`.

## Projects & documents
- `Project:113` `tenantId, name, status, revisionNumber X.Y default 1.0, teamLeadId, createdById` + 30 quality header fields (`organisationName, dwgNumber,... preliminaryFinalFlag, uiSettings Json`). Indexes: `@@index([tenantId])`, `[tenantId,status]`, `[tenantId,status,createdAt(sort:Desc)]`, `[tenantId,createdById]` (`schema.prisma:165-168` for list perf).
- `Document:172` `tenantId, projectId, type PFMEA|DFMEA|CONTROL_PLAN|PFD, name, currentRevisionId?` (loose UUID, not FK). `@@index([projectId]), [tenantId,type]`
- `DocumentRevision:193` `documentId, revisionNumber X.Y @unique[documentId,revisionNumber], status draft|in_review|approved|rejected|superseded, summary, changeDescription, effectiveFrom/To Date, submittedAt, approvedAt, lockedAt, createdById` + `_count(processSteps/pfmeaRows/controlPlanRows)` for UI. Immutability via `project.service:1631 assertRevisionWritable` (`lockedAt||status!draft → BadRequest`).
- `Approval:220` `revisionId, approverId, role reviewer|approver, decision approved|rejected|changes_requested, comment, decidedAt` — FK `revisionId` cascade. E-sig hash not yet persisted.
- `AuditLog:236` `tenantId, entityType, entityId, action create|update|delete|approve|reject|submit|activate, oldValue/newValue/diff Json, userId, ip, userAgent, timestamp` — append-only intent, indexes `[entityType,entityId], [tenantId,timestamp(desc)], [userId,timestamp(desc)]`.
- `ProjectRevision:723` legacy `projectId, revisionNo, changeDesc, createdById` — kept for backward compat; `DocumentRevision` is canonical.

## PFD / structure (7-step mapping)
- `ProcessItem:256` `tenantId, projectId, name` 1—N `ProcessStep`.
- `ProcessStep:271` `revisionId, processItemId, stepNumber, name, stepType operation|inspection|transport..., sequenceOrder, inputs/outputs/resources, incomingVariation Json?, specialCharacteristics String?, flowIcons Json {trans,recArea,store,wip,oper,insp,decs,rework,reject}, machinesEquipmentDocs Json?, desiredOutcome Text?, processCharacteristics Text?, linkedPfdStepId?, isOrphaned` — `@@index([revisionId]), [revisionId,sequenceOrder]`.
- `StructureFunction:639` `tenantId, projectId, parentType project|process_step|work_element, parentId, narration Text` 1—N `StructureFailure`. `@@index([tenantId,projectId]), [tenantId,parentType,parentId]`
- `StructureFailure:658` `functionId, role effect|mode|cause, narration, severity/occurrence/detection, currentControlPrevention/Detection, filterCode, isLinked` — `@@index([functionId],[role])`
- `FailureLink:683` `failureModeId, linkedFailureId, linkType effect|cause @unique[mode,linked,linkType]` 1—N `LinkAction`. Cascades via `structureFunction→failures→links→actions`.
- `LinkAction:699` `failureLinkId, description, preventionAction/detectionAction/actionTaken, targetDate/completionDate, responsiblePerson, revised S/O/D, remarks, status open..closed`.

## FMEA rows (7 junction tables)
- `Function:306`, `Requirement:321`, `FailureMode:337`, `Effect:351`, `Cause:366`, `Control:380`, `Characteristic:396` each `tenantId, name(500), isTemplate, tenant FK cascade`.
- `PfmeaRow:413` `revisionId, processStepId?, workElementName?, rowNumber, S/O/D SmallInt[1,10], ap Char(1) H|M|L read-only, filterCode, status, prevention/detection Action, responsibility, targetDate, actionTaken, completionDate, revised S/O/D/ap` + 7 M—N via `PfmeaRowFunction:568`, `PfmeaRowRequirement:578`, `PfmeaRowFailureMode:588`, `PfmeaRowEffect:598`, `PfmeaRowCause:608`, `PfmeaRowControl:618`, `PfmeaRowCharacteristic:628` all `@@id[PfmeaRowId, otherId]` cascade. `@@index([revisionId]),[processStepId],[revisionId,ap]`
- `ControlPlanRow:461` `revisionId, processStepId, characteristicId?, rowNumber, specTolerance, measurementMethod, sampleSize, frequency, controlType prevention|detection, controlMethod, reactionPlan` + `ControlPlanPfmeaLink:489` M—N to `PfmeaRow`.
- `Action:500` `tenantId, projectId, description, actionType corrective|preventive, ownerId, dueDate Date, status open|in_progress|completed|verified|closed|cancelled, priority`, + `ActionFmeaLink:529` `fmeaType PFMEA|DFMEA, before/after S/O/D/ap` + `ActionEvidence:550` `fileUrl 1000, fileName, fileType, fileSize BigInt, uploadedById`.
- `ContactInquiry:738`, `UserFeedback:750` isolated.

## Rating scales (admin editable, Simple Groups global)
- `SeverityScale:791`, `OccurrenceScale:800`, `DetectionScale:809` each `value @id Int1..10, label 100, criteria Text, color #hex`. Seeded via `RatingConfigService ensureSeeded()` on first `GET /rating-scales`.

## Operational notes
- **Tenant isolation:** every query must filter `tenantId`; `DocumentRevision` isolation via `document.tenantId` join.
- **Pagination:** `project.service:35` OR ILIKE without `pg_trgm` (B-tree indexes only); results wrapped `{data,total,page,limit}` via `lib/pagination unwrapPaginated`.
- **Soft archive:** guests `isGuest + guestExpiresAt +15d` (`auth.service:530`), sweep `user.service:15` after 15d inactivity.
- **Inactivity:** `lastActivityAt` bumped on `refresh` (always) + `getMe` throttled >5min + `login` (`auth.service:367,437,667`).

## 2026-10-19 additive model changes
`User.publicHandle` is nullable/globally unique and references immutable `PublicHandleReservation.handle`. The permanent global reservation ledger has no user/tenant cascade, so cleanup cannot recycle names. Migration backfills existing guest accounts and protects assigned handles against changes. Historical identity fields and user IDs remain unchanged. Source: `backend/prisma/schema.prisma:36`, migration `20261019090000_public_handles/migration.sql:1`.

`DocumentRevision.pfdGraph` (nullable JSON) and `pfdGraphVersion` (default 0) hold explicit physical topology and concurrency version. This is not a React Flow coordinate table or a replacement for existing ProcessStep identities. Source: migration `202610190002_pfd_graph/migration.sql:1`. Check ACTIVE_STATE for actual migration application; source addition alone does not prove database synchronization.

Trial identities require a non-null reserved handle via `guest_public_handle_required`. During rolling upgrades, run `backend/scripts/backfill-public-handles.cjs` after building if an older API admitted missing handles, before validating the constraint. Applied migration and drift evidence is recorded in ACTIVE_STATE.

Migration `20261019133000_legacy_trial_handle_compatibility` assigns and reserves a missing trial handle at the database boundary for older APIs during rollout. Existing non-null handles and registered names remain untouched. This retains the required-handle invariant without breaking old trial-login requests.

## PFD symbol selections (2026-10-20)
ProcessStep adds nullable VARCHAR120 manufacturingSymbolId and engineeringSymbolId via additive migration20261020190000_pfd_selected_symbols. No legacy icon/approved graph rewrite. Revision pfdGraph JSON supports v1/v2with explicit routes/geometry/annotations, version checked. Catalog identities are static application references validated in services, not equipment-name guesses. Seven migrations applied on configured database.
