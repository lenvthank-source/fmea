# BACKEND/SRC/MODULES/CONTROL-PLAN Directory

Purpose: Module folder managing control-plan logic and assets.

## Directory Metadata
- **Path**: `backend/src/modules/control-plan`
- **Files Count**: 19
- **Subdirectories Count**: 1

## File Map

| File | Purpose / Responsibility |
| :--- | :--- |
| [`control-plan-document.controller.ts`](./control-plan-document.controller.ts) | Canonical Control Plan save, preview/apply and phase fork API permissions. |
| [`control-plan-document.service.spec.ts`](./control-plan-document.service.spec.ts) | Source code component implementing control-plan-document.service.spec functionality. |
| [`control-plan-document.service.ts`](./control-plan-document.service.ts) | Revision-safe plan authoring and reviewed non-destructive source synchronization. |
| [`control-plan-document.spec.ts`](./control-plan-document.spec.ts) | Source code component implementing control-plan-document.spec functionality. |
| [`control-plan-document.ts`](./control-plan-document.ts) | Controlled phase-specific plan model, source provenance and readiness validation. |
| [`control-plan-v2.spec.ts`](./control-plan-v2.spec.ts) | Source code component implementing control-plan-v2.spec functionality. |
| [`control-plan.module.ts`](./control-plan.module.ts) | NestJS module registering control plan controller and service. |
| [`cp-approval-package.service.spec.ts`](./cp-approval-package.service.spec.ts) | Source code component implementing cp-approval-package.service.spec functionality. |
| [`cp-approval-package.service.ts`](./cp-approval-package.service.ts) | Records a password-confirmed approval intent and creates a queued approval package. |
| [`cp-lineage.service.spec.ts`](./cp-lineage.service.spec.ts) | Source code component implementing cp-lineage.service.spec functionality. |
| [`cp-lineage.service.ts`](./cp-lineage.service.ts) | Retrieves or binds an operation version to a logical lineage. If the step already has a binding, returns its existing lineage. If unbound, creates a new lineage for this step record without guessing from names. |
| [`cp-pdf.service.spec.ts`](./cp-pdf.service.spec.ts) | Source code component implementing cp-pdf.service.spec functionality. |
| [`cp-pdf.service.ts`](./cp-pdf.service.ts) | Generates a PDF buffer for a Control Plan V2 document. |
| [`cp-profile-baseline.ts`](./cp-profile-baseline.ts) | Source code component implementing cp-profile-baseline functionality. |
| [`cp-review.service.spec.ts`](./cp-review.service.spec.ts) | Source code component implementing cp-review.service.spec functionality. |
| [`cp-review.service.ts`](./cp-review.service.ts) | Source code component implementing cp-review.service functionality. |
| [`cp-source-adapter.service.ts`](./cp-source-adapter.service.ts) | Source code component implementing cp-source-adapter.service functionality. |
| [`cp-source-adapter.spec.ts`](./cp-source-adapter.spec.ts) | Source code component implementing cp-source-adapter.spec functionality. |
| [`cp-source-capture.service.ts`](./cp-source-capture.service.ts) | Captures an immutable source snapshot for a given Control Plan revision. Acquires the tenant source fence lock to guarantee fresh, serializable reads. |

## Subdirectories

- [dto](./dto/README.md) - Subdirectory folder containing localized modules.
