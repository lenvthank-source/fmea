# Control Plan implementation contracts

Authority: proposed implementation design for PLAN.md revision1, not existing endpoints/types. Existing behavior is in AUDIT.md. All new names below are proposed. Resolve R = F:/proj-fmea. No implementation is authorized by this file alone.

## 1. Stable keys and additive metadata

Keep Document, DocumentRevision, ControlPlanDocument.version/data as the editable aggregate. Existing canonical GET/PUT/fork/sync endpoints remain. Add metadata rather than replacing legacy analyses or creating a SQL table per conceptual content entity:

| Proposed model | Minimum content/invariants |
|---|---|
| EngineeringSourceFence | tenantId primary key, generation; transaction lock used by relevant source writers/capture/final approval; not an authorization grant |
| CpPhaseHead | tenantId/documentId/phase unique, currentRevisionId/version; independent phase activation, existing Document pointer remains default entry |
| OperationLineage | UUID, tenantId, projectId, createdBy/At; scoped logical operation; not name-derived |
| OperationVersionBinding | UUID, tenantId/projectId, lineageId, sourceRevisionId, processStepId, provenance/actor/reason; unique processStepId; verify step belongs to that source revision/project |
| OperationLineageRelation | UUID/groupId, scoped predecessor/successor IDs, split/merge/replacement kind, actor/reason; explicit acyclic reviewed relations |
| CpRequirementProfileRevision | tenantId/key/version, draft/published, content JSON/hash, rule-source metadata, author/publisher/At; published immutable |
| CpSourceCapture | UUID, tenantId/projectId/cpRevisionId, selected source revision or project-working-scope, snapshot JSON/hash, capturedBy/At; immutable after creation; source UUIDs stored as locators, not cascading FKs |
| CpMutationReceipt | tenant/project/cpRevisionId/actor/requestId unique, payload hash, resultVersion/entity IDs; transactional idempotency receipt for sync/review retries |
| CpReviewDecision | UUID, cpRevisionId, observedDocumentVersion, target kind/ID/path, valueHash/sourceSetHash/mappingHash, decision/reason, actor/time; append-only service API |
| CpValidationRun | UUID, cpRevisionId, document/source/mapping/profile/validator hashes, findings JSON, actor/time; immutable |
| CpApprovalPackage | UUID, tenant/project/revision, expectedVersion, frozen snapshot/hash, capture/profile/validation references, approval intent actor/comment/decisionAt, state/error/attempt/lease fields, finalizedAt; durable worker state |
| CpArtifact | UUID, tenant/project/packageId, kind/MIME/name, Bytes, size/hash, renderer/template/font versions; private and immutable; no public URL |

Use existing Approval and AuditLog for final decisions/history, not competing CPApproval/CPAuditEvent models. Add optional DocumentRevision.cpApprovalPackageId (unique, restrictive relation) for finalized package. Approved package/artifact/profile/review history must not cascade when an upstream source record is deleted. Existing protected project-history policies still control project/revision deletion; do not create a new unrestricted deletion route.

All new models have tenant/project indexes where applicable, UUID/snake_case conventions and scoped relation validation. A FK/JSON UUID alone does not establish tenant access. Published profiles are per tenant; seed an inspectable application template, require explicit profile selection, then persist a tenant-scoped immutable revision. Do not select by customer text or edit published rules in place.

Review and artifact metadata are not accepted through normal document PUT. Artifact bytes/hashes/approver IDs are server-owned. No database-wide cryptographic immutability or regulatory signature guarantee is claimed; API/DB-role restrictions and backups must match deployment reality.

Phase histories: keep one existing CONTROL_PLAN Document but introduce CpPhaseHead for prototype/pre-launch/production. UI phase selection is read-only and resolves that head; it does not update global pointers. Explicit CP activation updates only that phase head plus the legacy Document.currentRevisionId default entry, with expected head version and scoped revision/type checks. Fork updates only the target phase head, preserving the other phases. Existing revisionNumber uniqueness remains per Document (X.Y); do not invent duplicate1.0 per phase without changing the version contract. Legacy approved records with unknown phase do not acquire guessed phase heads. Active does not mean approved. Add phase/head projection to the existing CP revision list/context, not a new CP product.

## 2. Operation mapping and clone behavior

Identity tuple: source revision UUID + concrete ProcessStep UUID. Operation number/name are display values. CP operation has a new revision-local UUID and lineageId plus reviewed source bindings. A binding records its selected PFD baseline operation and any PFMEA operation/row relationships. All selected source revisions must belong to the same tenant/project and correct document types.

If a PFMEA row's step belongs to an older revision, preserve it and expose that concrete scope. Exact linkedPfdStepId may locate an older PFD operation; it does not prove correspondence with the selected new baseline. Confirm via known clone lineage or explicit reviewed mapping. Null/unavailable/multiple mappings stay unresolved. Names/numbers may appear as suggestions with no automatic acceptance. Do not introduce source changes merely to make CP validation pass.

Same-project PFD cloning creates new ProcessStep UUIDs and graph references as now, and adds new version bindings carrying the confirmed lineage in the same clone transaction. For previously unbound source steps, assign new lineage only to that specific record; no historical name-based backfill. A CP fork creates new revision-local operation/characteristic/control/resource IDs, retains logical lineages and attribution, preserves source baseline selection, resets acceptance/applicability decisions and package/validation/approval state. It never changes old package bytes.

Cross-project replication creates new project lineage IDs and new CP IDs. Remap concrete IDs only through the actual clone map; unresolved external links become review findings. Retain original provenance as captured source attribution, not an active cross-project FK. Do not reuse the generic recursive string remapper for v2 content: it can alter unrelated equal strings and lacks typed review/package rules. Add a typed v2 clone adapter; retain v1 compatibility.

Split: new successor lineages and explicit predecessor→successors group. Merge: predecessor lineages→new successor lineage. Engineer reviews how characteristics/controls/resources apply to each successor; no automatic duplication or deduplication. Source removal preserves captured history and requires applicability/replacement decision. Source renumber/reorder within a confirmed lineage changes display/sequence only. A reused number never proves continuity. Prevent cycles and cross-project lineage edges; require expected mapping digest on changes.

## 3. Source adapter and locator contract

Use server query code, not report HTML or frontend pages. Primary worksheet adapter loads every row for the explicitly selected PFMEA revision with actual processStep, function/requirement/failure/effect/cause/control/characteristic junctions. Preserve junction membership; the current schema does not provide per-cause control or per-control characteristic pairing merely because records share a row.

A source bundle returns: selected scope and status, captureId/hash/time, operations, analysis records with real IDs/relationships, independent control/characteristic/requirement candidate sets, action/evidence metadata, availability/findings, and locators. Engineer chooses valid relationships. PFD contributes operation/resources/context, not fabricated characteristics/controls. Desired outcomes/process-characteristic text remain candidate text, not automatic specifications. Multiple symbols are context, not duplicate operations.

Locator shape:

    { model: 'PFD_STEP'|'PFMEA_ROW'|'WORKSHEET_CONTROL'|'TREE_FAILURE_FIELD'
             |'TREE_LINK_ACTION'|'WORKSHEET_ACTION_FIELDS'|'TRACKER_ACTION',
      sourceRevisionId: UUID|null, captureId: UUID,
      entityId: UUID, parentIds: UUID[], fieldPath: string,
      sourceScope: 'revision'|'captured_project_context',
      capturedValueHash: SHA256 }

Capture stores the actual value and related identity/context. fieldPath uses validated allowed fields, not arbitrary object traversal/SQL. Multiple adopted sources remain multiple locators, not overwritten by one preferred source. Missing live sources fall back to captured records. Hash is a change detector, never a permanent control ID. Tree control identity is StructureFailure UUID + exact currentControlPrevention/currentControlDetection field path; tree controls have no separate control UUID.

Tree context is captured separately under project scope: associate functions to exact source step UUID, or to work-element parentId using the existing stepUUID::workElementName convention. Resource/work-element strings are not stable master IDs. Preserve ambiguous parent associations for explicit mapping. Root effects are associated through actual FailureLink records, not every project failure. Identical text never joins identities. Label this source Captured working tree context even when a selected PFMEA revision is approved. A tree-only operation may be reviewed/adopted into CP through an explicit source binding and exception to the default approved-baseline policy; no implicit claim of historical PFMEA approval.

Resource JSON arrays: retain original array, entry index and captured array hash; create independent CP resource UUIDs. Reordering/source changes must not retarget a CP resource by index or equal wording. No measurement-vs-manufacturing classification is inferred from a label; engineer classifies imported entries.

Action adapters:
- TREE_LINK_ACTION: preserve failureLinkId, action ID, status, completionDate, revised ratings/remarks; verificationState=not_established unless independently supported. No invented tracker evidence.
- WORKSHEET_ACTION_FIELDS: preserve row ID and exact fields; completion/actionTaken text is reported implementation only, not verification.
- TRACKER_ACTION: preserve Action ID, links, owner, real states, before/after evaluations and evidence IDs. verified/closed represents that workflow's verification; engineer still reviews CP applicability.

Expose sourceStatus, implementationReported, verificationState/basis, evidenceReferences and cpApplicabilityReview separately. Unknown proof is not ineffectiveness. Proposed actions may appear in context but cannot be adopted as active controls until implementation/applicability evidence and required reviews exist.

Unavailable source adapters return availability=unavailable + reason, not successful empty arrays. Structural invalid/cross-project references block adoption. No CP code may call syncFromTree to refresh data or mutate upstream controls/actions.

## 4. V2 document and lossless conversion

Persist schemaVersion=2 with:

    config: {phase, safeLaunch, requirementProfileRevisionId, applicability,
             sourceExceptionJustification}
    header: frozen actual strings
    sourceBaselines: selected revision IDs/types + captured scopes
    operations: [{id, lineageId|null, order, number, name,
      sourceBindings, resources:[{id,kind,text,controlledReference?,sources}],
      applicability, characteristics:[{id,number,kind,description,
        criteria, classification, sources,
        controls:[{id,controlType,method,evaluationMethod,measurementEquipment,
          executionRule,reaction,responsibility,recordReference,
          implementation,sourceBindings,legacyFields}]}]}]
    sourceExclusions, legacyUnmappedContent

CP identity: a new CP number is unique across CONTROL_PLAN Documents within the tenant; the same number may recur across phases/revisions of the same Document. Explicit authorized header corrections retain their prior values in existing snapshots; do not impose permanent number reservation without a separate requirement. Validate trimmed exact identifier equality under the source fence before first publication; legacy duplicates are audit findings requiring explicit correction, not auto-renumbered. Header snapshots retain their recorded number. Per-Document revision numbers remain X.Y.

Criteria: kind=numeric|attribute|controlled_reference|legacy_text|unspecified; exact specification/tolerance strings, unit, optional explicitly entered decimal-string limits and reference. Do not auto-parse legacy compound text, convert units, round limits or split tolerances. Unknown is blank/null/unspecified, never zero. Classifications retain code, scheme and source/applicability; no universal SC/CC assignment.

Execution rule is a discriminated union:
- unspecified: draft unknown.
- count: positive integer quantity, explicit frequency/trigger, coverage and applicable volume basis.
- all_units: no invented numeric sample; explicit coverage and execution trigger/summary.
- event: explicit event/trigger, quantity only if engineer defines it, coverage.
- continuous: explicit monitored scope/system and execution summary; no fake sample count.
- controlled_reference: document/system identity + revision/version or captured managed configuration, direct locator, sufficient summary, applicable approval/review.

These are product data modes, not claimed exhaustive handbook categories. Reject contradictory supplied fields structurally; missing applicable details are submission findings. V1 sampleSize/frequency/volumeBasis stay verbatim legacy fields until explicitly converted. No “100% means1” or guessed hourly/default basis. Free text systemReference alone is not a verified exception.

Reaction: trigger, executable actions or versioned controlled instruction, responsible function/owner, containment and restart criteria when applicable, evidence/record references. Justified not-applicable decisions are possible under the profile; do not invent containment/restart rules. Pass-through, error-proofing confirmation, rework/repair, alternate controls, Safe Launch entry/exit/additional controls retain explicit scope. An alternate is documented when applicable/existing, not universally invented.

V1 conversion preview: preserve original bytes/hash; each old line becomes a distinct characteristic/control representation under its exact operation identity without guessed grouping by names. Shared resources may be consolidated only after explicit review if repeated free-text resources disagree. Preserve every old cpFields/source/sourceState/exclusion/header/config value in legacyFields/provenance. Existing sourceState does not create accepted review events. Invalid/blank operation IDs go to unassigned draft section; never discard rows. V1 approved remains read-only. PUT v2 conversion must match expectedVersion and confirmed preview hash; rejected conversion changes nothing.

Duplicate as draft: fresh nested IDs, same text/provenance attribution, unreviewed applicability/reviews and no new claim of verified evidence. Manual content has no fabricated source. Review metadata is server-derived, not a trusted document boolean. Maximum legacy line/body limits stay explicit; do not lower20,000 legacy line support to conceal renderer/design gaps. Large documents may fail a separately stated packaging resource cap without losing content.

## 5. Review and sync state

Server events: accept, modify_accept, reject, not_applicable, retain_current, defer. Require reasons for rejection/NA/retention/modified adoption and profile-required warning dispositions. Values and source set hashes bind decisions. Review actor needs cp.edit; formal technical review/approval remains separate. Bulk review shows exact fields/values and creates individual bound decisions. No wildcard “all reviewed forever” flag.

An edit changes its value hash and invalidates its applicable review; adding/removing source bindings also invalidates it. Ancestor changes invalidate operation acceptance where applicability/mapping/resource scope changed; they do not indiscriminately erase unrelated engineering edits. Server GET returns computed review states from valid matching events. Imported confirmations are attribution only until server review.

Sync-preview accepts selected source baseline/capture and desired mapping revision. Return expectedVersion, canonical documentHash, sourceSetHash, mappingHash, changes and unresolved mapping groups. sourceSetHash covers relevant values AND membership/order/IDs/status/version, not only CP-visible strings. It must detect deletions/joins and action/evidence changes relevant to adopted controls.

Apply decisions target a known change ID, optional field path, selected relationship mapping, resolution and reason. Recompute snapshot/digests inside one scoped transaction; stale CP/source/profile/mapping ->409, no mutation. Existing route DTO keeps legacy fields for v1; v2 extends explicit schema version and hashes, with nested DTO validation and no any-shaped decisions.

For new source add: deliberate mapping creates candidate field values in imported/unreviewed state; adopting values and confirming applicability are separate actions even if UI offers a combined explicit review. For changed source: baseline/current/source three-way comparison; preserve local fields unless explicitly resolved. Retain_current records newly observed source while preserving local content/reason. Defer remains pending. Rejected candidates remain reasoned exclusions bound to source fingerprint; changed source invalidates exclusion. Removed source: keep captured content, mark review pending; choose replacement/manual justification/NA explicitly, never delete CP automatically.

New revision source selection creates a baseline-replacement proposal, reviewed lineage mapping and diff. Confirm removes obsolete active coverage obligations but retains historical captures/exclusions. V2 apply/review requests carry requestId UUID. Inside the same authorized transaction/fence, CpMutationReceipt stores request payload hash, resultVersion and created entity IDs, unique by tenant/cpRevision/actor/requestId. A retry with the same ID/hash returns the committed receipt and current-version reload instruction without writing again; reused ID/different payload returns409. Receipts survive the revision history, not a guessed short retry window. Repeated apply with identical request/result is idempotent; stale changes return409 rather than duplicate lines. Manual rows/resources survive every preview/apply/cancel/failure.

## 6. Validation profile

Profile rule record: ID/classification/source edition+section/applicability/verification/reviewer+date/software implementation/severity. Initial customer-neutral fmeapex-cp-baseline-v1 uses explicit application policies and verified source summaries; no complete standards claim. Published revision content/code hash immutable. cp.profile.manage creates/publishes new versions; publish validates rule names against supported validator registry, not uploaded executable code/eval.

Findings include ruleId, category=blocker|warning|information, applicability and entity/field locator. Integrity checks are immediate; completeness on submission:
- explicit phase/scope/profile/CP identity and actual header identification;
- same-project valid source/mapping and covered operations or reviewed applicability exclusions;
- imported required fields accepted for their exact content/source;
- applicable characteristic criteria and executable control/evaluation/coverage/reaction/responsibility;
- no unresolved source conflicts or unimplemented proposed controls counted active;
- controlled references contain sufficient actual detail/summary and version identity;
- required customer approvals only for a configured, verified applicable overlay;
- approved selected source baselines by default, or recorded reviewed exception (product policy);
- applicable Safe Launch/alternate/rework/pass-through/error-proofing content without guessed values.

A neutral CP profile is not a customer certificate. Tree working captures require an explicit source exception when relied upon. Missing evidence blocks only where verification is relied upon/required by chosen profile; it does not universally imply ineffective controls.

ValidationRun identity = documentHash + sourceSetHash + mappingHash + profileRevision/hash + validatorVersion. Hash canonical sorted object keys; preserve order of semantic arrays; exclude capture UUIDs, job UUIDs, live URLs and volatile timestamps from semantic value hashes; include actual persistent source entity IDs and their membership. Manifest hashing excludes its own hash field to avoid self-reference. Findings/dispositions change when their input changes. Pass the caller's transaction client through every reader, not this.prisma from inside approval validation. No full-completeness gating on initial draft save.

## 7. Snapshot, approval and durable package state

### Consistent source fence

Existing project-tree/shared-control writers do not all lock source revisions. A serializable CP transaction alone must not be claimed to freeze them. Add EngineeringSourceFence per tenant as a deliberately coarse P0 concurrency primitive. Relevant source mutations acquire it inside the same transaction before revision/analysis locks; increment generation only when source content changes. Source capture/final approval acquire the same row lock and read all relied-upon values consistently. Project/tenant authorization still applies independently. All writers use deterministic fence -> sorted revision IDs -> aggregate lock ordering. Do not hold fences during rendering, downloads or network I/O.

Inventory every relevant path: PFD create/update/delete/batch/import/reorder/clone, PFMEA row CRUD/import/sync, structure function/failure/link/LinkAction CRUD, shared requirement/control/characteristic modifications, action states/evidence/reassessment, project header edits and source deletion/replication. Use shared helpers, not nested Prisma transactions. Writers to immutable captured artifacts need no source-content fence. Unrelated tenant activity must not invalidate CP approval: compare relied-upon content/membership hashes, not generation alone. The coarse fence trades write concurrency for correctness; performance validation is required. Narrower per-project fences are P1 only after shared-master membership semantics are proven.

Source-fence coverage is a completion gate. If any active writer can bypass it, do not claim atomic live-source freshness or finalize v2 approval through that path. This is a controlled integration change, not permission to rewrite FMEA methods or propagate controls automatically.

### Capture and submission

1. Save v2 draft with expectedVersion. Server stores authoring content, not trusted review booleans.
2. Submission transaction resolves actor/project/revision, takes source fence then target revision lock, computes complete source/mapping/profile hashes, validates current server review events, freezes header/source values/relationships and creates immutable submission snapshot/validation run. Sets InReview only on success; no rendering inside transaction.
3. Snapshot includes CP document, actual selected scope/header/phase, source records and memberships, tree capture scope/approval caveat, mapping/exclusion/review decisions, profile/rule metadata, source approval states/exceptions, and relied-upon implementation evidence. Record exact time and capture identity, not only transient links. Server-owned evidence bytes can be copied privately during package work; retained metadata references immutable bytes and hashes before finalization. Do not fetch arbitrary user URLs or bypass source/evidence authorization. Unavailable required evidence fails the package/review dependency explicitly.

### Approval intent and package pipeline

Existing CP approve entrypoint accepts password/comment plus expectedVersion, submissionSnapshotHash and validationRunId. Reuse password verification, active actor checks and creator/approver segregation. Add explicit DB engineering permission check even for Admin. Non-CP endpoint behavior stays unchanged. No normal request accepts actor IDs or approval status from the client.

- Short intent transaction locks fence/revision, validates InReview/submission hashes/freshness and permission. Create CpApprovalPackage with a real password-confirmed intent actor/comment/decisionAt, observed hashes and state=queued. Do NOT set revision approved/lockedAt yet. Return202 with packageId/state. Store neither password nor JWT.
- Intent is scoped to this exact revision/hash and approver and valid for10minutes (security/product policy). New engineering content always requires new review and password-confirmed intent. Existing client idempotency key + hash identifies retries; duplicate identical request returns the original package. A different password is never persisted in idempotency logs.
- DB worker is an in-process bounded Nest lifecycle component, independent of Redis. Claim a queued package with atomic state/lease-token CAS; one rendering slot per process,120-second lease, heartbeat30seconds, three attempts with5s/30s/120s backoff within intent validity. Clear interval on shutdown; recovery reclaims expired leases. Bounded poll interval5seconds and exponential idle backoff up to30seconds; timer does not keep a terminated test alive. The DB is the durable queue; server sleep may delay work and UI must show pending honestly.
- Worker only reads the frozen submission payload and intent metadata. It never pulls latest source values to improve the document. Render full PDF/JSON manifest and copy required server-owned evidence. Persist immutable artifacts with MIME/hash/size/version. Package state becomes ready only after all bytes/manifest references are durable and verifiable; missing fonts/storage/oversize yields failed with sanitized retry information. No partial package is downloadable as approved.
- Internal candidate PDF may contain the intended Approved stamp and actual recorded decisionAt/approver from the confirmed intent; keep it inaccessible until finalization succeeds. decisionAt means real confirmed decision intent, finalizedAt/DocumentRevision.approvedAt means successful finalization. Never invent a future timestamp or claim pending bytes are approved artifacts. The final manifest records both and exact hashes; PDF identifies its package and recorded decision time.
- Finalization runs a NEW short transaction: lock fence/revision, check lease token, ready state, unexpired intent, same active approver/explicit permission/segregation, unchanged document version/submission/profile/mapping, and recomputed relied-upon source digest plus evidence hashes. Revalidate against the same transaction client. Stale source/CP inputs -> stale package, no approval. If another approval won, return its committed result or409 without duplicate decisions.
- Only then create existing Approval with decidedAt=confirmed decisionAt, set approved/approvedAt/finalizedAt/lockedAt and cpApprovalPackageId, and append audit. These writes commit together. Worker authority comes from the bounded persisted authenticated intent plus current DB checks, not a fabricated JWT. No further user click is required while the same valid approval intent is completing.
- Success publishes the retained package for authorized reads. Source changes after this serial point are future impacts, never retroactive edits. Rejecting/reopening InReview cancels pending packages; finalization CAS prevents a rejected revision becoming approved.

States are package/job states: queued -> rendering -> ready -> finalized; failed/stale/cancelled are explicit. They are not new document lifecycle states and not Released. Failed retry only regenerates identical frozen payload under a valid intent; changed/expired intent requires explicit reapproval. Crash after bytes stored but before final transaction leaves hidden candidate bytes and a recoverable package; no false approval. Terminal candidate cleanup never deletes finalized artifacts.

### Private artifacts and budget

P0 CpArtifact Bytes is private durable Postgres storage, not existing public uploads. The50MiB package resource cap includes snapshot, PDF, manifest and copied evidence. Preflight/streamed size accounting fails explicitly; never discard fields/evidence to fit. On large documents keep draft data and state the exact resource failure. Do not lower existing document line limits silently. Record production capacity/backup/retention assumptions and benchmark isolated representative packages. R2 can become a later private immutable storage adapter; no current fallback is acceptable for approved packages.

Authorize every package/status/download lookup against tenant/project/revision and actual actor, including trial restrictions; no URL possession bypass. Serve correct MIME/disposition and safe filenames; no credentials or public URLs. Retained output survives upstream record deletion, not a promise to ignore authorized project-retention policy. Approved-history deletion remains protected by existing policy/restrictive references. Audit APIs have no update/delete; do not advertise tamper-proof storage unless actually provided.

## 8. Proposed API and navigation additions

Preserve existing /api/v1 prefixes and CP GET/PUT/fork/sync-preview/sync-apply. Return stored schemaVersion and capabilities/version explicitly. New typed nested DTOs reject unknown decision/locator paths, malformed IDs and conflicting versions. Proposed route suffixes below belong under `/revisions/:revisionId/control-plan-document`:

| Route | Permission/input/result |
|---|---|
| POST upgrade-preview | cp.edit; expectedVersion; lossless v1 conversion, warnings and preview hash; no mutation |
| POST upgrade-apply | cp.edit; expectedVersion/previewHash/explicit confirmation; transactionally create v2 |
| GET source-context | cp.view; selected baseline, operation binding; full scoped context/capture availability |
| POST mappings/preview, mappings/apply | cp.edit; explicit mapping decisions + expectedVersion/hash; no upstream changes |
| POST reviews | cp.edit; exact target IDs/paths/value/source/mapping hashes; append server decisions |
| POST validate | cp.view; observe saved version; returns immutable validationRun with locators |
| GET packages, packages/:packageId | cp.view; actual status/manifest, never unfinalized bytes as approved |
| GET packages/:packageId/artifacts/:artifactId | cp.view + scoped access; authorized retained bytes |
| POST reports | cp.view; saved revision/version, full or selected CP operation IDs, format; no new revision |

Existing workspace paths are `/app/projects/:projectId/control-plan`, `/app/projects/:projectId/pfmea` and `/app/projects/:projectId/pfd` (router.tsx:103–106). Source navigation uses the explicit query contract below; current PFMEA only consumes tab.

Existing `/projects/:id/revisions/:revId/submit|approve|reject` delegates v2 CP to the package workflow, and must enforce route project ID matches actual revision project. Approval returns202 while pending,200 only for already finalized idempotent result. Add profile routes under a scoped CP controller using cp.profile.manage. No client-supplied executable applicability code. All mutations document400 invalid,403 forbidden,404 missing/inaccessible,409 stale/protected and503 infrastructure outcomes without exposing other tenants.

Deep link query contract: CP uses revisionId and operationId; PFD/PFMEA source links use sourceRevisionId, entityId, model and captureId plus tab=table|tree. All IDs are validated, not interpolated into raw selectors. CP preserves its revisionId and operationId selection. Source UI accepts sourceRevisionId/entityId/model/captureId, validates project scope and loads that exact revision before expanding/highlighting real IDs. PFMEA currently reads only tab; extend narrowly without using narration-based getFailureModeDbId. For captured tree records, show captured context; do not pretend current tree is historical. Deleted/unavailable source opens snapshot. Restore CP focus on return. Unknown/multiple CP mapping opens a chooser; do not navigate first match.

Full vs selected export: explicit scope enum + operation UUID list. Server verifies membership and retained order. Manifest identifies included/omitted scope and parent package. An edited selected native workbook is a partial import proposal, not replacement of the whole document. No imported review/signature is trusted. App grid/PDF/XLSX share record traversal; PDF pagination may differ visually but not content/identity. Approved full PDF serves exact archived bytes; extracted PDF records derivation/template version and parent snapshot/hash.

## 9. Safety checklist for a fresh executor

Before completing a task, challenge: did a text/array match create a relationship; did unknown become absence; did approved source status replace a snapshot; did a hidden job bypass permission/version/fence; did a reviewed field change without invalidation; did a failed artifact still lock a revision; did a workbook extract remove unselected work; did a new clone inherit approvals; did site/customer labels imply authority? Each negative case must have a fixture/regression, not only comments.
