# Security Rules

## Authentication

- **Strategy**: JWT Bearer tokens via Passport.js
- **Access Token**: 15-minute expiry, contains `sub`, `email`, `tenantId`, `roles[]`, `permissions[]`
- **Refresh Token**: 7-day expiry, contains `sub`, `tenantId`
- **Password Hashing**: bcrypt with cost factor 12
- **Public Endpoints**: Decorated with `@Public()` — bypass JWT validation
- **Global Guard**: `JwtAuthGuard` registered as `APP_GUARD` in [app.module.ts](file:///f:/proj-fmea/backend/src/app.module.ts)

Source: [auth.service.ts](file:///f:/proj-fmea/backend/src/modules/auth/auth.service.ts), [jwt.strategy.ts](file:///f:/proj-fmea/backend/src/modules/auth/jwt.strategy.ts)

## Authorization (RBAC)

| Role | Key Permissions |
|---|---|
| Admin | `admin.config`, `admin.users` (bypasses all permission checks) |
| Quality Engineer | `pfmea.create`, `pfmea.edit`, `dfmea.*`, `pfd.*`, `cp.*`, `action.create`, `ai.use` |
| Reviewer | `revision.review`, `action.view` |
| Approver | `revision.approve`, `action.view` |
| Viewer | `document.view`, `action.view` |

- Permission enforcement: `PermissionGuard` checks `@Permissions(...)` decorator
- Admin role automatically passes all permission checks
- Source: [permission.guard.ts](file:///f:/proj-fmea/backend/src/modules/auth/guards/permission.guard.ts)

## Multi-Tenant Data Isolation

- **CRITICAL**: Every database query on user data MUST include `tenantId` filter
- Cross-tenant data leakage is a security violation
- RLS session variables: `SET app.current_tenant_id` and `SET app.current_user_id`
- All tables cascade delete relative to `tenant` table
- Source: [prisma.service.ts](file:///f:/proj-fmea/backend/src/prisma/prisma.service.ts)

## Guest Accounts

- Belong to `guest-tenant` workspace
- JWT contains `isGuest: true`
- Quality Engineer permissions by default
- 15-day inactivity soft-archive (not hard delete)
- Read-only access to Work Element Repository (no edit/delete)
- Source: [auth.service.ts](file:///f:/proj-fmea/backend/src/modules/auth/auth.service.ts)

## Secrets Management

- Environment variables loaded via `@nestjs/config` (`ConfigModule.forRoot({ isGlobal: true })`)
- Secrets in `.env` file (gitignored)
- Required env vars:
  - `DATABASE_URL` — Neon PostgreSQL connection string
  - `JWT_SECRET` — Access token signing key
  - `JWT_REFRESH_SECRET` — Refresh token signing key
  - `PORT` — Server port (default 3000)
- No `.env.example` file currently exists — UNKNOWN whether R2 credentials are env-configured

## Input Validation

- Global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`
- All DTOs use `class-validator` decorators for field validation
- S/O/D ratings constrained to `@Min(1) @Max(10) @IsInt()`
- Source: [main.ts](file:///f:/proj-fmea/backend/src/main.ts)

## Revision Immutability (21 CFR Part 11)

- Locked revisions (`lockedAt !== null`) block all write mutations
- Revision creator cannot be reviewer or approver
- Audit log entries are write-only (no UPDATE/DELETE)
- Digital signatures: timestamp + user name + action type + hash

## File Upload Security

- Evidence files uploaded to Cloudflare R2 via `@aws-sdk/client-s3`
- 50MB max file size limit
- Falls back to local `uploads/evidence` directory if R2 not configured
- Presigned URLs expire after 1 hour
- Source: [r2.service.ts](file:///f:/proj-fmea/backend/src/modules/action/r2.service.ts)

## Webhook Security

- Outbound: HMAC-SHA256 signed with `X-FMEA-Signature` header
- Inbound: Must verify active tenant authorization tokens
