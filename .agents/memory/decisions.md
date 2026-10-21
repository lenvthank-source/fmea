# Architectural Decisions

Durable architectural decisions documented with evidence.

---

## Decision: Multi-Tenant via Prisma tenantId Filter

Status: Accepted

Decision: All database queries filter by `tenantId` at the application level using Prisma's `where` clause rather than database-level RLS policies.

Reason: Simpler implementation with Prisma ORM; RLS session variables are set but enforcement is primarily application-side.

Source: All service files in `backend/src/modules/`, [prisma.service.ts](file:///f:/proj-fmea/backend/src/prisma/prisma.service.ts)

---

## Decision: Schema Sync via prisma db push (No Migrations)

Status: Accepted

Decision: Database schema changes are applied using `npx prisma db push` rather than committed SQL migration files.

Reason: Rapid development workflow with Neon serverless PostgreSQL.

Source: No `migrations/` directory exists in `backend/prisma/`

---

## Decision: Global JWT + Permission Guards

Status: Accepted

Decision: `JwtAuthGuard` and `PermissionGuard` are registered as global `APP_GUARD` providers, requiring explicit `@Public()` opt-out for unauthenticated endpoints.

Reason: Secure-by-default approach — all routes are protected unless explicitly marked public.

Source: [app.module.ts](file:///f:/proj-fmea/backend/src/app.module.ts)

---

## Decision: Admin Role Bypasses Permission Checks

Status: Accepted

Decision: Users with `Admin` role automatically pass all `PermissionGuard` checks regardless of required permissions.

Reason: Simplifies admin access without needing to assign every individual permission.

Source: [permission.guard.ts](file:///f:/proj-fmea/backend/src/modules/auth/guards/permission.guard.ts)

---

## Decision: Auto-Deploy from main Branch

Status: Accepted

Decision: Both frontend (Cloudflare Pages) and backend (Render Docker) auto-deploy on push to `main` branch.

Reason: Simple deployment pipeline without CI/CD configuration.

Source: [cloudflare-render-neon.md](file:///f:/proj-fmea/docs/deployment/cloudflare-render-neon.md)

---

## Decision: Local Filesystem Fallback for R2

Status: Accepted

Decision: `R2Service` falls back to local disk (`uploads/evidence`) when Cloudflare R2 credentials are not configured.

Reason: Enables local development without requiring cloud storage setup.

Source: [r2.service.ts](file:///f:/proj-fmea/backend/src/modules/action/r2.service.ts)

### 2026-09-01 — ADR-028: Industrial Process Flow Diagram (PFD) Rebuild & Space-Optimized Shadcn Admin Theme
- **Context**: Quality engineers require an authentic engineering schematic representation of manufacturing processes matching industrial PFD standards (equipment line symbols, orthogonal piping, input stream flags, equipment tags) alongside AIAG/ASME classification, while avoiding dark/blurred header obstruction during modal data entry.
- **Decision**: Rebuilt PFD flow canvas from scratch in `PfdEngineeringCanvas.tsx` supporting 12 vector equipment types, orthogonal piping with 90° bends and directional markers, and incoming variation feed flags; elevated `DocumentHeader.tsx` to `zIndex: 1350` and disabled backdrop blur; modernized PFD, Repository, Actions, and Admin workspaces to Shadcn Admin theme; authored `.agents/rules/ui-theme.md`.
- **Consequence**: Engineers can visualize complex plant processes matching P&ID/PFD engineering drawings, interactively inspect equipment details, and enter FMEA data with continuous unblurred sight of program metadata.
- **Source**: [`frontend/src/features/pfd/components/PfdEngineeringCanvas.tsx:1`](file:///f:/proj-fmea/frontend/src/features/pfd/components/PfdEngineeringCanvas.tsx), [`frontend/src/components/DocumentHeader.tsx:102`](file:///f:/proj-fmea/frontend/src/components/DocumentHeader.tsx), [`versions/v0.5.6.md:1`](file:///f:/proj-fmea/versions/v0.5.6.md)

### 2026-09-01 — ADR-029: Fragmented Failure Causes Columns Across PFMEA Export/Import/Grid & Modal Theme Overhaul
- **Context**: AIAG-VDA 2019 PFMEA requires distinct evaluation of failure causes, prevention controls, occurrence ratings, detection controls, detection ratings, and action plans per cause sub-row. Merging these columns across an entire failure mode obscured cause-specific controls and actions in Excel and the UI grid. In addition, Work Element (4M) was omitted from Excel in v0.5.1 but still displayed in Report View, and dialogs retained legacy borders and plain tabs.
- **Decision**: Only merge columns 1 to 6 (`#`, `Structure / Item`, `Function`, `Failure Mode`, `Effects`, `SEV`) for each failure mode. Keep columns 7 to 23 (`Failure Causes` through `Remarks`) completely fragmented into individual sub-rows across Excel export, import forward-fill, and the Report View grid. Removed `Work Element (4M)` from Report View. Overhauled all PFMEA child dialogs (`FailureDetailWindow`, `AddFailureDialog`, `AddFunctionDialog`, `MultiAddWorkElementDialog`, `FailureLinkageModal`, `PfmeaExcelImportWizard`) to the Space-Optimized Shadcn Admin theme.
- **Consequence**: Full 1:1 fidelity between the on-screen Report View and exported Excel workbooks; causes and corrective actions are tracked granularly with independent ratings and AP badges; dialogs feature cohesive Shadcn Admin ergonomics.
- **Source**: [`frontend/src/features/reports/ReportExporter.tsx:660`](file:///f:/proj-fmea/frontend/src/features/reports/ReportExporter.tsx), [`frontend/src/features/pfmea/PfmeaWorkspace.tsx:1580`](file:///f:/proj-fmea/frontend/src/features/pfmea/PfmeaWorkspace.tsx), [`versions/v0.5.7.md:1`](file:///f:/proj-fmea/versions/v0.5.7.md)

### 2026-09-18 — ADR-030: Codebase Root Hygiene, Documentation Reorganization & Agentic Architecture Scaffolding
- **Context**: The root workspace contained loose design prompts, duplicate asset directories (`Pictures/`, `icons/`, `structure_tree_icons/`), a corrupted filename (`deplopyment guide`), and exposed plaintext database credentials (`FMEA Credentials.txt`). Furthermore, `.agents/` lacked full 7-subsystem compliance (missing Tier 1 anti-drift rules, Tier 2 engineering personas, Tier 3 deep-domain specifications, and directory README navigation indices).
- **Decision**: Sanitized credentials from root and created `backend/.env.example`; consolidated all specifications, guides, deployment notes, and prompts into organized `docs/` subfolders (`docs/specs/`, `docs/deployment/`, `docs/guides/`, `docs/prompts/`, `docs/assets/`); completed the `.agents/` 7-subsystem architecture with `.agents/rules/no_drift_clarification.md`, Tier 2 personas (`developer.md`, `reviewer.md`, `tester.md`, `architect.md`), Tier 3 memory specifications (`domain_algorithms.md`, `external_providers.md`, `data_schemas.md`), and comprehensive navigation catalogs across all subdirectories.
- **Consequence**: Pristine repository root; eliminated security vulnerability from exposed credentials; zero AST code scanning overhead for AI agents through living deep-domain memory; strict anti-drift and halt-on-uncertainty protocols active.
- **Source**: [`.agents/rules/no_drift_clarification.md:1`](file:///f:/proj-fmea/.agents/rules/no_drift_clarification.md), [`.agents/memory/domain_algorithms.md:1`](file:///f:/proj-fmea/.agents/memory/domain_algorithms.md), [`.agents/memory/external_providers.md:1`](file:///f:/proj-fmea/.agents/memory/external_providers.md), [`.agents/memory/data_schemas.md:1`](file:///f:/proj-fmea/.agents/memory/data_schemas.md), [`.agents/AGENTS.md:115`](file:///f:/proj-fmea/.agents/AGENTS.md)

### 2026-10-17 — ADR-031: Complete Frontend Overhaul to Industrial Quality Engineering Platform
- **Context**: The public-facing web experience on fmeapex.online used generic AI-generated templates ("AI slop") featuring drifting rainbow blur keyframes, rotated sticker badges, emoji headers, and disconnected telemetry. In addition, programmatic SEO routes (/fmea/:industry, /vs/:competitor, /glossary/:term) were isolated without header/footer navigation, and backend cold starts lacked live user feedback per AGENTS.md Rule 4.1.
- **Decision**: Ground-up frontend revamp establishing a handcrafted industrial design system (`.bg-tech-grid`, `.card-industrial`, `.fmea-range`, `#0F172A` ink, `#FF5500` accent); created `BackendWarmupContainer` in `useBackendWarmup.ts` wrapping `App.tsx` for live `/health` telemetry; rebuilt `SiteHeader.tsx` and `SiteFooter.tsx` with smooth-scrolling anchors, solutions mega-menu, and full site matrix; overhauled `LandingPage.tsx` around the AIAG-VDA 2019 7-step method, spreadsheet comparison matrix, and tactile Action Priority risk simulator; unified all programmatic SEO and blog pages under shared navigation.
- **Consequence**: Professional, industrial-grade user experience reflecting true engineering rigor; zero navigation dead-ends; real-time visibility into backend cold-start states; flawless production compilation across frontend and backend.
- **Source**: [`frontend/src/index.css:1`](file:///f:/proj-fmea/frontend/src/index.css), [`frontend/src/components/site/SiteHeader.tsx:1`](file:///f:/proj-fmea/frontend/src/components/site/SiteHeader.tsx), [`frontend/src/features/landing/LandingPage.tsx:1`](file:///f:/proj-fmea/frontend/src/features/landing/LandingPage.tsx), [`versions/v0.6.0.md:1`](file:///f:/proj-fmea/versions/v0.6.0.md)
### 2026-10-18 — ADR-032: High-Density Ergonomics, 24h Guest Sandbox Lifecycle, Real Audit Stream & 7-Step Tutorial
- **Context**: The portal dashboard displayed fake static activity rather than genuine audit logs. Vertical space was consumed by oversized buttons, tall cards, and floating overlays, making workspaces scroll-heavy on 13" laptop screens (1280x800). Guest accounts lacked clear lifecycle boundaries, risk isolation, and guided onboarding.
- **Decision**: Connected the dashboard activity feed to live PostgreSQL `audit_log` records via `GET /api/v1/audit-logs/recent`. Condensed the dashboard layout (72px KPI cards, compact buttons, 46px collapsed DocumentHeader, docked horizontal pan slider into pagination toolbar). Enforced browser-only guest sessions (`sessionStorage`) with access strictly limited to 1 pre-filled Reference Demo project (`E Vacuum Pump`) and 1 custom project with a strict 24-hour lifetime. Implemented a backend auto-archival engine (`autoArchiveExpiredGuestProjects`) to rename and archive $>24$h guest projects for Admin review only. Created `FmeaTutorialGuide.tsx` providing an interactive 7-Step Guided Help walkthrough with strictly two buttons (`Next` and `Skip All`). Fixed layout clipping across 1280x800 to 2560x1440 viewports (PFD step truncation, PFMEA sticky bleed-through, Control Plan tolerance clamping).
- **Consequence**: Full ergonomics density on 13" screens without vertical scrolling; safe and transparent 24h guest onboarding; live auditable activity stream; complete multi-viewport fidelity for MVP launch.
- **Source**: [`backend/src/modules/audit/audit-log.service.ts:1`](file:///f:/proj-fmea/backend/src/modules/audit/audit-log.service.ts), [`backend/src/modules/project/project.service.ts:80`](file:///f:/proj-fmea/backend/src/modules/project/project.service.ts), [`frontend/src/features/projects/components/FmeaTutorialGuide.tsx:1`](file:///f:/proj-fmea/frontend/src/features/projects/components/FmeaTutorialGuide.tsx), [`frontend/src/features/projects/ProjectList.tsx:1`](file:///f:/proj-fmea/frontend/src/features/projects/ProjectList.tsx), [`versions/v0.7.0.md:1`](file:///f:/proj-fmea/versions/v0.7.0.md)
### 2026-10-18 — ADR-033: Backend Container Security Remediation & Dependency Overrides
- **Context**: During production Docker / container build steps, `npm install` flagged 12 vulnerabilities (4 moderate, 6 high, 2 critical) across transitive dependencies (`proxy-addr`, `handlebars`, `multer`, `fast-uri`, `brace-expansion`, `browserslist`, `qs`, `sprintf-js`, `argparse`).
- **Decision**: Upgraded vulnerable runtime dependencies via `npm audit fix` and added a targeted `"overrides": { "js-yaml": "^4.1.0" }` in `backend/package.json` to eliminate the remaining transitive `sprintf-js` / `argparse` vulnerability from `@istanbuljs/load-nyc-config`.
- **Consequence**: Zero vulnerabilities (`found 0 vulnerabilities`) on `npm audit` across both production and development dependency trees. Clean container builds without vulnerability warnings.
- **Source**: [`backend/package.json:89`](file:///f:/proj-fmea/backend/package.json), [`versions/v0.8.0.md:1`](file:///f:/proj-fmea/versions/v0.8.0.md)

### 2026-10-18 — ADR-034: CIA Triad Authentication Flow, Zero Credential Exposure & Instant Direct Guest Access
- **Context**: The `/login` view exposed administrative credentials via a "Fill Admin Credentials" shortcut and presented an intermediate screen before allowing visitors into the application, violating the CIA Triad (Confidentiality and Availability).
- **Decision**: Purged all exposed credentials and shortcuts from client-side code; automated direct guest authentication so that opening the app or clicking "Launch Sandbox" immediately initializes a session and opens the workspace dashboard; configured the Corporate & Administrator Sign In window to appear strictly upon explicit sign-out from the dashboard, featuring clean, unpopulated credential fields and an instant fallback to the guest sandbox.
- **Consequence**: Full adherence to CIA Triad security principles; zero credential leaks in client code; frictionless onboarding for public visitors; secure, segregated sign-in gate for administrators.
- **Source**: [`frontend/src/features/auth/Login.tsx:1`](file:///f:/proj-fmea/frontend/src/features/auth/Login.tsx), [`frontend/src/features/auth/AuthContext.tsx:310`](file:///f:/proj-fmea/frontend/src/features/auth/AuthContext.tsx), [`frontend/src/components/Layout/AppShell.tsx:315`](file:///f:/proj-fmea/frontend/src/components/Layout/AppShell.tsx), [`frontend/src/app/router.tsx:31`](file:///f:/proj-fmea/frontend/src/app/router.tsx), [`versions/v0.8.1.md:1`](file:///f:/proj-fmea/versions/v0.8.1.md)

### 2026-10-18 — ADR-035: PFD Default Collapsed State, Linked 7-Step Walkthrough Guide & Real Audit Feed
- **Context**: Process Flow Diagram (PFD) operations defaulted to fully expanded mode, creating excessive vertical whitespace and heavy table scrolling. The onboarding tutorial was rendered as an isolated single modal rather than a contextual companion linked to each analytical step. The dashboard Recent Activity feed displayed artificial guest deletion entries and raw truncated UUIDs. Landing page header contained warming status badges and the hero section featured an artificial dark toy mockup.
- **Decision**: Initialized all PFD steps to collapsed by default in `PfdWorkspace.tsx` (`setCollapsedSteps`) with single-line row ergonomics; rebuilt `FmeaTutorialGuide.tsx` into a persistent floating companion card docked at bottom-right, linked to each of the 7 AIAG-VDA steps with direct route navigation and strictly two primary buttons (`Next` and `Skip All`); cleaned backend `audit-log.service.ts` to exclude ephemeral maintenance records and join `DocumentRevision` to render 100% genuine engineering activities; purged warming badges from `SiteHeader.tsx` and rebuilt `FmeaStudioPreview.tsx` to faithfully replicate the actual light enterprise app screens.
- **Consequence**: High-density screen utilization without vertical scrolling; seamless step-by-step guidance adhering to the AIAG-VDA 2019 standard; transparent, audit-ready activity stream; visual marketing alignment with real software interfaces.
- **Source**: [`frontend/src/features/pfd/PfdWorkspace.tsx:180`](file:///f:/proj-fmea/frontend/src/features/pfd/PfdWorkspace.tsx), [`frontend/src/features/projects/components/FmeaTutorialGuide.tsx:1`](file:///f:/proj-fmea/frontend/src/features/projects/components/FmeaTutorialGuide.tsx), [`backend/src/modules/audit/audit-log.service.ts:75`](file:///f:/proj-fmea/backend/src/modules/audit/audit-log.service.ts), [`frontend/src/components/site/FmeaStudioPreview.tsx:1`](file:///f:/proj-fmea/frontend/src/components/site/FmeaStudioPreview.tsx), [`versions/v0.8.2.md:1`](file:///f:/proj-fmea/versions/v0.8.2.md)

### 2026-10-18 — ADR-036: Visual Excel Retirement Animated Showcase & Light-Theme AP Dual Simulator
- **Context**: The public landing page featured a dark, isolated simulator widget (`#0B0F19`) that looked dated and disconnected from the platform's core mission: convincing engineering leaders to ditch fragile corporate Excel sheets. It lacked compelling visual proof of why spreadsheet FMEA fails during audits and how deterministic quality intelligence replaces it.
- **Decision**: Created `ExcelRetirementShowcase.tsx` featuring an animated, multi-mode visual comparison between an authentic corporate Excel sheet (broken `#REF!` errors, unaligned columns, hidden hazards, version sprawl) and the connected FMEApex Golden Thread (`PFD ↔ PFMEA ↔ Control Plan`). Overhauled `RiskCalculatorWidget.tsx` into a modern light-theme enterprise tool featuring a side-by-side comparative breakdown between the legacy Excel RPN formula (`RPN = S × O × D`) and the deterministic AIAG-VDA 2019 Action Priority engine, with tactile range sliders and 1-click AI closed-loop optimization simulations.
- **Consequence**: Unmistakable visual communication of the platform's core value proposition; interactive education on why OEM auditors banned arbitrary RPN cutoffs; cohesive light enterprise aesthetic throughout the marketing canvas.
- **Source**: [`frontend/src/features/landing/ExcelRetirementShowcase.tsx:1`](file:///f:/proj-fmea/frontend/src/features/landing/ExcelRetirementShowcase.tsx), [`frontend/src/features/landing/RiskCalculatorWidget.tsx:1`](file:///f:/proj-fmea/frontend/src/features/landing/RiskCalculatorWidget.tsx), [`frontend/src/features/landing/LandingPage.tsx:560`](file:///f:/proj-fmea/frontend/src/features/landing/LandingPage.tsx), [`versions/v0.8.3.md:1`](file:///f:/proj-fmea/versions/v0.8.3.md)

### 2026-10-18 — ADR-037: Full-Width Light Enterprise Architecture for Excel Retirement Showcase
- **Context**: An initial implementation of `ExcelRetirementShowcase.tsx` wrapped the data comparison table inside an isolated, pitch-black container (`bg-slate-950 p-8 min-h-[440px]`). On standard desktop screens, this produced a jarring letterboxed dark void that made the table appear shrunken, wasting significant space and breaking visual continuity with the surrounding light enterprise layout.
- **Decision**: Refactored `ExcelRetirementShowcase.tsx` into a full-width, light enterprise canvas with crisp micro-borders (`border-slate-200/90`), authentic Excel spreadsheet accents (`#107C41` green title bar, `#REF!` formula bar, and high-visibility red risk callouts), and unified tab navigation (`Old Excel Sheet`, `FMEApex Engine`, `Side-by-Side`). Purged unused imports, verified zero TypeScript / Vite bundling warnings across the frontend and backend, and validated responsive rendering across 13" laptop (1280x800) through 27" desktop (2560x1440) viewports via Puppeteer MCP.
- **Consequence**: Seamless visual harmony across the entire landing page; eliminates jarring void containers; establishes high-craft, high-density industrial quality aesthetics with zero layout clipping.
- **Source**: [`frontend/src/features/landing/ExcelRetirementShowcase.tsx:1-512`](file:///f:/proj-fmea/frontend/src/features/landing/ExcelRetirementShowcase.tsx), [`versions/v0.8.4.md:1`](file:///f:/proj-fmea/versions/v0.8.4.md)



### 2026-10-19 — Contextual workflow guidance and truthful activity (local, unreleased)
- Context: A guide rail duplicated the entry button, displaced programs, and did not follow creation actions. Activity formatting included filler events and hard-coded demo descriptions beyond a trial viewer’s project scope.
- Decision: Replace the rail with collision-aware coachmarks anchored to real controls and actual wizard/route state. Compact the dashboard, hide trial archives, and use a clear Trial workspace identity. Return only viewer-scoped recorded audit events, with real project attribution, refresh states, and collection-POST audit IDs.
- Validation: focused backend regression tests cover audit-only behavior, guest/owner/admin scope, inaccessible events, actual attribution, bounds, and creation IDs; browser checks cover validation, contextual prompts, all workflow chapters, and responsive layout.
- Sources: `frontend/src/features/projects/components/FmeaTutorialGuide.tsx:1`, `frontend/src/features/projects/ProjectList.tsx:1`, `backend/src/modules/audit/audit-log.service.ts:1`, `backend/src/common/audit.interceptor.ts:1`. Release ledger remains pending a user-confirmed version under [versions/README.md](../../versions/README.md); no release file or existing version entry changed.


## 2026-10-19 — Rule provenance, iterative drafts, permanent public identity (unreleased)
Status: Accepted by user's full-plan approval; implementation integration in progress.
Decision: Keep verified external/customer rules separate from product policy and actual implementation. Allow iterative drafts; preserve immediate integrity/permission/lock checks and evaluate review/release completeness. Preserve valid AP mappings while rejecting fractions; browser/backend parity does not prove handbook conformity. Use revision-owned explicit PFD topology rather than guessed routes. Reserve short public trial handles permanently in a global immutable ledger with no tenant/user cascade.
Evidence: `.agents/context/engineering-rule-register.md:1`, `backend/src/modules/auth/public-handle.ts:1`, migration `20261019090000_public_handles/migration.sql:1`, `backend/src/modules/pfmea/ap-calculator.spec.ts:1`.
Release: Not yet versioned/published; append a new versions ledger only after user confirmation. Existing release ledgers remain unchanged.

## 2026-10-19 — Publish connected quality release 0.10.0
User explicitly confirmed the minor version and authorized origin/main publication. See [v0.10.0](../../versions/v0.10.0.md) for immutable release scope, migrations and verification. Release commit 8318235 was pushed and remote SHA verified. Preserve baseline-backed migration history and permanent username reservations; production deployment completion and external handbook verification are separate checks. The current focused handoff is ACTIVE_STATE.md.


## 2026-10-20 — Controlled engineering aggregates (unreleased)

Adopt dedicated revision-owned DFMEA and phase-specific Control Plan aggregates with transaction-held parent revision protection and optimistic versions. Preserve legacy records as explicit review/mapping inputs. Replace destructive generation with fingerprinted preview/resolve/apply and retain manual execution decisions. Independent AP numerical validation is not available from complete authorized sources; keep unverified provenance visible. Source-approval/coverage defaults and independent action verification are product policies. Evidence: `docs/specs/controlled-engineering-delivery.md`, `backend/src/common/engineering-access.ts:1`, `backend/src/modules/dfmea/dfmea.service.ts:1`, `backend/src/modules/control-plan/control-plan-document.service.ts:1`. No new version ledger created: existing published version remains 0.10.1; commit/publication requires a new confirmed version.

## 2026-10-20 — User-confirmed v0.11.0 publication
The user requested Git push, README sync and handoff and explicitly confirmed minor version0.11.0. Release ledger: versions/v0.11.0.md:1. Synchronize all manifests/lockfiles and commit controlled engineering implementation with its tests, additive migration, evidence limits and Graphify output. Numerical standards verification and11 legacy sampling decisions remain open; publication does not certify conformity.

##2026-10-20 — PFD symbol and routing presentation (unreleased)
User approved dual modes with Manufacturing default, explicit table symbols, reviewed sequence generation and whole publicly discoverable reference inventory. Introduced graphv2 and additive symbol columns; renderer/export geometry shared. No route/equipment guessing, sourceSVGshipping or exact-standard glyph claims. Public editable native exports remain unavailable; vector previews archived separately. Runtime/browser/PDF acceptance recorded in docs/specs/pfd-symbols-delivery.md. No release version or Git publication authorized.

## 2026-10-20 — Portable researched implementation handoffs
User requested `handoff_plan` in personal `~/.agents/skills` for compatible harnesses, project artifacts in `.agents/handoff_plan/<slug>/PLAN.md`, startup discovery/implementation confirmation, user clarification of material uncertainty and verified completion in the same plan. Implemented canonical rules in .agents/AGENTS.md:1 and folder index .agents/handoff_plan/README.md:1. Existing harness entry adapters remain pointers. Status does not grant publication/production permissions; preserve valid prior authorization and avoid repeated prompts. This instruction update is uncommitted; published release remains versions/v0.12.0.md:1.


## 2026-10-21 — Classic manufacturing symbols restoration (v0.12.1)
User confirmed patch version bump to 0.12.1 and requested git push. Restored authentic classic manufacturing outlines (Operation = circle, Inspection = square, Transport = arrow, Storage = inverted triangle, Decision = diamond, Rework = pentagon outline, Combined = circle-in-square) and route markers (marker.wip, marker.reject) across 417 catalog symbols. Added compact PFD table cell, single primary activity selection, and atomic step patching. Full release ledger: `versions/v0.12.1.md`.

## 2026-10-21 — PFD multi-flow symbols restoration & architectural invariants (v0.12.2)
User confirmed patch version bump to 0.12.2 and requested git push. Restored multi-flow symbol support in PFD tables per AIAG-VDA 2019 / ASME process chart standards, eliminating the artificial single-symbol restriction caused by conflating flowchart node geometry with table attributes. Codified Rule 2.1.1 in `.agents/AGENTS.md` §2.1 and hard invariant in `.agents/agents/pfd/AGENT.md`. Added side-by-side SVG badges in table cells, non-destructive multi-select toggling in BrowseShapesDialog and Step Form Drawers, and formatted multi-activity Excel export. Full release ledger: `versions/v0.12.2.md`.

## 2026-10-21 — Demonstration-led homepage release (v0.12.3)
User requested push and explicitly confirmed patch release 0.12.3. The approved homepage uses a local engineering thread and deliberate propose/review/apply interaction, never production writes or automatic risk reduction. Preserve public identity, incoming anchors, quote prefill, contact compatibility and canonical trial entry. Frontend/backend builds, focused lint and desktop/mobile/keyboard browser verification passed; reduced-motion CSS reviewed without preference emulation. No schema or dependency-resolution changes. Release ledger: [v0.12.3](../../versions/v0.12.3.md); evidence: `docs/specs/homepage-story-delivery.md`.

## 2026-10-21 — Guest sign-in history & project card presentation release (v0.12.4)
User confirmed patch version bump to 0.12.4 and requested git push. Corrected guest session tracking so passwordless guest creation, user signup, and try-token paths transactionally record initial lastLoginAt and lastActivityAt. Replaced fire-and-forget login timestamp updates with awaited monotonic writes. Updated UserService.checkAndArchiveInactiveUsers to evaluate all activity signals (createdAt, lastLoginAt, and lastActivityAt) against the 15-day cutoff, preventing active guests with recent activity from being prematurely archived. Overhauled AdminPanel.tsx with truthful tiered display ("Last Sign-in", "Sign-in not recorded", "Not recorded"). Overhauled ProjectList.tsx to remove the erroneous "PFMEA" phase badge and fixed "24h trial" chip, applying a subtle pale yellow background (#fffdf0 / #fff9db) and border (#e7d69c / #d4bc78) to guest-origin project cards without distinguishing text labels. Fixed ProjectService.replicate from copying document families into project phase metadata. Release ledger: [v0.12.4](../../versions/v0.12.4.md); plans: [.agents/handoff_plan/guest-login-activity/PLAN.md](../handoff_plan/guest-login-activity/PLAN.md) and [.agents/handoff_plan/project-card-badges/PLAN.md](../handoff_plan/project-card-badges/PLAN.md).
