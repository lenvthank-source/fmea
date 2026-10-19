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
- Tenant-owned data retains existing lifecycle rules. Global public-handle reservations intentionally have no tenant/user cascade, are immutable, and survive account/tenant deletion.
- Source: [prisma.service.ts](file:///f:/proj-fmea/backend/src/prisma/prisma.service.ts)

## Guest Accounts

- Belong to `guest-tenant` workspace
- JWT contains `isGuest: true`
- Quality Engineer permissions by default
- 15-day inactivity soft-archive (not hard delete)
- Read-only access to Work Element Repository (no edit/delete)
- Source: [auth.service.ts](file:///f:/proj-fmea/backend/src/modules/auth/auth.service.ts)

### Guest Entry UI
- Homepage Try FMEApex / Try it out and the login trial action route to `/app/initializing`. `frontend/src/features/auth/InitializingWorkspace.tsx:1` waits for auth hydration, reuses an existing token or invokes the existing guest login endpoint, and enters `/app/projects` only on success.
- Guest initialization failures show a retryable error on that screen; they do not fall back to the email/password form. `/login` remains an explicit sign-in screen and redirects an already authenticated session to projects.
- Existing backend JWT, guest permissions, tenant checks, protected-route guards, and guest sessionStorage policy remain authoritative. The UI does not bypass authentication.

### Viewer-scoped workspace activity
- `GET /api/v1/audit-logs/recent` receives the authenticated viewer as well as tenant context. Project, document, revision, row, structure, and actor lookups retain tenant constraints and project-list visibility rules (guest reference + own unexpired program, owner scope for regular users, tenant scope for Admin).
- Only recorded audit rows are returned. Unattributable or inaccessible rows are omitted; no synthetic fallback records. Collection POST audit writes obtain the entity ID from the successful response when the URL has no ID.
- Account control displays the stable server-assigned `publicHandle`; trial information is in its menu. Internal `isGuest`, session storage, limits and permissions are preserved. Guest archive controls remain hidden.

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

## Revision protection and approval records

- Locked revisions (`lockedAt !== null`) block all write mutations
- Revision creator cannot be reviewer or approver
- Audit log entries are write-only (no UPDATE/DELETE)
- Approval currently records approver ID, decision, comment and timestamp after password confirmation; no cryptographic approval hash is persisted by the inspected method. These controls alone are not regulatory certification.

## File Upload Security

- Evidence files uploaded to Cloudflare R2 via `@aws-sdk/client-s3`
- 50MB max file size limit
- Falls back to local `uploads/evidence` directory if R2 not configured
- Presigned URLs expire after 1 hour
- Source: [r2.service.ts](file:///f:/proj-fmea/backend/src/modules/action/r2.service.ts)

## Webhook Security

- Outbound: HMAC-SHA256 signed with `X-FMEA-Signature` header
- Inbound: Must verify active tenant authorization tokens

## Permanent public handles
Guest creation allocates a lowercase two-word handle transactionally using secure randomness, a global unique ledger insert, and collision retries. PublicHandleReservation has no user/tenant ownership FK; permanent tombstones are a deliberate exception to tenant cascades. Database triggers prevent reservation update/delete/truncate and prevent changing an assigned user handle. Migration backfills existing guest accounts without modifying historical names/emails, IDs, ownership or audit events. New access claims, login response and `/auth/me` expose publicHandle; registered names remain unchanged. Display handles are not authentication secrets. Sources: `backend/src/modules/auth/public-handle.ts:1`, migration `20261019090000_public_handles/migration.sql:1`.
