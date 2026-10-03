-- PROJ-5: Teilnehmerzahl als eine Zahl statt einer Min/Max-Spanne.
--
-- Der Generator (PROJ-6) muss gegen genau einen Wert abgleichen — die
-- Obergrenze einer Übung und Material "pro Teilnehmer". Bei einer Spanne war
-- offen, welcher Wert gilt; die Untergrenze hatte ohnehin keine Funktion.
-- Begründung in features/PROJ-5-gruppenprofile.md.
--
-- Nachträglich rekonstruiert: wurde seinerzeit direkt im SQL Editor
-- ausgeführt und landete nicht im Migrationsverlauf von Supabase.

DO $$
DECLARE c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'groups'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%participants%'
  LOOP
    EXECUTE format('ALTER TABLE groups DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE groups DROP COLUMN IF EXISTS participants_min;
ALTER TABLE groups RENAME COLUMN participants_max TO participants;

ALTER TABLE groups ADD CONSTRAINT groups_participants_check
  CHECK (participants IS NULL OR participants >= 1);
