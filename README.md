# FMEApex — AI-Powered FMEA Quality Risk Platform

FMEApex is an interactive engineering workspace designed for quality risk management and analysis. The platform implements AI-powered assistance and standard Failure Mode and Effects Analysis (FMEA) methodologies to streamline engineering workflows, process flow diagrams, and corrective actions.

## Core Features

- **AIAG-VDA 7-Step Compliance:** Guided step-by-step authoring workflow with entry/exit gating controls.
- **PFD ↔ PFMEA Bidirectional Sync:** Live mapping and validation between Process Flow Diagrams and PFMEA analysis grids.
- **Interactive Structure Trees:** Vibrant, high-contrast, text-only hierarchical maps of system and process items, color-coded by role (Electric Blue for Root, Orange for System Elements, Green for Functions, Purple for Component/Work Elements, Red/Cyan for Failure Modes) with 30px large visual icons.
- **AI Copilot Suggestions:** Intelligent, context-aware suggestions for failure modes, causes, and controls based on Neon vector database similarity search.
- **Dual Authentication Model:** Pre-configured secure login for system administrators and instant trial access for Guest users.
- **Contextual Feedback Widget:** Floating feedback button (praise, idea, frustration, bug) auto-capturing page context, browser agent, and screen resolution.
- **Resilient Error Boundary:** Specialized error fallback modal that logs application crashes and stack traces to aid engineers in fixing bugs.
- **Control Plan Synchronization:** Bidirectional sync between FMEA controls and control plan methods or tolerances.
- **21 CFR Part 11 Audit Trail:** Revision lock controls, audit logs, and digital signature records.

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
- Trial sessions use the label **Trial workspace**, hide archive controls, and retain the existing guest limits and tenant permissions.
- Start any agent handoff at [.agents/ACTIVE_STATE.md](.agents/ACTIVE_STATE.md), then follow [AGENTS.md](AGENTS.md) and [CODEX.md](CODEX.md). Run `graphify update .` after each logical code-change batch and before handoff; regenerate directory indexes with `python .agents/skills/readme_sync/scripts/sync_readmes.py`.
- Release version: **0.9.0**. The configured database schema sync is verified. See [release notes](versions/v0.9.0.md); pushing main triggers the existing Cloudflare Pages and Render pipelines.
