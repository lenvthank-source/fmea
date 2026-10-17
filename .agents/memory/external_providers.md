# External Providers & Infrastructure Specifications (`external_providers.md`)

This specification details the cloud infrastructure components, third-party integrations, connection lifecycles, and operational constraints for the FMEA Quality Platform.

---

## 1. Neon Serverless PostgreSQL & pgvector

### 1.1 Connection & Cold-Start Policy
- **Driver**: Prisma ORM with `@prisma/adapter-pg` or standard PostgreSQL connection strings.
- **Connection Timeout**: Always append `&connect_timeout=30` to connection URLs to accommodate Neon serverless compute suspend/resume cold starts (typically 1.5s to 3s).
- **Session Variables (RLS Enforcement)**:
  Before executing raw SQL queries or user transactions, session variables must be initialized:
  ```sql
  SET LOCAL app.current_tenant_id = '{tenantId}';
  SET LOCAL app.current_user_id = '{userId}';
  ```

### 1.2 pgvector HNSW Configuration
- **Model Dimension**: 1536 (matching OpenAI `text-embedding-3-small`).
- **Index Parameters**:
  - Distance Metric: Cosine distance (`<=>`).
  - Construction Parameters: `M = 16`, `ef_construction = 64`.
- **Tenant Isolation**: Every vector similarity query **MUST** combine the vector cosine distance clause with a strict `tenant_id = '{tenantId}'` scalar filter. Cross-tenant vector querying is strictly prohibited.

---

## 2. Cloudflare Pages (Frontend Hosting)

- **Target**: High-performance static Edge hosting for the React 19 + Vite bundle (`frontend/dist`).
- **Routing**: Single Page Application (SPA) fallback configured to route all non-static paths to `/index.html 200`.
- **Cold-Start Resilience**: Invokes `useBackendWarmup` hook on root app mount to ping the Render backend `/health` endpoint, rendering loading states until the backend is fully awake.

---

## 3. Cloudflare R2 (Action Evidence Storage)

- **Purpose**: Secure edge object storage for corrective and preventive action verification evidence.
- **Protocol**: S3-compatible API client (`@aws-sdk/client-s3`).
- **File Constraints**:
  - Maximum upload size: **50 MB** per file.
  - Supported MIME types: PDF, PNG, JPEG, XLSX, DOCX, CSV.
- **Presigned URLs**: Evidence files are served via time-bounded presigned GET URLs (expiration: 15 minutes) or proxied through tenant-authenticated endpoints.

---

## 4. Render (Backend Container Compute)

- **Runtime**: NestJS 11 application executed inside a Node 22 Alpine Docker container.
- **Port**: Default `PORT=3000`.
- **Health Check Route**: `GET /health` responding with `{ status: "ok", timestamp: ... }`.
- **Graceful Shutdown**: Handles `SIGTERM` and `SIGINT` signals, closing Prisma client connections and draining active HTTP requests within 10 seconds.

---

## 5. BullMQ & Redis (Asynchronous Queues)

- **Embedding Queue (`embedding`)**:
  - Trigger: Asynchronously dispatched when a document revision is approved and locked.
  - Batch Size: 25 rows per job to prevent LLM rate limiting.
  - Retry Policy: Exponential backoff (3 attempts, initial delay 2s).
- **Cleanup Cron (`suggestion-expiry`)**:
  - Schedule: Daily at 02:00 UTC.
  - Purpose: Automatically marks proposed AI suggestions older than 30 days as `expired`.

---

## 6. OpenAI LLM & Embedding Integrations

- **Embedding Model**: `text-embedding-3-small` (1536 dimensions).
- **Generation Model**: GPT-4o / GPT-4o-mini for Copilot suggestions.
- **Timeout Policy**: All HTTP requests to OpenAI endpoints must specify an explicit `timeout: 30000` (30 seconds) with `AbortSignal`.
- **Human-in-the-Loop Mandate**: AI suggestions are stored in `ai_suggestion` with state `proposed`. AI models **CANNOT** write directly to live FMEA rows without explicit user approval.
