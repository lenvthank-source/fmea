# BACKEND/SRC/MODULES/AUTH Directory

Purpose: Module folder managing auth logic and assets.

## Directory Metadata
- **Path**: `backend/src/modules/auth`
- **Files Count**: 8
- **Subdirectories Count**: 4

## File Map

| File | Purpose / Responsibility |
| :--- | :--- |
| [`auth-identity.spec.ts`](./auth-identity.spec.ts) | Stable handle refresh/profile, registered identity and tenant isolation tests. |
| [`auth.controller.ts`](./auth.controller.ts) | Controller defining API endpoints for user authentication (login, signup, session). |
| [`auth.module.ts`](./auth.module.ts) | NestJS module configuring authentication, passport strategies, and JWT parameters. |
| [`auth.service.ts`](./auth.service.ts) | Service managing password hashing, user registration, JWT generation, and tenant lookup. |
| [`jwt-auth.guard.ts`](./jwt-auth.guard.ts) | Global or route-specific guard for validating JWT tokens. |
| [`jwt.strategy.ts`](./jwt.strategy.ts) | Passport strategy for decoding and verifying JWT tokens. |
| [`public-handle.spec.ts`](./public-handle.spec.ts) | Handle collision, concurrent allocation, reservation retention and finite-pool tests. |
| [`public-handle.ts`](./public-handle.ts) | Transactional permanent noun-pair public handle allocation with secure random start and collision retry. |

## Subdirectories

- [decorators](./decorators/README.md) - Subdirectory folder containing localized modules.
- [dto](./dto/README.md) - Subdirectory folder containing localized modules.
- [guards](./guards/README.md) - Subdirectory folder containing localized modules.
- [interfaces](./interfaces/README.md) - Subdirectory folder containing localized modules.
