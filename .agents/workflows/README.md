# Actionable Workflows Catalog (`.agents/workflows/`)

This directory contains step-by-step standard operating procedures (SOPs) for coding agents and engineers performing common software development lifecycle tasks.

## Workflow Guides

| Workflow Document | Scope & Target | Key Steps |
| :--- | :--- | :--- |
| [`feature.md`](./feature.md) | Developing new frontend or backend capabilities. | Context loading $\rightarrow$ Implementation Plan $\rightarrow$ Code $\rightarrow$ Unit tests $\rightarrow$ Same-turn sync. |
| [`bugfix.md`](./bugfix.md) | Triaging, reproducing, and fixing regressions. | Root cause reproduction $\rightarrow$ Minimal surgical edit $\rightarrow$ Regression test $\rightarrow$ Verification. |
| [`refactor.md`](./refactor.md) | Restructuring code without altering external behavior. | Baseline test verification $\rightarrow$ Stepwise refactoring $\rightarrow$ Interface stability check. |
| [`code-review.md`](./code-review.md) | Inspecting PRs for security, multi-tenancy, and quality. | RBAC permission check $\rightarrow$ Tenant isolation verification $\rightarrow$ Immutability audit. |
| [`release.md`](./release.md) | Version bumping and release ledger compilation. | Human gate confirmation $\rightarrow$ Semver bump $\rightarrow$ `versions/vX.Y.Z.md` ledger creation. |

## Mandatory Living Documentation Rule
Whenever executing any development or bugfix workflow, the engineer or agent **must** perform the mandatory same-turn documentation synchronization (updating affected directory `README.md`, `.agents/memory/`, and API contracts).
