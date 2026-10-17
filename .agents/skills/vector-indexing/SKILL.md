---
name: "AI Vector Embedding Indexing & Querying"
description: "Manages text chunking, OpenAI embeddings creation, HNSW indices in Neon, and tenant-isolated RAG similarity searches."
---

# AI Vector Embedding Indexing & Querying Skill

This skill governs the background indexing and querying pipeline of the AI Copilot.

## 1. Indexing & Querying Pipelines
1. **Asynchronous Indexing**:
   - Triggers via NestJS events when a document revision is approved.
   - Pushes an indexing task to the BullMQ `embedding` queue (low priority, 600s timeout, 2 retries).
   - Generates 1536-dimensional embeddings using OpenAI's `text-embedding-3-small` model.
   - Saves to the `ai_embedding` table in Neon Postgres.
2. **Text Chunking Strategies**:
   - **PFMEA Row**: Concatenate: `Function Name + Failure Mode + Effect + Root Cause + Prevention Controls + Detection Controls`.
   - **DFMEA Row**: Concatenate: `Component Name + Function Name + Failure Mode + Effect + Root Cause`.
   - **Knowledge Items / Templates**: Indexed row-by-row mapping exact text strings.
3. **Real-time Querying**:
   - Vectorize user-provided drafting context.
   - Run Cosine Similarity lookup on Neon Postgres to retrieve top-k=10 initial candidates.
   - Apply Cross-Encoder reranker to filter and return the top 5 most relevant results.

## 2. Integrity Rules
- **Tenant Isolation**: Every similarity query must strictly filter by `tenant_id = current_tenant_id` to prevent cross-tenant data leaks.
- **Cascading Deletions**: Deleting a tenant must cascade to wipe all associated `ai_embedding` entries.
- **Neon Index Configuration**: Neon uses HNSW index on the vector column with parameters: M=16, ef_construction=64.
- **Metadata Tagging**: Store structured tags alongside embeddings (`process_type`, `industry`, `material`, `severity`).

## 3. Key Database Tables
- `ai_embedding`: Stores the 1536 float vector array, tenant ID, entity type, target entity ID (e.g. `pfmea_row_id`), and metadata.
- `ai_suggestion` / `ai_suggestion_reference`: Logs generated proposals and source citations.

## 4. API Endpoints
- `POST /api/v1/embeddings/reindex` — Trigger manual reindexing of tenant approved documents.
- `POST /api/v1/embeddings/query` — Execute similarity search against the vector store.

## 5. Related Skills
- `ai-suggestion-review`: RAG query outputs feed directly into the suggestion review panel.
- `revision-approval`: Approval state transitions trigger the async embedding build.
