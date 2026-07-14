---
name: "SSO Authentication & Tenant Context Verification"
description: "Governs JWT tokens, subdomain validation, JIT user provisioning, and Row-Level Security (RLS) connection setting."
---

# SSO Authentication & Tenant Context Verification Skill

This skill governs identity validation, authentication tokens, and tenant context mapping.

## 1. Flow Stages
1. **Redirect & IDP Verify**: User initiates login via tenant subdomain and is redirected to IDP (Azure AD, Okta, Google Workspace).
2. **SSO Callback & Mapping**: IDP returns auth payload. JIT-provision user if they belong to the tenant domain but don't exist in the database yet.
3. **JWT Generation**: Generate access token (15 mins) and refresh token (7 days) with `tenant_id` parameters in payload. Store tokens in httpOnly cookies and memory.
4. **RLS Context Setting**: Prisma middleware maps `tenant_id` to database connection variables.
5. **Local Authentication Fallback**: Allow local login via email/password. Passwords must be hashed using bcrypt with a cost factor of 12.

## 2. Integrity Rules
- **RLS Enforced**: Database connection middleware must execute `SET app.current_tenant_id = {tenantId}` and `SET app.current_user_id = {userId}` before querying FMEA tables.
- **Cascading Deletes**: ON DELETE CASCADE must be configured on all user and project data foreign keys relative to the tenant to prevent dangling or orphaned tenant data.
- **MFA Check**: Multi-factor authentication is enforced if `mfa_enabled` is set to true in the user profile.
- **JWT Payload Structure**: Must contain: `sub` (user ID), `email`, `tenant_id`, `roles`, `permissions`, `iat` (issued at), and `exp` (expiry).
- **CORS Subdomains**: Only whitelisted tenant subdomains are permitted to connect.

## 3. Key Database Tables
- `tenant`: Master tenant record with subdomains and allowed IDP configurations.
- `user` / `role` / `user_role` / `role_permission`: The RBAC model storing permissions codes.

## 4. API Endpoints
- `POST /api/v1/auth/sso/callback` — OIDC callback endpoint for processing IDP response.
- `POST /api/v1/auth/login` — Fallback email/password login endpoint.
- `POST /api/v1/auth/mfa/verify` — MFA verification endpoint.

## 5. Related Skills
- `fmea-authoring`: Access control check for viewing/editing rows.
- `revision-approval`: Segregation checks verify the active user ID from JWT context against the revision author ID.
