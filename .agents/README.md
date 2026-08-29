# .agents/ — AI Agent Context System

This directory provides structured context for AI coding agents working on the FMEApex platform. It reduces hallucinations, minimizes token usage, and grounds agent decisions in verified repository evidence.

## Source-of-Truth Hierarchy

1. Actual source code
2. Configuration files (`package.json`, `schema.prisma`, `tsconfig.json`)
3. Tests and executable behavior
4. Existing documentation (`docs/`, deployment guides)
5. This `.agents/` directory

When `.agents/` conflicts with source code, **source code wins**.

## Directory Structure

```
.agents/
├── README.md              ← You are here (always load)
├── AGENTS.md              ← Core project rules (always load)
├── rules/                 ← Stable coding & architecture rules
│   ├── architecture.md
│   ├── coding-style.md
│   ├── testing.md
│   ├── security.md
│   └── git.md
├── context/               ← Project & domain knowledge
│   ├── project.md
│   ├── architecture.md
│   ├── domain.md
│   ├── glossary.md
│   ├── data-model.md        ← 41 Prisma models, indexes, lastActivityAt
│   ├── api-contracts.md     ← /api/v1 DTOs, pagination, errors
│   ├── permissions.md       ← endpoint→permission matrix + RLS
│   ├── deployment.md        ← Render/Neon/R2/Podman + env
│   ├── versioning.md        ← ledger index + schema linkage
│   └── routing.md           ← orchestrator dispatch table (keyword→agent, priority, fencing)
├── agents/                ← Role + specialist definitions (portable mesh)
│   ├── orchestrator/AGENT.md  ← Head orchestrator (primary, tri-compat)
│   ├── pfd/AGENT.md           ← PFD specialist
│   ├── pfmea/AGENT.md         ← PFMEA specialist
│   ├── dfmea/AGENT.md         ← DFMEA specialist
│   ├── control-plan/AGENT.md  ← CP sync specialist
│   ├── action/AGENT.md        ← Actions lifecycle
│   ├── revision/AGENT.md      ← 21 CFR Part 11
│   ├── rag/AGENT.md           ← Vector/RAG
│   ├── auth/AGENT.md          ← SSO/tenant/RBAC
│   ├── repository/AGENT.md    ← Repo/enterprise
│   ├── ai-suggestion/AGENT.md ← HITL review
│   ├── developer.md           ← Generic developer
│   ├── reviewer.md
│   ├── tester.md
│   └── architect.md
├── workflows/             ← Step-by-step task workflows
│   ├── feature.md
│   ├── bugfix.md
│   ├── code-review.md
│   ├── refactor.md
│   └── release.md
├── skills/                ← Domain-specific skill guides (existing)
├── prompts/               ← Reusable agent prompts
│   ├── feature.md
│   ├── review.md
│   └── debugging.md
├── checklists/            ← Verification checklists
│   ├── pre-commit.md
│   ├── pull-request.md
│   └── release.md
├── scripts/               ← Portable dispatch helper
│   └── dispatch.py          ← routing→prompt + blackboard bus (any IDE)
└── memory/                ← Durable decisions + bus
    ├── decisions.md         ← ADRs
    └── blackboard.md        ← orchestration bus (pending/in_progress/completed)
```

## Progressive Context Loading

Agents must NOT load the entire `.agents/` directory. Load only what is relevant.

### Level 1 — Always Load
- `.agents/README.md`
- `.agents/AGENTS.md`

### Level 2 — Task Context

| Task Type | Load These | Specialist AGENT.md |
|---|---|---|
| Frontend feature | `rules/architecture.md`, `context/architecture.md`, `skills/ui-ux-designer/` | `agents/orchestrator/AGENT.md` classifies → relevant specialist |
| Backend feature | `rules/architecture.md`, `context/architecture.md`, relevant skill | `agents/orchestrator/AGENT.md` → `auth/AGENT.md` or `pfd/AGENT.md` etc. |
| PFMEA authoring | `skills/fmea-authoring/`, `skills/pfd-pfmea-linking/`, `context/domain.md` | `agents/pfmea/AGENT.md` |
| PFD / import | `skills/pfd-pfmea-linking/`, `context/domain.md` | `agents/pfd/AGENT.md` |
| DFMEA authoring | `skills/fmea-authoring/`, `context/domain.md` | `agents/dfmea/AGENT.md` |
| Bug fix | `workflows/bugfix.md`, `context/architecture.md` | `agents/{domain}/AGENT.md` owner |
| Code review | `workflows/code-review.md`, `rules/coding-style.md`, `rules/security.md` | `agents/reviewer.md` + domain specialist |
| Database change | `context/architecture.md`, `rules/security.md` | `agents/{domain}/AGENT.md` + orchestrator `allow_shared` |
| SEO work | `skills/ai-seo/`, `skills/seo-audit/`, relevant SEO skills | `agents/ai-suggestion/AGENT.md` / `seo-agent` |
| Revision/approval | `skills/revision-approval/`, `rules/security.md` | `agents/revision/AGENT.md` |
| Control Plan | `skills/control-plan-sync/`, `skills/fmea-authoring/` | `agents/control-plan/AGENT.md` |
| Actions/optimization | `skills/corrective-actions/`, `context/domain.md` | `agents/action/AGENT.md` |
| RAG / embeddings | `skills/vector-indexing/` | `agents/rag/AGENT.md` |
| Auth / tenant | `skills/sso-tenant-context/`, `context/permissions.md` | `agents/auth/AGENT.md` |

### Level 3 — Specialized (load only when needed)
- `context/domain.md`, `context/glossary.md`
- `rules/security.md`
- `memory/decisions.md`
- Specific skill directories

## Hallucination Prevention

1. Never invent facts about the codebase
2. Never assume frameworks, commands, or env vars
3. Verify claims against source code before documenting
4. Mark unverified information as `UNKNOWN — verify from codebase`
5. Prefer file references over copying code
6. When documentation conflicts with code, flag the conflict

## Maintenance — Keep fresh (see AGENTS.md §6 for full rules)

Update `.agents/` when changes affect:
- Architecture or module boundaries (`context/architecture.md`)
- Public API routes or DTOs (`context/api-contracts.md`)
- Database schema / Prisma models / indexes (`context/data-model.md`)
- Authentication, RBAC, permissions, JWT/inactivity (`context/permissions.md`, `rules/security.md`)
- Build/dev commands, env vars, deployment (`context/deployment.md`)
- Security practices, domain terminology, AP logic (`context/domain.md`, `glossary.md`)
- Revision workflow, immutability, audit (`context/versioning.md`, `memory/decisions.md`)
- Deletion UX, session persistence, import wizards (`skills/*`)

Do NOT update for routine bugfixes. After every version bump: edit minimal file + append ADR + `python .agents/skills/readme_sync/scripts/sync_readmes.py` + `tsc` builds green + commit `.agents/` (use `git add -f` if gitignored). Review freshness each minor; stale docs = bug.

## Graphify

Graphify is not currently configured for this repository. If installed in the future, use it for dependency discovery and cross-reference findings against source code before documenting.
