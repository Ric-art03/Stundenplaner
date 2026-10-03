-- PROJ-5: Hallenzeiten können einmalige Termine sein, nicht nur wiederkehrende.
--
-- Nachträglich rekonstruiert: Diese Änderung wurde seinerzeit direkt
-- ausgeführt und landete nicht im Migrationsverlauf von Supabase. Der
-- Zeitstempel im Dateinamen ist geschätzt und dient nur der Reihenfolge.

ALTER TABLE group_schedules
  ADD COLUMN IF NOT EXISTS schedule_type TEXT NOT NULL DEFAULT 'recurring',
  ADD COLUMN IF NOT EXISTS date DATE;

-- Bei einmaligen Terminen steht statt des Wochentags ein Datum.
ALTER TABLE group_schedules ALTER COLUMN weekday DROP NOT NULL;

ALTER TABLE group_schedules DROP CONSTRAINT IF EXISTS group_schedules_type_check;
ALTER TABLE group_schedules ADD CONSTRAINT group_schedules_type_check
  CHECK (schedule_type = ANY (ARRAY['recurring'::text, 'one_time'::text]));
