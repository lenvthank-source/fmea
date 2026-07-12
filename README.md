# FMEAworks — AI-Powered FMEA Quality Risk Platform

FMEAworks is an interactive engineering workspace designed for quality risk management and analysis. The platform implements AI-powered assistance and standard Failure Mode and Effects Analysis (FMEA) methodologies to streamline engineering workflows, process flow diagrams, and corrective actions.

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
