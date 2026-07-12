# Project Rules: FMEA Quality Platform

This document compiles the core architectural rules, compliance guidelines, and agentic behavior guidelines for the FMEA Quality Platform. All agents and subagents must adhere to these rules when modifying code or design assets.

---

## 1. General Architectural Rules

### 1.1 Multi-Tenant Data Isolation
- **Tenant Isolation**: Every database query on user data, projects, or documents must contain a `tenantId` filter. Cross-tenant leakage is a critical security violation.
- **Row-Level Security (RLS)**: Setting Postgres session variables (`SET app.current_tenant_id = {tenantId}` and `SET app.current_user_id = {userId}`) is mandatory for direct SQL queries. All tables must configure `ON DELETE CASCADE` relative to the `tenant` table.

### 1.2 Data Integrity & Validation
- **Prerequisites Enforcement (7-Step Gating)**: Prevent users or agents from skipping steps in the FMEA workflow. A step cannot start until its predecessor is complete.
- **Rating Ranges**: All risk evaluations (Severity, Occurrence, Detection) must strictly occupy the integer range [1, 10].
- **Action Priority (AP)**: AP (High, Medium, Low) is a lookup-based read-only field derived from AIAG-VDA 2019 standards and cannot be overridden manually.
- **Severity Inheritance**: FMEA row severity is inherited from the highest severity value of its associated failure effects.

### 1.3 Role-Based Access Control (RBAC)
Enforce granular permissions matching the active JWT user payload. The 5 roles and their permission scopes are:
- **Admin**: `admin.config` (manage tenant configurations and SSO integrations).
- **Quality Engineer**: `pfmea.create`, `pfmea.edit`, `dfmea.create`, `dfmea.edit`, `pfd.create`, `pfd.edit`, `cp.create`, `cp.edit`, `action.create`, `ai.use`.
- **Reviewer**: `revision.review`, `action.view`.
- **Approver**: `revision.approve`, `action.view`.
- **Viewer**: `document.view`, `action.view`.

### 1.4 Failure Chain Completeness
- **Completeness Rule**: Each failure mode must have at least one effect and one cause.
- **Control Linkage**: Each root cause must link to at least one prevention or detection control.

### 1.5 Step Gating Entry Criteria
| Step | Process Step | Required Entry Criteria | Required Output |
|---|---|---|---|
| 1 | Planning (5Ts) | Project initialization | Document scope & 5Ts |
| 2 | Structure Analysis | BOM (DFMEA) or PFD (PFMEA) | Structural hierarchy tree |
| 3 | Function Analysis | Complete structure analysis | Functions and specifications |
| 4 | Failure Analysis | Complete function analysis | Cause → Failure Mode → Effect chains |
| 5 | Risk Analysis | Complete failure analysis | S/O/D ratings and AP values |
| 6 | Optimization | High AP rows identified | Corrective/preventive actions |
| 7 | Documentation | Action verification completed | Approved and locked revision |

---

## 2. Process-Specific Customization Rules

### 2.1 PFD ↔ PFMEA Bidirectional Linking
- **Verification Rule**: A PFMEA row cannot reference a process step that is missing from the Process Flow Diagram (PFD).
- **Orphan Flagging**: Flag any PFD steps that lack a corresponding FMEA row as coverage warnings.
- **Special Characteristics Flow-Down**: Special/critical characteristics identified in the DFMEA must flow down to the PFMEA as mandatory coverage items.

### 2.2 Control Plan (CP) Synchronization
- **Bidirectional Mapping**: Editing a control method or tolerance in the Control Plan must automatically propagate back to the linked PFMEA prevention/detection control or requirement, and vice-versa, in a serializable transaction.
- **Control Integrity**: Prevention and detection measures must be categorized distinctly to prevent calculation overlap.

### 2.3 Corrective Actions & Life Cycle
- **High AP Mandate**: Corrective action tracking is mandatory for any analysis row evaluated as High AP.
- **Closure Validation**: An action cannot be transitioned to `Closed` or `Verified` until evidence files are uploaded to Cloudflare R2 (50MB max file size limit) and post-action (After) S/O/D ratings are assigned.
- **Junction Tracking**: Track and store before/after ratings in `action_fmea_link` junction rows.
- **Action States**: Enforce transition flow: `Open` → `InProgress` → `Completed` → `Verified` → `Closed` / `Cancelled`.

### 2.4 Revisions & Approvals (21 CFR Part 11)
- **Review Segregation**: A revision creator cannot act as its reviewer or approver.
- **Immutability**: Once a revision has `locked_at` set, all write mutations to its contents are permanently blocked.
- **Audit Trails**: Capture all revision status transitions with digital signatures (timestamp, user name, action type, hash) in the immutable `audit_log` partition. Database constraints must reject all UPDATE and DELETE commands on the `audit_log` table.

---

## 3. AI Copilot, Webhooks & Embedding Rules

### 3.1 Human-in-the-Loop Suggestion Review
- AI recommendations must be stored in the `ai_suggestion` table with status `proposed`.
- AI suggestions must never directly modify live FMEA rows without an explicit user acceptance action (`accepted` or `accepted_modified`).
- Auto-expire proposed suggestions older than 30 days via a daily cron task.

### 3.2 Embedding Partitioning
- Vector similarity searches must filter strictly by `tenant_id` within Neon.
- Indexing must trigger asynchronously upon document revision approval using the BullMQ `embedding` queue.
- Neon pgvector HNSW index configurations must remain locked at: M=16, ef_construction=64.

### 3.3 Webhook Integrations Security
- **Outbound Webhooks**: All outbound webhook payloads must be signed using HMAC-SHA256, sending the signature in the `X-FMEA-Signature` header.
- **Inbound Webhooks**: Inbound API webhook callbacks must verify active tenant authorization tokens.

---

## 4. Landing Page, Guest Access & Feedback System Rules

### 4.1 Cold-Start & Health Monitoring
- All frontend entry points must invoke the `useBackendWarmup` hook on mount to ping `/health`.
- CTA buttons on the landing page and login gates must handle state appropriately depending on `isBackendReady` (e.g. show shimmer/loader status and prepare user).

### 4.2 Guest Account Lifecycles
- Guest accounts belong strictly to the `guest-tenant` subdomain workspace and have standard read/write permissions matching a Quality Engineer role.
- Guest sessions must carry `isGuest: true` in the JWT claims payload.
- Inactive guest accounts (no logins for 15 days) must be soft-archived rather than fully deleted.

### 4.3 Contextual Feedback & Error Boundary
- A global `ErrorBoundary` must wrap the main client-side AppRouter to intercept uncaught runtime exceptions and prompt the user to submit an error feedback report.
- The feedback submission payload must automatically extract the current page URL, document title, client browser info, and screen resolutions, and send them to `/auth/feedback`.

