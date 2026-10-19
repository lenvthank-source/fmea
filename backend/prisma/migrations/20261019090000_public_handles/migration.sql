CREATE TABLE "public_handle_reservation" (
  "handle" VARCHAR(63) PRIMARY KEY CHECK ("handle" ~ '^[a-z]+-[a-z]+$'),
  "reserved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "user" ADD COLUMN "public_handle" VARCHAR(63);
CREATE UNIQUE INDEX "user_public_handle_key" ON "user"("public_handle");
ALTER TABLE "user" ADD CONSTRAINT "user_public_handle_fkey" FOREIGN KEY ("public_handle") REFERENCES "public_handle_reservation"("handle") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Backfill all existing trial identities without touching historical names/emails or ownership.
DO $$
DECLARE existing RECORD; candidate TEXT;
BEGIN
  FOR existing IN SELECT id FROM "user" WHERE is_guest = TRUE AND public_handle IS NULL ORDER BY created_at, id LOOP
    SELECT a.word || '-' || b.word INTO candidate
    FROM unnest(ARRAY['table','bear','sugar','cup','paper','ball','apple','atlas','badge','basket','beach','beam','bell','berry','bird','bloom','boat','book','branch','brick','brook','brush','bucket','cable','candle','canvas','cedar','chair','cloud','coast','coral','crane','creek','crown','dawn','desk','dune','earth','ember','feather','field','flame','flower','forest','fox','frame','garden','gate','glass','globe','grain','grape','grove','harbor','hat','hawk','hill','honey','house','ice','island','jar','kite','lake','lamp','leaf','lemon','light','lime','lion','maple','meadow','metal','mint','moon','moss','mouse','nest','oak','ocean','olive','orange','otter','owl','palm','panda','peach','pearl','pebble','pen','pepper','pine','plant','plate','pond','pool','quartz','quilt','rabbit','rain','raven','reed','river','robin','rock','rose','sail','sand','seed','shell','sky','snow','soap','soil','sparrow','spoon','spring','star','stone','storm','stream','sun','swan','tea','tent','thread','tiger','timber','toast','torch','tower','trail','tree','tulip','turtle','valley','vine','wave','wheel','willow','wind','wing','wolf','wood','yarn','zebra']) WITH ORDINALITY a(word, seq)
    CROSS JOIN unnest(ARRAY['table','bear','sugar','cup','paper','ball','apple','atlas','badge','basket','beach','beam','bell','berry','bird','bloom','boat','book','branch','brick','brook','brush','bucket','cable','candle','canvas','cedar','chair','cloud','coast','coral','crane','creek','crown','dawn','desk','dune','earth','ember','feather','field','flame','flower','forest','fox','frame','garden','gate','glass','globe','grain','grape','grove','harbor','hat','hawk','hill','honey','house','ice','island','jar','kite','lake','lamp','leaf','lemon','light','lime','lion','maple','meadow','metal','mint','moon','moss','mouse','nest','oak','ocean','olive','orange','otter','owl','palm','panda','peach','pearl','pebble','pen','pepper','pine','plant','plate','pond','pool','quartz','quilt','rabbit','rain','raven','reed','river','robin','rock','rose','sail','sand','seed','shell','sky','snow','soap','soil','sparrow','spoon','spring','star','stone','storm','stream','sun','swan','tea','tent','thread','tiger','timber','toast','torch','tower','trail','tree','tulip','turtle','valley','vine','wave','wheel','willow','wind','wing','wolf','wood','yarn','zebra']) WITH ORDINALITY b(word, seq)
    WHERE NOT EXISTS (SELECT 1 FROM public_handle_reservation r WHERE r.handle = a.word || '-' || b.word)
    ORDER BY a.seq,b.seq LIMIT 1;
    IF candidate IS NULL THEN RAISE EXCEPTION 'Public handle capacity exhausted'; END IF;
    INSERT INTO public_handle_reservation(handle) VALUES(candidate);
    UPDATE "user" SET public_handle = candidate WHERE id = existing.id;
  END LOOP;
END $$;
-- Tombstones survive user/tenant cleanup and accidental application deletes.
CREATE FUNCTION protect_public_handle_reservations() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Public handle reservations are permanent'; END $$;
CREATE TRIGGER public_handle_reservations_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON public_handle_reservation FOR EACH STATEMENT EXECUTE FUNCTION protect_public_handle_reservations();

CREATE FUNCTION protect_assigned_public_handle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.public_handle IS NOT NULL AND NEW.public_handle IS DISTINCT FROM OLD.public_handle THEN
    RAISE EXCEPTION 'Assigned public handles cannot be changed';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER assigned_public_handle_immutable BEFORE UPDATE OF public_handle ON "user" FOR EACH ROW EXECUTE FUNCTION protect_assigned_public_handle();
