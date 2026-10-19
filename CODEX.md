# OpenAI Codex Guide: FMEApex Platform

Ground all execution in `.agents/`. Do NOT whole-scan codebase.

## 1. Session Start (Mandatory)
Read these two files first (< 2k tokens):
1. `.agents/ACTIVE_STATE.md` — Active status, where we left off, in-flight task, next backlog, final goal.
2. `.agents/AGENTS.md` — Core architectural rules and compliance standards.

## 2. Invariants
- **Multi-Tenant RLS**: Queries MUST filter by `tenantId`. Use `SET app.current_tenant_id` for raw SQL.
- **7-Step AIAG-VDA Gating**: Strict phase sequence; no skipping.
- **Deterministic AP**: Read-only lookup from AIAG-VDA 2019 Table 5-4. Never manually override AP.
- **Severity Inheritance**: FMEA row severity = worst-case failure effect severity.
- **Golden Thread Sync**: PFD ↔ PFMEA ↔ Control Plan bidirectional sync (0 orphan operations).
- **21 CFR Part 11**: SHA-256 digital locks; `audit_log` rejects UPDATE and DELETE.
- **Git Push (Windows)**: Always use `git config --local credential.helper wincred` and `$env:GCM_INTERACTIVE="never"`.

## 3. Graphify Knowledge Graph
- **Before Planning/Edits**: Run `graphify query "<symbol>"` or `graphify path "<A>" "<B>"` (< 500 tokens). Check `graphify-out/GRAPH_REPORT.md` for community hubs.
- **Always on after changes**: Run `graphify update .` after each logical code-change batch and again after any later code edits, before completing work or handing off. This AST-only refresh needs no API key. Preserve generated graph changes; fix extraction errors or record an explicit blocker.

## 4. CLI Helpers
```powershell
python .agents/scripts/handoff.py --status           # Executive dashboard
python .agents/scripts/handoff.py --check            # Validate semver & bridge sync
python .agents/scripts/handoff.py --update "..." --next "..." --graph  # Handoff to Antigravity
```

## 5. Session End Protocol
1. Verify builds: `cd backend && npx tsc --noEmit` and `cd frontend && npm run build`.
2. Update `.agents/ACTIVE_STATE.md` (or run `handoff.py --update "..." --next "..." --graph`).
3. Clean conventional commit (`feat(...)`, `fix(...)`).


## Current UI and activity handoff

Read the latest dated section in `.agents/ACTIVE_STATE.md`; earlier sections describe superseded guide layouts. The current guide uses anchored coachmarks, not an in-flow panel or reserved rail. Source: `frontend/src/features/projects/components/FmeaTutorialGuide.tsx:1`. Activity is audit-only and viewer-scoped in `backend/src/modules/audit/audit-log.service.ts:1`; do not restore filler records or hard-coded demo descriptions. Guest identity remains `isGuest` internally while the UI says Trial workspace. Detailed contracts live in `.agents/rules/ui-theme.md` and `.agents/context/api-contracts.md`.
