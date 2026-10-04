-- ============================================
-- PROJ-6: Einheiten-Generator — Einheiten, Segmente, Einträge, Verwendungen
-- ============================================

-- 1. Einheiten
-- total_minutes wird aus der Gruppe KOPIERT, nicht gelesen: ändert der Nutzer
-- später die Einheitsdauer seiner Gruppe, bleiben bestehende Einheiten gleich.
-- seed hält den Zufalls-Startwert, mit dem das Ergebnis reproduzierbar ist.
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  total_minutes INTEGER NOT NULL CHECK (total_minutes BETWEEN 5 AND 300),
  seed INTEGER NOT NULL,
  manually_edited BOOLEAN NOT NULL DEFAULT false,
  relaxed_note TEXT CHECK (char_length(relaxed_note) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own units" ON units
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own units" ON units
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own units" ON units
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own units" ON units
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_units_user_created ON units(user_id, created_at DESC);
CREATE INDEX idx_units_group_created ON units(group_id, created_at DESC);

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 2. Segmente
-- gap_reason wird gespeichert und nicht nur angezeigt — die Spec verlangt,
-- dass der Grund einer Lücke nachvollziehbar an der Einheit haftet.
CREATE TABLE unit_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  minutes INTEGER NOT NULL CHECK (minutes >= 1),
  fill_mode TEXT NOT NULL CHECK (fill_mode IN ('generate', 'empty')),
  sports JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_sport TEXT,
  difficulties JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT CHECK (char_length(notes) <= 2000),
  gap_reason TEXT CHECK (char_length(gap_reason) <= 500),
  position INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE unit_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own unit segments" ON unit_segments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM units WHERE units.id = unit_segments.unit_id AND units.user_id = auth.uid())
  );
CREATE POLICY "Users insert own unit segments" ON unit_segments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM units WHERE units.id = unit_segments.unit_id AND units.user_id = auth.uid())
  );
CREATE POLICY "Users update own unit segments" ON unit_segments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM units WHERE units.id = unit_segments.unit_id AND units.user_id = auth.uid())
  );
CREATE POLICY "Users delete own unit segments" ON unit_segments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM units WHERE units.id = unit_segments.unit_id AND units.user_id = auth.uid())
  );

CREATE INDEX idx_unit_segments_unit_id ON unit_segments(unit_id, position);

-- 3. Einheiten-Einträge
-- Verweis statt Kopie: exercise_id zeigt auf die Übung, Korrekturen dort
-- wirken sofort in allen Einheiten. ON DELETE SET NULL statt CASCADE, damit
-- beim Löschen einer Übung ein Platzhalter stehen bleibt und die Einheit
-- nicht stillschweigend kürzer wird.
-- planned_duration ist bewusst kopiert: ein fertiger Stundenverlauf darf sich
-- nicht verschieben, wenn später die geschätzte Dauer der Übung geändert wird.
CREATE TABLE unit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES unit_segments(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES exercise_variants(id) ON DELETE SET NULL,
  planned_duration INTEGER NOT NULL CHECK (planned_duration >= 1),
  position INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE unit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own unit items" ON unit_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM unit_segments
      JOIN units ON units.id = unit_segments.unit_id
      WHERE unit_segments.id = unit_items.segment_id AND units.user_id = auth.uid()
    )
  );
CREATE POLICY "Users insert own unit items" ON unit_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_segments
      JOIN units ON units.id = unit_segments.unit_id
      WHERE unit_segments.id = unit_items.segment_id AND units.user_id = auth.uid()
    )
  );
CREATE POLICY "Users update own unit items" ON unit_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM unit_segments
      JOIN units ON units.id = unit_segments.unit_id
      WHERE unit_segments.id = unit_items.segment_id AND units.user_id = auth.uid()
    )
  );
CREATE POLICY "Users delete own unit items" ON unit_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM unit_segments
      JOIN units ON units.id = unit_segments.unit_id
      WHERE unit_segments.id = unit_items.segment_id AND units.user_id = auth.uid()
    )
  );

CREATE INDEX idx_unit_items_segment_id ON unit_items(segment_id, position);
CREATE INDEX idx_unit_items_exercise_id ON unit_items(exercise_id);

-- 4. Übungsverwendungen
-- Grundlage der Frische-Regel ("welche Übungen hat diese Gruppe zuletzt
-- gesehen") als eine schnelle Abfrage, statt bei jedem Generieren alle
-- Einheiten mit Segmenten und Einträgen durchsuchen zu müssen.
CREATE TABLE exercise_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE exercise_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own exercise usages" ON exercise_usages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own exercise usages" ON exercise_usages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own exercise usages" ON exercise_usages
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_exercise_usages_group_used ON exercise_usages(group_id, used_at DESC);
CREATE INDEX idx_exercise_usages_exercise ON exercise_usages(exercise_id, used_at DESC);
CREATE INDEX idx_exercise_usages_unit ON exercise_usages(unit_id);
