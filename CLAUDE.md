# Claude Code Guide: FMEApex Platform

Ground all reasoning in `.agents/`. Do NOT whole-scan codebase.

## 1. Session Start (Mandatory)
Read first (< 2k tokens):
1. `.agents/ACTIVE_STATE.md` — Active status, where we left off, in-flight task, next backlog, final goal.
2. `.agents/AGENTS.md` — Core rules (multi-tenant RLS, 7-step gating, read-only AP, 21 CFR Part 11).

## 2. Graphify Knowledge Graph
- **Before Planning/Edits**: Run `graphify query "<symbol>"` or check `graphify-out/GRAPH_REPORT.md`.
- **After Edits**: Run `graphify update .` (AST-only, 0 API cost).

## 3. CLI & Handoff
```bash
python .agents/scripts/handoff.py --status           # Executive dashboard
python .agents/scripts/handoff.py --check            # Validate semver & bridge sync
python .agents/scripts/handoff.py --update "..." --next "..." --graph  # Handoff to other harnesses
```

## 4. Session End Protocol
1. Verify builds: `cd backend && npx tsc --noEmit` and `cd frontend && npm run build`.
2. Update `.agents/ACTIVE_STATE.md` via `handoff.py --update "..." --next "..." --graph`.
3. Conventional commit (`feat(...)`, `fix(...)`).
