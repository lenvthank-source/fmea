# Release Workflow

## Deployment Architecture

- **Frontend**: Auto-deploys to Cloudflare Pages on `main` push
- **Backend**: Auto-deploys to Render (Docker) on `main` push
- **Database**: Reviewed migration history via `npx prisma migrate deploy` to Neon; validate Prisma first and confirm status/drift afterward

Source: [deployment_guide.md](file:///f:/proj-fmea/deployment_guide.md)

## Pre-Release Checklist

- [ ] All changes committed and pushed to `main`
- [ ] `cd frontend && npm run build` passes (tsc + vite)
- [ ] `cd backend && npm run build` passes (nest build)
- [ ] `cd backend && npm test` passes
- [ ] Reviewed database migrations applied: `cd backend && npx prisma migrate deploy`; no reset/data-loss flags
- [ ] No `.env` changes needed (or communicated to deployment platform)

## Post-Release Verification

- [ ] Frontend loads on production URL
- [ ] Backend health check responds: `GET /api/v1/health`
- [ ] Login flow works (regular + guest)
- [ ] Critical workspace features load (PFD, PFMEA, Control Plan)

## CAUTION

> Never invent deployment commands. Use only commands documented in
> [deployment_guide.md](file:///f:/proj-fmea/deployment_guide.md)
> and [package.json](file:///f:/proj-fmea/package.json).

Release 0.10.0: five migrations already applied to configured Neon, including the existing-schema baseline and legacy-API handle compatibility. Do not re-resolve the baseline on a fresh database. Normal deployment uses the committed history. Never print credential-helper output or include runtime logs in a release.
