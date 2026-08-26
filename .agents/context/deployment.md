# Deployment & Ops

## Targets
| Tier | Where | What | Health |
|------|-------|------|--------|
| Frontend | Cloudflare Pages — auto-deploy `main` → `vite build` (React19+Vite8+MUI9) | `frontend/dist` → CDN | `GET /` + `GET /api/v1/health` proxied |
| Backend | Render Docker — `F:\proj-fmea\backend\Dockerfile` → Nest11 (`npm run build` → `dist/main.js`) | `PORT=3000` `node dist/main` | `GET /api/v1/health` (cold-start ~8-12s; warmup `useBackendWarmup` hook) |
| DB | Neon Postgres 15+pgvector — pooled `DATABASE_URL` `ep-hidden-math-...-pooler.c-2...aws.neon.tech` `sslmode=require&channel_binding=require` | Prisma 5.20 `prisma db push` (no `migrate` history, per ADR) + `prisma generate` | `SELECT 1` |
| Files | Cloudflare R2 S3 via `@aws-sdk/client-s3` presigned 1h fallback `uploads/evidence/` | 50MB limit `action.service` | `S3Client` region auto |
| Queue | Redis + BullMQ (`embedding` low/600s/2retries, `linkage`?) for vector indexing & CP sync | — | `REDIS_URL` if configured |

## Local dev
```bash
npm run install:all
docker compose -f fmea-pod.yaml up -d   # postgres:15+pgvector + redis
cd backend && npx prisma generate && npx prisma db push
npm run backend:dev   # :3000  (or podman:up)
npm run frontend:dev  # Vite :5173 proxy /api → :3000
```
Build verify: `cd backend && npx tsc --noEmit && npm run build` (`nest build`) ; `cd frontend && npx tsc -b && npm run build` (`vite build` + `oxlint`). Minimal tests `npm test` (3 backend specs, 0 frontend).

## Env matrix (required)
| Var | Example | Where |
|-----|---------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:...@ep-hidden-math-pooler.../neondb?sslmode=require&channel_binding=require` | Render + local `.env` |
| `JWT_SECRET` | `super-secret-fmea-token-key-2026` | Render; fail-fast in `main.ts:50` prod |
| `JWT_REFRESH_SECRET` | `super-secret-fmea-refresh-token-key-2026` | Render |
| `JWT_EXPIRES_IN` | `15m` | `auth.service:420` (default) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | `auth.service:427` (inactivity capped 72h via `lastActivityAt`) |
| `PORT` | `3000` | `main.ts:6` |
| `R2_*` | `R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET` | `action.service` S3; fallback local `uploads/` |
| `REDIS_URL` | `redis://localhost:6379` | BullMQ; if absent, jobs inline |

All secrets via `@nestjs/config` ConfigService; never commit `.env` (`rules/security.md`, `git.md` Never Commit list).

## Prisma workflow
- Single source schema `backend/prisma/schema.prisma` (41 models + indexes `project[tenantId,status,createdAt]`, `DocumentRevision`, `lastActivityAt`, `SeverityScale`). 
- Local: `npx prisma generate && npx prisma db push` (no `prisma/migrations`).
- Deploy: Render `postinstall` runs `prisma generate`; runtime first `GET /rating-scales` seeds `ensureSeeded()` (`rating-config.service`), `PrismaService.seedDefaultData()` seeds global `Permission` 22 rows if empty.
- Indexes added `v0.2.3` require `db push` on Render (auto on next deploy if schema changed).

## Release pipeline
1. Bump `package.json#version` root + `backend/package.json` + `frontend/package.json` in sync.
2. Create `versions/v<MAJOR.MINOR.PATCH>.md` append-only (template `versions/README.md`) with concrete `path:line` refs.
3. Pre-release checks (`workflows/release.md` 7): commits on `main`, builds green, `npm test`, `prisma db push`, no `.env` staged, `isBackendReady` warmup handled (`useBackendWarmup:13`).
4. Push `main` → Cloudflare Pages + Render auto-deploy (no branch protection, no GitHub Actions).
5. Post-verify: frontend route `/`, `GET /api/v1/health`, login/guest, PFD `GET /revisions/:id/pfd-steps`, PFMEA rows, linkage candidates, rating scales.
6. Note: `.agents/` is currently `gitignored` (`rules/git.md`); use `git add -f .agents/...` or remove ignore to keep knowledge tracked; `docs/` likewise gitignored.

## Known runtime noise
- `ERR_BLOCKED_BY_CLIENT` `fonts.googleapis.com`/`beacon.min.js` — ad-blocker, benign.
- `GET /` & `/favicon.ico` 404 — external probes to Render, not app routes (prefix `/api/v1`).
- Arm Neon pooler `npg_...` password rotates rarely — update `DATABASE_URL` in Render env when rotated.
