# FMEA Platform Backend

This is the backend server for the AI-Powered FMEA Platform, built using **NestJS** (TypeScript), **Prisma ORM**, **PostgreSQL** (with `pgvector`), and Cloudflare R2 object storage.

---

## 🗺️ Backend Directory Structure

For ease of navigation and context optimization, each subdirectory contains its own `README.md` index file:

- 📂 **[`prisma/`](./prisma/README.md)**: Database schema (`schema.prisma`) and migrations.
- 📂 **[`src/`](./src/README.md)**: Source code of the NestJS application.
  - 📂 **[`src/prisma/`](./src/prisma/README.md)**: Prisma database client initialization and services.
  - 📂 **[`src/modules/`](./src/modules/README.md)**: Feature modules (Action, Auth, Control Plan, PFD, PFMEA, Project).
- 📂 **[`test/`](./test/README.md)**: End-to-end integration test suites.

---

## 🛠️ Project Setup & Commands

### Prerequisites
- Node.js (v18+)
- PostgreSQL running locally or via Docker/Podman
- Cloudflare R2 credentials or compatible S3 mock (configured in `.env`)

### Install Dependencies
```bash
npm install
```

### Database Operations
```bash
# Push schema changes to the database
npx prisma db push

# Open Prisma Studio to explore tables
npx prisma studio
```

### Start Server
```bash
# Development (with auto-reload)
npm run start:dev

# Production build and run
npm run build
npm run start:prod
```

### Testing
```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```
