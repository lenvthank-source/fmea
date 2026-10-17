# Coding Style Rules

Observed conventions from the actual codebase.

## Backend (NestJS/TypeScript)

### Naming
- **Modules**: `PascalCase` + `Module` suffix (e.g., `PfmeaModule`, `ActionModule`)
- **Services**: `PascalCase` + `Service` suffix (e.g., `PfmeaRowService`, `R2Service`)
- **Controllers**: `PascalCase` + `Controller` suffix (e.g., `PfmeaRowController`)
- **DTOs**: `PascalCase` + `Dto` suffix (e.g., `CreatePfmeaRowDto`, `UpdateStepDto`)
- **Guards**: `PascalCase` + `Guard` suffix (e.g., `JwtAuthGuard`, `PermissionGuard`)
- **Files**: `kebab-case` (e.g., `pfmea-row.service.ts`, `jwt-auth.guard.ts`)
- **Database tables**: `snake_case` via Prisma `@@map()` (e.g., `pfmea_row`, `audit_log`)

### File Organization
- One module per feature directory under `backend/src/modules/`
- Each module directory contains: `.module.ts`, `.service.ts`, `.controller.ts`, `dto/` subdirectory
- DTOs use `class-validator` decorators (`@IsString()`, `@IsInt()`, `@Min()`, `@Max()`, etc.)
- DTOs use `class-transformer` for type coercion (`@Transform()`, `@Type()`)

### Error Handling
- Use NestJS built-in exceptions: `NotFoundException`, `ForbiddenException`, `BadRequestException`, `ConflictException`, `UnauthorizedException`
- No custom exception filters — relies on NestJS default error serialization

### Async Patterns
- All service methods are `async` returning `Promise<T>`
- Complex multi-step mutations use `prisma.$transaction()` with explicit timeout
- No event emitters or message queues currently active in production

### Imports
- NestJS decorators from `@nestjs/common`
- Prisma client from local `../../prisma/prisma.service`
- Guards/decorators from relative paths within `auth/` module

## Frontend (React/TypeScript)

### Naming
- **Components**: `PascalCase` files and exports (e.g., `PfmeaWorkspace.tsx`, `RatingDropdown.tsx`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useBackendWarmup.ts`, `useResponsive.ts`)
- **Utilities**: `camelCase` (e.g., `apCalculator.ts`, `fmeaTreeStyles.ts`)
- **Feature directories**: `kebab-case` (e.g., `control-plan/`, `structure-linkage/`)

### Component Patterns
- Functional components with `React.FC` type annotation
- `useState` + `useEffect` for state management (no class components)
- API calls via raw `fetch()` with `Authorization: Bearer ${token}` header
- No centralized API client or axios — each component manages its own fetch calls
- Optimistic UI updates with local state

### Styling
- MUI `sx` prop for inline styles (primary approach)
- MUI `styled()` for complex custom components
- No CSS Modules, no Tailwind
- Theme tokens defined in [theme.ts](file:///f:/proj-fmea/frontend/src/theme/theme.ts)
- FMEA tree colors defined in [fmeaTreeStyles.ts](file:///f:/proj-fmea/frontend/src/features/shared/fmeaTreeStyles.ts)

### TypeScript
- `strict` mode enabled
- `noUnusedLocals: true`, `noUnusedParameters: true`
- Target: `es2023`
- Build: `tsc -b && vite build` (TypeScript checked before bundling)
- Linter: `oxlint` (Rust-based, fast)

### Forms
- `react-hook-form` with `zod` schemas for validation
- `@hookform/resolvers` for zod integration
