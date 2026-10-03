-- PROJ-5: Optionale Hauptsportart für die Gewichtung im Generator.
--
-- Der Generator rotiert sonst gleichmäßig über alle getaggten Sportarten;
-- bei fünf Tags wäre nur jede fünfte Übung aus der eigentlichen Sportart.
-- Mit gesetzter Hauptsportart erscheint sie doppelt im Rotationszyklus.
-- Begründung in features/PROJ-5-gruppenprofile.md.
--
-- Nachträglich rekonstruiert: wurde seinerzeit direkt im SQL Editor
-- ausgeführt und landete nicht im Migrationsverlauf von Supabase.

ALTER TABLE groups ADD COLUMN IF NOT EXISTS primary_sport TEXT;

-- Die Hauptsportart muss immer eine der getaggten Sportarten sein.
ALTER TABLE groups ADD CONSTRAINT groups_primary_sport_check
  CHECK (primary_sport IS NULL OR sports ? primary_sport);
