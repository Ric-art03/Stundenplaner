-- ============================================
-- PROJ-7: Einheiten-Editor — Markierung „noch zu ergänzen" und Speichern in einem Zug
-- ============================================
-- Rein additiv: eine neue Spalte, ein Index, eine Funktion. Keine Richtlinie
-- wird angefasst, keine bestehende Zeile beschrieben.

-- 1. Markierung an der Übung
-- Entsteht beim Schnell-Anlegen aus dem Editor und verschwindet, sobald die
-- Übung über das reguläre Formular gespeichert wird. Ein Hinweis, keine
-- Einschränkung: Generator und Editor lesen die Spalte bei der Kandidatensuche
-- nicht.
--
-- Standardwert `false`, damit alle bestehenden Übungen als vollständig gelten,
-- ohne dass eine Zeile beschrieben werden muss.
ALTER TABLE exercises ADD COLUMN needs_completion BOOLEAN NOT NULL DEFAULT false;

-- Teilindex: der Filter „nur noch zu ergänzende" trifft wenige Zeilen, und nur
-- die stehen im Index.
CREATE INDEX idx_exercises_needs_completion ON exercises(user_id) WHERE needs_completion;

-- 2. Den geänderten Plan in einem Zug ablegen
--
-- Eine Funktion ist eine Transaktion: entweder passiert alles oder nichts. Das
-- ist der Unterschied zu `relaxSegment`, das in Einzelschritten arbeitet — dort
-- betrifft ein Abbruch ein Segment, hier bliebe der ganze Plan leer zurück.
--
-- SECURITY INVOKER, mit Absicht: die Funktion läuft mit den Rechten des
-- Aufrufers, die Richtlinien aus `20261006090000_harden_unit_write_policies`
-- bleiben als zweite Verteidigungslinie unter ihr wirksam. Sie prüft das
-- Eigentum trotzdem selbst und meldet einen Fehlschlag laut, statt sich auf ein
-- stilles „0 Zeilen" zu verlassen (das wäre BUG-16).
--
-- Rückgabe: 'ok' oder 'stale'. Alles andere ist eine Ausnahme und rollt zurück.
--
-- p_segments: [{ "id": <uuid>, "notes": <text>,
--                "items": [{ "exerciseId": <uuid|null>, "variantId": <uuid|null>,
--                            "plannedDuration": <int> }] }]
--
-- Eine Übung, die der Aufrufer nicht sehen kann — inzwischen gelöscht oder
-- fremd, beides ist unter den Leserichtlinien nicht unterscheidbar — wird als
-- Platzhalter (exercise_id NULL) abgelegt. So scheitert das Speichern nicht,
-- wenn eine Übung in einem anderen Tab gelöscht wurde (Edge Case 3), und ein
-- fremder Verweis wird in keinem Fall geschrieben.
CREATE OR REPLACE FUNCTION public.save_unit_plan(
  p_unit_id UUID,
  p_segments JSONB,
  p_expected_updated_at TIMESTAMPTZ,
  p_force BOOLEAN DEFAULT false,
  p_name TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_unit public.units%ROWTYPE;
  v_name TEXT := NULL;
  v_segment JSONB;
  v_segment_id UUID;
  v_notes TEXT;
  v_old JSONB;
  v_new JSONB;
  v_changed BOOLEAN := false;
  v_becomes_saved BOOLEAN;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Die Zeile wird gesperrt: zwei gleichzeitige Speichervorgänge laufen
  -- nacheinander, der zweite sieht den Änderungsstempel des ersten.
  SELECT * INTO v_unit
  FROM public.units
  WHERE id = p_unit_id AND user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unit_not_found';
  END IF;

  -- Hinweis auf fremde Änderungen, keine Sperre: mit p_force wird überschrieben.
  IF NOT p_force AND v_unit.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RETURN 'stale';
  END IF;

  IF p_name IS NOT NULL THEN
    v_name := btrim(p_name);
    IF char_length(v_name) NOT BETWEEN 1 AND 200 THEN
      RAISE EXCEPTION 'invalid_name';
    END IF;
  END IF;

  -- Der Plan muss genau die Segmente dieser Einheit tragen. Das Zeitgerüst
  -- gehört dem Generator: hat er es inzwischen neu geschrieben, passen die
  -- Kennungen nicht mehr, und geschrieben wird nichts.
  IF jsonb_typeof(p_segments) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid_plan';
  END IF;

  IF (SELECT count(*) FROM public.unit_segments WHERE unit_id = p_unit_id)
       <> jsonb_array_length(p_segments)
     OR (SELECT count(DISTINCT s.elem->>'id') FROM jsonb_array_elements(p_segments) AS s(elem))
       <> jsonb_array_length(p_segments)
     OR EXISTS (
       SELECT 1
       FROM jsonb_array_elements(p_segments) AS s(elem)
       WHERE NOT EXISTS (
         SELECT 1 FROM public.unit_segments us
         WHERE us.id = (s.elem->>'id')::uuid AND us.unit_id = p_unit_id
       )
     )
  THEN
    RAISE EXCEPTION 'segments_changed';
  END IF;

  FOR v_segment IN SELECT elem FROM jsonb_array_elements(p_segments) AS s(elem)
  LOOP
    v_segment_id := (v_segment->>'id')::uuid;

    -- Der bisherige Inhalt, als Folge von (Übung, Variante, Plandauer).
    SELECT coalesce(
             jsonb_agg(jsonb_build_array(i.exercise_id, i.variant_id, i.planned_duration)
                       ORDER BY i.position, i.id),
             '[]'::jsonb)
    INTO v_old
    FROM public.unit_items i
    WHERE i.segment_id = v_segment_id;

    -- Der neue Inhalt in derselben Form. Übung und Variante werden dabei
    -- aufgelöst: nur was dem Aufrufer gehört, bleibt stehen, und eine Variante
    -- nur, wenn sie zu genau dieser Übung gehört.
    SELECT coalesce(
             jsonb_agg(jsonb_build_array(r.exercise_id, r.variant_id, r.planned_duration)
                       ORDER BY r.ord),
             '[]'::jsonb)
    INTO v_new
    FROM (
      SELECT t.ord,
             e.id AS exercise_id,
             v.id AS variant_id,
             (t.item->>'plannedDuration')::integer AS planned_duration
      FROM jsonb_array_elements(coalesce(v_segment->'items', '[]'::jsonb))
             WITH ORDINALITY AS t(item, ord)
      LEFT JOIN public.exercises e
        ON e.id = (t.item->>'exerciseId')::uuid AND e.user_id = v_user
      LEFT JOIN public.exercise_variants v
        ON v.id = (t.item->>'variantId')::uuid AND v.exercise_id = e.id
    ) r;

    -- Nur ein wirklich umgebautes Segment wird ersetzt. Ersetzt wird
    -- vollständig, nicht abgeglichen: die Kennungen der Einträge werden
    -- nirgends sonst verwiesen.
    IF v_old IS DISTINCT FROM v_new THEN
      DELETE FROM public.unit_items WHERE segment_id = v_segment_id;

      INSERT INTO public.unit_items (segment_id, exercise_id, variant_id, planned_duration, position)
      SELECT v_segment_id,
             (t.elem->>0)::uuid,
             (t.elem->>1)::uuid,
             (t.elem->>2)::integer,
             (t.ord - 1)::integer
      FROM jsonb_array_elements(v_new) WITH ORDINALITY AS t(elem, ord);

      -- Die Lückenbegründung beschreibt den Versuch des Generators. Nach einem
      -- Umbau von Hand stimmt sie nicht mehr — und ein Grund, der nicht mehr
      -- stimmt, ist schlechter als keiner.
      UPDATE public.unit_segments
      SET gap_reason = NULL, gap_detail = NULL
      WHERE id = v_segment_id;

      v_changed := true;
    END IF;

    -- Eine geleerte Notiz verschwindet, statt als leerer Text stehen zu bleiben.
    v_notes := v_segment->>'notes';
    IF btrim(coalesce(v_notes, '')) = '' THEN
      v_notes := NULL;
    END IF;

    UPDATE public.unit_segments
    SET notes = v_notes
    WHERE id = v_segment_id AND notes IS DISTINCT FROM v_notes;

    IF FOUND THEN
      v_changed := true;
    END IF;
  END LOOP;

  -- Verwendungsnachweise aus dem neuen Inhalt. Wird aus dem Entwurf eine
  -- gespeicherte Einheit, entstehen alle neu — der Zeitpunkt ist dann der des
  -- Speicherns und nicht der des Generierens (BUG-6). Sonst behalten
  -- unveränderte Übungen ihren Zeitpunkt, entfernte fallen weg, neue kommen dazu.
  v_becomes_saved := v_name IS NOT NULL AND NOT v_unit.saved;

  IF v_becomes_saved THEN
    DELETE FROM public.exercise_usages WHERE unit_id = p_unit_id;
  ELSE
    DELETE FROM public.exercise_usages u
    WHERE u.unit_id = p_unit_id
      AND NOT EXISTS (
        SELECT 1
        FROM public.unit_items i
        JOIN public.unit_segments s ON s.id = i.segment_id
        WHERE s.unit_id = p_unit_id AND i.exercise_id = u.exercise_id
      );
  END IF;

  INSERT INTO public.exercise_usages (user_id, exercise_id, group_id, unit_id)
  SELECT DISTINCT v_user, i.exercise_id, v_unit.group_id, p_unit_id
  FROM public.unit_items i
  JOIN public.unit_segments s ON s.id = i.segment_id
  WHERE s.unit_id = p_unit_id
    AND i.exercise_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.exercise_usages u
      WHERE u.unit_id = p_unit_id AND u.exercise_id = i.exercise_id
    );

  -- Zuletzt die Einheit selbst. Das Update läuft immer, auch ohne inhaltliche
  -- Änderung: der Trigger zieht dabei den Änderungsstempel nach.
  UPDATE public.units
  SET manually_edited = manually_edited OR v_changed,
      name = coalesce(v_name, name),
      saved = saved OR v_name IS NOT NULL
  WHERE id = p_unit_id AND user_id = v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unit_not_found';
  END IF;

  RETURN 'ok';
END;
$$;

-- Nur angemeldete Nutzer. Ohne Anmeldung scheitert die Funktion ohnehin an
-- `auth.uid()`, aufrufbar muss sie für `anon` trotzdem nicht sein.
REVOKE EXECUTE ON FUNCTION public.save_unit_plan(UUID, JSONB, TIMESTAMPTZ, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_unit_plan(UUID, JSONB, TIMESTAMPTZ, BOOLEAN, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_unit_plan(UUID, JSONB, TIMESTAMPTZ, BOOLEAN, TEXT) TO authenticated;
