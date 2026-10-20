# Implementation handoff plans

Canonical location: `.agents/handoff_plan/<plan-slug>/PLAN.md`. Keep evidence and executor packets beside each plan. Startup/confirmation/completion rules are maintained in [shared agent instructions](../AGENTS.md), not separately per harness.

## Plan index

- [Restore original manufacturing symbols](pfd-classic-manufacturing-symbols/PLAN.md) — `pfd-classic-manufacturing-symbols`, revision 1. Status: `completed` (2026-10-21). Original manufacturing palette restored as default, authentic outlines, compact table cell with Needs review indicator, atomic PATCH step updates. All 174 backend tests & 27 frontend tests pass.

Existing historical delivery reports remain in `docs/specs/`; they have not been reclassified as pending plans.

When a plan is created, add its ID, title and relative PLAN.md link here. Read the actual plan's frontmatter for authoritative status; this index is navigation, not permission to execute.

## Lifecycle

`draft` → `ready` → `in_progress` → `completed`. `blocked` records required missing work; `superseded` links to replacement history. Relevant pending plans require user execution confirmation unless already authorized. Resolve material confusion before dependent edits. Completion requires a timestamp and actual acceptance evidence in the same PLAN.md; research completion alone is insufficient.

Authoring skill when installed: `~/.agents/skills/handoff_plan/SKILL.md`, with `references/plan-lifecycle.md` defining the plan metadata and execution log. The skill is shared through the personal `.agents/skills` discovery folder.

## Feasibility reports (not pending implementation plans)

- [Multi-harness project continuity — feasibility and engineering review](multi-harness-coordination/FEASIBILITY.md), 2026-10-20. Completed read-only assessment with isolated helper reproductions, current capability coverage, official harness references, proposed coordinator and phased acceptance gates. No PLAN.md or implementation authorization created by this report.
