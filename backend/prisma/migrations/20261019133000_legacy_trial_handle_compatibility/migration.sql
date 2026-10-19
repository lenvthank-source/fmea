-- Preserve trial login for older API instances sharing this database during rollout.
-- New APIs allocate explicitly; this fallback only handles missing legacy handles.
CREATE FUNCTION ensure_trial_public_handle() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  words TEXT[] := ARRAY['table','bear','sugar','cup','paper','ball','apple','atlas','badge','basket','beach','beam','bell','berry','bird','bloom','boat','book','branch','brick','brook','brush','bucket','cable','candle','canvas','cedar','chair','cloud','coast','coral','crane','creek','crown','dawn','desk','dune','earth','ember','feather','field','flame','flower','forest','fox','frame','garden','gate','glass','globe','grain','grape','grove','harbor','hat','hawk','hill','honey','house','ice','island','jar','kite','lake','lamp','leaf','lemon','light','lime','lion','maple','meadow','metal','mint','moon','moss','mouse','nest','oak','ocean','olive','orange','otter','owl','palm','panda','peach','pearl','pebble','pen','pepper','pine','plant','plate','pond','pool','quartz','quilt','rabbit','rain','raven','reed','river','robin','rock','rose','sail','sand','seed','shell','sky','snow','soap','soil','sparrow','spoon','spring','star','stone','storm','stream','sun','swan','tea','tent','thread','tiger','timber','toast','torch','tower','trail','tree','tulip','turtle','valley','vine','wave','wheel','willow','wind','wing','wolf','wood','yarn','zebra'];
  pool_size INTEGER := array_length(words, 1);
  start_index INTEGER;
  candidate_index INTEGER;
  allocated TEXT;
BEGIN
  IF NOT NEW.is_guest OR NEW.public_handle IS NOT NULL THEN RETURN NEW; END IF;
  start_index := floor(random() * pool_size * pool_size)::INTEGER;
  FOR offset_index IN 0..(pool_size * pool_size - 1) LOOP
    candidate_index := (start_index + offset_index) % (pool_size * pool_size);
    INSERT INTO public_handle_reservation(handle)
      VALUES(words[candidate_index / pool_size + 1] || '-' || words[candidate_index % pool_size + 1])
      ON CONFLICT DO NOTHING RETURNING handle INTO allocated;
    IF FOUND THEN
      NEW.public_handle := allocated;
      RETURN NEW;
    END IF;
  END LOOP;
  RAISE EXCEPTION 'Trial username capacity exhausted';
END $$;
CREATE TRIGGER ensure_trial_public_handle
  BEFORE INSERT OR UPDATE OF public_handle, is_guest ON "user"
  FOR EACH ROW EXECUTE FUNCTION ensure_trial_public_handle();
