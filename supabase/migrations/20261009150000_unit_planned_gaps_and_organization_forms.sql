-- ============================================
-- PROJ-7: Überarbeitung vom 2026-10-09 — geplante Lücke und Organisationsform je Phase
-- ============================================
-- Rein additiv: zwei neue Spalten am Segment und eine neue Fassung der
-- Speicher-Funktion. Keine Richtlinie wird angefasst, keine bestehende Zeile
-- inhaltlich verändert — beide Spalten haben einen Standardwert, mit dem sich
-- bestehende Einheiten verhalten wie bisher.

-- 1. Geplante freie Minuten
--
-- „In diesem Segment sind bis zu n freie Minuten geplant." Eine Zahl und kein
-- Ja/Nein: frei ≤ geplant ist eine geplante Lücke, frei > geplant eine offene.
-- Werden nach der Erklärung weitere Minuten frei, ist die Lücke damit von
-- selbst wieder offen — ohne Logik, die der Erklärung nachläuft.
--
-- Standardwert 0: bei bestehenden Einheiten ist nichts geplant. Eine früher
-- gespeicherte Einheit mit Lücke behält ihren Hinweis, bis sie das nächste Mal
-- gespeichert wird.
ALTER TABLE unit_segments
  ADD COLUMN planned_gap_minutes INTEGER NOT NULL DEFAULT 0
  CHECK (planned_gap_minutes >= 0);

-- 2. Organisationsformen der Phase
--
-- Die Auswahl aus den Generator-Einstellungen. Leer = keine Einschränkung.
-- Als Liste wie `sports` und `difficulties` daneben.
ALTER TABLE unit_segments
  ADD COLUMN organization_forms JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. Die Speicher-Funktion, neue Fassung
--
-- Gegenüber `20261008090000` kommt zweierlei dazu:
--
--   a) Jedes Segment bringt `plannedGapMinutes` mit; die Zahl wird abgelegt.
--   b) Am Ende wird geprüft, dass keine **offene** Lücke bleibt. Bleibt in einem
--      Segment, das gefüllt werden soll, mehr frei als geplant, wird nichts
--      geschrieben (`open_gaps`). Damit ist „in einer gespeicherten Einheit
--      steht kein Warnfeld" eine Zusage der Datenbank und nicht nur eine
--      Gewohnheit der Oberfläche.
--
-- Ein im Generator auf „frei lassen" gestelltes Segment (`fill_mode = 'empty'`)
-- gilt mit allen freien Minuten als geplant. Eine Überfüllung ist keine Lücke
-- und sperrt nicht.
--
-- Alles Übrige ist unverändert: SECURITY INVOKER, Eigentumsprüfung, Abgleich
-- des Änderungsstempels, Ersetzen nur umgebauter Segmente, Verwendungsnachweise.
--
-- p_segments: [{ "id": <uuid>, "notes": <text>, "plannedGapMinutes": <int>,
--                "items": [{ "exerciseId": <uuid|null>, "variantId": <uuid|null>,
--                            "plannedDuration": <int> }] }]
--
-- Fehlt `plannedGapMinutes`, gilt 0.
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
  v_planned INTEGER;
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

    -- Die geplanten freien Minuten. Eine Lücke zu erklären oder wieder zu
    -- öffnen ist eine Änderung von Hand wie jede andere.
    v_planned := coalesce((v_segment->>'plannedGapMinutes')::integer, 0);
    IF v_planned < 0 THEN
      RAISE EXCEPTION 'invalid_plan';
    END IF;

    UPDATE public.unit_segments
    SET planned_gap_minutes = v_planned
    WHERE id = v_segment_id AND planned_gap_minutes IS DISTINCT FROM v_planned;

    IF FOUND THEN
      v_changed := true;
    END IF;
  END LOOP;

  -- Keine offene Lücke in einer gespeicherten Einheit: jede freie Minute ist
  -- gefüllt oder als geplant erklärt. Geprüft wird am geschriebenen Stand —
  -- die Ausnahme rollt alles Vorige zurück. Ein Platzhalter (gelöschte Übung)
  -- zählt mit seiner Plandauer, so wie ihn die Oberfläche rechnet.
  IF EXISTS (
    SELECT 1
    FROM public.unit_segments s
    WHERE s.unit_id = p_unit_id
      AND s.fill_mode = 'generate'
      AND s.minutes - coalesce(
            (SELECT sum(i.planned_duration) FROM public.unit_items i WHERE i.segment_id = s.id),
            0
          ) > s.planned_gap_minutes
  ) THEN
    RAISE EXCEPTION 'open_gaps';
  END IF;

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

-- Die Signatur ist unverändert, die Rechte aus `20261008090000` gelten damit
-- weiter. Hier noch einmal gesetzt, damit diese Datei für sich allein stimmt.
REVOKE EXECUTE ON FUNCTION public.save_unit_plan(UUID, JSONB, TIMESTAMPTZ, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_unit_plan(UUID, JSONB, TIMESTAMPTZ, BOOLEAN, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_unit_plan(UUID, JSONB, TIMESTAMPTZ, BOOLEAN, TEXT) TO authenticated;
