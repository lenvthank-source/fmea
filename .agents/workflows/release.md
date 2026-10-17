# Release Workflow

## Deployment Architecture

- **Frontend**: Auto-deploys to Cloudflare Pages on `main` push
- **Backend**: Auto-deploys to Render (Docker) on `main` push
- **Database**: Schema changes via `npx prisma db push` to Neon

Source: [deployment_guide.md](file:///f:/proj-fmea/deployment_guide.md)

## Pre-Release Checklist

- [ ] All changes committed and pushed to `main`
- [ ] `cd frontend && npm run build` passes (tsc + vite)
- [ ] `cd backend && npm run build` passes (nest build)
- [ ] `cd backend && npm test` passes
- [ ] Database schema changes pushed: `cd backend && npx prisma db push`
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
