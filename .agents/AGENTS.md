# Project Rules: FMEA Quality Platform

This document compiles the core architectural rules, compliance guidelines, and agentic behavior guidelines for the FMEA Quality Platform. All agents and subagents must adhere to these rules when modifying code or design assets.

---

## 1. General Architectural Rules

### 1.1 Multi-Tenant Data Isolation
- **Tenant Isolation**: Every database query on user data, projects, or documents must contain a `tenantId` filter. Cross-tenant leakage is a critical security violation.
- **Row-Level Security (RLS)**: Setting Postgres session variables (`SET app.current_tenant_id = {tenantId}` and `SET app.current_user_id = {userId}`) is mandatory for direct SQL queries. Tenant-owned data retains lifecycle constraints. Global permanent public-handle reservations deliberately have no user/tenant cascade.

### 1.2 Data Integrity & Validation
- **Iterative Drafts / Review Completeness**: Permit incomplete drafts and revisiting activities. Enforce references, permissions, isolation, integer inputs and locks immediately; completeness before review/release.
- **Rating Ranges**: All risk evaluations (Severity, Occurrence, Detection) must strictly occupy the integer range [1, 10].
- **Action Priority (AP)**: AP (High, Medium, Low) is a lookup-based read-only field derived from the configured executable AP profile; numerical handbook conformity remains pending independent verification and cannot be overridden manually.
- **Severity Inheritance**: FMEA row severity is inherited from the highest severity value of its associated failure effects.

### 1.3 Role-Based Access Control (RBAC)
Enforce granular permissions matching the active JWT user payload. The 5 roles and their permission scopes are:
- **Admin**: `admin.config` (manage tenant configurations and SSO integrations).
- **Quality Engineer**: `pfmea.create`, `pfmea.edit`, `dfmea.create`, `dfmea.edit`, `pfd.create`, `pfd.edit`, `cp.create`, `cp.edit`, `action.create`, `ai.use`.
- **Reviewer**: `revision.review`, `action.view`.
- **Approver**: `revision.approve`, `action.view`.
- **Viewer**: `document.view`, `action.view`.

### 1.4 Failure Chain Completeness
- **Completeness Rule**: Before review/release flag missing effects/causes; allow incomplete drafts.
- **Control Linkage**: At review/release report missing applicable prevention/detection controls.

### 1.5 Rule authority
The [engineering rule register](context/engineering-rule-register.md) distinguishes sources, customer additions, product policies and gaps. Prior strict stage-entry claims and unverified AP threshold summaries are superseded. Physical routing differs from PFMEA structure; results documentation is broader than revision locking.

---

## 2. Process-Specific Customization Rules

### 2.1 PFD ↔ PFMEA Bidirectional Linking
- **Verification Rule**: A PFMEA row cannot reference a process step that is missing from the Process Flow Diagram (PFD).
- **Orphan Flagging**: Flag manufacturing activities lacking analysis; connectors require no invented FMEA rows. Record justified exclusions.
- **Special Characteristics Flow-Down**: Special/critical characteristics identified in the DFMEA must flow down to the PFMEA as mandatory coverage items.

### 2.2 Control Plan (CP) Synchronization
- **Bidirectional Mapping**: Current CP sync is explicitly triggered from PFMEA/PFD; CP PATCH updates CP only. Automatic reverse propagation is not implemented. Future sync must protect approved revisions and expose conflicts.
- **Control Integrity**: Prevention and detection measures must be categorized distinctly to prevent calculation overlap.

### 2.3 Corrective Actions & Life Cycle
- **High AP Review**: Document team review/action-or-justification under applicable customer/company policy. Do not universally mandate a new action from every High label.
- **Closure Policy / Gap**: Review evidence and justified after ratings. Current ActionService does not enforce a complete evidence/state-machine contract; upload size/type validation remains.
- **Junction Tracking**: Track and store before/after ratings in `action_fmea_link` junction rows.
- **Action States**: Enforce transition flow: `Open` → `InProgress` → `Completed` → `Verified` → `Closed` / `Cancelled`.

### 2.4 Revision protection and approval records
- **Review Segregation**: A revision creator cannot act as its reviewer or approver.
- **Immutability**: Once a revision has `locked_at` set, all write mutations to its contents are permanently blocked.
- **Audit Trails**: Preserve recorded revision transitions, approver identity, decision and timestamps. Current approval stores password-confirmed decisions and locks; a cryptographic signature hash/partitioned immutable audit guarantee is not established by this contract. Verify actual database constraints before claiming regulatory support.

---

## 3. AI Copilot, Webhooks & Embedding Rules

### 3.1 Human-in-the-Loop Suggestion Review
- AI recommendations must be stored in the `ai_suggestion` table with status `proposed`.
- AI suggestions must never directly modify live FMEA rows without an explicit user acceptance action (`accepted` or `accepted_modified`).
- Auto-expire proposed suggestions older than 30 days via a daily cron task.

### 3.2 Embedding Partitioning
- Vector similarity searches must filter strictly by `tenant_id` within Neon.
- Indexing must trigger asynchronously upon document revision approval using the BullMQ `embedding` queue.
- Neon pgvector HNSW index configurations must remain locked at: M=16, ef_construction=64.

### 3.3 Webhook Integrations Security
- **Outbound Webhooks**: All outbound webhook payloads must be signed using HMAC-SHA256, sending the signature in the `X-FMEA-Signature` header.
- **Inbound Webhooks**: Inbound API webhook callbacks must verify active tenant authorization tokens.

---

## 4. Landing Page, Guest Access & Feedback System Rules

### 4.1 Cold-Start & Health Monitoring
- All frontend entry points must invoke the `useBackendWarmup` hook on mount to ping `/health`.
- CTA buttons on the landing page and login gates must handle state appropriately depending on `isBackendReady` (e.g. show shimmer/loader status and prepare user).

### 4.2 Guest Account Lifecycles
- Guest accounts belong strictly to the `guest-tenant` subdomain workspace and have standard read/write permissions matching a Quality Engineer role.
- Guest sessions must carry `isGuest: true` in the JWT claims payload.
- Inactive guest accounts (no logins for 15 days) must be soft-archived rather than fully deleted.

### 4.3 Contextual Feedback & Error Boundary
- A global `ErrorBoundary` must wrap the main client-side AppRouter to intercept uncaught runtime exceptions and prompt the user to submit an error feedback report.
- The feedback submission payload must automatically extract the current page URL, document title, client browser info, and screen resolutions, and send them to `/auth/feedback`.

---

## 5. Versioning & Release Rules

- **Single source of truth**: root `package.json#version`. Before any GitHub commit/publish, the agent MUST:
  1. **Confirm with the user** the intended version bump (never auto-bump silently).
  2. Bump semver in root `package.json` and keep `backend/package.json` + `frontend/package.json` in sync.
  3. Create a matching `versions/v<MAJOR.MINOR.PATCH>.md` ledger file (template in `versions/README.md`) that is both human-readable and agent-parseable (fixed field order, `path:line` file references).
- The `versions/` folder is append-only; never edit an existing version file, add a new one.
- Version files are the auditable map of product change — keep them concrete (what changed, why, which files), not marketing copy.

### 5.1 Non-Blocking Git Push Protocol (Windows / Agent Subshells)
- **Avoid GCM Hangs**: System Git on Windows defaults to `credential.helper=manager` (GUI Git Credential Manager), which hangs on modal/tty prompts when run inside background subshells.
- **Mandatory Helper**: Always enforce `credential.helper=wincred` locally (`git config --local credential.helper wincred`) so Git reads securely from the Windows Credential Store without modal interruption.
- **Diagnostics & Rules**: Detailed troubleshooting and configuration steps are codified in [rules/git.md](file:///f:/proj-fmea/.agents/rules/git.md).

---

## 6. Agent Knowledge & Maintenance Rules — Keep `.agents/` Fresh

### 6.1 What lives in `.agents/` (single source; no CLAUDE/GEMINI/.cursor duplicates)
- **Root:** `.agents/AGENTS.md` (this file, always loaded) + `.agents/README.md` (progressive-loading manual).
- **Context (domain knowledge):** `.agents/context/{project,architecture,domain,glossary}.md` + new `context/{data-model,api-contracts,permissions,deployment,versioning}.md` — full stack, data model (41 Prisma models), API DTOs, RBAC matrix, deployment (Render/Neon/R2/Podman), version ledger.
- **Rules (stable):** `.agents/rules/{architecture,coding-style,security,testing,git,ui-theme,no_drift_clarification}.md` + `rules/README.md`.
- **Memory:** `.agents/memory/decisions.md` (ADRs), `memory/blackboard.md` (mesh bus), `memory/{domain_algorithms,external_providers,data_schemas}.md` (deep domain specs) + `memory/README.md`.
- **Skills:** `.agents/skills/*` — execution contracts (`fmea-authoring`, `pfd-pfmea-linking`, `control-plan-sync`, `corrective-actions`, `revision-approval`, `vector-indexing`, `sso-tenant-context`, `agentic-architecture-scaffold`, `readme_sync`, etc.) + `skills/README.md`.
- **Workflows/Checklists/Prompts/Agents:** `.agents/workflows/*.md` + `workflows/README.md`, `.agents/checklists/*.md` + `checklists/README.md`, `.agents/prompts/*.md`, `.agents/agents/*.md` + `agents/README.md`.

### 6.2 When to update `.agents/` (mandatory)
Update immediately when changes affect:
- Architecture or module boundaries (`context/architecture.md`, `rules/architecture.md`)
- Public API routes, DTOs, pagination (`context/api-contracts.md`)
- Database schema / Prisma models / indexes (`context/data-model.md`, `context/architecture.md`)
- Auth, RBAC, permissions, JWT/refresh/inactivity (`rules/security.md`, `context/permissions.md`)
- Build/dev commands, env vars, deployment (`context/deployment.md`, `context/project.md`)
- Domain terminology, AP/RPN logic, 7-step gating (`context/domain.md`, `context/glossary.md`)
- Major dependencies (React, Nest, Prisma, MUI, pgvector)
- Revision workflow, immutability, audit (`memory/decisions.md`, `context/versioning.md`)
- Deletion UX, session persistence, import wizards (`AGENTS.md` §1-2, `skills/*`)

Do **NOT** update for routine bugfixes that don't touch the above.

### 6.3 How to update
1. Edit the **minimal** context/rules file that is stale; keep diff small and add `path:line` evidence.
2. Append ADR to `memory/decisions.md` with date + `versions/vX.Y.Z.md` link.
3. Run the readme sync: `python .agents/skills/readme_sync/scripts/sync_readmes.py` and verify per-directory `README.md` reflects new structure (token-optimized index).
4. Ensure builds stay green: `backend npx tsc --noEmit && nest build` + `frontend npx tsc -b && vite build`.
5. Commit `.agents/` with version bump (respect `.gitignore` allow-list — force-add via `git add -f .agents/...` if ignored).

### 6.4 Hygiene
- **Single Source of Truth**: `.agents/` is the single source of domain knowledge and rules. Dedicated entry adapters (`CODEX.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, `GEMINI.md`) are authorized strictly as canonical lightweight pointers directing any external harness directly to `.agents/AGENTS.md` and `.agents/ACTIVE_STATE.md`. They must never define separate, duplicate, or conflicting rules.
- Keep SEO skills (`ai-seo`, `seo-*`, `programmatic-seo`) separate from core FMEA skills; do not let SEO bloat obscure domain contracts.
- `versions/` index (`versions/README.md`) is linked from `context/versioning.md` — update entry on every release.
- Review `.agents/` freshness at least once per minor version; stale docs count as a bug.

### 6.5 Multi-Agent Orchestration — Portable Mesh (VS Code / Cursor / Opencode / Gemini / Antigravity)

- **Source of truth for agents**: `.agents/agents/*/AGENT.md` (Markdown frontmatter) — NOT `agent.json`. Each `AGENT.md` is tri-compatible: `mode:primary/subagent` (opencode) + `mainAgent/subagent` (antigravity) + `kind/tools` (gemini) + `allow` fencing. See `.agents/context/routing.md:1`.
- **Mirrors for Gemini CLI**: `.gemini/agents/*.md` are auto-copied from `.agents/agents/*/AGENT.md` (so `invoke_agent{agent_name}` and `@<name>` work); keep in sync via `python .agents/scripts/dispatch.py` or manual copy.
- **Head Orchestrator**: `.agents/agents/orchestrator/AGENT.md:1` (never writes feature code) + `.agents/agents/orchestrator/prompt.md:1`. It classifies intent via `context/routing.md:1` keyword→agent table, fans out max 4 parallel specialists, merges slices, enforces **human gate ALWAYS** (`memory/blackboard.md:APPROVED` required before build/push).
- **Bus**: `memory/blackboard.md:1` is the portable `send_message` replacement — every agent appends `## <ISO> — <intent> — <agent> — <status> — priority:N` with `owns/artifacts/depends_on` and `> <agent> → <target>: <msg>`. Visible in any IDE terminal.
- **Dispatch helper**: `python .agents/scripts/dispatch.py --intent "..." --mode plan|build` prints per-agent prompts (copy-paste into any model's chat) and appends `pending` to blackboard. No Task tool required; if Opencode `Task(subagent_type)` exists it may be used, but fallback is file-bus.
- **Routing table**: `.agents/context/routing.md:1` holds `keyword regex → agent → AGENT.md → priority → allow glob`. Priority decides conflict winner (higher wins; tie → human gate). `max_parallel: 4`.
- **Fencing — HARD (not advisory)**: each `AGENT.md:allow` glob is enforced; writes outside `allow` are rejected by orchestrator pre-check and `checklists/pre-commit.md`. Shared files (`backend/prisma/schema.prisma`, `context/data-model.md`) require explicit `> orchestrator: granting allow_shared to <agent> for <reason>` in blackboard.
- **Legacy JSON**: `F:\proj-fmea\.agents\agents\{fmea-authoring,pfd-pfmea-linking,...}/agent.json:1` (hidden `customAgent`) kept for back-compat but deprecated — dispatch reads `AGENT.md` only.
- **Opencode vs Gemini parity**: Opencode `Task(subagent_type=agent.name)` ≡ Antigravity `invoke_subagent{TypeName}` ≡ Gemini `invoke_agent{agent_name}`/`@name`. No exclusive param — see `context/routing.md:Tri-compat Mapping`.

---

## 7. Multi-Harness Cross-Session Synchronization Protocol (Antigravity + OpenAI Codex)

### 7.1 The Living State Hub (`.agents/ACTIVE_STATE.md`)
- `.agents/ACTIVE_STATE.md` is the universal, cross-session continuity ledger shared across Google Antigravity, OpenAI Codex, Claude Code, and Cursor.
- It captures: (1) Project North Star & Final Goal, (2) Current System State & Health, (3) Where We Left Off (Last Session Summary), (4) Active In-Flight Task, (5) What Is Left (Prioritized Backlog), and (6) Inter-Harness Handoff Protocol.

### 7.2 Two-Way Inter-Harness Contract
- **Session Start**: Any harness (Antigravity or Codex) MUST read `.agents/ACTIVE_STATE.md` as its first action to restore context in `< 2,000` tokens without re-scanning the codebase.
- **Session End**: Before closing a session or turn, the active harness MUST update `.agents/ACTIVE_STATE.md` (or run `python .agents/scripts/handoff.py --update "..." --next "..."`) to document completed work, touched files, verified builds, and the next priority task.
- **CLI Helper**: Run `python .agents/scripts/handoff.py --status` for an instant executive dashboard in any terminal. Run `python .agents/scripts/handoff.py --check` to verify semver and cross-file consistency.

---

## 8. Graphify Knowledge Graph Architecture

### 8.1 Pre-Planning Mandatory Graph Inspection
- **Before Building Any Implementation Plan (`/plan`) or Modifying Code**: Any agent or harness (Antigravity, OpenAI Codex, Claude Code) MUST first inspect the active knowledge graph at `graphify-out/`:
  - Run `graphify query "<feature_or_symbol>"` to discover the exact subgraph, upstream callers, downstream database models, and community hubs without expensive whole-codebase scans.
  - Run `graphify path "<SymbolA>" "<SymbolB>"` to check dependency chains and prevent breaking bidirectional contracts.
  - Inspect `graphify-out/GRAPH_REPORT.md` (or open `graphify-out/GRAPH_TREE.html`) to verify high-level architecture community hubs (`router.tsx`, `PfmeaRowService`, `ControlPlanRowService`, `ActionService`, `PrismaService`).

### 8.2 Post-Change Graph Synchronization
- **Mandatory Rebuild After Changes**: Whenever modifications are made in Google Antigravity, OpenAI Codex, or any harness:
  - Run `graphify update .` to incrementally re-extract the AST and keep `graph.json`, `graph.html`, and `GRAPH_REPORT.md` in sync.
  - Alternatively, run `python .agents/scripts/handoff.py --update "..." --next "..." --graph` which automatically executes `graphify update .` during session handoff.





### 8.3 Always-on incremental handoff rule (2026-10-19)
After each logical code-change batch, run `graphify update .`; repeat if later edits change code. Do not report work complete with a stale graph. Sync directory READMEs and write the latest validation, pending work, local preview processes, and release state into `.agents/ACTIVE_STATE.md` before handoff. Root `CODEX.md` and `AGENTS.md` remain lightweight pointers to this canonical rule.

### 8.4 Dashboard onboarding and activity invariants (2026-10-19)
- One guide entry per screen; contextual coachmarks follow actual form controls and route transitions. Guide navigation must never save engineering data or mark enforced FMEA stages complete.
- Prioritize programs over summary tiles. No permanent guide rail on the dashboard. Trial users do not receive archive navigation. Their account control displays the stable server-assigned public handle, with trial status in its menu.
- Recent activity is recorded audit data only, scoped to the viewer’s accessible projects and tenant. Do not manufacture compliance, verification, re-sequencing, project names, or fallback activity.
- Sources: `frontend/src/features/projects/ProjectList.tsx:1`, `frontend/src/features/projects/components/FmeaTutorialGuide.tsx:1`, `backend/src/modules/audit/audit-log.service.ts:1`.
