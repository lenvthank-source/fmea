# Agent Routing Table — Portable Mesh Dispatch

Single source for orchestrator classification (`AGENTS.md:6.5`). Any model/IDE reads this.

## Dispatch

| Keywords (case-insensitive, regex) | Agent | AGENT.md | Priority | Fencing |
|---|---|---|---|---|
| `pfd, process flow, process step, import PFD, ExcelImportWizard` | `pfd-agent` | `.agents/agents/pfd/AGENT.md:1` | 1 | `backend/src/modules/pfd/**, frontend/src/features/pfd/**` |
| `pfmea, PFMEA row, failure mode, failure effect, failure cause, S/O/D, AP, linkage, FailureLinkage` | `pfmea-agent` | `.agents/agents/pfmea/AGENT.md:1` | 1 | `backend/src/modules/pfmea/**, frontend/src/features/pfmea/**` |
| `dfmea, DFMEA, System.*Subsystem.*Component, boundary diagram` | `dfmea-agent` | `.agents/agents/dfmea/AGENT.md:1` | 1 | `frontend/src/features/dfmea/**` |
| `control plan, CP.*sync, control-plan` | `control-plan-agent` | `.agents/agents/control-plan/AGENT.md:1` | 2 | `backend/src/modules/control-plan/**, frontend/src/features/control-plan/**` |
| `action, corrective, optimization, High AP, R2, evidence` | `action-agent` | `.agents/agents/action/AGENT.md:1` | 2 | `backend/src/modules/action/**, frontend/src/features/actions/**` |
| `revision, approval, approve, reject, submit, lockedAt, 21 CFR, audit log` | `revision-agent` | `.agents/agents/revision/AGENT.md:1` | 1 | `backend/src/modules/project/**, backend/src/modules/audit/**` |
| `embedding, vector, rag, HNSW, BullMQ.*embedding, ai_embedding` | `rag-agent` | `.agents/agents/rag/AGENT.md:1` | 3 | `backend/src/queues/**` |
| `auth, SSO, tenant, RBAC, JWT, refresh, lastActivityAt, isHydrating, PermissionGuard` | `auth-agent` | `.agents/agents/auth/AGENT.md:1` | 1 | `backend/src/modules/auth/**, backend/src/modules/user/**, frontend/src/features/auth/**` |
| `repository, package library, BOM, PLM, ERP` | `repository-agent` | `.agents/agents/repository/AGENT.md:1` | 3 | `backend/src/modules/repository/**, frontend/src/features/repository/**` |
| `ai suggestion, ai-suggestion, proposed.*accepted, suggestion.*review` | `ai-suggestion-agent` | `.agents/agents/ai-suggestion/AGENT.md:1` | 3 | `backend/src/modules/**/ai**` |
| `seo, landing, programmatic, pillar, competitor` | `seo-agent` | `.agents/skills/ai-seo/SKILL.md:1` | 3 | `frontend/src/features/{landing,programmatic,content}/**` |

## Orchestrator Behavior

- **Match**: scan intent + `grep_search` evidence; collect all matching agents (typically 2–4).
- **Priority**: 1 = primary owner (must run), 2 = secondary, 3 = triggered downstream.
- **Max parallel**: `4` — queue remainder FIFO. Tuned in this file (`max_parallel: 4`).
- **Conflict**: same `path:line` → higher `priority` wins; tie → human gate (§1.3 `AGENTS.md`).
- **Shared files**: only `allow_shared` in `orchestrator/AGENT.md` may be touched by >1 agent and requires explicit `> orchestrator: granting allow_shared to <agent> for <reason>` in `memory/blackboard.md`.

## Tri-compat Mapping

| Runtime | Invoke | Example |
|---|---|---|
| **Opencode** | `Task(prompt, subagent_type=agent.name)` | `Task("implement PFD import", prompt, subagent_type="pfd-agent")` |
| **Antigravity 2.0** | `invoke_subagent{TypeName, Prompt, Workspace:worktree}` | `invoke_subagent{TypeName: "pfd-agent", Prompt: "...", Workspace: "worktree"}` |
| **Gemini CLI** | `invoke_agent{agent_name, prompt}` or `@<name>` | `@pfd-agent implement PFD import` |
| **VS Code/Cursor/manual** | Paste `AGENT.md` as system prompt into new chat tab, share `memory/blackboard.md` | Any model pastes `.agents/agents/pfd/AGENT.md` |

## Ownership vs Legacy JSON

- New portable `AGENT.md` in `.agents/agents/{pfd,pfmea,dfmea,control-plan,action,revision,rag,auth,repository,ai-suggestion}/AGENT.md` are **source of truth**.
- Legacy `*.json` in `.agents/agents/{fmea-authoring,pfd-pfmea-linking,...}/agent.json:1` kept for back-compat (deprecated) — do not rely for dispatch.

Source: `AGENTS.md:6.5`, `README.md:70`, `rules/architecture.md`.
