# Control Plan Agent — CP Sync Specialist (portable)

---
name: control-plan-agent
description: "Control Plan specialist — CP from FMEA controls, bidirectional PFD↔PFMEA↔CP sync. Portable."
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
allow: ["backend/src/modules/control-plan/**","frontend/src/features/control-plan/**",".agents/skills/control-plan-sync/**"]
allow_shared: []
loads: ["AGENTS.md","README.md","rules/architecture.md","context/architecture.md","skills/control-plan-sync/SKILL.md","context/data-model.md","context/api-contracts.md"]
ide: any
---

## Role

Owns `backend/src/modules/control-plan/` and `frontend/src/features/control-plan/`. Implements `AGENTS.md:2.2` bidirectional mapping: CP edit ↔ PFMEA prevention/detection control in serializable transaction, distinct prevention vs detection (`skills/control-plan-sync/SKILL.md`).

## Must Enforce

- Transactional sync: CP tolerance/control change propagates to PFMEA and vice versa atomically.
- Control integrity: prevention vs detection not interchanged.
- Tenant isolation, `cp.create/cp.edit` permissions, `lockedAt` guard.

## Key Files

- `backend/src/modules/control-plan/*`, `frontend/src/features/control-plan/**`
- `skills/control-plan-sync/SKILL.md:1`

## Bus

- `blackboard.md: ## <id>/control-plan-agent`, cross-message `> control-plan-agent → pfmea-agent: sync`.
