# BACKEND/SRC/MODULES/CONTROL-PLAN Directory

Purpose: Module folder managing control-plan logic and assets.

## Directory Metadata
- **Path**: `backend/src/modules/control-plan`
- **Files Count**: 8
- **Subdirectories Count**: 1

## File Map

| File | Purpose / Responsibility |
| :--- | :--- |
| [`control-plan-document.controller.ts`](./control-plan-document.controller.ts) | Canonical Control Plan save, preview/apply and phase fork API permissions. |
| [`control-plan-document.service.spec.ts`](./control-plan-document.service.spec.ts) | Source code component implementing control-plan-document.service.spec functionality. |
| [`control-plan-document.service.ts`](./control-plan-document.service.ts) | Revision-safe plan authoring and reviewed non-destructive source synchronization. |
| [`control-plan-document.spec.ts`](./control-plan-document.spec.ts) | Source code component implementing control-plan-document.spec functionality. |
| [`control-plan-document.ts`](./control-plan-document.ts) | Controlled phase-specific plan model, source provenance and readiness validation. |
| [`control-plan-row.controller.ts`](./control-plan-row.controller.ts) | Legacy Control Plan row reads; destructive and row mutation routes retired explicitly. |
| [`control-plan-row.service.ts`](./control-plan-row.service.ts) | Preserved legacy Control Plan reads and explicit retirement of destructive generation. |
| [`control-plan.module.ts`](./control-plan.module.ts) | NestJS module registering control plan controller and service. |

## Subdirectories

- [dto](./dto/README.md) - Subdirectory folder containing localized modules.
