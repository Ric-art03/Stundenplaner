-- ============================================
-- PROJ-14: Nachbereitung — beide Notizen der Übung in einem Zug
-- ============================================
-- Nach dem Durchspielen durch den Nutzer geändert: der Dialog der
-- Nachbereitung zeigt nicht mehr „dein Satz" und eine Vorschau, sondern das
-- Notizfeld der Übung selbst — umschaltbar zwischen Arbeitsnotiz und
-- Anmerkungen, beide direkt änderbar, beide mit einer Bestätigung gespeichert.
--
-- Dafür braucht es zweierlei:
--
--   a) Der Vermerk am Schritt muss auch „beides" heißen können.
--   b) Eine Funktion, die **beide** Felder in einem Zug setzt. Zwei Aufrufe
--      nacheinander gingen nicht: der erste zieht den Änderungsstempel der
--      Übung nach, der zweite würde sich an ihm stoßen.
--
-- `append_exercise_note` aus `20261011100000` wird dadurch ersetzt und entfernt.

-- 1. Der Vermerk darf auch „beides" heißen
--
-- Die Prüfung wurde in `20261011100000` ohne eigenen Namen angelegt; Postgres
-- hat sie `unit_run_steps_adopted_note_check` genannt (am lebenden System
-- nachgesehen).
ALTER TABLE unit_run_steps
  DROP CONSTRAINT unit_run_steps_adopted_note_check;

ALTER TABLE unit_run_steps
  ADD CONSTRAINT unit_run_steps_adopted_note_check
  CHECK (adopted_note IN ('work', 'personal', 'both'));

-- 2. Die alte Funktion fällt weg
DROP FUNCTION public.append_exercise_note(UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ);

-- 3. Notizen der Übung setzen
--
-- `p_work_notes` und `p_notes` sind jeweils der **ganze neue Text** des Felds.
-- NULL heißt: dieses Feld nicht anfassen. Ein leerer Text leert das Feld.
--
-- Im selben Zug wird der Vermerk am Schritt nachgeführt — für jedes Feld, das
-- sich **wirklich geändert** hat. Er zählt mit: dasselbe Feld ein zweites Mal
-- ändert ihn nicht, das andere Feld macht aus ihm „both".
--
-- Welche Übung gemeint ist, sagt der Schritt, nicht der Aufrufer. Wurde die
-- Übung seit `p_expected_updated_at` geändert, wird nichts überschrieben.
--
-- Rückgabe: 'ok' oder 'stale'.
-- Ausnahmen: not_authenticated, invalid_note, step_not_found, exercise_gone.
CREATE FUNCTION public.update_exercise_notes(
  p_run_id UUID,
  p_position INTEGER,
  p_expected_updated_at TIMESTAMPTZ,
  p_work_notes TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_step public.unit_run_steps%ROWTYPE;
  v_exercise public.exercises%ROWTYPE;
  v_work TEXT := btrim(p_work_notes);
  v_personal TEXT := btrim(p_notes);
  v_work_changed BOOLEAN;
  v_personal_changed BOOLEAN;
  v_mark TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF (v_work IS NULL AND v_personal IS NULL)
     OR char_length(coalesce(v_work, '')) > 2000
     OR char_length(coalesce(v_personal, '')) > 2000
  THEN
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
  SELECT * INTO v_exercise
  FROM public.exercises e
  WHERE e.id = v_step.exercise_id AND e.user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'exercise_gone';
  END IF;

  IF v_exercise.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RETURN 'stale';
  END IF;

  v_work_changed :=
    v_work IS NOT NULL AND v_work IS DISTINCT FROM btrim(coalesce(v_exercise.work_notes, ''));
  v_personal_changed :=
    v_personal IS NOT NULL AND v_personal IS DISTINCT FROM btrim(coalesce(v_exercise.notes, ''));

  -- Nichts geändert: kein Schreiben, kein Vermerk, kein neuer Änderungsstempel.
  IF NOT v_work_changed AND NOT v_personal_changed THEN
    RETURN 'ok';
  END IF;

  -- Ein geleertes Feld verschwindet, statt als leerer Text stehen zu bleiben.
  UPDATE public.exercises
  SET work_notes = CASE WHEN v_work_changed THEN nullif(v_work, '') ELSE work_notes END,
      notes = CASE WHEN v_personal_changed THEN nullif(v_personal, '') ELSE notes END
  WHERE id = v_step.exercise_id AND user_id = v_user;

  v_mark := CASE
    WHEN v_work_changed AND v_personal_changed THEN 'both'
    WHEN v_work_changed THEN 'work'
    ELSE 'personal'
  END;

  UPDATE public.unit_run_steps
  SET adopted_note = CASE
    WHEN adopted_note IS NULL OR adopted_note = v_mark THEN v_mark
    ELSE 'both'
  END
  WHERE id = v_step.id;

  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_exercise_notes(UUID, INTEGER, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_exercise_notes(UUID, INTEGER, TIMESTAMPTZ, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_exercise_notes(UUID, INTEGER, TIMESTAMPTZ, TEXT, TEXT) TO authenticated;
