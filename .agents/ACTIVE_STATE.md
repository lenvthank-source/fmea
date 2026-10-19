# FMEApex — active handoff

Updated 2026-10-19T15:16:00+00:00. Harness: Google Antigravity. Workspace: `F:/proj-fmea`, branch `main`, release **v0.10.1** (`0.10.1`), confirmed by the user for publication to `origin/main`. Git is authoritative for local/remote commit IDs; deployment status must be checked independently.

## Current objective and status
The user-approved complete public identity redesign and connected engineering/workspace plan is published as release 0.10.0. Release commit `831823590a03249a41f8efac727c60f32c5d2b9d` was pushed to `origin/main` and the remote SHA was verified equal to local HEAD. This handoff update may be a later documentation commit; use Git for the current tip. Delivery checklist and URL evidence: `docs/specs/connected-quality-delivery.md`. Historical sessions are archived in `docs/handoffs/2026-10-19-before-connected-delivery.md`; they do not override this state.

## Delivered
- All 23 public URLs share ivory/graphite/orange identity, shared navigation/footer, substantive resource articles, responsive layouts, canonical metadata, noindex errors, sitemap and honest machine-readable content. Four language-prefix families redirect to English while retaining query/hash. Homepage interactions and direct trial entry remain.
- Dashboard prioritizes compact complete program cards. Real scoped audit events populate activity. One contextual guide follows actual creation/workflow controls; archive navigation is hidden for trial users.
- Minimal account control shows a server-assigned permanent noun-pair handle. Unique global reservations survive account/tenant deletion; a database trigger protects assigned handles. Registered names and historical identity fields are preserved.
- Repository navigator + actual function/cause/control graph, zoom/fit/collapse, ancestor highlighting, full inspector, tree alternative, nested search, coverage filtering, responsive details and honest empty/malformed states. Server roles/visibility/import ownership and revision protection enforced.
- Revision-owned PFD graph stores explicit decisions, loops, parallel/material/disposition routes independently of table order. Graph writes validate references, connectivity on review, tenant access, locks and optimistic versions. Operation changes invalidate review and advance versions atomically; approved downstream metadata stays protected.
- Manufacturing notation uses declared activities and unambiguous source marks, never equipment names. WIP/rejection alone do not become storage/rework/scrap. Sequence-only legacy data remains a draft requiring actual routing/classification review.
- Screen/SVG/paginated print-PDF/native XLSX share graph semantics. XLSX includes editable process/route sheets, graph metadata and diagram image. Import remaps operation IDs, preserves routing/positions and counts its own mutation version increments; concurrent routing saves are rejected. Revision/project cloning remaps graph references.
- Incomplete drafts remain usable. Submission/approval readiness checks missing/blank chains, integer ratings, reviewed topology and CP methods/reaction plans. AP mappings preserved; all 1,000 valid combinations match client/backend. Canonical rules and five domain skills now distinguish source requirements, product policies and gaps.

## Verified
- Backend production build PASS; all **62 Jest tests in 10 suites PASS**.
- Frontend production build PASS; **12 graph/import/print/repository tests PASS**. Changed new modules lint clean; broader old modules retain nonfatal warnings.
- Browser checked all 23 public routes at desktop/narrow widths; additional 768/390 checks across 11 page families. Main integration checked actual trial entry, username/menu, guide/Create Project, compact cards, repository graph/inspector and PFD read-only view. No document horizontal overflow at 1440 or 320 CSS pixels after fixes.
- Real XLSX download verified four sheets, embedded PNG, full identity/descriptions and metadata. Its round-trip remapped all 12 operation IDs, retained 14 nodes/13 routes and all positions. No engineering reference data changed for QA; no contact inquiry submitted.
- Normal Prisma generation PASS after releasing old DLL lock. Five migrations applied to configured Neon: existing-schema baseline, additive PFD graph, public handle ledger/backfill, required trial handle, and backward-compatible legacy API allocation. Prisma migration status current; schema diff **no difference**. 43 trial users have 43 unique handles and zero missing handles. A rolled-back database transaction verified that legacy inserts receive a reserved handle without leaving test data. One rollout-gap account repaired via `backend/scripts/backfill-public-handles.cjs`; no reset/deletion/renumbering.
- Existing Vite runs on :5173; final built API restarted hidden on :3000, task-owned PID **24200**. Check current port ownership before any later restart; never stop unrelated Node processes. Logs: ignored `backend/local-api.stdout.log` and `.stderr.log`.

## Source map / next agent
Public: `frontend/src/components/site/`, router and public feature pages. Identity: auth/public-handle + auth service, Prisma migrations, AppShell/ProjectList. PFD: backend pfd graph/service/controller, project revision readiness/cloning, frontend pfd utilities/editor/import and ReportExporter. Repository: backend repository module and frontend repository feature.

Start with this file and `.agents/AGENTS.md`, then **graphify query before source discovery**. Run README sync and `graphify update .` after each logical change and before handoff; preserve generated artifacts. SQL extraction currently warns that optional `tree_sitter_sql` is unavailable; TS/TSX graph extraction succeeds.

The user explicitly authorized Git push and confirmed **0.10.1**. Package and lockfile metadata, append-only release notes, directory indexes and handoff are synchronized. The patch resolves resilient PFD graph 404 fallbacks, guards unhydrated auth queries in PfdWorkspace, and fixes non-fatal PFD Excel export. Future releases require their own version confirmation.

## Material limits / existing backlog
Numerical AP handbook conformity still requires independent licensed-reference validation; do not claim certification. Manufacturing-v1 is a declared product notation, subject to customer acceptance. Do not silently rewrite historical imported records or invent missing branches. Existing automatic CP-to-PFMEA reverse propagation and a complete action-evidence state machine are not implemented; these are documented pre-existing gaps, not delivered features. Production RLS/staging/container verification remain separate backlog. Full browser printing and a real engineering-record import were not submitted against shared reference data; print pagination and import contracts are covered by tests and native workbook verification. The final browser reload reported no runtime or HTML nesting errors; exports stay disabled until saved topology loads successfully.

## Release handoff
Use `versions/v0.10.1.md` for the release scope. All maintained source-directory READMEs are tracked; `.gitignore` excludes task runtime logs and graph lock files. Next priority is post-deployment verification on configured Cloudflare Pages/Render URLs, then the independent methodology/backlog items above.

