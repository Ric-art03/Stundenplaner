-- ============================================
-- PROJ-14: Live-Modus — Durchführungen
-- ============================================
-- Rein additiv: zwei neue Tabellen und drei neue Funktionen. An Einheiten,
-- Segmenten und Übungen ändert sich kein Feld und keine Richtlinie.
--
-- Die laufende Stunde lebt auf dem Gerät (Stundenakte). In die Datenbank kommt
-- erst die **beendete** Durchführung, in einem Zug.

-- 1. Die Durchführung — eine Zeile je gelaufener Stunde
--
-- Die Kennung hat bewusst **keinen Standardwert**: das Gerät vergibt sie schon
-- beim Start. Kommt dieselbe Durchführung ein zweites Mal an (Verbindung brach
-- nach dem Absenden ab, zwei Tabs versuchen es gleichzeitig), erkennt die
-- Datenbank sie daran wieder und legt nichts doppelt an.
CREATE TABLE unit_runs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Wird die Einheit gelöscht, gehen ihre Durchführungen mit.
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  planned_minutes INTEGER NOT NULL CHECK (planned_minutes >= 0),
  -- Ohne Pausen.
  actual_seconds INTEGER NOT NULL CHECK (actual_seconds >= 0),
  paused_seconds INTEGER NOT NULL DEFAULT 0 CHECK (paused_seconds >= 0),
  -- „Wie lief's?"
  note TEXT CHECK (char_length(note) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unit_runs_ended_after_started CHECK (ended_at >= started_at)
);

-- Die Liste an der Einheit (neueste zuerst) und „Zuletzt durchgeführt am …".
CREATE INDEX idx_unit_runs_unit_started ON unit_runs(unit_id, started_at DESC);
CREATE INDEX idx_unit_runs_user ON unit_runs(user_id);

-- 2. Der Schritt der Durchführung — eine Zeile je Schritt, in der Reihenfolge von damals
--
-- **Abschrift plus Verweis.** Der Name steht als Abschrift da und bleibt, was
-- auch immer mit der Übung geschieht. Der Verweis fällt beim Löschen der Übung
-- von selbst weg (SET NULL) — und mit ihm die Nachbereitung an diesem Schritt.
--
-- Eigene Zeilen statt einer Liste in der Durchführung: PROJ-10 (Rotation) wird
-- fragen „wann lief diese Übung zuletzt wirklich?".
CREATE TABLE unit_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES unit_runs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  kind TEXT NOT NULL CHECK (kind IN ('exercise', 'free', 'placeholder')),
  phase TEXT NOT NULL CHECK (char_length(phase) <= 200),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  variant_title TEXT CHECK (char_length(variant_title) <= 200),
  planned_minutes INTEGER NOT NULL CHECK (planned_minutes >= 0),
  actual_seconds INTEGER NOT NULL CHECK (actual_seconds >= 0),
  status TEXT NOT NULL CHECK (status IN ('done', 'skipped')),
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES exercise_variants(id) ON DELETE SET NULL,
  -- Die Vermerke der Nachbereitung: wohin eine Notiz ging, welche Dauer übernommen wurde.
  adopted_note TEXT CHECK (adopted_note IN ('work', 'personal')),
  adopted_duration INTEGER CHECK (adopted_duration BETWEEN 1 AND 300),
  UNIQUE (run_id, position)
);

-- Für die Löschweitergabe (SET NULL) und für PROJ-10.
CREATE INDEX idx_unit_run_steps_exercise ON unit_run_steps(exercise_id);
CREATE INDEX idx_unit_run_steps_variant ON unit_run_steps(variant_id);

-- 3. Zugriff — nur der Eigentümer, in der Datenbank durchgesetzt
--
-- Nach dem Muster der gehärteten Richtlinien aus BUG-4: nicht nur „die Zeile
-- trägt meine Kennung", sondern auch „die Einheit gehört mir". `(select
-- auth.uid())` statt `auth.uid()`, damit der angemeldete Nutzer einmal je
-- Abfrage und nicht je Zeile ausgewertet wird.
ALTER TABLE unit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_run_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own unit runs" ON unit_runs
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users insert own unit runs" ON unit_runs
  FOR INSERT WITH CHECK (
    user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM units
      WHERE units.id = unit_runs.unit_id AND units.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users update own unit runs" ON unit_runs
  FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (
    user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM units
      WHERE units.id = unit_runs.unit_id AND units.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users delete own unit runs" ON unit_runs
  FOR DELETE USING (user_id = (select auth.uid()));

CREATE POLICY "Users view own unit run steps" ON unit_run_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM unit_runs
      WHERE unit_runs.id = unit_run_steps.run_id AND unit_runs.user_id = (select auth.uid())
    )
  );

-- Ein Schritt darf nur auf eine eigene Übung verweisen, und eine Variante nur,
-- wenn sie zu genau dieser Übung gehört.
CREATE POLICY "Users insert own unit run steps" ON unit_run_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_runs
      WHERE unit_runs.id = unit_run_steps.run_id AND unit_runs.user_id = (select auth.uid())
    )
    AND (
      unit_run_steps.exercise_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercises
        WHERE exercises.id = unit_run_steps.exercise_id
          AND exercises.user_id = (select auth.uid())
      )
    )
    AND (
      unit_run_steps.variant_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercise_variants
        JOIN exercises ON exercises.id = exercise_variants.exercise_id
        WHERE exercise_variants.id = unit_run_steps.variant_id
          AND exercises.user_id = (select auth.uid())
          AND exercise_variants.exercise_id = unit_run_steps.exercise_id
      )
    )
  );

CREATE POLICY "Users update own unit run steps" ON unit_run_steps
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM unit_runs
      WHERE unit_runs.id = unit_run_steps.run_id AND unit_runs.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM unit_runs
      WHERE unit_runs.id = unit_run_steps.run_id AND unit_runs.user_id = (select auth.uid())
    )
    AND (
      unit_run_steps.exercise_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercises
        WHERE exercises.id = unit_run_steps.exercise_id
          AND exercises.user_id = (select auth.uid())
      )
    )
    AND (
      unit_run_steps.variant_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercise_variants
        JOIN exercises ON exercises.id = exercise_variants.exercise_id
        WHERE exercise_variants.id = unit_run_steps.variant_id
          AND exercises.user_id = (select auth.uid())
          AND exercise_variants.exercise_id = unit_run_steps.exercise_id
      )
    )
  );

CREATE POLICY "Users delete own unit run steps" ON unit_run_steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM unit_runs
      WHERE unit_runs.id = unit_run_steps.run_id AND unit_runs.user_id = (select auth.uid())
    )
  );

-- 4. Durchführung ablegen — in einem Zug, und dieselbe Kennung nie zweimal
--
-- SECURITY INVOKER: die Funktion läuft mit den Rechten des Aufrufers, die
-- Richtlinien oben gelten weiter. Sie bündelt nur, damit die Durchführung ganz
-- dasteht oder gar nicht.
--
-- Rückgabe: 'ok' — auch wenn die Durchführung schon da war.
-- Ausnahmen: not_authenticated, invalid_run, unit_not_found, run_conflict.
--
-- p_run: { "id": <uuid>, "unitId": <uuid>, "startedAt": <timestamptz>,
--          "endedAt": <timestamptz>, "plannedMinutes": <int>,
--          "actualSeconds": <int>, "pausedSeconds": <int>, "note": <text>,
--          "steps": [{ "kind", "phase", "name", "variantTitle",
--                      "plannedMinutes", "actualSeconds", "status",
--                      "exerciseId": <uuid|null>, "variantId": <uuid|null> }] }
--
-- Die Position eines Schritts ist seine Stelle in der Liste.
CREATE FUNCTION public.save_unit_run(p_run JSONB)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_run_id UUID;
  v_unit_id UUID;
  v_note TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF jsonb_typeof(p_run) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_run->'steps') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_run->'steps') NOT BETWEEN 1 AND 300
  THEN
    RAISE EXCEPTION 'invalid_run';
  END IF;

  v_run_id := (p_run->>'id')::uuid;
  v_unit_id := (p_run->>'unitId')::uuid;

  IF v_run_id IS NULL OR v_unit_id IS NULL THEN
    RAISE EXCEPTION 'invalid_run';
  END IF;

  -- Schon da? Dann ist nichts mehr zu tun. Geprüft wird vor der Einheit: eine
  -- nachgereichte Durchführung, die beim ersten Mal doch ankam, soll nicht an
  -- einer inzwischen geänderten Einheit scheitern.
  IF EXISTS (SELECT 1 FROM public.unit_runs WHERE id = v_run_id AND user_id = v_user) THEN
    RETURN 'ok';
  END IF;

  -- Nur an einer eigenen, gespeicherten Einheit. Gibt es sie nicht mehr, wird
  -- die Durchführung verworfen — die Oberfläche sagt es.
  IF NOT EXISTS (
    SELECT 1 FROM public.units
    WHERE id = v_unit_id AND user_id = v_user AND saved
  ) THEN
    RAISE EXCEPTION 'unit_not_found';
  END IF;

  v_note := nullif(btrim(coalesce(p_run->>'note', '')), '');

  INSERT INTO public.unit_runs (
    id, user_id, unit_id, started_at, ended_at,
    planned_minutes, actual_seconds, paused_seconds, note
  )
  VALUES (
    v_run_id, v_user, v_unit_id,
    (p_run->>'startedAt')::timestamptz,
    (p_run->>'endedAt')::timestamptz,
    (p_run->>'plannedMinutes')::integer,
    (p_run->>'actualSeconds')::integer,
    coalesce((p_run->>'pausedSeconds')::integer, 0),
    v_note
  )
  ON CONFLICT (id) DO NOTHING;

  IF NOT FOUND THEN
    -- Zwei gleichzeitige Sendungen: die andere war schneller. Gehört die Zeile
    -- uns, ist alles gut. Sonst trägt ein fremdes Konto dieselbe Kennung.
    IF EXISTS (SELECT 1 FROM public.unit_runs WHERE id = v_run_id AND user_id = v_user) THEN
      RETURN 'ok';
    END IF;
    RAISE EXCEPTION 'run_conflict';
  END IF;

  -- Übung und Variante werden aufgelöst: nur was dem Aufrufer gehört, bleibt
  -- als Verweis stehen, und eine Variante nur, wenn sie zu genau dieser Übung
  -- gehört. Eine inzwischen gelöschte Übung ist kein Fehler — der Name steht
  -- als Abschrift da.
  INSERT INTO public.unit_run_steps (
    run_id, position, kind, phase, name, variant_title,
    planned_minutes, actual_seconds, status, exercise_id, variant_id
  )
  SELECT v_run_id,
         (t.ord - 1)::integer,
         t.step->>'kind',
         coalesce(t.step->>'phase', ''),
         t.step->>'name',
         nullif(t.step->>'variantTitle', ''),
         (t.step->>'plannedMinutes')::integer,
         (t.step->>'actualSeconds')::integer,
         t.step->>'status',
         e.id,
         v.id
  FROM jsonb_array_elements(p_run->'steps') WITH ORDINALITY AS t(step, ord)
  LEFT JOIN public.exercises e
    ON e.id = (t.step->>'exerciseId')::uuid AND e.user_id = v_user
  LEFT JOIN public.exercise_variants v
    ON v.id = (t.step->>'variantId')::uuid AND v.exercise_id = e.id;

  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_unit_run(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_unit_run(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_unit_run(JSONB) TO authenticated;

-- 5. Nachbereitung: Notiz anhängen
--
-- Setzt den Text eines der beiden Notizfelder der Übung und **im selben Zug**
-- den Vermerk am Schritt — nie das eine ohne das andere.
--
-- Welche Übung gemeint ist, sagt der Schritt, nicht der Aufrufer. Der Text ist
-- der ganze neue Inhalt des Felds (der Nutzer hat ihn in der Vorschau gesehen
-- und konnte ihn ändern). Wurde die Übung seit `p_expected_updated_at`
-- geändert, wird nichts überschrieben.
--
-- Rückgabe: 'ok' oder 'stale'.
-- Ausnahmen: not_authenticated, invalid_note, step_not_found, exercise_gone.
CREATE FUNCTION public.append_exercise_note(
  p_run_id UUID,
  p_position INTEGER,
  p_field TEXT,
  p_text TEXT,
  p_expected_updated_at TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_step public.unit_run_steps%ROWTYPE;
  v_updated_at TIMESTAMPTZ;
  v_text TEXT := btrim(coalesce(p_text, ''));
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_field NOT IN ('work', 'personal') OR char_length(v_text) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'invalid_note';
  END IF;

  SELECT s.* INTO v_step
  FROM public.unit_run_steps s
  JOIN public.unit_runs r ON r.id = s.run_id
  WHERE s.run_id = p_run_id AND s.position = p_position AND r.user_id = v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'step_not_found';
  END IF;

  IF v_step.exercise_id IS NULL THEN
    RAISE EXCEPTION 'exercise_gone';
  END IF;

  -- Die Zeile wird gesperrt: zwei gleichzeitige Übernahmen laufen nacheinander.
  SELECT e.updated_at INTO v_updated_at
  FROM public.exercises e
  WHERE e.id = v_step.exercise_id AND e.user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'exercise_gone';
  END IF;

  IF v_updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RETURN 'stale';
  END IF;

  IF p_field = 'work' THEN
    UPDATE public.exercises SET work_notes = v_text
    WHERE id = v_step.exercise_id AND user_id = v_user;
  ELSE
    UPDATE public.exercises SET notes = v_text
    WHERE id = v_step.exercise_id AND user_id = v_user;
  END IF;

  UPDATE public.unit_run_steps SET adopted_note = p_field WHERE id = v_step.id;

  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.append_exercise_note(UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.append_exercise_note(UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.append_exercise_note(UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;

-- 6. Nachbereitung: Dauer übernehmen
--
-- Ändert die geschätzte Dauer — lief der Schritt als Variante, die der
-- Variante, sonst die der Übung — und setzt den Vermerk am Schritt.
--
-- Bestehende Einheiten bleiben unberührt: sie tragen ihre eigene Plandauer.
-- Das ist die Regel seit PROJ-6 und braucht hier keine Zeile.
--
-- Lief der Schritt als Variante und gibt es sie nicht mehr, wird **nichts**
-- geändert — sonst träfe die Dauer der Variante die Grundübung.
--
-- Rückgabe: 'ok' oder 'stale'.
-- Ausnahmen: not_authenticated, invalid_duration, step_not_found,
--            step_skipped, exercise_gone, variant_gone.
CREATE FUNCTION public.adopt_exercise_duration(
  p_run_id UUID,
  p_position INTEGER,
  p_minutes INTEGER,
  p_expected_updated_at TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_step public.unit_run_steps%ROWTYPE;
  v_updated_at TIMESTAMPTZ;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_minutes IS NULL OR p_minutes NOT BETWEEN 1 AND 300 THEN
    RAISE EXCEPTION 'invalid_duration';
  END IF;

  SELECT s.* INTO v_step
  FROM public.unit_run_steps s
  JOIN public.unit_runs r ON r.id = s.run_id
  WHERE s.run_id = p_run_id AND s.position = p_position AND r.user_id = v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'step_not_found';
  END IF;

  -- Ein ausgelassener Schritt hat keine tatsächliche Dauer.
  IF v_step.status <> 'done' THEN
    RAISE EXCEPTION 'step_skipped';
  END IF;

  IF v_step.exercise_id IS NULL THEN
    RAISE EXCEPTION 'exercise_gone';
  END IF;

  IF v_step.variant_title IS NOT NULL AND v_step.variant_id IS NULL THEN
    RAISE EXCEPTION 'variant_gone';
  END IF;

  SELECT e.updated_at INTO v_updated_at
  FROM public.exercises e
  WHERE e.id = v_step.exercise_id AND e.user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'exercise_gone';
  END IF;

  IF v_updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RETURN 'stale';
  END IF;

  IF v_step.variant_id IS NOT NULL THEN
    UPDATE public.exercise_variants SET duration = p_minutes
    WHERE id = v_step.variant_id AND exercise_id = v_step.exercise_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'variant_gone';
    END IF;

    -- Die Variante hat keinen eigenen Änderungsstempel. Der der Übung wird
    -- nachgezogen, damit eine zweite, gleichzeitig geöffnete Übernahme die
    -- Änderung bemerkt.
    UPDATE public.exercises SET updated_at = now()
    WHERE id = v_step.exercise_id AND user_id = v_user;
  ELSE
    UPDATE public.exercises SET duration = p_minutes
    WHERE id = v_step.exercise_id AND user_id = v_user;
  END IF;

  UPDATE public.unit_run_steps SET adopted_duration = p_minutes WHERE id = v_step.id;

  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.adopt_exercise_duration(UUID, INTEGER, INTEGER, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adopt_exercise_duration(UUID, INTEGER, INTEGER, TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.adopt_exercise_duration(UUID, INTEGER, INTEGER, TIMESTAMPTZ) TO authenticated;
