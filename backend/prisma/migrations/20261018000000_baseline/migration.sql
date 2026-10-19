-- CreateTable
CREATE TABLE "action" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "action_type" VARCHAR(30) NOT NULL DEFAULT 'corrective',
    "owner_id" UUID NOT NULL,
    "due_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "completion_notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_evidence" (
    "id" UUID NOT NULL,
    "action_id" UUID NOT NULL,
    "file_url" VARCHAR(1000) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50),
    "file_size" BIGINT,
    "description" TEXT,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_fmea_link" (
    "id" UUID NOT NULL,
    "action_id" UUID NOT NULL,
    "fmea_type" VARCHAR(10) NOT NULL,
    "fmea_row_id" UUID NOT NULL,
    "before_severity" SMALLINT,
    "before_occurrence" SMALLINT,
    "before_detection" SMALLINT,
    "before_ap" CHAR(1),
    "after_severity" SMALLINT,
    "after_occurrence" SMALLINT,
    "after_detection" SMALLINT,
    "after_ap" CHAR(1),

    CONSTRAINT "action_fmea_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "approver_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "decision" VARCHAR(20),
    "comment" TEXT,
    "decided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "diff" JSONB,
    "user_id" UUID NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cause" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characteristic" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "classification" VARCHAR(20) NOT NULL DEFAULT 'standard',
    "unit_of_measure" VARCHAR(50),
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "characteristic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_inquiry" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255),
    "type" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL,
    "detection_method" VARCHAR(255),
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_plan_pfmea_link" (
    "control_plan_row_id" UUID NOT NULL,
    "pfmea_row_id" UUID NOT NULL,

    CONSTRAINT "control_plan_pfmea_link_pkey" PRIMARY KEY ("control_plan_row_id","pfmea_row_id")
);

-- CreateTable
CREATE TABLE "control_plan_row" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "process_step_id" UUID NOT NULL,
    "characteristic_id" UUID,
    "row_number" INTEGER NOT NULL,
    "spec_tolerance" VARCHAR(255),
    "measurement_method" VARCHAR(255),
    "sample_size" VARCHAR(100),
    "frequency" VARCHAR(100),
    "control_type" VARCHAR(20) NOT NULL,
    "control_method" VARCHAR(255),
    "reaction_plan" TEXT,
    "responsible" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "control_plan_row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detection_scale" (
    "value" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "criteria" TEXT NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#64748b',

    CONSTRAINT "detection_scale_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "document" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "current_revision_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_revision" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "revision_number" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "summary" TEXT,
    "change_description" TEXT,
    "effective_from" DATE,
    "effective_to" DATE,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(6),
    "approved_at" TIMESTAMPTZ(6),
    "locked_at" TIMESTAMPTZ(6),

    CONSTRAINT "document_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "effect" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "level" VARCHAR(20) NOT NULL DEFAULT 'local',
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "effect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failure_link" (
    "id" UUID NOT NULL,
    "failure_mode_id" UUID NOT NULL,
    "linked_failure_id" UUID NOT NULL,
    "link_type" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failure_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failure_mode" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failure_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "function" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(50) NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "function_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_action" (
    "id" UUID NOT NULL,
    "failure_link_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "target_date" DATE,
    "revised_severity" SMALLINT,
    "revised_occurrence" SMALLINT,
    "revised_detection" SMALLINT,
    "remarks" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "action_taken" TEXT,
    "completion_date" DATE,
    "detection_action" TEXT,
    "prevention_action" TEXT,
    "responsible_person" VARCHAR(255),

    CONSTRAINT "link_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occurrence_scale" (
    "value" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "criteria" TEXT NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#64748b',

    CONSTRAINT "occurrence_scale_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(50) NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pfmea_row" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "process_step_id" UUID,
    "work_element_name" VARCHAR(255),
    "row_number" INTEGER NOT NULL,
    "severity" SMALLINT,
    "occurrence" SMALLINT,
    "detection" SMALLINT,
    "ap" CHAR(1),
    "filter_code" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "access_level" VARCHAR(20) NOT NULL DEFAULT 'public',
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "action_taken" TEXT,
    "completion_date" DATE,
    "detection_action" TEXT,
    "prevention_action" TEXT,
    "responsibility" VARCHAR(255),
    "revised_ap" CHAR(1),
    "revised_detection" SMALLINT,
    "revised_occurrence" SMALLINT,
    "revised_severity" SMALLINT,
    "target_date" DATE,

    CONSTRAINT "pfmea_row_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pfmea_row_cause" (
    "pfmea_row_id" UUID NOT NULL,
    "cause_id" UUID NOT NULL,

    CONSTRAINT "pfmea_row_cause_pkey" PRIMARY KEY ("pfmea_row_id","cause_id")
);

-- CreateTable
CREATE TABLE "pfmea_row_characteristic" (
    "pfmea_row_id" UUID NOT NULL,
    "characteristic_id" UUID NOT NULL,

    CONSTRAINT "pfmea_row_characteristic_pkey" PRIMARY KEY ("pfmea_row_id","characteristic_id")
);

-- CreateTable
CREATE TABLE "pfmea_row_control" (
    "pfmea_row_id" UUID NOT NULL,
    "control_id" UUID NOT NULL,

    CONSTRAINT "pfmea_row_control_pkey" PRIMARY KEY ("pfmea_row_id","control_id")
);

-- CreateTable
CREATE TABLE "pfmea_row_effect" (
    "pfmea_row_id" UUID NOT NULL,
    "effect_id" UUID NOT NULL,

    CONSTRAINT "pfmea_row_effect_pkey" PRIMARY KEY ("pfmea_row_id","effect_id")
);

-- CreateTable
CREATE TABLE "pfmea_row_failure_mode" (
    "pfmea_row_id" UUID NOT NULL,
    "failure_mode_id" UUID NOT NULL,

    CONSTRAINT "pfmea_row_failure_mode_pkey" PRIMARY KEY ("pfmea_row_id","failure_mode_id")
);

-- CreateTable
CREATE TABLE "pfmea_row_function" (
    "pfmea_row_id" UUID NOT NULL,
    "function_id" UUID NOT NULL,

    CONSTRAINT "pfmea_row_function_pkey" PRIMARY KEY ("pfmea_row_id","function_id")
);

-- CreateTable
CREATE TABLE "pfmea_row_requirement" (
    "pfmea_row_id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,

    CONSTRAINT "pfmea_row_requirement_pkey" PRIMARY KEY ("pfmea_row_id","requirement_id")
);

-- CreateTable
CREATE TABLE "process_item" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "process_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_step" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "process_item_id" UUID NOT NULL,
    "step_number" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "step_type" VARCHAR(30) NOT NULL DEFAULT 'operation',
    "sequence_order" INTEGER NOT NULL,
    "inputs" TEXT,
    "outputs" TEXT,
    "resources" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "incoming_variation" JSONB,
    "special_characteristics" VARCHAR(100),
    "flow_icons" JSONB,
    "machines_equipment_documents" JSONB,
    "desired_outcome" TEXT,
    "process_characteristics" TEXT,
    "linked_pfd_step_id" UUID,
    "is_orphaned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "process_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255),
    "description" TEXT,
    "customer" VARCHAR(255),
    "plant_id" UUID,
    "product_family_id" UUID,
    "model_year" VARCHAR(10),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "team_lead_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "organisation_name" VARCHAR(255),
    "organisation_code" VARCHAR(100),
    "org_part_number" VARCHAR(100),
    "organisation_plant" VARCHAR(255),
    "customer_part_number" VARCHAR(100),
    "part_name" VARCHAR(500),
    "key_contact" VARCHAR(255),
    "latest_change_level" VARCHAR(100),
    "drawing_rev_date" DATE,
    "document_number" VARCHAR(100),
    "control_plan_number" VARCHAR(100),
    "assembly_line_number" VARCHAR(100),
    "origination_date" DATE DEFAULT CURRENT_TIMESTAMP,
    "supplier_approval_date" DATE,
    "other_approval_date" DATE,
    "document_types" TEXT[],
    "cft_members" TEXT[],
    "customer_eng_approver" VARCHAR(255),
    "customer_eng_approval_date" DATE,
    "customer_qual_approver" VARCHAR(255),
    "customer_qual_approval_date" DATE,
    "other_approver" VARCHAR(255),
    "other_approval_date2" DATE,
    "dwg_number" VARCHAR(100),
    "dwg_rev_no_date" VARCHAR(100),
    "preliminary_final_flag" VARCHAR(20) DEFAULT 'preliminary',
    "ui_settings" JSONB,
    "revision_number" VARCHAR(20) DEFAULT '1.0',

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_revision" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "revision_no" VARCHAR(20) NOT NULL,
    "change_description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "project_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "spec" VARCHAR(255),
    "tolerance" VARCHAR(100),
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "severity_scale" (
    "value" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "criteria" TEXT NOT NULL,
    "color" VARCHAR(20) NOT NULL DEFAULT '#64748b',

    CONSTRAINT "severity_scale_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "structure_failure" (
    "id" UUID NOT NULL,
    "function_id" UUID NOT NULL,
    "role" VARCHAR(10) NOT NULL,
    "narration" TEXT NOT NULL,
    "severity_rating" SMALLINT,
    "occurrence_rating" SMALLINT,
    "detection_rating" SMALLINT,
    "current_control_prevention" TEXT,
    "current_control_detection" TEXT,
    "filter_code" VARCHAR(50),
    "is_linked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "structure_failure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "structure_function" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "parent_type" VARCHAR(20) NOT NULL,
    "parent_id" VARCHAR(100) NOT NULL,
    "narration" TEXT NOT NULL,
    "location" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "structure_function_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "subdomain" VARCHAR(63) NOT NULL,
    "plan" VARCHAR(50) NOT NULL DEFAULT 'standard',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "avatar_url" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "guest_expires_at" TIMESTAMPTZ(6),
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "last_activity_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "user_email" VARCHAR(255),
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "type" VARCHAR(30) NOT NULL,
    "message" TEXT NOT NULL,
    "page_url" VARCHAR(500) NOT NULL,
    "page_title" VARCHAR(255),
    "component" VARCHAR(255),
    "error_message" TEXT,
    "error_stack" TEXT,
    "browser_info" VARCHAR(500),
    "screen_size" VARCHAR(50),
    "metadata" JSONB DEFAULT '{}',
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "work_element_package" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "package_data" JSONB NOT NULL,
    "contributor_id" UUID NOT NULL,
    "contributor_name" VARCHAR(255) NOT NULL,
    "contributor_tenant_id" UUID NOT NULL,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "source_project_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "work_element_package_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "action_owner_id_status_idx" ON "action"("owner_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "action_tenant_id_status_idx" ON "action"("tenant_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "approval_revision_id_idx" ON "approval"("revision_id" ASC);

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type" ASC, "entity_id" ASC);

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_timestamp_idx" ON "audit_log"("tenant_id" ASC, "timestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_log_user_id_timestamp_idx" ON "audit_log"("user_id" ASC, "timestamp" DESC);

-- CreateIndex
CREATE INDEX "control_plan_row_revision_id_idx" ON "control_plan_row"("revision_id" ASC);

-- CreateIndex
CREATE INDEX "document_project_id_idx" ON "document"("project_id" ASC);

-- CreateIndex
CREATE INDEX "document_tenant_id_type_idx" ON "document"("tenant_id" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "document_revision_document_id_idx" ON "document_revision"("document_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "document_revision_document_id_revision_number_key" ON "document_revision"("document_id" ASC, "revision_number" ASC);

-- CreateIndex
CREATE INDEX "document_revision_status_idx" ON "document_revision"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "failure_link_failure_mode_id_linked_failure_id_link_type_key" ON "failure_link"("failure_mode_id" ASC, "linked_failure_id" ASC, "link_type" ASC);

-- CreateIndex
CREATE INDEX "link_action_failure_link_id_idx" ON "link_action"("failure_link_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "permission_code_key" ON "permission"("code" ASC);

-- CreateIndex
CREATE INDEX "pfmea_row_process_step_id_idx" ON "pfmea_row"("process_step_id" ASC);

-- CreateIndex
CREATE INDEX "pfmea_row_revision_id_ap_idx" ON "pfmea_row"("revision_id" ASC, "ap" ASC);

-- CreateIndex
CREATE INDEX "pfmea_row_revision_id_idx" ON "pfmea_row"("revision_id" ASC);

-- CreateIndex
CREATE INDEX "process_step_revision_id_idx" ON "process_step"("revision_id" ASC);

-- CreateIndex
CREATE INDEX "process_step_revision_id_sequence_order_idx" ON "process_step"("revision_id" ASC, "sequence_order" ASC);

-- CreateIndex
CREATE INDEX "project_tenant_id_created_by_idx" ON "project"("tenant_id" ASC, "created_by" ASC);

-- CreateIndex
CREATE INDEX "project_tenant_id_idx" ON "project"("tenant_id" ASC);

-- CreateIndex
CREATE INDEX "project_tenant_id_status_created_at_idx" ON "project"("tenant_id" ASC, "status" ASC, "created_at" DESC);

-- CreateIndex
CREATE INDEX "project_tenant_id_status_idx" ON "project"("tenant_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "project_revision_project_id_idx" ON "project_revision"("project_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "role_tenant_id_name_key" ON "role"("tenant_id" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "structure_failure_function_id_idx" ON "structure_failure"("function_id" ASC);

-- CreateIndex
CREATE INDEX "structure_failure_role_idx" ON "structure_failure"("role" ASC);

-- CreateIndex
CREATE INDEX "structure_function_tenant_id_parent_type_parent_id_idx" ON "structure_function"("tenant_id" ASC, "parent_type" ASC, "parent_id" ASC);

-- CreateIndex
CREATE INDEX "structure_function_tenant_id_project_id_idx" ON "structure_function"("tenant_id" ASC, "project_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_subdomain_key" ON "tenant"("subdomain" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_tenant_id_email_key" ON "user"("tenant_id" ASC, "email" ASC);

-- CreateIndex
CREATE INDEX "work_element_package_status_idx" ON "work_element_package"("status" ASC);

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action" ADD CONSTRAINT "action_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_evidence" ADD CONSTRAINT "action_evidence_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_evidence" ADD CONSTRAINT "action_evidence_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_fmea_link" ADD CONSTRAINT "action_fmea_link_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_fmea_link" ADD CONSTRAINT "action_fmea_link_fmea_row_id_fkey" FOREIGN KEY ("fmea_row_id") REFERENCES "pfmea_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval" ADD CONSTRAINT "approval_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "document_revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cause" ADD CONSTRAINT "cause_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characteristic" ADD CONSTRAINT "characteristic_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control" ADD CONSTRAINT "control_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_plan_pfmea_link" ADD CONSTRAINT "control_plan_pfmea_link_control_plan_row_id_fkey" FOREIGN KEY ("control_plan_row_id") REFERENCES "control_plan_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_plan_pfmea_link" ADD CONSTRAINT "control_plan_pfmea_link_pfmea_row_id_fkey" FOREIGN KEY ("pfmea_row_id") REFERENCES "pfmea_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_plan_row" ADD CONSTRAINT "control_plan_row_characteristic_id_fkey" FOREIGN KEY ("characteristic_id") REFERENCES "characteristic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_plan_row" ADD CONSTRAINT "control_plan_row_process_step_id_fkey" FOREIGN KEY ("process_step_id") REFERENCES "process_step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_plan_row" ADD CONSTRAINT "control_plan_row_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "document_revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_revision" ADD CONSTRAINT "document_revision_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_revision" ADD CONSTRAINT "document_revision_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "effect" ADD CONSTRAINT "effect_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failure_link" ADD CONSTRAINT "failure_link_failure_mode_id_fkey" FOREIGN KEY ("failure_mode_id") REFERENCES "structure_failure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failure_link" ADD CONSTRAINT "failure_link_linked_failure_id_fkey" FOREIGN KEY ("linked_failure_id") REFERENCES "structure_failure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failure_mode" ADD CONSTRAINT "failure_mode_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "function" ADD CONSTRAINT "function_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_action" ADD CONSTRAINT "link_action_failure_link_id_fkey" FOREIGN KEY ("failure_link_id") REFERENCES "failure_link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row" ADD CONSTRAINT "pfmea_row_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row" ADD CONSTRAINT "pfmea_row_process_step_id_fkey" FOREIGN KEY ("process_step_id") REFERENCES "process_step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row" ADD CONSTRAINT "pfmea_row_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "document_revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_cause" ADD CONSTRAINT "pfmea_row_cause_cause_id_fkey" FOREIGN KEY ("cause_id") REFERENCES "cause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_cause" ADD CONSTRAINT "pfmea_row_cause_pfmea_row_id_fkey" FOREIGN KEY ("pfmea_row_id") REFERENCES "pfmea_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_characteristic" ADD CONSTRAINT "pfmea_row_characteristic_characteristic_id_fkey" FOREIGN KEY ("characteristic_id") REFERENCES "characteristic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_characteristic" ADD CONSTRAINT "pfmea_row_characteristic_pfmea_row_id_fkey" FOREIGN KEY ("pfmea_row_id") REFERENCES "pfmea_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_control" ADD CONSTRAINT "pfmea_row_control_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "control"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_control" ADD CONSTRAINT "pfmea_row_control_pfmea_row_id_fkey" FOREIGN KEY ("pfmea_row_id") REFERENCES "pfmea_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_effect" ADD CONSTRAINT "pfmea_row_effect_effect_id_fkey" FOREIGN KEY ("effect_id") REFERENCES "effect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_effect" ADD CONSTRAINT "pfmea_row_effect_pfmea_row_id_fkey" FOREIGN KEY ("pfmea_row_id") REFERENCES "pfmea_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_failure_mode" ADD CONSTRAINT "pfmea_row_failure_mode_failure_mode_id_fkey" FOREIGN KEY ("failure_mode_id") REFERENCES "failure_mode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_failure_mode" ADD CONSTRAINT "pfmea_row_failure_mode_pfmea_row_id_fkey" FOREIGN KEY ("pfmea_row_id") REFERENCES "pfmea_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_function" ADD CONSTRAINT "pfmea_row_function_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "function"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_function" ADD CONSTRAINT "pfmea_row_function_pfmea_row_id_fkey" FOREIGN KEY ("pfmea_row_id") REFERENCES "pfmea_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_requirement" ADD CONSTRAINT "pfmea_row_requirement_pfmea_row_id_fkey" FOREIGN KEY ("pfmea_row_id") REFERENCES "pfmea_row"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pfmea_row_requirement" ADD CONSTRAINT "pfmea_row_requirement_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_item" ADD CONSTRAINT "process_item_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_item" ADD CONSTRAINT "process_item_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_step" ADD CONSTRAINT "process_step_process_item_id_fkey" FOREIGN KEY ("process_item_id") REFERENCES "process_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_step" ADD CONSTRAINT "process_step_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "document_revision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_team_lead_id_fkey" FOREIGN KEY ("team_lead_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_revision" ADD CONSTRAINT "project_revision_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_revision" ADD CONSTRAINT "project_revision_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement" ADD CONSTRAINT "requirement_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structure_failure" ADD CONSTRAINT "structure_failure_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "structure_function"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
