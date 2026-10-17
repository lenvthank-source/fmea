# Architecture Context

## System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                         │
│  React 19 SPA (Vite) → Static HTML/JS/CSS                  │
└───────────────────────────────┬───────────────────────────────┘
                                │ fetch() /api/v1/*
┌───────────────────────────────┼───────────────────────────────┐
│                    Render (Docker)                          │
│  NestJS 11 API                                              │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐             │
│  │ Controllers │→│  Services  │→│ PrismaService │──┐          │
│  └─────────────┘  └────────────┘  └─────────────┘  │          │
│       ↑                                         │          │
│  ┌─────────────┐  ┌────────────┐             │          │
│  │ JwtAuthGuard│  │ Permission │             │          │
│  │   (global)  │  │   Guard    │             │          │
│  └─────────────┘  └────────────┘             │          │
└─────────────────────────────────────────────────┬─────────────┘
                                                 │
┌─────────────────────────────────────────────────┼─────────────┐
│                                                 │             │
│  ┌───────────────────┐        ┌──────────────────┐            │
│  │ Neon PostgreSQL  │        │  Cloudflare R2    │            │
│  │ (pgvector:pg15)  │        │  (evidence files) │            │
│  └───────────────────┘        └──────────────────┘            │
└───────────────────────────────────────────────────────────────┘
```

## Backend Module Dependency Graph

```
AppModule
├── AuthModule (JWT, Passport, guest login, RBAC)
├── UserModule → PrismaModule
├── ProjectModule → AuditLogModule, PrismaModule
├── PfdModule → PrismaModule
├── PfmeaModule → PrismaModule
├── ControlPlanModule → PrismaModule
├── ActionModule → PrismaModule (includes R2Service)
├── StructureLinkageModule → PrismaModule
├── AuditLogModule → PrismaModule, AuthModule
├── RepositoryModule → PrismaModule, AuthModule
└── PrismaModule (global)
```

## Data Flow: FMEA 7-Step Process

```
Step 1: Planning           → Project creation (ProjectModule)
 Step 2: Structure Analysis → PFD steps (PfdModule) or BOM items
 Step 3: Function Analysis  → Structure functions (StructureLinkageModule)
 Step 4: Failure Analysis   → Structure failures + links (StructureLinkageModule)
 Step 5: Risk Analysis      → PFMEA rows with S/O/D + AP (PfmeaModule)
 Step 6: Optimization       → Corrective actions (ActionModule)
 Step 7: Documentation      → Revision lock + audit (ProjectModule)
```

## Key Data Relationships

```
Tenant
 └── Users (multi-tenant isolation)
 └── Projects
      └── Documents (PFD, PFMEA, DFMEA, CONTROL_PLAN)
      │    └── DocumentRevisions
      │         └── ProcessSteps (PFD steps)
      │         └── PfmeaRows (FMEA grid rows)
      │         └── ControlPlanRows
      └── StructureFunctions (tree nodes: project/step/work-element)
      │    └── StructureFailures (effect/mode/cause)
      │         └── FailureLinks (network connections)
      │              └── LinkActions (corrective actions on links)
      └── Actions (corrective/preventive)
           └── ActionFmeaLinks (before/after ratings)
           └── ActionEvidence (R2 file attachments)
```

## Frontend Route Map

| Route | Component | Auth Required |
|---|---|---|
| `/` | LandingPage | No |
| `/login` | Login | No |
| `/learn/:slug` | PillarPage | No |
| `/fmea/:industry` | IndustryFmeaPage | No |
| `/vs/:competitor` | CompetitorVsPage | No |
| `/glossary/:term` | GlossaryPage | No |
| `/app/projects` | ProjectList | Yes |
| `/app/projects/:id/pfd` | PfdWorkspace | Yes |
| `/app/projects/:id/pfmea` | PfmeaWorkspace | Yes |
| `/app/projects/:id/dfmea` | DfmeaWorkspace | Yes |
| `/app/projects/:id/control-plan` | ControlPlanWorkspace | Yes |
| `/app/projects/:id/linkage` | LinkageMap | Yes |
| `/app/projects/:id/settings` | ProjectSettings | Yes |
| `/app/actions` | ActionsDashboard | Yes |
| `/app/repository` | RepositoryPage | Yes |
| `/app/admin` | AdminPanel | Yes |

Source: [router.tsx](file:///f:/proj-fmea/frontend/src/app/router.tsx)

## API Route Summary

| Prefix | Module | Key Operations |
|---|---|---|
| `/api/v1/auth` | Auth | login, signup, guest, refresh, feedback, contact |
| `/api/v1/users` | User | CRUD, role assignment, inquiries, feedback |
| `/api/v1/projects` | Project | CRUD, documents, revisions, audit |
| `/api/v1/revisions/:id/pfd-steps` | PFD | Step CRUD, reorder, import |
| `/api/v1/revisions/:id/pfmea-rows` | PFMEA | Row CRUD, tree sync |
| `/api/v1/revisions/:id/control-plan-rows` | ControlPlan | Row CRUD, PFMEA/PFD sync |
| `/api/v1/actions` | Action | CRUD, evidence upload/delete |
| `/api/v1/structure-functions` | StructureLinkage | Function tree CRUD |
| `/api/v1/structure-failures` | StructureLinkage | Failure tree CRUD |
| `/api/v1/failure-modes/:id` | StructureLinkage | Link network, candidates |
| `/api/v1/repository/packages` | Repository | Package CRUD, approve/reject, import |
| `/api/v1/audit-logs` | AuditLog | Query audit entries |

## Database

- **Provider**: Neon serverless PostgreSQL 15 with pgvector extension
- **ORM**: Prisma 5.20.x
- **Schema management**: `prisma db push` (no committed SQL migrations)
- **Models**: 41 total (see [schema.prisma](file:///f:/proj-fmea/backend/prisma/schema.prisma))
- **Seeding**: Built into `PrismaService.seedDefaultData()` and `AuthService.registerTenant()`
- **Connection**: Pooled via Neon with `sslmode=require`
