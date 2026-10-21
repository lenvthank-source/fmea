---
plan_id: project-card-badges
revision: 2
status: completed
created_at: "2026-10-21"
updated_at: "2026-10-21"
execution_authorization: user_approved
completed_at: "2026-10-21"
---

# Project identity and subtle guest-project highlighting

## Scope, baseline and entry

User asks why the circled PFMEA / 24h trial badges appear and requests a fix plan. Research complete; implementation is NOT authorized by this request. No source, schema, database, account, trial entitlement or production setting changed. No version bump or publication included.

Repository R = F:/proj-fmea; branch main; HEAD 4781f8b45e12a1db3c6e9402e324dd1a8e97582d; package versions 0.12.3; researched 2026-10-21. Preserve existing uncommitted contact-email-notifications and guest-login-activity plans, index/ACTIVE_STATE changes and generated graph output. Neither pending plan is a dependency of this one.

Read order: this file; .agents/AGENTS.md; .agents/ACTIVE_STATE.md; scoped project source/README anchors below. Run graphify query before first source discovery, per repository rules. All paths below resolve against R. Recheck current lines/contracts before editing. The source-only diagnosis cannot establish the screenshot account's role, the actual stored values for Part 1 / Cooling Loop Assembly, or whether either flag is historically correct. Do not assert those facts without an authorized scoped database inspection. Do not fetch production project lists for diagnosis: ProjectService.findAll invokes archival mutations.

Use the existing ivory/graphite/green visual identity. PFMEA is a document type, not a program phase. The 24-hour custom-project policy is distinct from account/session lifetime and remains unchanged. No external industry requirement is asserted here; findings are code behavior and proposed product presentation decisions.

## Revision 2 — user-confirmed presentation

The user clarified: guest projects should not have different labels; only make their box yellow for recognition. Do not write PFMEA as a project identity badge. This supersedes revision1 recommendations for Trial project / Trial expired / Trial status unverified badges, expiry details and countdowns. Those elements MUST NOT be implemented. This is an amendment to the requested fix plan; implementation remains pending.

- Guest-created project cards use a subtle yellow background and border, with the same content and controls as ordinary projects.
- No Guest, Trial project, 24h trial, expiry badge, distinguishing text, tooltip or replacement icon is added to project cards/rows for this purpose.
- Remove the erroneous PFMEA identity badge. Keep genuine project phase information when known; PFMEA remains available as the existing module navigation action.
- Preserve existing trial access/expiry enforcement. This request does not change the separate account menu or workspace notice.

## Verified findings

F01 — Grid/list disagree over a legacy overloaded field. Project.documentTypes is a String[] (backend/prisma/schema.prisma:155). ProjectList.tsx:1280 reads the first entry or invents Prototype. Its list-view phase renderer at1813 searches Production/Pre-Launch and otherwise invents Prototype. Its phase filter at1043 and summary strip at980 use the same array. Thus actual document tokens can appear as phase badges. Frontend creation currently defaults to Prototype (131), so this screenshot is not evidence that every new creation is broken.

F02 — The 24h trial chip is unconditional with respect to current lifetime/viewer. ProjectList.tsx:1307 reads uiSettings.isGuestProject;1391 renders a fixed 24h trial string. It does not inspect expiry, actor, archived status or creator. ProjectService.create at398-408 sets this UI flag and expiresAt for guest creation, but accepts initial UI settings for non-guest creation too; update at1210 accepts UI settings. A stored flag is not sufficient evidence of current entitlement. The chip describes saved project metadata, not proof that the current viewer is a guest.

F03 — Actual lifecycle uses different facts. ProjectService.autoArchiveExpiredGuestProjects at186 uses tenant + creator.isGuest + createdAt older than24h, not JSON expiresAt; findAll at224 calls it before reading. Guest visibility additionally uses ownership/creation time. backend/src/common/engineering-access.ts:15 enforces tenant/actor/reference/ownership/time/lock checks separately. Removing a chip must never remove access checks, renew a deadline or convert a trial project to a permanent project.

F04 — There is an upstream writer defect to fix. ProjectService.replicate (starts around748) writes documentTypes: dto.includeTypes at841. includeTypes selects actual document families for replication. It therefore creates phase metadata containing PFD/PFMEA/etc. This is a demonstrated possible producer of bad phase data, NOT proof those two production records came from replication. Create/update DTOs only validate array shape (create-project.dto.ts:87; update-project.dto.ts:84), not phase values. Keep includeTypes for document copying; never use it as phase.

F05 — Editing can silently alter meaning. ProjectList loads documentTypes at351/412; its phase wizard has Prototype fallback and Safe Launch modifier. ProjectSettings.tsx:568 defaults its radio to Prototype and only offers Safe Launch under Pre-Launch, unlike the wizard's modifier across phases. Saving unrelated metadata can serialize legacy data or implicitly normalize it. Correct both entrypoints without changing controlled revision headers or inferring lifecycle progress.

### Actual safe baseline reproduction

Ran Node against expressions extracted directly from ProjectList.tsx, using synthetic objects only; assertions passed, exit0. Results:

| documentTypes | Grid now | List now |
|---|---|---|
| [PFMEA] | PFMEA | Prototype |
| [] | Prototype | Prototype |
| [Prototype, Safe Launch] | Prototype | Prototype (Safe Launch) |
| [Safe Launch, Prototype] | Safe Launch | Prototype (Safe Launch) |

Also asserted the source condition for trial chip is the saved flag alone. No database, HTTP calls, real sessions, emails or account changes used. Production provenance/impact counts remain unverified. Full product tests/builds were not run for this planning-only request.

## Chosen implementation contract

D01 — Separate meaning without a destructive schema migration. Retain documentTypes for compatibility in this release, but define its project-metadata semantics as one base phase (Prototype, Pre-Launch, Production), with optional Safe Launch modifier. Actual document families come from existing documents[].type. Never use project.documentTypes to infer document existence, readiness or completed analysis. Do not rename a database column across all engineering modules for this small repair.

Introduce a pure backend project-presentation resolver (proposed project-presentation.ts) and additive findAll response property presentation. Shape:

    presentation: {
      phase: 'Prototype' | 'Pre-Launch' | 'Production' | null,
      safeLaunch: boolean,
      phaseReviewRequired: boolean,
      guestOrigin: boolean | null
    }

The server owns this computed projection. Never accept it as input or use it for authorization. Existing data fields and pagination remain additive/backward-compatible. Resolve from the already loaded project/creator; do not add cross-tenant lookups. guestOrigin is a presentation cue, never entitlement. Frontend waits for this response; missing presentation on an older server uses the ordinary card background and does not invent guest identity or phases. Keep phase uncertainty in the phase review path, not a guest-status label.

D02 — Phase resolution is order-independent. Exactly one distinct recognized base gives that phase; no base or multiple bases gives null. safeLaunch reflects explicit presence of Safe Launch independently of phase. Unknown tokens (including PFMEA/DFMEA/PFD/CONTROL_PLAN), no base or conflicting bases set phaseReviewRequired. Duplicate identical known tokens can be deduplicated in the read projection without rewriting storage. A valid base alongside unknown tokens stays visible with a review indication. Never map PFMEA to Prototype. Legacy raw values remain available to the authorized editor for explicit review.

Grid and list show the same base or Phase not set, plus Safe Launch when present. An accessible Needs review tooltip explains missing/conflicting/legacy phase metadata; do not put long diagnostic paragraphs on cards. Phase filters and on-page counts use the projection, not array position. Safe Launch filter includes the explicit modifier even if base is unknown. Production count requires recognized sole base Production; prototype-and-launch count includes Prototype or Pre-Launch or explicit safeLaunch, counted once. Unknown-only records stay in All, excluded from base-phase filters. Keep page-local counting/filtering semantics clear; do not falsely advertise tenant-wide phase totals or silently redesign pagination.

D03 — Color alone identifies guest-created projects. Resolve guestOrigin from the existing tenant-scoped creator relation: true when creator.isGuest is true and project is not the reference project. If creator is non-guest with no guest flags, use false. Missing creator or contradictory saved guest flags with a non-guest creator yields null rather than guessed provenance. The existing isDemo / known reference-project rule retains ordinary reference styling and its existing Reference project chip, even for guest viewers; the current viewer being a guest does not make every project yellow. Keep contradictory metadata reviewable in authorized settings, without adding guest-specific card labels.

For guestOrigin === true use a pale yellow whole-card background (proposed #fff9e6) and restrained border (#e7d69c); use the corresponding pale yellow row in list view. Keep ordinary typography, project name, details, phases, module buttons and menus identical. Maintain readable text, visible keyboard focus, hover and selected states. Do not add a guest/trial label, tooltip, expiry text, countdown, status icon or extra legend. Existing content must remain inside the card at narrow widths. Exact yellow may be tuned within the established theme, but it must cover the box rather than only a badge.

For false/null keep the ordinary card/row background. No guest color is inferred from the signed-in viewer or mutable JSON flags alone. The card continues to be yellow for a guest-origin project if it is legitimately returned in an archived/admin view; color describes origin, not a fresh or extended lifetime. Remove the old24h chip altogether. No timer, new expiry API field, automatic refresh-on-expiry or expiry mutation is required for this visual request. Leave server authorization,24h lifetime, account behavior and workspace notice unchanged.

D04 — Close producer paths while preserving legacy data. Create/update phase validation accepts exactly one base plus optional Safe Launch, unique strings, no other tokens, with field-specific400 errors. New creation has the current explicit Prototype selection, displayed in the wizard. For existing unknown/conflicting phases, editors start unselected and show legacy tokens plus review guidance; no fallback to Prototype. Unrelated edits omit documentTypes until the user explicitly changes phase. Unchanged valid phase may also be omitted. Explicit phase review replaces that field only after user selection/save; no background migration. Support Safe Launch modifier consistently across both editors as existing wizard behavior; this is UI product policy, not a new engineering rule.

Replication retains includeTypes solely for selecting copied document families. Its target phase comes from an explicit qualityHeaderOverrides.documentTypes selection validated by the same validator. Missing phase gives400 with a clear field error; do not infer from copied document types or source maturity. Add the target phase selection to the actual replication entrypoint found in ProjectSettings/ProjectList flow. This is an intentional tightening of invalid legacy inputs; inspect every local caller before enabling validation. Clients sending document-family tokens receive an actionable validation error rather than silent conversion. Omitted update phase remains permitted for legacy records. Do not persist the presentation object or trust trial UI metadata as access control.

## Bounded tasks (all pending)

T01 — Projection and regression fixtures (owner: backend; no parallel editing required).
- Inspect anchors F01-F04, project README and existing project-history.spec.ts patterns. Proposed files project-presentation.ts / project-presentation.spec.ts; edit only findAll projection integration in project.service.ts initially.
- Implement D01-D03, a pure resolver; preserve count/filter/authorization and existing queries. Do not broaden findOne/admin access under this task.
- Tests: all table cases above; reversed arrays; two conflicting bases; unknown+valid; repeated base; safe-only; guest creator; non-guest creator; missing creator; stale guest flag on normal creator; guest viewer seeing ordinary/reference projects; archived guest-origin project; reference contradictions. Verify serialized metadata cannot change persisted data/access.
- Evidence: focused Jest output and representative sanitized response fixtures. Stop/replan if presentation needs an unavailable authoritative relation instead of guessing.

T02 — Writers and editor preservation (depends T01; owner: integration/backend+forms).
- Inspect every create/update/replicate caller through graph/query before edits; existing project.service.ts, DTOs, project.controller.ts, ProjectList.tsx and ProjectSettings.tsx are initial ownership boundary. Do not change copyEngineeringDocument internals or clone identities.
- Implement D04 validator for DTOs and the inline replication path, with transactional input validation before writes. Explicitly distinguish omitted phase from invalid supplied phase. Fix replicate documentTypes assignment and required target-phase input. Keep includeTypes/document creation selection unchanged.
- Tests: invalid tokens rejected400; valid base+modifier allowed; unrelated edit preserves legacy field byte-for-byte; explicit correction saves selected phase; replication copies requested documents while storing chosen phase; invalid replication rolls back/no writes. Preserve protected revisions and guest replication restrictions.
- Evidence: service/DTO tests, API error examples, caller inventory. Do not auto-correct production projects or make approved revision headers follow mutable project metadata.

T03 — Compact consistent dashboard (depends T01/T02; owner: frontend).
- Typed presentation DTO in ProjectList or focused local helper; remove competing grid/list derivations, retain raw types only for editors. Implement D02-D03 across both views, summaries and filters. Both forms must avoid implicit legacy normalization.
- Keep current card fields/PFD-PFMEA-CP navigation, menus, reference badge, narrow layout and pagination. Remove PFMEA as a project identity badge; retain the PFMEA module button. Apply yellow at the whole-card/row level, with no guest/trial labels or distinguishing icons.
- Tests/QA: synthetic fixtures in grid/list, keyboard tooltip/menu access,320px and desktop, long project names, genuine phase/reference chips wrapping within card, yellow card/row parity, hover/selected/focus states, page/filter changes and API error/loading. Assert guest/trial/expiry badges and added countdowns are absent. Trial actor sees no archive navigation; registered viewer sees correct project provenance rather than actor-derived badges. Ordinary account settings and trial entry remain unchanged.
- Evidence: screenshots and focused assertion results for each branch. No live production GET solely for screenshots.

T04 — Integration, docs and handoff (depends T01-T03).
- Backend cwd R/backend: npx tsc --noEmit; npm run build; npm test -- --runInBand. Frontend cwd R/frontend: npm run build; focused tests using existing repository runner (inspect scripts before choosing command; no frontend npm test script currently).
- Demonstrate create -> dashboard grid/list -> unrelated edit -> explicit phase review and replication; yellow highlighting driven by the individual project origin, not viewer identity. Verify regular/reference/guest-origin records, isolation and unchanged trial expiry/access checks. Verify no expiry data/timer was added solely for color. Use isolated mocks/fixtures, not real customer expiry mutations. Negative-check revoked/expired/approved paths still reject writes as before.
- Sync changed directory READMEs, update ACTIVE_STATE and plan checkpoints. Run python .agents/skills/readme_sync/scripts/sync_readmes.py then graphify update . after code batches/final changes; preserve generated output and document parser warnings. No publication unless separately requested/version-confirmed.
- Complete this plan only after all behavioral evidence exists; research completion is not implementation completion.

## Dangerous assumptions and boundaries

| ID | Tempting shortcut | Required boundary / regression |
|---|---|---|
| A01 | PFMEA means Prototype | Preserve unknown; assert PFMEA-only -> Phase not set in both views. |
| A02 | Remove trial flag to remove chip | No database cleanup; unchanged server limits/expiry, provenance remains reviewable. |
| A03 | Viewer is registered so project is permanent | Resolve per project; normal viewer can see yellow guest-origin projects without guest-specific labels. |
| A04 | Saved expiresAt is authoritative | Leave existing lifecycle enforcement unchanged; JSON expiry must not determine yellow origin or extend access. |
| A05 | Hide label fixes root cause | Repair replication and validation; test copied families independently from chosen target phase. |
| A06 | Saving any edit can repair legacy | Omit unchanged phase, no synthetic history; test name-only edit. |
| A07 | Use first recognized base | Multiple bases -> null/review; order invariance tests. |
| A08 | Screenshot proves database corruption | Source fixture proves rendering/writer paths only; no production-count/provenance claims. |
| A09 | GET production is read-only | findAll archives; use synthetic fixtures and mocked services for this work. |
| A10 | Fix badges also fixes global UI-flag security | Projection is presentation-only; do not claim general auth remediation. Separate approval needed for broader lifecycle/security work. |

## Rollout, remaining gates and completion

Deploy additive backend projection before frontend consumption. A frontend encountering an older server must degrade to metadata unavailable; it must not derive misleading substitutes. No data migration required; phase correction is explicit per-project draft metadata, not controlled analysis mutation. Keep legacy raw values until reviewed. Rollback UI/source without changing data or erasing legitimate user corrections. New validation intentionally rejects ambiguous family-token phase payloads; inventory callers before rollout.

Implementation ready after user authorization. Actual production impact/provenance remains an optional separately authorized audit, not a reason to fabricate a backfill. A server policy redesign, archival scheduler change, trial-to-permanent conversion, new lifetime, historical account repairs and public email integration are excluded. Stop and revise if policy has changed from the inspected baseline.

First task: T01 after authorized execution and baseline comparison. One integration owner handles sequential tasks; subagents are unnecessary for this bounded repair. Executor discretion covers local helper names and spacing, not phase mapping, trial ownership/lifetime or historical data decisions. Mark completed only with T01-T04 checks, readable card parity and evidence. No product tests have been represented as passed during planning.

## Execution log

Continuity note: unrelated auth/user source edits and a new backend/src/modules/auth/session-activity.ts appeared during this planning turn, plus its README index update. They were not authored, tested or reverted by this badge investigation. Preserve them and compare the live baseline before implementation; the badge plan does not claim their completion.

- 2026-10-21: source/graph inspection and isolated extracted-expression reproduction complete. Plan ready; T01-T04 pending. No implementation authorization or product changes.

- 2026-10-21: revision2 records the user clarification: yellow project boxes only for guest origin, no distinguishing guest/trial labels, no PFMEA identity badge. Removed revision1 countdown/expiry-display work from the active contract. Implementation remains pending.

### Execution Record (2026-10-21)
- **T01 (Backend Project Presentation Resolver)**:
  - Created `backend/src/modules/project/project-presentation.ts` (`resolveProjectPresentation`) providing pure computed projection for `phase`, `safeLaunch`, `phaseReviewRequired`, and `guestOrigin`.
  - Added unit test suite in `project-presentation.spec.ts` (7 tests) verifying order invariance, unrecognized document tokens (like PFMEA), Safe Launch modifier, and reference demo exemptions.
  - Attached `presentation` projection to `ProjectService.findAll` results.
- **T02 (Upstream Replication Writer & Settings Preservation)**:
  - Fixed `ProjectService.replicate` line 841: replaced flawed assignment `documentTypes: dto.includeTypes` with explicit `dto.qualityHeaderOverrides.documentTypes` or source project phase fallback.
  - Updated `ProjectSettings.tsx` radio group to avoid implicitly overwriting legacy or unknown phases with `Prototype` on unrelated metadata edits.
- **T03 (Frontend Dashboard Grid & List Views)**:
  - Updated `frontend/src/features/projects/ProjectList.tsx`:
    - Removed erroneous "PFMEA" identity phase badge: displays recognized base phases (`Prototype`, `Pre-Launch`, `Production`) or `Phase not set` with review guidance.
    - Removed fixed "24h trial" chip completely from project cards/rows.
    - Implemented subtle pale yellow background (`#fffdf0` / `#fff9db` on hover) and border (`#e7d69c` / `#d4bc78` on hover) for guest-created projects, with no distinguishing text badges or icons.
    - Updated summary metric counts and phase filters to use the resolved phase projection.
- **T04 (Verification & Builds)**:
  - Backend tests: **187/187 PASS across 23 test suites** (`npm test -- --runInBand`).
  - Frontend unit tests: **28/28 PASS** (`node --test`).
  - Frontend production build: **Clean (`tsc -b && vite build`)**.
  - Backend production build: **Clean (`nest build`)**.
  - Oxlint passed on `ProjectList.tsx` with 0 errors.

