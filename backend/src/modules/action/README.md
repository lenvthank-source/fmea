# BACKEND/SRC/MODULES/ACTION Directory

Purpose: Module folder managing action logic and assets.

## Directory Metadata
- **Path**: `backend/src/modules/action`
- **Files Count**: 4
- **Subdirectories Count**: 1

## File Map

| File | Purpose / Responsibility |
| :--- | :--- |
| [`action.controller.ts`](./action.controller.ts) | Controller defining API endpoints for actions and evidence uploads (CRUD, evidence attachment). |
| [`action.module.ts`](./action.module.ts) | NestJS module registering action routes, services, and cloud storage providers. |
| [`action.service.ts`](./action.service.ts) | Core service logic for actions management, evidence storage in R2, and status updates. |
| [`r2.service.ts`](./r2.service.ts) | Service managing evidence file uploads and presigned URLs using Cloudflare R2 bucket. |

## Subdirectories

- [dto](./dto/README.md) - Subdirectory folder containing localized modules.
