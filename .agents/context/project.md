# Project Context

## What FMEApex Does

FMEApex is a multi-tenant, cloud-native platform for AIAG-VDA compliant Failure Mode and Effects Analysis (FMEA). It enables quality engineers to perform structured risk analysis following the 7-step FMEA methodology, manage process flow diagrams, create control plans, track corrective actions, and generate compliant documentation.

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | NestJS | 11.x |
| ORM | Prisma Client | 5.20.x |
| Database | PostgreSQL (Neon serverless) | 15 (pgvector) |
| Frontend Framework | React | 19.x |
| Build Tool | Vite | 8.x |
| UI Library | MUI (Material UI) | 9.x |
| Language | TypeScript | 6.x (frontend), 5.x (backend) |
| Auth | Passport.js + JWT | via @nestjs/passport |
| File Storage | Cloudflare R2 (S3-compatible) | via @aws-sdk/client-s3 |
| Form Validation | react-hook-form + zod | 7.x + 4.x |
| Backend Validation | class-validator + class-transformer | 0.15.x + 0.5.x |
| Linter (frontend) | oxlint | 1.69.x |
| Linter (backend) | ESLint + Prettier | 9.x + 3.x |
| Animations | framer-motion | 12.x |
| SEO | react-helmet-async | 3.x |
| Excel Export | exceljs + xlsx | 4.x + 0.18.x |

Sources: [backend/package.json](file:///f:/proj-fmea/backend/package.json), [frontend/package.json](file:///f:/proj-fmea/frontend/package.json)

## Project Structure

```
proj-fmea/
├── backend/          # NestJS API + Prisma ORM
│   ├── src/
│   │   ├── main.ts           # App bootstrap (port, CORS, prefix, validation)
│   │   ├── app.module.ts     # Root module (imports all feature modules)
│   │   ├── prisma/           # PrismaService (DB connection, RLS, seeding)
│   │   └── modules/          # Feature modules (auth, project, pfd, pfmea, etc.)
│   ├── prisma/
│   │   └── schema.prisma     # Database schema (41 models)
│   ├── test/               # E2E tests
│   └── Dockerfile          # Multi-stage production build
├── frontend/         # React SPA
│   ├── src/
│   │   ├── main.tsx          # React root render
│   │   ├── App.tsx           # Provider hierarchy
│   │   ├── app/router.tsx    # Route definitions
│   │   ├── features/         # Feature-based components
│   │   ├── components/       # Shared components (Layout, SEO, Feedback)
│   │   ├── hooks/            # Custom hooks
│   │   └── theme/            # MUI theme + dark mode
│   └── public/             # Static assets (icons, robots.txt, sitemap)
├── docs/             # Architecture & workflow documentation
├── .agents/          # AI agent context system
└── package.json      # Root orchestration scripts
```

## Development Commands

```bash
# Install all dependencies
npm run install:all

# Start local infrastructure (Postgres + Redis)
npm run podman:up

# Start backend dev server (port 3000)
npm run backend:dev

# Start frontend dev server
npm run frontend:dev

# Build frontend for production
cd frontend && npm run build

# Build backend for production
cd backend && npm run build

# Push database schema changes
cd backend && npx prisma db push

# Generate Prisma client
cd backend && npx prisma generate
```

Source: [package.json](file:///f:/proj-fmea/package.json), [backend/package.json](file:///f:/proj-fmea/backend/package.json)

## Key Entry Points

- Backend bootstrap: [main.ts](file:///f:/proj-fmea/backend/src/main.ts)
- Backend module registry: [app.module.ts](file:///f:/proj-fmea/backend/src/app.module.ts)
- Frontend render: [main.tsx](file:///f:/proj-fmea/frontend/src/main.tsx)
- Frontend providers: [App.tsx](file:///f:/proj-fmea/frontend/src/App.tsx)
- Frontend routing: [router.tsx](file:///f:/proj-fmea/frontend/src/app/router.tsx)
- Database schema: [schema.prisma](file:///f:/proj-fmea/backend/prisma/schema.prisma)
- API config: [config.ts](file:///f:/proj-fmea/frontend/src/config.ts) (`VITE_API_BASE_URL`)

## Deployment

| Component | Platform | Method |
|---|---|---|
| Frontend | Cloudflare Pages | Git-connected auto-deploy from `main` |
| Backend | Render | Docker web service from `main` |
| Database | Neon | Serverless PostgreSQL (pgvector) |
| File Storage | Cloudflare R2 | S3-compatible object storage |

Source: [deployment_guide.md](file:///f:/proj-fmea/deployment_guide.md)
