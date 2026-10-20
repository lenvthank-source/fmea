CREATE TABLE "dfmea_document" (
  "id" UUID NOT NULL, "revision_id" UUID NOT NULL, "tenant_id" UUID NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0, "data" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "dfmea_document_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dfmea_document_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "document_revision"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "dfmea_document_revision_id_key" ON "dfmea_document"("revision_id");
CREATE INDEX "dfmea_document_tenant_id_idx" ON "dfmea_document"("tenant_id");
CREATE TABLE "control_plan_document" (
  "id" UUID NOT NULL, "revision_id" UUID NOT NULL, "tenant_id" UUID NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0, "data" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "control_plan_document_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "control_plan_document_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "document_revision"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "control_plan_document_revision_id_key" ON "control_plan_document"("revision_id");
CREATE INDEX "control_plan_document_tenant_id_idx" ON "control_plan_document"("tenant_id");

-- Defense in depth: canonical content cannot bypass revision/type/tenant checks.
CREATE FUNCTION enforce_engineering_document_revision() RETURNS TRIGGER AS $$
DECLARE owner_tenant UUID; owner_type TEXT; owner_status TEXT; owner_locked TIMESTAMPTZ;
BEGIN
  SELECT d.tenant_id,d.type,r.status,r.locked_at INTO owner_tenant,owner_type,owner_status,owner_locked
  FROM document_revision r JOIN document d ON d.id=r.document_id WHERE r.id=NEW.revision_id FOR UPDATE OF r;
  IF owner_tenant IS NULL OR owner_tenant<>NEW.tenant_id THEN RAISE EXCEPTION 'Engineering document tenant mismatch'; END IF;
  IF (TG_TABLE_NAME='dfmea_document' AND owner_type<>'DFMEA') OR (TG_TABLE_NAME='control_plan_document' AND owner_type<>'CONTROL_PLAN') THEN RAISE EXCEPTION 'Engineering document type mismatch'; END IF;
  IF owner_locked IS NOT NULL OR owner_status<>'draft' THEN RAISE EXCEPTION 'Engineering revision is protected'; END IF;
  IF TG_OP='UPDATE' AND (NEW.revision_id<>OLD.revision_id OR NEW.tenant_id<>OLD.tenant_id) THEN RAISE EXCEPTION 'Engineering identity cannot change'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER dfmea_revision_integrity BEFORE INSERT OR UPDATE ON dfmea_document FOR EACH ROW EXECUTE FUNCTION enforce_engineering_document_revision();
CREATE TRIGGER control_plan_revision_integrity BEFORE INSERT OR UPDATE ON control_plan_document FOR EACH ROW EXECUTE FUNCTION enforce_engineering_document_revision();
