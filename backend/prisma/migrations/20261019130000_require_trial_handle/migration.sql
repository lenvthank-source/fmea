-- Fail old API writes rather than admitting trial identities without a reservation.
-- Existing installations: run scripts/backfill-public-handles.cjs if an old API
-- admitted guests between the public-handle migration and application rollout.
ALTER TABLE "user" ADD CONSTRAINT "guest_public_handle_required"
  CHECK (NOT is_guest OR public_handle IS NOT NULL) NOT VALID;
ALTER TABLE "user" VALIDATE CONSTRAINT "guest_public_handle_required";
