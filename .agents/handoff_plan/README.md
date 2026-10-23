# Implementation handoff plans

Canonical location: `.agents/handoff_plan/<plan-slug>/PLAN.md`. Keep evidence and executor packets beside each plan. Startup/confirmation/completion rules are maintained in [shared agent instructions](../AGENTS.md), not separately per harness.

## Plan index

- [Fix Control Plan validation UUID crash & canonical save](control-plan-validation-uuid-fix/PLAN.md) — `control-plan-validation-uuid-fix`, revision 1, status `completed` (2026-10-23). Fix PostgreSQL UUID column crash on CP validation run, sanitize profileRevisionId/actorId, and enable explicit saving of initial version 0 Control Plans to unblock submission readiness. 211 backend tests and 45 frontend tests pass.

- [One-click Initialize Design FMEA button](initialize-dfmea-button/PLAN.md) — `initialize-dfmea-button`, revision 1, status `completed` (2026-10-23). Provide an active, transactional "Initialize Design FMEA for this Program" button in DfmeaWorkspace when a program lacks a DFMEA document, with backend creation and multi-tenant/archive guards. 210 backend tests and 45 frontend tests pass.

- [Controlled Control Plan evolution](control-plan-evolution/PLAN.md) — `control-plan-evolution`, revision 1, status `completed` (2026-10-23). Codebase-verified extension of existing CP, explicit identity/source reviews, v2 compatibility, atomic snapshots/approval packages, operation navigator workspace, PDFKit export, and verification suites. 208 backend tests and 35 frontend tests pass.

- [Project identity and yellow guest-project boxes](project-card-badges/PLAN.md) — `project-card-badges`, revision 2, status `completed` (2026-10-21). Guest origin identified purely by subtle yellow card/row box; eliminated erroneous PFMEA and 24h trial badges; added backend presentation resolver and fixed replication phase assignment. 187 backend tests and 28 frontend tests pass.

- [Correct guest sign-in history and inactivity interpretation](guest-login-activity/PLAN.md) — `guest-login-activity`, revision 1, status `completed` (2026-10-21). Fixed missing guest and session login timestamps, truthful admin display, and activity-aware archival. 180 backend tests and 28 frontend tests pass.

- [Contact enquiry email notifications](contact-email-notifications/PLAN.md) — `contact-email-notifications`, revision1, status `ready` (2026-10-21). Resend Free comparison, confirmed support mailbox, independent owner/customer messages, durable retries and production setup gates. Research complete; implementation not requested.

- [Restore multi-flow symbols in PFD tables](pfd-multi-flow-symbols/PLAN.md) — `pfd-multi-flow-symbols`, revision 1. Status: `completed` (2026-10-21). Root-cause analysis of single-symbol restriction, hard PFD engineering rules codification, table multi-symbol display and multi-toggle popover, and step drawer multi-select. 28/28 frontend tests and 174/174 backend tests pass.
- [Restore original manufacturing symbols](pfd-classic-manufacturing-symbols/PLAN.md) — `pfd-classic-manufacturing-symbols`, revision 1. Status: `completed` (2026-10-21). Original manufacturing palette restored as default, authentic outlines, compact table cell with Needs review indicator, atomic PATCH step updates. All 174 backend tests & 27 frontend tests pass.

Existing historical delivery reports remain in `docs/specs/`; they have not been reclassified as pending plans.

When a plan is created, add its ID, title and relative PLAN.md link here. Read the actual plan's frontmatter for authoritative status; this index is navigation, not permission to execute.

## Lifecycle

`draft` → `ready` → `in_progress` → `completed`. `blocked` records required missing work; `superseded` links to replacement history. Relevant pending plans require user execution confirmation unless already authorized. Resolve material confusion before dependent edits. Completion requires a timestamp and actual acceptance evidence in the same PLAN.md; research completion alone is insufficient.

Authoring skill when installed: `~/.agents/skills/handoff_plan/SKILL.md`, with `references/plan-lifecycle.md` defining the plan metadata and execution log. The skill is shared through the personal `.agents/skills` discovery folder.

## Feasibility reports (not pending implementation plans)

- [Multi-harness project continuity — feasibility and engineering review](multi-harness-coordination/FEASIBILITY.md), 2026-10-20. Completed read-only assessment with isolated helper reproductions, current capability coverage, official harness references, proposed coordinator and phased acceptance gates. No PLAN.md or implementation authorization created by this report.
