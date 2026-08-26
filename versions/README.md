# Version & Change Ledger

Human write short summaries. Coding agents parse this folder to reconstruct what changed between releases.

## File naming rule
- One file per release: `v<MAJOR>.<MINOR>.<PATCH>.md` (matching root `package.json#version`).

## File template (keep fields in order)
```
# v<MAJOR>.<MINOR>.<PATCH> — <YYYY-MM-DD>
## Summary     (2-4 human sentences)
## Changes     (bullets grouped by: Features / Fixes / Refactors)
## Files Touched (path:line — reason)
## Schema/Migrations (none | Prisma file + model changes)
## Breaking / Notes (none | migration steps, flags)
```

## Release index (newest first)
- `v0.3.4.md` — Flexible date parser (DD-MM-YYYY, Excel serials, null fallback), dedicated Responsibility & Target Date column mappings, AP Char(1) and rating sanitization
- `v0.3.3.md` — AIAG-VDA 2019 22-column PFMEA Excel Import Wizard, PFD stepNumber fix & multi-format parsing, Add Failure Cause field interchange, dropdown menu downward anchor & scroll, wizard >85% table viewport optimization, PFMEA floating horizontal scrollbar
- `v0.3.2.md` — PFD Detached domain terminology, minimalist close-to-click warning dialog, PFD wizard polish, linkage 3px dividers, dynamic Report status, upward modal shift & downward dropdown anchoring
- `v0.3.1.md` — PFD Excel import .xls universal SheetJS parser, Failure Linkage 3-column flow + bezier curves, 2px slate visual divider, button double '+' cleanup, fluid glassmorphic styling
- `v0.3.0.md` — Session persistence+72h sliding, PFD Import wiring, Linkage blink rAF fix, delete ConfirmDialog everywhere (multi-value/unlink), revision guards+timestamps, `.agents` restructure (data-model/api-contracts/permissions/deployment/versioning) + AGENTS.md §6 (no CLAUDE/GEMINI/.cursor)
- `v0.2.3.md` — Admin S/O/D editable (Severity/Occurrence/Detection simple groups), fix Actions D.map, Fab dedup, project nav cleanup, login perf (session-in-login, fire-and-forget lastLoginAt, B-tree indexes)
- `v0.2.2.md` — Fix `i.filter` crash + long-term pagination UI for projects and FMEA tables (server search, TablePagination, unwrapPaginated)
- `v0.2.1.md` — Fix RevisionGuard DI crash (CommonModule) + global warning/error toasts for blocked/failed actions (bottom-center Snackbar, parseApiError)
- `v0.2.0.md` — Excel Import Wizard, Project Replication, Work Element Retention, Failure Linkage Zoom/Pan, Revision Workflow, Semver Numbering, Guest Isolation, Security Hardening
- `v0.1.0.md` — Project replication, dropdown fix, Excel export borders, Failure Linkage zoom/pan, work-element retention
- `v0.0.0.md` — Baseline: introduced versioning system, no runtime change.
