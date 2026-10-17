# Release Checklist

## Pre-Deploy
- [ ] All code merged to `main`
- [ ] Frontend build: `cd frontend && npm run build`
- [ ] Backend build: `cd backend && npm run build`
- [ ] Backend tests: `cd backend && npm test`
- [ ] Database schema synced: `cd backend && npx prisma db push`
- [ ] Environment variables updated on hosting platform if needed

## Post-Deploy
- [ ] Cloudflare Pages deployment succeeded (frontend)
- [ ] Render deployment succeeded (backend Docker)
- [ ] Health check responds: `GET /api/v1/health`
- [ ] Login works (regular account)
- [ ] Guest sandbox login works
- [ ] Core workspaces load: PFD, PFMEA, Control Plan, Actions

Source: [deployment_guide.md](file:///f:/proj-fmea/deployment_guide.md)
