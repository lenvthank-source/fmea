# Architectural Decisions

Durable architectural decisions documented with evidence.

---

## Decision: Multi-Tenant via Prisma tenantId Filter

Status: Accepted

Decision: All database queries filter by `tenantId` at the application level using Prisma's `where` clause rather than database-level RLS policies.

Reason: Simpler implementation with Prisma ORM; RLS session variables are set but enforcement is primarily application-side.

Source: All service files in `backend/src/modules/`, [prisma.service.ts](file:///f:/proj-fmea/backend/src/prisma/prisma.service.ts)

---

## Decision: Schema Sync via prisma db push (No Migrations)

Status: Accepted

Decision: Database schema changes are applied using `npx prisma db push` rather than committed SQL migration files.

Reason: Rapid development workflow with Neon serverless PostgreSQL.

Source: No `migrations/` directory exists in `backend/prisma/`

---

## Decision: Global JWT + Permission Guards

Status: Accepted

Decision: `JwtAuthGuard` and `PermissionGuard` are registered as global `APP_GUARD` providers, requiring explicit `@Public()` opt-out for unauthenticated endpoints.

Reason: Secure-by-default approach — all routes are protected unless explicitly marked public.

Source: [app.module.ts](file:///f:/proj-fmea/backend/src/app.module.ts)

---

## Decision: Admin Role Bypasses Permission Checks

Status: Accepted

Decision: Users with `Admin` role automatically pass all `PermissionGuard` checks regardless of required permissions.

Reason: Simplifies admin access without needing to assign every individual permission.

Source: [permission.guard.ts](file:///f:/proj-fmea/backend/src/modules/auth/guards/permission.guard.ts)

---

## Decision: Auto-Deploy from main Branch

Status: Accepted

Decision: Both frontend (Cloudflare Pages) and backend (Render Docker) auto-deploy on push to `main` branch.

Reason: Simple deployment pipeline without CI/CD configuration.

Source: [deployment_guide.md](file:///f:/proj-fmea/deployment_guide.md)

---

## Decision: Local Filesystem Fallback for R2

Status: Accepted

Decision: `R2Service` falls back to local disk (`uploads/evidence`) when Cloudflare R2 credentials are not configured.

Reason: Enables local development without requiring cloud storage setup.

Source: [r2.service.ts](file:///f:/proj-fmea/backend/src/modules/action/r2.service.ts)

### 2026-09-01 — ADR-028: Industrial Process Flow Diagram (PFD) Rebuild & Space-Optimized Shadcn Admin Theme
- **Context**: Quality engineers require an authentic engineering schematic representation of manufacturing processes matching industrial PFD standards (equipment line symbols, orthogonal piping, input stream flags, equipment tags) alongside AIAG/ASME classification, while avoiding dark/blurred header obstruction during modal data entry.
- **Decision**: Rebuilt PFD flow canvas from scratch in `PfdEngineeringCanvas.tsx` supporting 12 vector equipment types, orthogonal piping with 90° bends and directional markers, and incoming variation feed flags; elevated `DocumentHeader.tsx` to `zIndex: 1350` and disabled backdrop blur; modernized PFD, Repository, Actions, and Admin workspaces to Shadcn Admin theme; authored `.agents/rules/ui-theme.md`.
- **Consequence**: Engineers can visualize complex plant processes matching P&ID/PFD engineering drawings, interactively inspect equipment details, and enter FMEA data with continuous unblurred sight of program metadata.
- **Source**: [`frontend/src/features/pfd/components/PfdEngineeringCanvas.tsx:1`](file:///f:/proj-fmea/frontend/src/features/pfd/components/PfdEngineeringCanvas.tsx), [`frontend/src/components/DocumentHeader.tsx:102`](file:///f:/proj-fmea/frontend/src/components/DocumentHeader.tsx), [`versions/v0.5.6.md:1`](file:///f:/proj-fmea/versions/v0.5.6.md)
