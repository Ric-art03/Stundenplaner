-- ============================================
-- BUG-4 (aus PROJ-6): Der Zugriffsschutz prüft Eigentum an Gruppe und Übung nicht
-- ============================================
--
-- Befund aus dem QA-Durchlauf vom 2026-10-05, am 2026-10-06 am lebenden System
-- reproduziert: Ein Nutzer konnte mit eigenem Token eine Einheit anlegen, die auf
-- eine FREMDE Gruppe verweist. Die Richtlinie prüfte nur `auth.uid() = user_id`,
-- nicht das Eigentum an der verwiesenen Zeile.
--
-- Keine Offenlegung — die Leserichtlinien verbergen fremde Inhalte weiterhin. Es
-- entsteht Datenmüll im eigenen Konto, der auf fremde Zeilen zeigt.
--
-- Hier geschlossen, BEVOR PROJ-7 (Einheiten-Editor) gebaut wird: Der Editor bringt
-- mehrere neue Schreibwege (tauschen, einfügen, nachbesetzen, Variante umschalten).
-- Die Datenbank ist die zweite Verteidigungslinie und darf sich nicht darauf
-- verlassen, dass jeder künftige Schreibweg selbst prüft.
--
-- Vier Lücken, am 2026-10-06 in `pg_policies` bestätigt:
--   1. units INSERT          — group_id ungeprüft
--   2. units UPDATE          — group_id ungeprüft (eine Einheit ließ sich auf eine
--                              fremde Gruppe umhängen; nicht im Ursprungsbefund)
--   3. unit_items INSERT     — exercise_id und variant_id ungeprüft
--   4. unit_items UPDATE     — dito. Das ist die Lücke, die PROJ-7 am häufigsten
--                              benutzen würde: „Übung tauschen" ist ein UPDATE
--                              auf exercise_id
--   5. exercise_usages INSERT — exercise_id, group_id und unit_id ungeprüft.
--                              Nicht Teil des Ursprungsbefunds, dieselbe Klasse,
--                              und der Editor schreibt diese Tabelle bei jedem
--                              Speichern neu
--
-- `unit_segments` bleibt unberührt: dort wird das Eigentum über `unit_id` bereits
-- in beide Richtungen geprüft. Bei UPDATE ohne eigenes WITH CHECK zieht Postgres
-- den USING-Ausdruck auch für die neue Zeile heran — die Lücke besteht dort nicht.
--
-- Bestandsdaten vorher geprüft: 0 Verstöße bei 71 Einträgen und 12 Einheiten.
-- Die Härtung kann also keine vorhandene Zeile unschreibbar machen.

-- 1. units — die Gruppe muss dem Nutzer gehören
DROP POLICY IF EXISTS "Users insert own units" ON units;
CREATE POLICY "Users insert own units" ON units
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = units.group_id AND groups.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users update own units" ON units;
CREATE POLICY "Users update own units" ON units
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = units.group_id AND groups.user_id = auth.uid()
    )
  );

-- 2. unit_items — Übung und Variante müssen dem Nutzer gehören, und die Variante
--    muss zu genau der Übung des Eintrags gehören.
--
--    `exercise_id IS NULL` bleibt zulässig: beim Löschen einer Übung setzt
--    ON DELETE SET NULL den Verweis auf NULL, damit ein Platzhalter stehen bleibt
--    statt die Einheit stillschweigend zu kürzen. Solche Zeilen müssen weiter
--    änderbar sein — genau daran hängt das Nachbesetzen in PROJ-7 (BUG-5).
DROP POLICY IF EXISTS "Users insert own unit items" ON unit_items;
CREATE POLICY "Users insert own unit items" ON unit_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_segments
      JOIN units ON units.id = unit_segments.unit_id
      WHERE unit_segments.id = unit_items.segment_id AND units.user_id = auth.uid()
    )
    AND (
      unit_items.exercise_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercises
        WHERE exercises.id = unit_items.exercise_id AND exercises.user_id = auth.uid()
      )
    )
    AND (
      unit_items.variant_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercise_variants
        JOIN exercises ON exercises.id = exercise_variants.exercise_id
        WHERE exercise_variants.id = unit_items.variant_id
          AND exercises.user_id = auth.uid()
          AND exercise_variants.exercise_id = unit_items.exercise_id
      )
    )
  );

DROP POLICY IF EXISTS "Users update own unit items" ON unit_items;
CREATE POLICY "Users update own unit items" ON unit_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM unit_segments
      JOIN units ON units.id = unit_segments.unit_id
      WHERE unit_segments.id = unit_items.segment_id AND units.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_segments
      JOIN units ON units.id = unit_segments.unit_id
      WHERE unit_segments.id = unit_items.segment_id AND units.user_id = auth.uid()
    )
    AND (
      unit_items.exercise_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercises
        WHERE exercises.id = unit_items.exercise_id AND exercises.user_id = auth.uid()
      )
    )
    AND (
      unit_items.variant_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercise_variants
        JOIN exercises ON exercises.id = exercise_variants.exercise_id
        WHERE exercise_variants.id = unit_items.variant_id
          AND exercises.user_id = auth.uid()
          AND exercise_variants.exercise_id = unit_items.exercise_id
      )
    )
  );

-- 3. exercise_usages — jeder der drei Verweise muss dem Nutzer gehören
DROP POLICY IF EXISTS "Users insert own exercise usages" ON exercise_usages;
CREATE POLICY "Users insert own exercise usages" ON exercise_usages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM exercises
      WHERE exercises.id = exercise_usages.exercise_id AND exercises.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = exercise_usages.group_id AND groups.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM units
      WHERE units.id = exercise_usages.unit_id AND units.user_id = auth.uid()
    )
  );
