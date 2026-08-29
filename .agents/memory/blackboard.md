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

## 2026-08-29T10:00Z — Mesh scaffold — orchestrator — completed — priority:0
- owns: .agents/agents/**, .agents/context/routing.md, .agents/memory/blackboard.md
- artifacts: [.agents/agents/orchestrator/AGENT.md:1, .agents/context/routing.md:1, .agents/memory/blackboard.md:1]
- depends_on: []
> orchestrator → all-agents: Portable mesh scaffold complete — 10 specialists + routing + bus + dispatch. Ready for tri-compat (VS Code/Cursor/Opencode/Gemini/Antigravity). See .agents/context/routing.md:1 for dispatch.
