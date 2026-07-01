# BACKEND/SRC Directory

Purpose: Module folder managing src logic and assets.

## Directory Metadata
- **Path**: `backend/src`
- **Files Count**: 5
- **Subdirectories Count**: 2

## File Map

| File | Purpose / Responsibility |
| :--- | :--- |
| [`app.controller.spec.ts`](./app.controller.spec.ts) | Unit test suite for AppController. |
| [`app.controller.ts`](./app.controller.ts) | Root application controller containing basic healthcheck or welcome route. |
| [`app.module.ts`](./app.module.ts) | Root module of the application. Registers all modules, configuration, database service, and global guards. |
| [`app.service.ts`](./app.service.ts) | Root application service providing basic status or greeting text. |
| [`main.ts`](./main.ts) | Entry point of the NestJS application. Starts the server, sets up global prefix, validation pipe, and CORS. |

## Subdirectories

- [modules](./modules/README.md) - Subdirectory folder containing localized modules.
- [prisma](./prisma/README.md) - Subdirectory folder containing localized modules.
