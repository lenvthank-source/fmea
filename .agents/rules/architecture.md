# Architecture Rules

## System Overview

FMEApex is a multi-tenant, cloud-hosted FMEA quality risk platform.

- **Backend**: NestJS 11 + Prisma ORM + PostgreSQL (Neon serverless)
- **Frontend**: React 19 + Vite 8 + MUI 9 + TypeScript 6
- **Storage**: Cloudflare R2 (evidence files) with local filesystem fallback
- **Deployment**: Cloudflare Pages (frontend), Render Docker (backend)
- **Local Dev**: Podman pod with pgvector:pg15 + redis:7-alpine

Sources: [package.json](file:///f:/proj-fmea/package.json), [backend/package.json](file:///f:/proj-fmea/backend/package.json), [frontend/package.json](file:///f:/proj-fmea/frontend/package.json)

## Backend Architecture

### Module Boundary Map

| Module | Path | Responsibility |
|---|---|---|
| `AuthModule` | `backend/src/modules/auth/` | JWT auth, signup, guest login, RBAC, feedback/contact |
| `UserModule` | `backend/src/modules/user/` | User CRUD, inactivity archival, role management |
| `ProjectModule` | `backend/src/modules/project/` | Project lifecycle, documents, revisions, audit logging |
| `PfdModule` | `backend/src/modules/pfd/` | Process Flow Diagram steps (CRUD, reorder, import) |
| `PfmeaModule` | `backend/src/modules/pfmea/` | PFMEA grid rows, AP calculation, tree-to-table sync |
| `ControlPlanModule` | `backend/src/modules/control-plan/` | CP rows, bidirectional sync from PFMEA and PFD |
| `ActionModule` | `backend/src/modules/action/` | Corrective actions, R2 evidence upload, before/after ratings |
| `StructureLinkageModule` | `backend/src/modules/structure-linkage/` | Structure tree (functions, failures), failure network links |
| `AuditLogModule` | `backend/src/modules/audit/` | Immutable audit trail entries |
| `RepositoryModule` | `backend/src/modules/repository/` | Reusable work element package library |
| `PrismaModule` | `backend/src/prisma/` | Database connection, RLS session vars, seed data |

Source: [app.module.ts](file:///f:/proj-fmea/backend/src/app.module.ts)

### Dependency Direction

- Controllers → Services → PrismaService
- All modules import `PrismaModule` for database access
- `ProjectModule` imports `AuditLogModule` for revision audit trails
- `RepositoryModule` imports `AuthModule` for user resolution
- Global guards: `JwtAuthGuard` → `PermissionGuard` (registered in `AppModule`)

### API Prefix

All routes prefixed with `/api/v1/` via `app.setGlobalPrefix('api/v1')` in [main.ts](file:///f:/proj-fmea/backend/src/main.ts).

### Global Middleware Stack

1. CORS (`app.enableCors()`)
2. `ValidationPipe` (`whitelist: true, transform: true, forbidNonWhitelisted: true`)
3. `JwtAuthGuard` (global, skipped on `@Public()` endpoints)
4. `PermissionGuard` (global, skipped on `@Public()`, bypassed for `Admin` role)

## Frontend Architecture

### Feature-Based Organization

| Feature | Path | Purpose |
|---|---|---|
| `auth` | `frontend/src/features/auth/` | Login, guest access, AuthContext |
| `projects` | `frontend/src/features/projects/` | Project list, settings, revision management |
| `pfd` | `frontend/src/features/pfd/` | Process Flow Diagram workspace |
| `pfmea` | `frontend/src/features/pfmea/` | PFMEA structure tree + grid workspace |
| `dfmea` | `frontend/src/features/dfmea/` | Design FMEA workspace |
| `control-plan` | `frontend/src/features/control-plan/` | Control Plan workspace |
| `actions` | `frontend/src/features/actions/` | Corrective actions dashboard |
| `linkage` | `frontend/src/features/linkage/` | End-to-end traceability matrix |
| `repository` | `frontend/src/features/repository/` | Reusable work element library |
| `reports` | `frontend/src/features/reports/` | Excel export generation |
| `admin` | `frontend/src/features/admin/` | Admin panel (users, feedback, revisions) |
| `landing` | `frontend/src/features/landing/` | Marketing homepage |
| `programmatic` | `frontend/src/features/programmatic/` | SEO template pages |
| `content` | `frontend/src/features/content/` | Educational pillar pages |

Source: [router.tsx](file:///f:/proj-fmea/frontend/src/app/router.tsx)

### Provider Hierarchy

`ColorModeProvider` → `AuthProvider` → `BrowserRouter` → `ErrorBoundary` → `AppRouter`

Source: [App.tsx](file:///f:/proj-fmea/frontend/src/App.tsx)

### State Management

- **Primary**: React Context (`AuthContext`) + component-level `useState`/`useEffect`
- **Redux**: `@reduxjs/toolkit` + `react-redux` installed but usage is minimal
- **Forms**: `react-hook-form` + `zod` validation
- **Persistence**: `localStorage` for tokens and view preferences

## Subagent Fencing — HARD (Portable Mesh)

- **Source**: `AGENTS.md:6.5` + `.agents/context/routing.md:1` + each `.agents/agents/*/AGENT.md:allow`.
- **Rule**: a specialist may `write_to_file`/`replace_file_content` **only** inside its `allow` globs. Default `deny` — no advisory.
- **Shared files**: `backend/prisma/schema.prisma`, `.agents/context/data-model.md`, `.agents/context/api-contracts.md` etc. require orchestrator to append `> orchestrator: granting allow_shared to <agent> for <reason>` in `memory/blackboard.md:1` before write.
- **Bus**: fencing violations are flagged pre-commit (`checklists/pre-commit.md`) and via orchestrator `rejected: out-of-scope`.
- **Routing**: unknown intent → orchestrator picks closest agent but logs `unknown — verify from codebase` (`README.md:Hallucination Prevention`).

## Forbidden Patterns

- Cross-tenant data access (every query MUST filter by `tenantId`)
- Skipping FMEA 7-step gating prerequisites
- Direct AI modification of live FMEA rows (must go through `ai_suggestion` table)
- Manual override of Action Priority (AP is lookup-only)
- Mutations on locked revisions (`lockedAt !== null`)
- UPDATE/DELETE on `audit_log` table
- Writing outside `AGENT.md:allow` without `allow_shared` grant
