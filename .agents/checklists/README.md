# Verification Checklists Catalog (`.agents/checklists/`)

This directory contains operational verification checklists to ensure quality, security, and architectural integrity before committing, submitting pull requests, or deploying releases.

## Checklists

| Checklist Document | Scope | Trigger Event |
| :--- | :--- | :--- |
| [`pre-commit.md`](./pre-commit.md) | Syntax checks, unit tests, secret verification, and fencing bounds. | Before every git commit or task completion. |
| [`pull-request.md`](./pull-request.md) | Architectural alignment, test coverage, multi-tenancy audit, and clean diffs. | Prior to submitting or merging a pull request. |
| [`release.md`](./release.md) | Version bump verification across package.json files, version ledger compliance, and build validation. | Prior to tagging or deploying a production release. |
