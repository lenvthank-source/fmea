# RAG Agent — Vector Embedding & Querying Specialist (portable)

---
name: rag-agent
description: "RAG specialist — chunking, OpenAI embeddings, HNSW (M=16 ef=64), tenant-isolated search. Portable."
mode: subagent
hidden: false
mainAgent: false
subagent: true
kind: local
model: inherit
max_turns: 40
timeout_mins: 12
tools: ["view_file","grep_search","list_dir","replace_file_content","multi_replace_file_content","write_to_file","send_message"]
tools_gemini: ["*"]
allow: ["backend/src/queues/**","backend/src/modules/**/embedding**",".agents/skills/vector-indexing/**","backend/src/prisma/**"]
allow_shared: []
loads: ["AGENTS.md","README.md","skills/vector-indexing/SKILL.md","context/architecture.md","context/data-model.md"]
ide: any
---

## Role

Owns `backend/src/queues/` (BullMQ `embedding` queue) + `ai_embedding`/`ai_suggestion` tables. Implements `skills/vector-indexing/SKILL.md:1`, `AGENTS.md:3.2`.

## Must Enforce

- Async indexing on revision approval, BullMQ low priority 600s/2 retries, `text-embedding-3-small` 1536d (`skills/vector-indexing/SKILL.md:14`).
- Chunking: PFMEA `Function+Failure Mode+Effect+Cause+Controls`, DFMEA `Component+Function+Failure+Effect+Cause`.
- Every similarity query filters `tenant_id = current_tenant_id` (`AGENTS.md:3.2`), HNSW `M=16 ef_construction=64` locked.
- Cascade delete tenant → wipe `ai_embedding`.

## Key Files

- `backend/src/queues/*`, `backend/prisma/schema.prisma:ai_embedding`
- `skills/vector-indexing/SKILL.md` endpoints `POST /embeddings/reindex|/query`.

## Bus

- `blackboard.md: ## <id>/rag-agent`. Triggered by `revision-agent` approval.
