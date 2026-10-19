# Skills Catalog (`.agents/skills/`)

This directory contains executable execution contracts, step-by-step procedures, and diagnostic scripts for autonomous agents working on specialized domain capabilities.

---

## 1. Core FMEA Quality Platform Skills

| Skill Folder | Description & Execution Scope | Key Artifacts |
| :--- | :--- | :--- |
| [`fmea-authoring`](./fmea-authoring/SKILL.md) | 7-step FMEA authoring, structure tree construction, S/O/D ratings, Action Priority (AP) calculation. | `backend/src/modules/pfmea/` |
| [`pfd-pfmea-linking`](./pfd-pfmea-linking/SKILL.md) | Process Flow Diagram (PFD) to PFMEA row synchronization, sequence mapping, and orphan detection. | `backend/src/modules/pfd/` |
| [`control-plan-sync`](./control-plan-sync/SKILL.md) | Control Plan generation from PFMEA controls and bidirectional characteristic/method updates. | `backend/src/modules/control-plan/` |
| [`corrective-actions`](./corrective-actions/SKILL.md) | High AP corrective actions lifecycle, Cloudflare R2 evidence uploads, and before/after risk scores. | `backend/src/modules/action/` |
| [`revision-approval`](./revision-approval/SKILL.md) | 21 CFR Part 11 electronic signatures, reviewer segregation, immutable revision locking. | `backend/src/modules/audit/` |
| [`vector-indexing`](./vector-indexing/SKILL.md) | Neon pgvector HNSW indexing, BullMQ embedding queues, and tenant-isolated similarity search. | `backend/src/queues/` |
| [`sso-tenant-context`](./sso-tenant-context/SKILL.md) | JWT authentication, subdomain tenant resolution, JIT provisioning, and Row-Level Security (RLS). | `backend/src/modules/auth/` |
| [`enterprise-integrations`](./enterprise-integrations/SKILL.md) | PLM BOM imports, ERP process routings, MES closed-loop quality defect feedbacks. | `backend/src/modules/repository/` |
| [`ai-suggestion-review`](./ai-suggestion-review/SKILL.md) | Human-in-the-loop suggestion review, proposed state tracking, user acceptance transitions. | `frontend/src/features/pfmea/` |

---

## 2. Architecture & Utility Skills

| Skill Folder | Description & Purpose |
| :--- | :--- |
| [`agentic-architecture-scaffold`](./agentic-architecture-scaffold/SKILL.md) | Universal turnkey scaffolding engine for Document-Driven AI Agent Architectures (`.agents/` + `AGENTS.md`). |
| [`readme_sync`](./readme_sync/SKILL.md) | Automated directory-level `README.md` generator and context window optimizer. |
| [`ui-ux-designer`](./ui-ux-designer/SKILL.md) | Design tokens, color system, hierarchy breadcrumbs, and modern user interface styling. |

---

## 3. SEO & Discovery Suite

Dedicated SEO skills for search engine indexing and LLM citations:
`ai-seo`, `programmatic-seo`, `seo-audit`, `seo-authority-builder`, `seo-cannibalization-detector`, `seo-content-auditor`, `seo-content-planner`, `seo-content-refresher`, `seo-content-writer`, `seo-keyword-strategist`, `seo-meta-optimizer`, `seo-snippet-hunter`, `seo-structure-architect`.
*(Note: Keep SEO skills separated from core FMEA domain contracts to prevent context bloat).*

## Public Product Design

- [frontend-design](./frontend-design/SKILL.md): Anthropic's visual direction and frontend design guidance.
- [web-design-guidelines](./web-design-guidelines/SKILL.md): Vercel's web interface accessibility and interaction review.
- [fmeapex-product-story](./fmeapex-product-story/SKILL.md): FMEApex-specific connected engineering narrative, preview integrity, and homepage validation.
