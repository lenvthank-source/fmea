# Data Model — Prisma 5.20 (41 models)

Source of truth: `backend/prisma/schema.prisma:1`.

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
