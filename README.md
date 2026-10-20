# FMEApex — Connected Engineering Quality Platform

FMEApex is an interactive engineering workspace designed for quality risk management and analysis. The platform connects design and process risk analysis, manufacturing routing, controls, revisions and documented mitigation decisions. Applicable methodology verification is recorded separately from software completeness.

## Core Features

- **Seven-activity authoring:** Iterative drafts with integrity checks and review/release completeness. Applicable requirement verification is tracked explicitly.
- **PFD/PFMEA traceability:** Explicit manufacturing routing with stable operation references and analytical coverage.
- **Design structure and failure chains:** Revision-owned system/subsystem/component identities, functions, requirements, interfaces and cause-level controls/evaluations; linked structure, focus and worksheet views.
- **Engineering input integrity:** Simulated AI auto-fill is removed. Source-backed suggestions must remain proposed until explicitly reviewed; no generated failure or sampling decisions are silently inserted.
- **Dual Authentication Model:** Pre-configured secure login for system administrators and instant trial access for Guest users.
- **Contextual Feedback Widget:** Floating feedback button (praise, idea, frustration, bug) auto-capturing page context, browser agent, and screen resolution.
- **Resilient Error Boundary:** Specialized error fallback modal that logs application crashes and stack traces to aid engineers in fixing bugs.
- **Controlled Control Plans:** Independent phase revision histories, revision-frozen headers, full characteristic/control/reaction fields and reviewed PFD/PFMEA change previews. Source conflicts and coverage exclusions require explicit decisions; automatic reverse propagation is not implemented.
- **Revision controls:** Protected revisions, approval records and audit events; these software features are not a regulatory certification claim.

## DFMEA and Control Plan — v0.11.0

The canonical engineering editors use dedicated revision-owned documents, optimistic versions and transactional project/trial/revision checks. Legacy records remain preserved and explicitly unreviewed. DFMEA provides reviewed legacy-chain mapping and characteristic flow-down references. Control Plan updates preserve manual execution decisions and never invent sample sizes, frequencies or reactions.

Native XLSX and printable documents cover the entire selected revision. Native workbooks preserve the complete structured model; changed DFMEA narrative worksheets require explicit mapping rather than guessing relationships. Long text is retained in continuation sheets.

Verification and remaining methodology limits: [controlled engineering delivery](docs/specs/controlled-engineering-delivery.md). Start agent work from [.agents/ACTIVE_STATE.md](.agents/ACTIVE_STATE.md). Release [v0.11.0](versions/v0.11.0.md) records the user-approved controlled-engineering implementation, validation and remaining reference gates.

## PFD symbol and layout upgrade (working changes)

Manufacturing notation remains the default, with optional explicit engineering symbols, a searchable original shape library and reviewable automatic layout. Selected equipment does not change operation meaning. Existing routing and downstream identities remain protected. See the [PFD delivery checklist](docs/specs/pfd-symbols-delivery.md) and [reference inventory](docs/references/README.md) for implementation, verification and source limitations. These changes are not yet committed or published.

## Project Structure

- [backend/](file:///f:/proj-fmea/backend/) - NestJS API Service & Prisma ORM database layer
- [frontend/](file:///f:/proj-fmea/frontend/) - React Client Application (Vite + MUI)
- [.agents/](file:///f:/proj-fmea/.agents/) - Developer workspace rules, automated workflows, and customization guides

## Getting Started

Refer to the respective application folders for configuration and local development instructions:
- [backend/README.md](file:///f:/proj-fmea/backend/README.md)
- [frontend/README.md](file:///f:/proj-fmea/frontend/README.md)

## v0.9.0 experience (2026-10-19)

- The homepage, sign-in, and dashboard share the connected FMEA visual theme. Try FMEApex / Try it out enters an authenticated trial workspace without an email/password screen.
- Programs take priority on the dashboard, with a compact summary row and an activity feed backed exclusively by recorded audit events for accessible projects.
- One 7-Step Guide entry per screen starts contextual prompts beside real creation controls and follows the engineering workflow. Tour progress never completes FMEA prerequisites.
- Trial sessions show their permanent assigned username and identify **Trial workspace** in the account menu, hide archive controls, and retain the existing guest limits and tenant permissions.
- Start any agent handoff at [.agents/ACTIVE_STATE.md](.agents/ACTIVE_STATE.md), then follow [AGENTS.md](AGENTS.md) and [CODEX.md](CODEX.md). Run `graphify update .` after each logical code-change batch and before handoff; regenerate directory indexes with `python .agents/skills/readme_sync/scripts/sync_readmes.py`.
- Release version: **0.9.0**. The configured database schema sync is verified. See [release notes](versions/v0.9.0.md); pushing main triggers the existing Cloudflare Pages and Render pipelines.

## v0.10.0 connected quality release
All 23 public URLs now share the homepage identity. The approved application changes are implemented: explicit revision-owned PFD routing and graph-preserving exports/import, permanent trial usernames, compact complete program cards, and a visual package repository. Submission readiness and engineering source distinctions are enforced/documented. See the [delivery checklist](docs/specs/connected-quality-delivery.md) and [.agents/ACTIVE_STATE.md](.agents/ACTIVE_STATE.md) for tests, migration evidence and handoff. Release version **0.10.0** is published to `origin/main` (release commit `8318235`); see [release notes](versions/v0.10.0.md). Deployment completion is verified separately from Git publication.

Methodology and feature claims are tracked in the [engineering rule register](.agents/context/engineering-rule-register.md). Configured AP browser/backend parity is tested for every valid integer combination; independent numerical handbook conformity remains pending. Existing AP mappings and approved records are preserved.
