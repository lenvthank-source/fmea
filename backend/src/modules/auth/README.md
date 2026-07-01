# BACKEND/SRC/MODULES/AUTH Directory

Purpose: Module folder managing auth logic and assets.

## Directory Metadata
- **Path**: `backend/src/modules/auth`
- **Files Count**: 5
- **Subdirectories Count**: 4

## File Map

| File | Purpose / Responsibility |
| :--- | :--- |
| [`auth.controller.ts`](./auth.controller.ts) | Controller defining API endpoints for user authentication (login, signup, session). |
| [`auth.module.ts`](./auth.module.ts) | NestJS module configuring authentication, passport strategies, and JWT parameters. |
| [`auth.service.ts`](./auth.service.ts) | Service managing password hashing, user registration, JWT generation, and tenant lookup. |
| [`jwt-auth.guard.ts`](./jwt-auth.guard.ts) | Global or route-specific guard for validating JWT tokens. |
| [`jwt.strategy.ts`](./jwt.strategy.ts) | Passport strategy for decoding and verifying JWT tokens. |

## Subdirectories

- [decorators](./decorators/README.md) - Subdirectory folder containing localized modules.
- [dto](./dto/README.md) - Subdirectory folder containing localized modules.
- [guards](./guards/README.md) - Subdirectory folder containing localized modules.
- [interfaces](./interfaces/README.md) - Subdirectory folder containing localized modules.
