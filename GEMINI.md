# Gemini CLI Project Guide: FMEApex Quality Platform

This repository follows the deterministic `.agents/` context architecture.
Ground all reasoning in `.agents/AGENTS.md` and check `.agents/ACTIVE_STATE.md` at session start for active project context, where we left off, in-flight task, and next backlog items.
Ensure all database queries filter by `tenantId` (multi-tenant RLS).
Ensure Action Priority (AP) is read-only and looked up from AIAG-VDA 2019 Table 5-4.
Check `graphify query "<symbol>"` before planning/edits; update graph with `graphify update .` after changes.
Update `.agents/ACTIVE_STATE.md` or run `python .agents/scripts/handoff.py --update "..." --next "..." --graph` before completing sessions.
