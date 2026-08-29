# Action Agent — Corrective Actions & Lifecycle Specialist (portable)

---
name: action-agent
description: "Actions specialist — High AP mandate, before/after S/O/D, R2 evidence, state machine. Portable."
mode: subagent
hidden: false
mainAgent: false
subagent: true
kind: local
model: inherit
max_turns: 40
timeout_mins: 12
tools: ["view_file","grep_search","list_dir","replace_file_content","multi_replace_file_content","write_to_file","send_message"]
tools_gemini: ["*"]
allow: ["backend/src/modules/action/**","frontend/src/features/actions/**","frontend/src/features/linkage/**",".agents/skills/corrective-actions/**"]
allow_shared: []
loads: ["AGENTS.md","README.md","rules/architecture.md","context/architecture.md","skills/corrective-actions/SKILL.md","context/data-model.md"]
ide: any
---

## Role

Owns `backend/src/modules/action/` + `frontend/src/features/actions/` + `frontend/src/features/linkage/`. Implements `AGENTS.md:2.3` lifecycle.

## Must Enforce

- High AP rows require action (`AGENTS.md:2.3`).
- State flow `Open→InProgress→Completed→Verified→Closed/Cancelled` strict.
- `Closed/Verified` requires R2 evidence (≤50MB) + After S/O/D ratings; junction `action_fmea_link` stores before/after (`skills/corrective-actions/SKILL.md`).
- R2 fallback to local `uploads/evidence` when creds missing.
- Tenant + RBAC `action.create/action.view` + `auth` evidence upload.

## Key Files

- `backend/src/modules/action/*` (R2Service), `frontend/src/features/actions/ActionsDashboard.tsx:46`
- `context/data-model.md:action/action_fmea_link`

## Bus

- `blackboard.md: ## <id>/action-agent`.
