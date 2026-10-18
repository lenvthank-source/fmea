# Blackboard — Portable Orchestration Bus

Shared by all agents and the head orchestrator in any IDE/model. Append-only; prune entries older than 30d.

## Protocol

- **Orchestrator** appends `## <ISO8601> — <intent> — <agent> — <status> — priority:N` with `owns:`, `artifacts:`, `depends_on:`.
- **Specialists** update status `pending → in_progress → completed|rejected|superseded` and append `> <agent> → <target>: <message>`.
- **Human gate**: orchestrator blocks until `APPROVED` line appears under a unified plan entry.
- **Conflict**: `> orchestrator: granting allow_shared to <agent> for <reason>` required for `allow_shared` writes.

## Format

```markdown
## 2026-08-29T10:00Z — Add S/O/D column — pfd-agent — pending — priority:2
- owns: backend/src/modules/pfd/**, frontend/src/features/pfd/**
- artifacts: []
- depends_on: [auth-agent]
> pfd-agent → orchestrator: started — reading backend/src/modules/pfd/pfd.service.ts:1
```

## Entries (newest first)

## 2026-10-18T09:05Z — PFD Default Collapsed, Linked 7-Step Walkthrough Guide, Real Audit Feed & Actual App Screen Mockup (v0.8.2) — orchestrator — completed — priority:1
- owns: frontend/src/features/pfd/**, frontend/src/features/projects/components/FmeaTutorialGuide.tsx, backend/src/modules/audit/audit-log.service.ts, frontend/src/components/site/**, frontend/src/features/landing/**, frontend/src/components/Layout/AppShell.tsx, frontend/src/app/router.tsx, versions/**
- artifacts: [versions/v0.8.2.md]
- depends_on: []
> orchestrator → all-agents: Implemented and visually verified across all viewports:
> 1. PFD Workspace default collapsed state (setCollapsedSteps) with single-line row ergonomics to eliminate vertical whitespace and table scrolling.
> 2. Docked 7-step guide (FmeaTutorialGuide.tsx) linked to each screen with direct route navigation and strictly two primary buttons: 'Next' and 'Skip All'.
> 3. Real PostgreSQL audit stream in Recent Activity (purged ephemeral guest user deletion logs and resolved human-readable DocumentRevision/Project entities).
> 4. Cleaned landing page header of API warming badges and overhauled hero preview (FmeaStudioPreview.tsx) to faithfully replicate actual light-theme enterprise app screens.
> 5. Green compilation across NestJS backend and Vite/TypeScript frontend; verified via Puppeteer screenshots.

## 2026-10-18T07:55Z — CIA Triad Remediation, Zero Credential Exposure & Instant Guest Access (v0.8.1) — orchestrator — completed — priority:1
- owns: frontend/src/features/auth/**, frontend/src/components/Layout/AppShell.tsx, frontend/src/app/router.tsx, frontend/src/components/site/SiteHeader.tsx, frontend/src/features/landing/RiskCalculatorWidget.tsx, versions/**
- artifacts: [versions/v0.8.1.md]
- depends_on: []
> orchestrator → all-agents: Resolved CIA Triad Confidentiality violation on /login. Completely purged hardcoded admin credentials and 'Fill Admin Credentials' button from client-side code. Opening the app or clicking 'Launch Sandbox' directly and frictionlessly logs into the Guest Sandbox. The Administrator Sign In window is only presented after an explicit sign-out action from within the app shell, with clean empty inputs and an immediate fallback back to guest sandbox. Bumped version to v0.8.1.


## 2026-10-18T07:28Z — Backend Container Security Remediation & v0.8.0 Release — orchestrator — completed — priority:1
- owns: backend/package.json, backend/package-lock.json, versions/**
- artifacts: [versions/v0.8.0.md]
- depends_on: []
> orchestrator → all-agents: Patched all 12 vulnerabilities (4 moderate, 6 high, 2 critical) flagged during backend container build across proxy-addr, handlebars, multer, fast-uri, brace-expansion, browserslist, and qs. Configured js-yaml override in backend/package.json to eliminate sprintf-js/argparse DoS. Verified npm audit reports 'found 0 vulnerabilities'. Bumped semver to v0.8.0.

## 2026-10-18T07:10Z — MVP Public Launch: Ergonomics, Real Activity, Guest 24h & 7-Step Tutorial — orchestrator — completed — priority:1
- owns: backend/src/modules/audit/**, backend/src/modules/project/**, frontend/src/features/projects/**, frontend/src/features/auth/**, frontend/src/components/**, frontend/src/features/pfd/**, frontend/src/features/pfmea/**, frontend/src/features/control-plan/**
- artifacts: [C:\Users\Palak\.gemini\antigravity\brain\408b102d-b73a-4ff7-be95-a235a863ce80\fmea_mvp_ergonomics_and_access_plan.md]
- depends_on: []
> orchestrator → all-agents: Completed and verified:
> 1. Real Audit Activity feed hooked to GET /api/v1/audit-logs/recent.
> 2. Admin (lenvthank@gmail.com) views all projects platform-wide and can permanently delete any project.
> 3. Guest accounts use browser-only sessionStorage, view 1 pre-filled Reference Demo project (E Vacuum Pump), and can create 1 custom project with 24h lifespan.
> 4. Auto-archival engine tested: >24h projects auto-archived as [Guest Archive - <User>] <Name> (<DateTime>) and visible only to Admin.
> 5. 7-Step Guided Help Tutorial implemented (FmeaTutorialGuide.tsx) with strictly two controls on every step: "Next" and "Skip All".
> 6. Ergonomics & layout bugs fixed across 1280x800, 1440x900, 1920x1080, and 2560x1440 viewports (BUG-01 through BUG-08).
> 7. Both frontend and backend compile clean (0 errors); all live endpoints healthy.

## 2026-08-29T10:00Z — Mesh scaffold — orchestrator — completed — priority:0
- owns: .agents/agents/**, .agents/context/routing.md, .agents/memory/blackboard.md
- artifacts: [.agents/agents/orchestrator/AGENT.md:1, .agents/context/routing.md:1, .agents/memory/blackboard.md:1]
- depends_on: []
> orchestrator → all-agents: Portable mesh scaffold complete — 10 specialists + routing + bus + dispatch. Ready for tri-compat (VS Code/Cursor/Opencode/Gemini/Antigravity). See .agents/context/routing.md:1 for dispatch.
