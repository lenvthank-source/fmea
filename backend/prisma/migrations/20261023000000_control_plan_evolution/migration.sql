-- CreateTable
CREATE TABLE "engineering_source_fence" (
    "tenant_id" UUID NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "engineering_source_fence_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "cp_phase_head" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "phase" VARCHAR(50) NOT NULL,
    "current_revision_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cp_phase_head_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_lineage" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_lineage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_version_binding" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "lineage_id" UUID NOT NULL,
    "source_revision_id" UUID NOT NULL,
    "process_step_id" UUID NOT NULL,
    "provenance" JSONB,
    "actor_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_version_binding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_lineage_relation" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "predecessor_id" UUID NOT NULL,
    "successor_id" UUID NOT NULL,
    "kind" VARCHAR(50) NOT NULL,
    "actor_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_lineage_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cp_requirement_profile_revision" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "content" JSONB NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "rule_source_metadata" JSONB,
    "author_id" UUID,
    "published_by_id" UUID,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cp_requirement_profile_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cp_source_capture" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "cp_revision_id" UUID NOT NULL,
    "source_revision_id" UUID,
    "source_scope" VARCHAR(50) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "snapshot_hash" VARCHAR(64) NOT NULL,
    "captured_by_id" UUID,
    "captured_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cp_source_capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cp_mutation_receipt" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "cp_revision_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "result_version" INTEGER NOT NULL,
    "entity_ids" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cp_mutation_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cp_review_decision" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "cp_revision_id" UUID NOT NULL,
    "observed_document_version" INTEGER NOT NULL,
    "target_kind" VARCHAR(50) NOT NULL,
    "target_id" UUID NOT NULL,
    "target_path" VARCHAR(255),
    "value_hash" VARCHAR(64) NOT NULL,
    "source_set_hash" VARCHAR(64),
    "mapping_hash" VARCHAR(64),
    "decision" VARCHAR(50) NOT NULL,
    "reason" TEXT,
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cp_review_decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cp_validation_run" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "cp_revision_id" UUID NOT NULL,
    "document_hash" VARCHAR(64) NOT NULL,
    "source_set_hash" VARCHAR(64) NOT NULL,
    "mapping_hash" VARCHAR(64) NOT NULL,
    "profile_revision_id" UUID,
    "profile_hash" VARCHAR(64) NOT NULL,
    "validator_version" VARCHAR(50) NOT NULL,
    "findings" JSONB NOT NULL,
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cp_validation_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cp_approval_package" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "expected_version" INTEGER NOT NULL,
    "frozen_snapshot" JSONB NOT NULL,
    "frozen_snapshot_hash" VARCHAR(64) NOT NULL,
    "source_capture_id" UUID,
    "profile_revision_id" UUID,
    "validation_run_id" UUID,
    "intent_actor_id" UUID NOT NULL,
    "intent_comment" TEXT,
    "intent_decision_at" TIMESTAMPTZ NOT NULL,
    "state" VARCHAR(50) NOT NULL DEFAULT 'queued',
    "lease_token" VARCHAR(100),
    "lease_expires_at" TIMESTAMPTZ,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "finalized_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cp_approval_package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cp_artifact" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "package_id" UUID NOT NULL,
    "kind" VARCHAR(50) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "content" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "renderer_version" VARCHAR(50),
    "template_version" VARCHAR(50),
    "font_versions" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cp_artifact_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "document_revision" ADD COLUMN "cp_approval_package_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "cp_phase_head_tenant_id_document_id_phase_key" ON "cp_phase_head"("tenant_id", "document_id", "phase");
CREATE INDEX "cp_phase_head_tenant_id_document_id_idx" ON "cp_phase_head"("tenant_id", "document_id");

-- CreateIndex
CREATE INDEX "operation_lineage_tenant_id_project_id_idx" ON "operation_lineage"("tenant_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "operation_version_binding_process_step_id_key" ON "operation_version_binding"("process_step_id");
CREATE INDEX "operation_version_binding_tenant_id_project_id_idx" ON "operation_version_binding"("tenant_id", "project_id");
CREATE INDEX "operation_version_binding_source_revision_id_idx" ON "operation_version_binding"("source_revision_id");

-- CreateIndex
CREATE INDEX "operation_lineage_relation_tenant_id_project_id_idx" ON "operation_lineage_relation"("tenant_id", "project_id");
CREATE INDEX "operation_lineage_relation_group_id_idx" ON "operation_lineage_relation"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "cp_requirement_profile_revision_tenant_id_key_version_key" ON "cp_requirement_profile_revision"("tenant_id", "key", "version");
CREATE INDEX "cp_requirement_profile_revision_tenant_id_idx" ON "cp_requirement_profile_revision"("tenant_id");

-- CreateIndex
CREATE INDEX "cp_source_capture_tenant_id_project_id_idx" ON "cp_source_capture"("tenant_id", "project_id");
CREATE INDEX "cp_source_capture_cp_revision_id_idx" ON "cp_source_capture"("cp_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "cp_mutation_receipt_tenant_id_cp_revision_id_actor_id_reques_key" ON "cp_mutation_receipt"("tenant_id", "cp_revision_id", "actor_id", "request_id");
CREATE INDEX "cp_mutation_receipt_tenant_id_project_id_idx" ON "cp_mutation_receipt"("tenant_id", "project_id");

-- CreateIndex
CREATE INDEX "cp_review_decision_cp_revision_id_idx" ON "cp_review_decision"("cp_revision_id");
CREATE INDEX "cp_review_decision_tenant_id_idx" ON "cp_review_decision"("tenant_id");

-- CreateIndex
CREATE INDEX "cp_validation_run_cp_revision_id_idx" ON "cp_validation_run"("cp_revision_id");
CREATE INDEX "cp_validation_run_tenant_id_idx" ON "cp_validation_run"("tenant_id");

-- CreateIndex
CREATE INDEX "cp_approval_package_tenant_id_project_id_idx" ON "cp_approval_package"("tenant_id", "project_id");
CREATE INDEX "cp_approval_package_revision_id_idx" ON "cp_approval_package"("revision_id");
CREATE INDEX "cp_approval_package_state_idx" ON "cp_approval_package"("state");

-- CreateIndex
CREATE INDEX "cp_artifact_tenant_id_project_id_idx" ON "cp_artifact"("tenant_id", "project_id");
CREATE INDEX "cp_artifact_package_id_idx" ON "cp_artifact"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_revision_cp_approval_package_id_key" ON "document_revision"("cp_approval_package_id");

-- AddForeignKey
ALTER TABLE "operation_version_binding" ADD CONSTRAINT "operation_version_binding_lineage_id_fkey" FOREIGN KEY ("lineage_id") REFERENCES "operation_lineage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_revision" ADD CONSTRAINT "document_revision_cp_approval_package_id_fkey" FOREIGN KEY ("cp_approval_package_id") REFERENCES "cp_approval_package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cp_artifact" ADD CONSTRAINT "cp_artifact_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "cp_approval_package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
