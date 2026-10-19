# FMEApex — Active Session State & Multi-Harness Continuity Hub

> **Universal Context Ledger**: Shared across Antigravity, OpenAI Codex, Claude Code, Cursor, VS Code.
> **Last Updated**: 2026-10-19T03:20:33Z | **Active Harness**: OpenAI Codex
> **Version**: `v0.9.0` (root `package.json#version`) | **Branch**: `main` (release base `455d02c`; current commit is recorded by Git)
> **Knowledge Graph**: Refreshed after homepage, auth, dashboard, and guide changes (`graphify-out/`)

---

## 🎯 1. Project North Star & Invariants

### Mission & MVP Criteria
Replace fragile Excel sheets with **FMEApex** — deterministic AIAG-VDA 2019 Quality OS:
1. **7-Step AIAG-VDA Gating**: Complete failure chains (Cause → Mode → Effect); zero skipped phases.
2. **Golden Thread**: PFD ↔ PFMEA ↔ Control Plan bidirectional serializable sync (0 orphan operations).
3. **Deterministic AP**: Table 5-4 read-only matrix lookup (High, Med, Low). Replaces flawed RPN (`S × O × D`).
4. **21 CFR Part 11**: Cryptographic SHA-256 locked revisions; `audit_log` rejects UPDATE/DELETE.
5. **24h Guest Sandbox**: 1 pre-filled demo (`E Vacuum Pump`) + max 1 custom project (24h lifespan, auto-archived for admin `lenvthank@gmail.com`).
6. **Multi-Tenant RLS**: All queries filtered by `tenantId`. `SET app.current_tenant_id` mandatory in raw SQL.
7. **Non-Blocking Git**: Windows subshells use `credential.helper=wincred` and `$env:GCM_INTERACTIVE="never"`.

---

## 📍 2. Current System Health

| Attribute | State | Proof |
|---|---|---|
| **Semver** | `0.9.0` | User-confirmed minor release; package and lockfile metadata synchronized |
| **Git** | v0.9.0 delivery authorized on main | Verify final local/remote SHA with Git; latest release section below |
| **Daemons** | Local Vite `:5173` and backend `:3000` | Actual guest entry reached dashboard; temporary `:5174` test server stopped |
| **Database** | Configured Neon schema verified synchronized | prisma validate + prisma db push --skip-generate succeeded; already in sync; no schema/data changes |
| **Builds** | Frontend: PASS · Backend: PASS | TypeScript checks pass; existing MUI barrel/chunk warnings |
| **Security** | `npm audit` | 0 vulnerabilities |
| **Knowledge Graph** | `graphify-out/graph.json` | Release AST refresh succeeded; current counts are in graphify-out/GRAPH_REPORT.md |

---

## 🕒 3. Where We Left Off (Last Session Summary)

- **v0.8.4 Release**: Full-width light enterprise overhaul of `ExcelRetirementShowcase.tsx` (eliminated letterboxed black void). Built authentic Excel replica (`#107C41` bar, `#REF!` formula, RPN 36 blindspot warning) vs FMEApex Golden Thread. Clean build and push (`455d02c`).
- **Multi-Harness System Setup**: Installed `graphifyy`, extracted 2,928 AST nodes/edges into `graphify-out/`, built canonical bridge adapters (`CODEX.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, `GEMINI.md`), and built CLI tool `.agents/scripts/handoff.py`.

---

## ⚡ 4. Active In-Flight Task

- **Task**: Publish v0.9.0 on main and synchronize the configured database.
- **Status**: User approved v0.9.0. Schema sync verified already aligned; release builds and all 17 backend tests verified. Commit/push authorization is explicit; use Git for final remote delivery state.


---

## 📋 5. What Is Left (Prioritized Backlog)

### Immediate (P0)
- [x] Multi-Harness state hub (`.agents/ACTIVE_STATE.md`) & CLI tool (`.agents/scripts/handoff.py`).
- [x] Canonical entry adapters (`CODEX.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, `GEMINI.md`).
- [x] Graphify AST extraction (2,928 nodes) & `.agents/rules/graphify.md` rule.
- [ ] Staging verification of multi-harness handoff.

### Pre-Launch (P1)
- [ ] **Production Neon RLS Validation**: Verify session variables (`SET app.current_tenant_id`) and tenant isolation on live Neon database.
- [ ] **Air-Gapped Container Verification**: Verify `fmea-pod.yaml` and `docker-compose.prod.yml` build/run cleanly.
- [ ] **24h Guest Session Auto-Archival Stress Test**: Verify cron in `project.service.ts` auto-archives expired projects.
- [ ] **Cloudflare Pages & Render Auto-Deploy Verification**: Staging URL checks.

### Polish (P2)
- [ ] Export parity check (Excel/PDF formatting across 13" laptop to 27" desktop).
- [ ] Figma design tokens review.

---

## 🤝 6. Inter-Harness Handoff Protocol

### On Session Start (Any Harness)
1. Read `.agents/ACTIVE_STATE.md` first (< 2k tokens). Do NOT whole-scan codebase.
2. Check `git status` and `git log -1 --oneline`.
3. Before planning/edits, query Graphify: `graphify query "<feature_or_symbol>"` or check `graphify-out/GRAPH_REPORT.md`.

### On Session End (Any Harness)
1. Verify builds: `cd backend && npx tsc --noEmit` and `cd frontend && npm run build`.
2. Update `.agents/ACTIVE_STATE.md`:
   - Run: `python .agents/scripts/handoff.py --update "summary" --next "next task" --graph`
3. Conventional commit (`feat(...)`, `fix(...)`).


## 7. Prior Codex Handoff — Homepage Story Redesign (2026-10-18)

- Rebuilt `frontend/src/features/landing/LandingPage.tsx` around spreadsheet fragmentation, DFMEA structure, PFMEA relationships, central control plans, and verified mitigation.
- Added `ConnectedProduct.tsx`: local illustrative interactive preview, document/component selection, spreadsheet comparison, and a shared control update visible in both PFMEA and control-plan views.
- Added layered, scoped `landing-story.css`: responsive ivory/graphite/orange presentation, scroll-linked sticky diagram, compact short-screen controls, keyboard focus, reduced-motion support.
- Preserved guest/authenticated routing, backend readiness messages, contact payload endpoint, legacy section anchors, and production risk calculator (loaded on demand). Shared public header/footer and authenticated screens are unchanged.
- Installed Anthropic `frontend-design` and Vercel `web-design-guidelines` under `.agents/skills/`; created and validated `fmeapex-product-story`; indexed all three in the skill catalog.
- Validation: frontend production build PASS; backend TypeScript + Nest build PASS; changed-file oxlint PASS; full frontend lint exits 0 with pre-existing warnings. Desktop and 390px mobile browser checks PASS: comparison, component/document selection, linked update propagation, chapter navigation, step selection, mobile menu/anchors, calculator disclosure; runtime error log empty.
- Ran README sync and `graphify update .`. Preview: http://localhost:5173/ (local Vite session).
- No real contact inquiry was submitted. Guest login and contact delivery were preserved but not exercised against the live backend.
- Version remains 0.8.4. No commit, push, or live deployment; existing unrelated working-tree changes preserved.
- Next: user visual review, then confirm release version before committing/publishing under repository version rules.


## 8. Latest Codex Handoff — Cohesive App Theme & Compact Guide (2026-10-19)

- Completed every follow-up to the homepage redesign: matching login and dashboard theme; Try it out copy; direct guest app entry from Try FMEApex / Try it out; responsive interactive guide.
- `frontend/src/theme/theme.ts:4` is the canonical MUI palette; `ColorModeContext.tsx` consumes it. `quality-theme.css` styles auth, chrome, dashboard, and guide with ivory/graphite/orange/contextual green.
- `frontend/src/features/auth/Login.tsx:21` keeps the explicit email/password form and a trial action. Labels, autocomplete, password visibility, errors, phone and desktop layouts verified without submitting credentials.
- `/app/initializing` waits for auth hydration, reuses an existing token or calls the existing guest login endpoint, and enters projects on success. Failure remains retryable on that screen. No permission, JWT, tenant, or database changes.
- Fixed warmup to use existing root `/health` and require a status-ok payload instead of accepting the Vite fallback page.
- Dashboard metrics now use loaded data with clear scope. Search has a label; project titles are links; cards fit the available panel width rather than the viewport. Grid/table switch and phase filtering verified.
- Guide starts collapsed for guests. Explicit action expands it; seven native step buttons, Next/Back, project-aware links, details, collapse, Close, Dismiss, Finish, and reopening are interactive. Educational guide progress does not alter enforced FMEA gating.
- Guide uses normal flow below 1500px and a reserved 292px sticky side rail above. Verified at 390px, 721px, and 1600px: no horizontal overflow or content overlap. At 721px the expanded guide is approximately 281px tall; collapsed is approximately 59px.
- Actual local homepage Try it out reached `/app/projects` with guest context and reference project. Isolated synthetic fixture verified guest failure and retry without corporate login. All temporary fixture files and the test server were removed.
- Validation: frontend production build and backend TypeScript PASS; changed-file lint exits 0 with three pre-existing warnings (two ProjectList effect dependencies, ColorModeContext fast-refresh export). Existing build warnings concern MUI barrel imports and large chunks. No browser runtime errors observed. Frontend diff whitespace check PASS; full-tree diff check reports a pre-existing trailing blank line in `.agents/AGENTS.md`.
- Updated UI/auth rules, synchronized READMEs, and rebuilt graphify AST index. Local preview remains http://localhost:5173/ with backend port 3000.
- Screenshots saved in the current Codex visualization directory: `fmeapex-dashboard-guide.jpg`, `fmeapex-guide-tablet.jpg`, `fmeapex-login-desktop.jpg`, `fmeapex-login-phone.jpg`.
- No contact submission, engineering data edits, release version bump, commit, push, or deployment. Version remains 0.8.4; unrelated working-tree changes preserved.
- Next: user visual review. Before any future commit/publication, obtain the intended release version under repository version rules.


## 9. Latest Codex Handoff — Contextual Tour, Real Activity, Trial UX (2026-10-19)

This section supersedes the in-flow/side-rail guide described in section 8.

### Completed user requests
- Dashboard now prioritizes programs: removed large KPI tiles and redundant shortcut card; added a compact summary strip, smaller header/card spacing, a wider programs column, and mobile phase scrolling. At the screenshot desktop size, the program panel moved from about 477px to 287px from the top and the first program card is fully visible. No horizontal overflow in the narrow-phone check.
- Replaced the guide rail with a bounded Popper coachmark anchored beside actual controls. One visible guide entry per screen: dashboard button, project sidebar button, or global workflow header button.
- Creation prompts follow part name, part number, valid Next Step, organisation, customer, team/document setup, and Create Program. Required empty fields disable tip continuation; actual form validation remains authoritative. On a successful guided create, the existing handler enters the created project's PFD.
- PFD Add Step opens a drawer-specific prompt. The tour then follows real PFMEA function/failure controls, the risk grid, actions/evidence, and the same project's control plan. Finishing or closing ends guidance only; no FMEA gate or approval is completed by the tour.
- Fixed limited-trial fallback to an existing program when creation is disabled. Global actions without project context offer Choose a program rather than an inert next action. Active tours survive native navigation using an existing session-scoped flag.
- Guest UI now says Trial workspace (Trial on narrow screens), uses an E avatar, hides synthetic account email/name and archive navigation/actions, removes redundant Quality Projects navigation on the dashboard, and labels the account action Sign in to your account. Internal isGuest/JWT/tenant policy is unchanged.

### Activity correction
- The old service returned tenant-wide events, hard-coded demo descriptions, invented verification/re-sequencing labels, and synthetic filler. It is now audit-only and viewer-scoped to accessible active programs, including guest reference + own unexpired programs, owner scope for regular users, and tenant scope for Admin.
- Real project/document/revision/row/function/failure/link/action relationships provide attribution; unresolved or inaccessible events are omitted. Deleted entities can resolve through immutable snapshots. No schema or migration changes.
- Collection POSTs now record the created entity ID returned in the successful response when the URL has no ID, fixing missing project-creation audits.
- Dashboard activity polls every 30 seconds while visible, refreshes on focus and mutations, and has a manual refresh with updated-at/loading/empty/error states. Errors clear stale items. Actual local API events were observed, including a newly recorded control-plan revision appearing after refresh.

### Source map
- Tour: frontend/src/features/projects/components/FmeaTutorialGuide.tsx:1.
- Dashboard and wizard hooks/anchors: frontend/src/features/projects/ProjectList.tsx:1.
- Single guide entry and trial account presentation: frontend/src/components/Layout/AppShell.tsx:1.
- Styling: frontend/src/theme/quality-theme.css:1.
- Stable workflow anchors only: PfdWorkspace.tsx, PfmeaWorkspace.tsx, PfmeaStructureTree.tsx, ActionsDashboard.tsx, ControlPlanWorkspace.tsx.
- Activity API: backend/src/modules/audit/audit-log.service.ts:1 and audit-log.controller.ts:1; write attribution: backend/src/common/audit.interceptor.ts:1.
- Tests: backend/src/modules/audit/audit-log.service.spec.ts:1 and backend/src/common/audit.interceptor.spec.ts:1.

### Validation and operational state
- Frontend npm run build PASS; backend npx tsc --noEmit PASS and Nest build PASS. Existing MUI barrel-import and large-bundle warnings remain.
- Six focused Jest tests PASS: no filler, guest visibility, owner/admin scope, bounded limits, actual actor/project/delete attribution, inaccessible records, and collection-POST audit IDs.
- Changed tour/dashboard/AppShell oxlint PASS with no warnings. Also corrected the existing effect dependencies in ProjectList and its unsupported SelectProps usage.
- Browser: real guest session, field-tip progression, actual Next Step validation failure/success, team/create tip, close/cancel, PFD drawer, all engineering tour chapters, same-project documentation, Finish, account menu, archive absence, desktop and narrow phone. Verification form inputs were cancelled; no test project was submitted through the UI. Successful guided-save navigation is implemented in the handler but was not exercised by submitting a real test project.
- README sync completed; root README, AGENTS, CODEX, canonical rule/context/decision files updated. Graphify updated after logical code batches; final graph has no extraction syntax errors. Git diff --check PASS. No temporary test fixture files were introduced.
- Local Vite remains on port 5173 (prior preview process). Updated local API process PID 24268 on port 3000. Keep these for user review; do not terminate unrelated processes.
- Current proof images: fmeapex-dashboard-optimized.jpg and fmeapex-creation-walkthrough.jpg in C:/Users/Palak/.codex/visualizations/2026/10/18/01a15026-af67-7522-87fc-f43cefdb4e2b/.
- Version remains 0.8.4. No release commit, push, migration, or deployment. Preserve pre-existing harness/graph work and earlier homepage/auth changes.

### Next agent
Start here, then read canonical AGENTS and query Graphify for the feature being changed. All requested local fixes are complete. Next is user visual review; obtain the intended release version before any commit/publication. After every logical code-change batch run graphify update ., sync directory READMEs, and update this ledger. Do not restore the superseded guide rail or synthetic activity feed.


## 10. Latest Release Handoff — v0.9.0 (2026-10-19)

- User explicitly requested Git push and database sync, then confirmed the 0.9.0 minor release. This supersedes prior local-only/pending-version statements in historical handoffs.
- Root/backend/frontend package versions and existing lockfile root metadata are synchronized at 0.9.0. Added versions/v0.9.0.md and updated the version index.
- Configured Neon DB: prisma validate succeeded, then prisma db push --skip-generate reported the database already in sync. No Prisma schema changes, reset, data-loss flags, migrations, or seed changes.
- Release gates: frontend production build PASS; backend Nest build PASS; all backend Jest tests PASS (4 suites, 17 tests). Existing MUI barrel/chunk warnings remain. Previous dashboard/tour lint and responsive browser checks passed.
- Publication target is origin/main at the existing GitHub repository. A main push triggers the configured Cloudflare Pages and Render auto-deploy pipelines; pipeline completion is distinct from successful Git synchronization.
- Portable harness files, design skills, directory README maps, release notes, and the graph accompany the product changes. Exclude environment files, credentials, dependency/build folders, graph caches, and temporary fixtures. No forced push or remote history rewrite.
- Before ending delivery: confirm local HEAD equals origin/main and the working tree is clean; report the actual commit SHA from Git. The handoff itself does not embed its own commit hash.
- Next agent: read this latest section, verify Git/remote deployment status, and continue from the v0.9.0 release. Run Graphify after each logical code-change batch; preserve the current coachmark and audit-only activity designs described in section 9.
