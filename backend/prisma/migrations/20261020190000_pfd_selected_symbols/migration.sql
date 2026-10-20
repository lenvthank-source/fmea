-- Additive symbol selections; legacy flow_icons and approved graphs are unchanged.
ALTER TABLE "process_step" ADD COLUMN "manufacturing_symbol_id" VARCHAR(120), ADD COLUMN "engineering_symbol_id" VARCHAR(120);
