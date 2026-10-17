# Agent Roster & Delegation Matrix (`.agents/agents/`)

This directory defines the specialized agent personas, file ownership boundaries, and operational scopes for the portable multi-agent mesh across IDEs (Antigravity, Gemini, VS Code, Cursor, Opencode).

---

## 1. Head Orchestrator

| Agent | Specification File | Role & Boundaries |
| :--- | :--- | :--- |
| **Orchestrator** | [`orchestrator/AGENT.md`](./orchestrator/AGENT.md) | Classifies incoming developer intents, coordinates parallel subagents (max 4), maintains the blackboard communication bus (`memory/blackboard.md`), and enforces human confirmation gates. Never writes feature code directly. |

---

## 2. Domain Specialists

| Specialist Agent | Agent Spec | Primary File Ownership & Scope |
| :--- | :--- | :--- |
| **PFMEA Specialist** | [`pfmea/AGENT.md`](./pfmea/AGENT.md) | `frontend/src/features/pfmea/**`, `backend/src/modules/pfmea/**`. Governs 7-step gating, S/O/D ratings, AP lookup calculations, and failure link associations. |
| **DFMEA Specialist** | [`dfmea/AGENT.md`](./dfmea/AGENT.md) | `frontend/src/features/dfmea/**`, DFMEA trees, boundary diagrams, interfaces, and characteristic flow-down to PFMEA. |
| **PFD Specialist** | [`pfd/AGENT.md`](./pfd/AGENT.md) | `frontend/src/features/pfd/**`, `backend/src/modules/pfd/**`. Process flow diagrams, sequence re-ordering, symbol rendering, and PFD↔PFMEA step synchronization. |
| **Control Plan Specialist** | [`control-plan/AGENT.md`](./control-plan/AGENT.md) | `frontend/src/features/control-plan/**`, `backend/src/modules/control-plan/**`. Dynamic CP generation from PFMEA controls, bidirectional tolerance/method synchronization. |
| **Action Tracking Specialist** | [`action/AGENT.md`](./action/AGENT.md) | `frontend/src/features/actions/**`, `backend/src/modules/action/**`. Corrective actions lifecycle, Cloudflare R2 evidence uploads, junction rating recalculation. |
| **Revision & Approvals Specialist** | [`revision/AGENT.md`](./revision/AGENT.md) | `frontend/src/features/revisions/**`, `backend/src/modules/audit/**`. 21 CFR Part 11 electronic signatures, reviewer segregation, locked revision immutability. |
| **RAG & Embeddings Specialist** | [`rag/AGENT.md`](./rag/AGENT.md) | Neon pgvector HNSW indexing (M=16, ef_construction=64), BullMQ embedding queues, semantic search with strict `tenantId` isolation. |
| **Auth & Security Specialist** | [`auth/AGENT.md`](./auth/AGENT.md) | `backend/src/modules/auth/**`, `backend/src/modules/user/**`. Multi-tenant isolation, JWT refresh tokens, guest lifecycles, and Row-Level Security (RLS). |
| **Repository Specialist** | [`repository/AGENT.md`](./repository/AGENT.md) | `frontend/src/features/repository/**`, `backend/src/modules/repository/**`. Golden libraries, template catalogues, and cross-project knowledge reuse. |
| **AI Suggestion Specialist** | [`ai-suggestion/AGENT.md`](./ai-suggestion/AGENT.md) | Human-in-the-loop suggestion review lifecycle, prompt engineering, suggestion state transitions (`proposed` → `accepted`/`rejected`). |

---

## 3. General Engineering Roles

| Engineering Persona | Specification File | Role & Scope |
| :--- | :--- | :--- |
| **Developer** | [`developer.md`](./developer.md) | Fullstack feature implementation, bug fixes, refactoring, and mandatory same-turn documentation sync. |
| **Reviewer** | [`reviewer.md`](./reviewer.md) | Code quality, multi-tenant safety inspection, RBAC verification, and 21 CFR Part 11 compliance audit. |
| **Tester** | [`tester.md`](./tester.md) | Zero-residue testing, unit test suites, integration tests, and build compilation verification. |
| **Architect** | [`architect.md`](./architect.md) | Subsystem boundaries, schema migrations (`schema.prisma`), ADR maintenance, and agent mesh configuration. |

---

## 4. Operational Protocols

1. **Fencing**: Agents may only write to paths listed in their `allow` glob. Modifying shared files (e.g. `schema.prisma`) requires explicit permission recorded on the blackboard.
2. **Tri-Compatibility**: Each `AGENT.md` is compatible with Antigravity (`mainAgent/subagent`), Gemini CLI (`kind/tools`), and Opencode (`mode:primary/subagent`).
3. **Legacy Agent Deprecation**: Folders containing only `agent.json` are deprecated legacy definitions maintained solely for backwards compatibility; runtime dispatch reads `AGENT.md`.
