-- Additive: historical revisions and operation IDs are unchanged.
BEGIN;
ALTER TABLE "document_revision" ADD COLUMN "pfd_graph" JSONB;
ALTER TABLE "document_revision" ADD COLUMN "pfd_graph_version" INTEGER NOT NULL DEFAULT 0;
COMMIT;
