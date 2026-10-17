# Subsystem Memory Catalog (`.agents/memory/`)

This directory houses deep domain specifications, algorithmic rules, provider configurations, and architectural decision records (ADRs). Consulting these documents prevents repeated whole-codebase AST scans and eliminates model hallucination.

## Memory Specifications

| Memory Document | Scope & Contents | Key Contracts |
| :--- | :--- | :--- |
| [`domain_algorithms.md`](./domain_algorithms.md) | AIAG-VDA 2019 Action Priority tables, S/O/D [1..10] ranges, severity inheritance, failure chain completeness. | AP is deterministic read-only lookup; $S_{\text{row}} = \max(S_e)$; failure mode needs $\ge 1$ effect and $\ge 1$ cause. |
| [`data_schemas.md`](./data_schemas.md) | Core entity relationships across 41 Prisma models, Control Plan bidirectional sync, action rating junctions. | `lockedAt` blocks write mutations; RLS enforces tenant cascading; action closure requires R2 evidence. |
| [`external_providers.md`](./external_providers.md) | Cloudflare Pages, Cloudflare R2 (50MB limits), Render Docker service, Neon Postgres (pgvector HNSW M=16), BullMQ queues. | 30s timeout on external network calls; cosine vector search isolated by `tenantId`. |
| [`decisions.md`](./decisions.md) | Architectural Decision Records (ADRs) tracking dated context, choices, and file:line evidence. | Append-only ledger linked to version release files. |
| [`blackboard.md`](./blackboard.md) | Portable multi-agent communication bus for Antigravity, Gemini, VS Code, and Opencode. | Asynchronous coordination, task ownership status, and human review gating. |
