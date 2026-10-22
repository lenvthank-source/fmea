# Codebase audit and corrections to the consolidated proposal

Inspected2026-10-22; packaged2026-10-23. R=F:/proj-fmea. Anchors below are inspected source locations, not claims about production data. Recheck after code drift. Graphify queries preceded source discovery; directory READMEs provided the scoped entrypoints. No production queries were used.

## Findings with evidence

| ID | Source anchor | Verified behavior / implication |
|---|---|---|
| E01 | backend/prisma/schema.prisma:196,229,242 | Existing DocumentRevision and canonical JSON DFMEA/CP aggregates; CP already exists. Use aggregate/version compatibility, not replacement. |
| E02 | backend/src/modules/control-plan/control-plan-document.controller.ts:51 | Existing GET/PUT/fork/sync-preview/sync-apply with cp permissions; inline decorated DTOs, nested decision objects need stronger validation. |
| E03 | control-plan-document.service.ts:80,175,434 | Legacy projection, phase fork, expectedVersion persistence, serializable write handling/audit already implemented. Full source header is saved in aggregate, not every older source header. |
| E04 | control-plan-document.service.ts:533–714 | PFD operation candidates and complete server-side PFMEA worksheet candidates. Control/characteristic/requirement loops form Cartesian tuples, warning but not establishing their real relationships. Explicit preview choices exist; the defect is not that every candidate is automatically approved. |
| E05 | control-plan-document.ts:294,344,447 | Three-way source comparison/application/readiness already exist. sourceState=current after accepted addition is not a separate field-level acceptance record. Sampling is free text; standardProfile is free text. |
| E06 | frontend/src/features/pfmea/PfmeaWorkspace.tsx:499,512,1662 | Report data comes from paginated pfmea-rows plus separately loaded project structure. max(causes,prevention, detection) subrows align by index; do not infer cause-control relationships. |
| E07 | backend/src/modules/pfmea/pfmea-row.service.ts:146–239,584 | findAllRows flattens actual junction entities; syncFromTree separately materializes project-tree analysis using legacy matching. CP must use server source queries and never trigger this mutation to refresh context. |
| E08 | PfmeaWorkspace.tsx:1425,1908,1934 | getFailureModeDbId uses first function/mode and narration matching for detail navigation. New CP navigation requires explicit entity IDs/revision/capture, not this fallback. |
| E09 | schema.prisma:306,450,676–757 | ProcessStep has nullable linkedPfdStepId. Tree has StructureFunction/StructureFailure/FailureLink/LinkAction; current controls are text on StructureFailure. Worksheet has separate FailureMode/Effect/Cause/Control IDs+junctions. No permanent operation-lineage ID. |
| E10 | project.service.ts:80,1331,1441–1500 | Generic aggregate copy recursively remaps strings; PFD revisions clone steps/newUUIDs; PFMEA rows retain existing processStepId. V2 needs typed clone rules and deliberate mapping, not assumed full isolation. |
| E11 | project.service.ts:2137,2188,2320; common/engineering-access.ts:57 | Revision guard/approval exists, but CP readiness constructs a service on root Prisma. Existing approve records status/lock/decision/audit, no PDF archive. Do not repeat obsolete docs' stronger signature claims. |
| E12 | action/action.service.ts:249–324; structure-linkage/structure-linkage.service.ts:496–559 | Tracker has ordered completion/verification/evidence/reassessment policy; LinkAction CRUD stores status/completion/revised ratings without the same effectiveness workflow. Keep adapter meanings separate. |
| E13 | frontend/src/features/control-plan/ControlPlanWorkspace.tsx:275,288,420 | Current operation grouping, complete selected-document export and shared approval endpoints can be extended. Groups include mutable number/name; v2 grouping must use CP operation ID. UI approval currently expects immediate success, so202 package progress needs explicit handling. |
| E14 | frontend/src/features/shared/engineeringDocumentExport.ts:23,104,148 | Genuine XLSX/native model helpers and browser print exist. Browser print is user output, not server-retained controlled PDF. Preserve generic PFD/DFMEA behavior. |
| E15 | action/r2.service.ts:17,52,89; queues/queues.module.ts:32 | Evidence service uses R2 or local public uploads; presigned URLs expire. Queues are inert without REDIS_URL. New CP retention must not silently inherit these limitations. |
| E16 | auth/guards/permission.guard.ts:32; common/engineering-access.ts | Admin bypasses permission guard. Scoped tenant/project/trial/revision checks exist but no proven site-level permission boundary. New CP engineering sign-off must check explicit approval authority. |
| E17 | backend/Dockerfile:2,30; backend/package.json; frontend/package.json | Node22-slim production, NestJS/Prisma, TypeScript React/MUI. Backend Jest available; frontend uses node:test helpers despite no npm test script. |
| E18 | .agents/rules/testing.md; docs/workflows/revision-approval.md | Testing coverage/no-frontend-tests text is stale. Older workflow asserts hashes/supersession guarantees not established by inspected approval code. Canonical AGENTS/current source and engineering register take precedence. |

## DISC task disposition

- DISC-01: architecture/reuse established by E01–E05/E13–E17. This is an existing-feature evolution.
- DISC-02: resolved by E06–E08. Report is worksheet API+UI transformation, with separate tree/details/action paths; no single magical combined-report backend. Do not ask the owner to investigate this.
- DISC-03/05: E09/E10 resolve association/clone behavior. Additive lineage/mapping chosen; no full PFMEA consolidation prerequisite.
- DISC-04: E04/E07/E09/E12 identify sources and separate action semantics. CONTRACTS selects worksheet primary, captured tree supplement/adoption with exact mapping.
- DISC-06/07: E11/E13 show approval lock and active pointer separate; dedicated release absent. Preserve lifecycle rather than invent Released.
- DISC-08: E09/E10/E11 show shared/project-level entities and incomplete upstream immutability. Captures plus source fence are required for claimed atomic freshness.
- DISC-09: E14/E15 show XLSX/print/storage capabilities and gaps. P0 chooses PDFKit+private DB bytes; this is proposed design, not an existing renderer/storage service.
- DISC-10: E16 scoped authorizations exist; site security is not established. New CP profile/approval authority is explicit.
- DISC-11: E13/E14 plus frontend/control-plan README identify reusable components. Existing theme/ui-theme.md governs density, color and keyboard focus.
- DISC-12: public AIAG/IATF references checked; complete licensed manuals/customer applicability not established. Neutral application profile is implementable; full standards/customer claims remain gated. The input's reference to supplied handbook/screenshots is not proof this audit read/verified a complete licensed publication.

## Corrections to original architecture and sequencing

1. Do discovery now and record evidence, rather than leave all DISC tasks as the implementer's open research burden.
2. Reuse existing aggregate/routes and metadata tables only where invariants require them. Source snapshots and artifacts are new capabilities, not merely new labels on locked rows.
3. Pick explicit v2 compatibility and clone semantics; otherwise a flash model may destructively migrate legacy analyses or inherit approvals.
4. Separate relationships from candidates. The current Cartesian preview is not proof every tuple is meaningful; report array indices are not relationships either.
5. Make concurrency meaningful: all relied-upon source writers and approval use a common tenant fence, plus target version/hash checks. A long PDF transaction or root-Prisma readiness breaks the intended boundary.
6. Do not introduce a second CP approval/lifecycle/RBAC system. Extend existing routes/records while closing v2 bypasses and separating operational Admin from assigned engineering approval.
7. Replace abstract artifact pseudocode with a bounded durable pipeline and failure/recovery states. Byte retention precedes final approval; no public URL/ephemeral disk/Redis assumption.
8. Define execution modes, legacy free-text conversion, field reviews, source/baseline replacement, native extract imports and exact navigation. These are consequential details left open in the input.
9. Keep complete-reference/customer verification as a named applicability/conformity gate. Do not make every engineering field universally mandatory or assume Safe Launch lasts a fixed duration.
10. Documentation cleanup follows delivered behavior; planning does not rewrite core rules to claim features exist.

## Baseline tests and limitations

Four focused backend suites49 tests and frontend CP helper5 tests passed. Actual private candidates()/applyCpChanges() with in-memory stubs confirmed8 tuple candidates and sourceState=current/no fieldReviews. See evidence/RESULTS.md and baseline-repro.cjs. These checks validate the audit baseline, not implementation of v2.

No product source edits, database schema execution, real customer records, role creation, cloud storage activation, email or Git publication. No real DB concurrency/browser/PDF checks performed in this planning task. Those remain explicit task acceptance. No subagents were spawned; packet ownership is proposed, not an assertion prior agents resumed.
