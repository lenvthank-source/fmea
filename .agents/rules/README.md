# System Rules Catalog (`.agents/rules/`)

This directory contains inviolable, stable system constraints and engineering standards governing all autonomous coding agents and human contributors working on the FMEA Quality Platform.

## Rules Catalog

| Rule Document | Purpose & Scope | Core Mandate |
| :--- | :--- | :--- |
| [`architecture.md`](./architecture.md) | Multi-tenancy, layering, connection lifecycles, and cache policies. | Strict `tenantId` isolation on all queries; 7-step gating prerequisites. |
| [`coding-style.md`](./coding-style.md) | TypeScript/NestJS/React coding standards, timeouts, zero stub policy. | Explicit 30s timeout on external network/DB calls; no unhandled stubs. |
| [`git.md`](./git.md) | Git workflow, commit conventions, version ledger synchronization. | Never auto-bump versions or push without human approval. |
| [`security.md`](./security.md) | Secret hygiene, RLS session parameters, RBAC enforcement. | Zero secrets in repo; set session tenant/user variables before raw SQL. |
| [`testing.md`](./testing.md) | Test coverage standards, mock configurations, zero residue mandate. | Deterministic database cleanup; no dirty test data in live/dev DBs. |
| [`ui-theme.md`](./ui-theme.md) | FMEApex design system, modern dark/light styling, color tokens. | Follow design tokens and hierarchy breadcrumbs across dialogs and grids. |
| [`no_drift_clarification.md`](./no_drift_clarification.md) | Halt-on-uncertainty, anti-hallucination, abstract schema mandate. | Stop exploratory loops immediately if ambiguous; clarify with user. |

## Loading Hierarchy

Rules in this directory are Tier 1 system constraints:
- They are auto-loaded or actively referenced at the start of any planning or coding turn.
- Violating any rule defined in this directory is a blocking pull-request failure.
