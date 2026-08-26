# Permissions & RBAC — Endpoint → Permission Matrix

Guard stack `app.module.ts:50-59` `APP_GUARD JwtAuthGuard` (respects `@Public`) → `APP_GUARD PermissionGuard` (checks `@Permissions(...)`). `JwtPayload: {sub, email, tenantId, roles[], permissions[], isGuest}` (`auth.service:417`). Fallback secrets `super-secret-fmea-...` must be rotated via `JWT_SECRET/JWT_REFRESH_SECRET` env.

## Roles (seeded per tenant `prisma.service:77` + `auth.service:178-276`)
| Role | System | Representative permissions (22 total) |
|------|--------|----------------------------------------|
| **Admin** | isSystem | **all** (`admin.config` plus every below) via `rolePermission.createMany(dbPermissions)` |
| **Quality Engineer** | isSystem | `project.view/edit`, `pfmea.create/edit/view/delete`, `dfmea.*`, `cp.create/edit/view/delete`, `revision.create/submit`, `action.create/edit/view/close` (10-12 perms) |
| **Reviewer** | isSystem | `project.view, pfmea.view, dfmea.view, cp.view, revision.review, action.view` |
| **Approver** | isSystem | `project.view, pfmea.view, dfmea.view, cp.view, revision.approve, action.view` |
| **Viewer** | isSystem | `*.view` only (`project.view, pfmea.view, dfmea.view, cp.view, action.view`) |

Guest `isGuest:true` gets Quality Engineer role in `guest-tenant` (15d soft-archive `user.service:15`); `guestLogin` forbids `project.delete`, repository approve.

Admin bypass: `PermissionGuard` returns true if `user.roles.includes('Admin')` (`AuthContext:276` frontend mirror).

## Endpoint → Required permission (key, see `api-contracts.md` for method+path)
| Area | Endpoint pattern | Decorator | Role that grants |
|------|------------------|-----------|------------------|
| Auth | `POST /auth/:login|guest|refresh`, `GET /health`, `GET /rating-scales` | `@Public` | — |
| Rating write | `PUT /rating-scales/:scale/:value` | `@Permissions('admin.config')` | Admin |
| Projects | `GET /projects` | `@Permissions('project.view')` | QE/Reviewer/Approver/Viewer/Admin |
|  | `POST /projects`, `POST /projects/:id/replicate`, `PATCH /projects/:id` | `@Permissions('project.edit')` or `project.create` | QE/Admin |
| Documents/Revisions | `POST /projects/:id/revisions` | `@Permissions('project.edit')` (createRevision) | QE/Admin |
|  | `GET /projects/:id/revisions`, `GET /projects/:id/revisions/:id`, `GET /projects/admin/revisions` | `project.view` / `admin.config` | platform |
|  | `PATCH /projects/revisions/:id` | owner tenant check + draft/locked guard (no extra @Permissions, rely on project.edit upstream) | QE/Admin |
|  | `DELETE /projects/revisions/:id` & `DELETE /projects/admin/revisions/:id` | `admin.config` for admin route | Admin |
|  | `POST /projects/revisions/:id/activate` | `project.edit` | QE/Admin |
|  | `POST /projects/revisions/:id/submit` | `revision.submit` | QE/Admin |
|  | `POST /projects/revisions/:id/approve` | `revision.approve` + segregation `createdById!=userId` + e-sig `bcrypt.compare` 12 | Approver/Admin |
|  | `POST /projects/revisions/:id/reject` | `revision.review` + segregation | Reviewer/Admin |
| PFD | `GET /revisions/:id/pfd-steps` | `pfmea.view` (mapped) | Viewer+ |
|  | `POST/PATCH/DELETE /pfd-steps*`, `POST /revisions/:id/pfd-steps/batch|import|reorder` | `pfmea.edit` + `assertRevisionWritable` (`project.service:1631` blocks locked/non-draft) | QE/Admin |
| PFMEA | `GET /revisions/:id/pfmea-rows` | `pfmea.view` | Viewer+ |
|  | `POST/PATCH/DELETE /pfmea-rows/*`, `sync-from-tree`, structure `structure-functions/failures`, `failure-modes/:id/link` | `pfmea.edit` + guard | QE/Admin |
|  | `DELETE /failure-links, /link-actions` | `pfmea.edit` | QE/Admin |
| DFMEA | parallel `dfmea.create/edit/view/delete` guards | `dfmea.*` | QE/Admin |
| Control Plan | `GET /revisions/:id/control-plan-rows` | `cp.view` | Viewer+ |
|  | `POST/PATCH/DELETE /control-plan-rows/*`, `sync` | `cp.edit` + guard | QE/Admin |
| Actions | `GET /actions`, `GET /projects/:id/actions` | `action.view` | Reviewer+ |
|  | `POST /projects/:id/actions`, `PATCH/DELETE /actions/*`, evidence upload | `action.create/edit/close` | QE/Admin |
| Audit | `GET /revisions/:id/audit-logs`, `GET /audit-logs` | tenant-filtered, typically `revision.view` implied |  |
| Repository | `POST /repository/packages`, `GET /repository/packages` | any authed; approve → `admin.config` |  |
| Admin panel | `GET /admin/*`, `PUT /admin/users/:id/role` | `admin.config` | Admin |

## Frontend enforcement
- `AuthContext.hasPermission(per)` (`AuthContext:275`) true if Admin else `permissions.includes(per)`. Used by `RequirePermission.tsx:31` (redirect `/` if no perms) + `AppShell` menu filtering (`AppShell:412` hides admin if not `admin.config`).
- `Workspace` inline edits call `parseApiError` + `showToast(getToastSeverity)` — locked/draft returns warning 6s, else error 7s (`ToastProvider`).
- Guest restrictions share QE but hide `project.delete` etc via permission check.

## RLS & isolation
- App-level via `tenantId` filter on every Prisma query (never raw SQL without `SET app.current_tenant_id`). `PrismaService` seeds permissions + roles tenant-scoped. `onDelete:Cascade` from `tenant` prevents orphan cross-tenant.
- Secrets via `@nestjs/config` `.env` `DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT`; no hardcoded secrets in controllers.
- ValidationPipe `whitelist:forbidNonWhitelisted` strips unknown fields; DTOs `class-validator` enforce `S/O/D @Min(1) @Max(10) @IsInt`.

## Common mistakes to avoid
- Missing `@Public` on login/refresh/health → 401 before auth.
- Missing `tenantId` in `where` → cross-tenant leak.
- Direct `prisma.*` outside service → bypass `assertRevisionWritable`.
- Using `user.sub` vs `userId` mismatch (payload `sub` is `user.id`).

