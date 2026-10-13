-- ============================================
-- PROJ-16: Verwaltung — Stundenmuster und eigene Kategorien
-- ============================================
-- Rein hinzufügend. An bestehenden Tabellen ändert sich kein Feld und keine
-- Zugriffsregel.
--
--   1. Tabelle `unit_patterns` (Stundenmuster) mit vier Zugriffsregeln
--   2. `category_replace_in_list` — Hilfsfunktion: einen Begriff in einer Liste
--      ersetzen, ohne Doppeltes zu hinterlassen
--   3. `category_usages` — wo steht ein Begriff? (Namen der Einträge)
--   4. `category_usage_counts` — Zahlen für alle eigenen Begriffe auf einmal
--   5. `rename_category` — Umbenennen und Zusammenführen in einem Zug
--
-- Alle Funktionen laufen mit den Rechten des Aufrufers (SECURITY INVOKER): die
-- bestehenden Zugriffsregeln gelten weiter, die Funktionen filtern zusätzlich
-- selbst auf den angemeldeten Nutzer. Für nicht Angemeldete gesperrt.

-- ============================================
-- 1. Stundenmuster
-- ============================================
-- Ein Eintrag je Muster, die Segmente als geordnete Liste in einem Feld: ein
-- Muster wird immer als Ganzes gelesen und überschrieben, nie segmentweise.
--
-- Je Segment (Schlüssel wie im Programm):
--   name, minutes, fillMode, difficulties, organizationForms, notes,
--   sports (Liste oder null = „wie die Gruppe"), primarySport
CREATE TABLE unit_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  total_minutes INTEGER NOT NULL CHECK (total_minutes BETWEEN 5 AND 300),
  segments JSONB NOT NULL CHECK (jsonb_typeof(segments) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Je Nutzer eindeutig, ohne Rücksicht auf Groß-/Kleinschreibung. Deckt zugleich
-- die Suche nach `user_id` ab.
CREATE UNIQUE INDEX idx_unit_patterns_user_name ON unit_patterns (user_id, lower(name));

ALTER TABLE unit_patterns ENABLE ROW LEVEL SECURITY;

-- `(select auth.uid())` statt `auth.uid()`: wird einmal je Abfrage ausgewertet
-- statt einmal je Zeile.
CREATE POLICY "Users see own unit patterns" ON unit_patterns
  FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users insert own unit patterns" ON unit_patterns
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users update own unit patterns" ON unit_patterns
  FOR UPDATE USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users delete own unit patterns" ON unit_patterns
  FOR DELETE USING ((select auth.uid()) = user_id);

CREATE TRIGGER unit_patterns_updated_at
  BEFORE UPDATE ON unit_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. Einen Begriff in einer Liste ersetzen
-- ============================================
-- Aus ["A","alt","neu"] wird ["A","neu"]: der alte Begriff wird ersetzt, und
-- steht der neue schon da, bleibt er nur einmal stehen. Die Reihenfolge bleibt.
-- Ist `p_list` keine Liste, kommt es unverändert zurück.
CREATE FUNCTION public.category_replace_in_list(p_list JSONB, p_old TEXT, p_new TEXT)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN jsonb_typeof(p_list) IS DISTINCT FROM 'array' THEN p_list
    ELSE (
      SELECT coalesce(jsonb_agg(d.val ORDER BY d.ord), '[]'::jsonb)
      FROM (
        SELECT DISTINCT ON (r.val) r.val, r.ord
        FROM (
          SELECT CASE WHEN t.elem = p_old THEN p_new ELSE t.elem END AS val, t.ord
          FROM jsonb_array_elements_text(p_list) WITH ORDINALITY AS t(elem, ord)
        ) r
        ORDER BY r.val, r.ord
      ) d
    )
  END;
$$;

-- ============================================
-- 3. Wo steht ein Begriff?
-- ============================================
-- Liefert für **einen** Begriff die Einträge des angemeldeten Nutzers, an denen
-- er steht: kind ∈ exercises | groups | venues | units | patterns.
--
-- Eine Übung zählt einmal, auch wenn der Begriff nur an einer Variante steht.
-- Einheiten: nur gespeicherte; der Entwurf des Generators ist kein Eintrag, den
-- der Nutzer kennt (umbenannt wird er trotzdem, siehe `rename_category`).
-- Durchführungen (PROJ-14) zählen nicht — sie sind eine Aufzeichnung.
--
-- Verglichen wird genau, also mit Groß-/Kleinschreibung: „Reifen" und „reifen"
-- können aus der Zeit vor PROJ-16 nebeneinander bestehen und sind zwei Begriffe.
CREATE FUNCTION public.category_usages(p_type TEXT, p_name TEXT)
RETURNS TABLE (kind TEXT, entry_id UUID, entry_name TEXT)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT 'exercises', e.id, e.name
  FROM public.exercises e
  WHERE e.user_id = auth.uid()
    AND CASE p_type
      WHEN 'sport' THEN e.sports ? p_name
      WHEN 'phase' THEN e.phases ? p_name
      WHEN 'age_group' THEN
        e.age_groups ? p_name
        OR EXISTS (
          SELECT 1 FROM public.exercise_variants v
          WHERE v.exercise_id = e.id AND v.age_groups ? p_name
        )
      WHEN 'organization_form' THEN
        e.organization_forms ? p_name
        OR EXISTS (
          SELECT 1 FROM public.exercise_variants v
          WHERE v.exercise_id = e.id AND v.organization_forms ? p_name
        )
      WHEN 'material' THEN
        EXISTS (
          SELECT 1 FROM public.exercise_materials m
          WHERE m.exercise_id = e.id AND m.name = p_name
        )
        OR EXISTS (
          SELECT 1 FROM public.exercise_variants v
          WHERE v.exercise_id = e.id
            AND v.materials @> jsonb_build_array(jsonb_build_object('name', p_name))
        )
      ELSE false
    END

  UNION ALL

  SELECT 'groups', g.id, g.name
  FROM public.groups g
  WHERE g.user_id = auth.uid()
    AND CASE p_type
      WHEN 'sport' THEN g.sports ? p_name
      WHEN 'age_group' THEN g.age_groups ? p_name
      ELSE false
    END

  UNION ALL

  SELECT 'venues', h.id, h.name
  FROM public.venues h
  WHERE h.user_id = auth.uid()
    AND p_type = 'material'
    AND EXISTS (
      SELECT 1 FROM public.venue_materials m
      WHERE m.venue_id = h.id AND m.name = p_name
    )

  UNION ALL

  SELECT 'units', u.id, u.name
  FROM public.units u
  WHERE u.user_id = auth.uid()
    AND u.saved
    AND EXISTS (
      SELECT 1 FROM public.unit_segments s
      WHERE s.unit_id = u.id
        AND CASE p_type
          WHEN 'sport' THEN s.sports ? p_name
          WHEN 'phase' THEN s.name = p_name
          WHEN 'organization_form' THEN s.organization_forms ? p_name
          ELSE false
        END
    )

  UNION ALL

  SELECT 'patterns', p.id, p.name
  FROM public.unit_patterns p
  WHERE p.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(p.segments) AS seg(elem)
      WHERE CASE p_type
        WHEN 'sport' THEN
          jsonb_typeof(seg.elem->'sports') = 'array' AND seg.elem->'sports' ? p_name
        WHEN 'phase' THEN seg.elem->>'name' = p_name
        WHEN 'organization_form' THEN
          jsonb_typeof(seg.elem->'organizationForms') = 'array'
          AND seg.elem->'organizationForms' ? p_name
        ELSE false
      END
    );
$$;

-- ============================================
-- 4. Zahlen für alle eigenen Begriffe auf einmal
-- ============================================
-- Ein Aufruf beim Öffnen des Reiters „Kategorien". Begriffe ohne Verwendung
-- kommen mit lauter Nullen zurück.
CREATE FUNCTION public.category_usage_counts()
RETURNS TABLE (
  category_id UUID,
  exercises INTEGER,
  groups INTEGER,
  venues INTEGER,
  units INTEGER,
  patterns INTEGER
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    c.id,
    count(*) FILTER (WHERE u.kind = 'exercises')::INTEGER,
    count(*) FILTER (WHERE u.kind = 'groups')::INTEGER,
    count(*) FILTER (WHERE u.kind = 'venues')::INTEGER,
    count(*) FILTER (WHERE u.kind = 'units')::INTEGER,
    count(*) FILTER (WHERE u.kind = 'patterns')::INTEGER
  FROM public.custom_categories c
  LEFT JOIN LATERAL public.category_usages(c.category_type, c.name) u ON true
  WHERE c.user_id = auth.uid()
  GROUP BY c.id;
$$;

-- ============================================
-- 5. Umbenennen und Zusammenführen
-- ============================================
-- Ändert den Begriff an allen Stellen und in der Kategorienliste — alles oder
-- nichts. Die Stellen je Art:
--
--   sport              Übung · Gruppe (+ Hauptsportart) · Segment (+ Hauptsportart) · Muster
--   age_group          Übung · Variante · Gruppe
--   phase              Übung · Segment (Name, Lücken-Erklärung) · Muster
--   organization_form  Übung · Variante · Segment · Muster
--   material           Material der Übung · Material der Variante · Material der Halle
--
-- Durchführungen (PROJ-14) werden nie angefasst.
--
-- `p_predefined` = der neue Name ist ein mitgelieferter Begriff (das weiß nur
-- der Server, die Listen stehen im Programm). Dann verschwindet der eigene
-- Begriff aus der Kategorienliste. Gleicht der neue Name einem **anderen
-- eigenen** Begriff, stellt die Funktion das selbst fest und übernimmt dessen
-- Schreibweise. Beides ist ein Zusammenführen und verlangt `p_merge`.
--
-- Doppeltes wird immer aufgeräumt, nicht nur beim Zusammenführen: der neue Name
-- kann an einer Übung schon stehen, ohne in der Kategorienliste zu sein.
-- Stehen zwei Materialzeilen danach unter demselben Namen, bleibt die des
-- vorhandenen Begriffs und die des alten entfällt.
--
-- Die Kategorientabelle hat bewusst kein Recht „ändern". Umbenannt wird deshalb
-- durch Löschen und Neuanlegen unter derselben Kennung.
--
-- Rückgabe: { name, merged, affected } — `affected` zählt die Einträge wie
-- `category_usages` (Übungen, Gruppen, Hallen, gespeicherte Einheiten, Muster).
-- Ausnahmen: not_authenticated, category_not_found, invalid_name, name_taken.
CREATE FUNCTION public.rename_category(
  p_id UUID,
  p_new_name TEXT,
  p_merge BOOLEAN DEFAULT false,
  p_predefined BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_type TEXT;
  v_old TEXT;
  v_created TIMESTAMPTZ;
  v_new TEXT := btrim(p_new_name);
  v_other TEXT;
  v_merged BOOLEAN := false;
  v_affected INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Zwei gleichzeitige Umbenennungen desselben Nutzers laufen nacheinander.
  PERFORM pg_advisory_xact_lock(hashtext('rename_category:' || v_user::text));

  SELECT c.category_type, c.name, c.created_at INTO v_type, v_old, v_created
  FROM public.custom_categories c
  WHERE c.id = p_id AND c.user_id = v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'category_not_found';
  END IF;

  -- Phasen fassen nur 60 Zeichen: so lang darf der Name eines Segments sein.
  -- Die Klammer um das CASE ist nötig: ohne sie hält plpgsql dessen THEN für
  -- das Ende der IF-Bedingung.
  IF v_new IS NULL OR v_new = ''
     OR char_length(v_new) > (CASE WHEN v_type = 'phase' THEN 60 ELSE 100 END)
  THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;

  IF p_predefined THEN
    v_merged := true;
  ELSE
    -- Ein anderer eigener Begriff desselben Namens? Die genaue Schreibweise
    -- gewinnt, wenn es mehrere gibt.
    SELECT c.name INTO v_other
    FROM public.custom_categories c
    WHERE c.user_id = v_user
      AND c.category_type = v_type
      AND c.id <> p_id
      AND lower(c.name) = lower(v_new)
    ORDER BY (c.name = v_new) DESC, c.name
    LIMIT 1;

    IF FOUND THEN
      v_merged := true;
      v_new := v_other;
    END IF;
  END IF;

  IF v_merged AND NOT p_merge THEN
    RAISE EXCEPTION 'name_taken';
  END IF;

  IF NOT v_merged AND v_new = v_old THEN
    RETURN jsonb_build_object('name', v_old, 'merged', false, 'affected', 0);
  END IF;

  SELECT count(*)::INTEGER INTO v_affected FROM public.category_usages(v_type, v_old);

  -- ---- Übungen ----
  IF v_type = 'sport' THEN
    UPDATE public.exercises
    SET sports = public.category_replace_in_list(sports, v_old, v_new)
    WHERE user_id = v_user AND sports ? v_old;
  ELSIF v_type = 'phase' THEN
    UPDATE public.exercises
    SET phases = public.category_replace_in_list(phases, v_old, v_new)
    WHERE user_id = v_user AND phases ? v_old;
  ELSIF v_type IN ('age_group', 'organization_form', 'material') THEN
    -- Auch Übungen, die den Begriff nur an einer Variante oder als Material
    -- tragen, bekommen einen neuen Änderungsstempel: wer sie in einem anderen
    -- Tab offen hat, soll merken, dass sich etwas geändert hat. Das `SET`
    -- ändert bei ihnen nichts, löst aber den Stempel aus.
    UPDATE public.exercises e
    SET age_groups = CASE WHEN v_type = 'age_group'
          THEN public.category_replace_in_list(e.age_groups, v_old, v_new) ELSE e.age_groups END,
        organization_forms = CASE WHEN v_type = 'organization_form'
          THEN public.category_replace_in_list(e.organization_forms, v_old, v_new)
          ELSE e.organization_forms END
    WHERE e.user_id = v_user
      AND e.id IN (
        SELECT u.entry_id FROM public.category_usages(v_type, v_old) u WHERE u.kind = 'exercises'
      );
  END IF;

  -- ---- Varianten ----
  IF v_type = 'age_group' THEN
    UPDATE public.exercise_variants v
    SET age_groups = public.category_replace_in_list(v.age_groups, v_old, v_new)
    FROM public.exercises e
    WHERE e.id = v.exercise_id AND e.user_id = v_user AND v.age_groups ? v_old;
  ELSIF v_type = 'organization_form' THEN
    UPDATE public.exercise_variants v
    SET organization_forms = public.category_replace_in_list(v.organization_forms, v_old, v_new)
    FROM public.exercises e
    WHERE e.id = v.exercise_id AND e.user_id = v_user AND v.organization_forms ? v_old;
  ELSIF v_type = 'material' THEN
    UPDATE public.exercise_variants v
    SET materials = (
      SELECT coalesce(
        jsonb_agg(
          CASE WHEN m.elem->>'name' = v_old
            THEN jsonb_set(m.elem, '{name}', to_jsonb(v_new))
            ELSE m.elem
          END
          ORDER BY m.ord
        ),
        '[]'::jsonb
      )
      FROM jsonb_array_elements(v.materials) WITH ORDINALITY AS m(elem, ord)
      -- Steht das vorhandene Material schon da, entfällt die Zeile des alten.
      WHERE NOT (
        m.elem->>'name' = v_old
        AND v_new <> v_old
        AND v.materials @> jsonb_build_array(jsonb_build_object('name', v_new))
      )
    )
    FROM public.exercises e
    WHERE e.id = v.exercise_id
      AND e.user_id = v_user
      AND v.materials @> jsonb_build_array(jsonb_build_object('name', v_old));
  END IF;

  -- ---- Material der Übungen und Hallen ----
  IF v_type = 'material' THEN
    DELETE FROM public.exercise_materials m
    USING public.exercises e
    WHERE e.id = m.exercise_id
      AND e.user_id = v_user
      AND m.name = v_old
      AND v_new <> v_old
      AND EXISTS (
        SELECT 1 FROM public.exercise_materials k
        WHERE k.exercise_id = m.exercise_id AND k.name = v_new
      );

    UPDATE public.exercise_materials m
    SET name = v_new
    FROM public.exercises e
    WHERE e.id = m.exercise_id AND e.user_id = v_user AND m.name = v_old;

    DELETE FROM public.venue_materials m
    USING public.venues h
    WHERE h.id = m.venue_id
      AND h.user_id = v_user
      AND m.name = v_old
      AND v_new <> v_old
      AND EXISTS (
        SELECT 1 FROM public.venue_materials k
        WHERE k.venue_id = m.venue_id AND k.name = v_new
      );

    UPDATE public.venue_materials m
    SET name = v_new
    FROM public.venues h
    WHERE h.id = m.venue_id AND h.user_id = v_user AND m.name = v_old;
  END IF;

  -- ---- Gruppen ----
  IF v_type = 'sport' THEN
    UPDATE public.groups
    SET sports = public.category_replace_in_list(sports, v_old, v_new),
        primary_sport = CASE WHEN primary_sport = v_old THEN v_new ELSE primary_sport END
    WHERE user_id = v_user AND sports ? v_old;
  ELSIF v_type = 'age_group' THEN
    UPDATE public.groups
    SET age_groups = public.category_replace_in_list(age_groups, v_old, v_new)
    WHERE user_id = v_user AND age_groups ? v_old;
  END IF;

  -- ---- Segmente der Einheiten (gespeicherte und Entwurf) ----
  IF v_type IN ('sport', 'phase', 'organization_form') THEN
    -- Erst der Änderungsstempel der Einheiten, solange die Segmente den alten
    -- Namen noch tragen.
    UPDATE public.units u
    SET name = u.name
    WHERE u.user_id = v_user
      AND EXISTS (
        SELECT 1 FROM public.unit_segments s
        WHERE s.unit_id = u.id
          AND CASE v_type
            WHEN 'sport' THEN s.sports ? v_old
            WHEN 'phase' THEN s.name = v_old OR s.gap_detail->>'phase' = v_old
            ELSE s.organization_forms ? v_old
          END
      );

    IF v_type = 'sport' THEN
      UPDATE public.unit_segments s
      SET sports = public.category_replace_in_list(s.sports, v_old, v_new),
          primary_sport = CASE WHEN s.primary_sport = v_old THEN v_new ELSE s.primary_sport END
      FROM public.units u
      WHERE u.id = s.unit_id AND u.user_id = v_user AND s.sports ? v_old;
    ELSIF v_type = 'phase' THEN
      UPDATE public.unit_segments s
      SET name = CASE WHEN s.name = v_old THEN v_new ELSE s.name END,
          gap_detail = CASE WHEN s.gap_detail->>'phase' = v_old
            THEN jsonb_set(s.gap_detail, '{phase}', to_jsonb(v_new))
            ELSE s.gap_detail
          END
      FROM public.units u
      WHERE u.id = s.unit_id
        AND u.user_id = v_user
        AND (s.name = v_old OR s.gap_detail->>'phase' = v_old);
    ELSE
      UPDATE public.unit_segments s
      SET organization_forms = public.category_replace_in_list(s.organization_forms, v_old, v_new)
      FROM public.units u
      WHERE u.id = s.unit_id AND u.user_id = v_user AND s.organization_forms ? v_old;
    END IF;

    -- ---- Stundenmuster ----
    UPDATE public.unit_patterns p
    SET segments = n.segments
    FROM (
      SELECT q.id, (
        SELECT coalesce(jsonb_agg(
          CASE v_type
            WHEN 'phase' THEN
              CASE WHEN seg.elem->>'name' = v_old
                THEN jsonb_set(seg.elem, '{name}', to_jsonb(v_new))
                ELSE seg.elem
              END
            WHEN 'sport' THEN
              CASE WHEN jsonb_typeof(seg.elem->'sports') = 'array' AND seg.elem->'sports' ? v_old
                THEN seg.elem || jsonb_build_object(
                  'sports', public.category_replace_in_list(seg.elem->'sports', v_old, v_new),
                  'primarySport', CASE WHEN seg.elem->>'primarySport' = v_old
                    THEN to_jsonb(v_new)
                    ELSE coalesce(seg.elem->'primarySport', 'null'::jsonb)
                  END
                )
                ELSE seg.elem
              END
            ELSE
              CASE WHEN jsonb_typeof(seg.elem->'organizationForms') = 'array'
                        AND seg.elem->'organizationForms' ? v_old
                THEN jsonb_set(
                  seg.elem, '{organizationForms}',
                  public.category_replace_in_list(seg.elem->'organizationForms', v_old, v_new)
                )
                ELSE seg.elem
              END
          END
          ORDER BY seg.ord
        ), '[]'::jsonb)
        FROM jsonb_array_elements(q.segments) WITH ORDINALITY AS seg(elem, ord)
      ) AS segments
      FROM public.unit_patterns q
      WHERE q.user_id = v_user
    ) n
    WHERE p.id = n.id AND p.segments IS DISTINCT FROM n.segments;
  END IF;

  -- ---- Die Kategorienliste selbst ----
  DELETE FROM public.custom_categories WHERE id = p_id AND user_id = v_user;

  IF NOT v_merged THEN
    INSERT INTO public.custom_categories (id, user_id, category_type, name, created_at)
    VALUES (p_id, v_user, v_type, v_new, v_created);
  END IF;

  RETURN jsonb_build_object('name', v_new, 'merged', v_merged, 'affected', v_affected);
END;
$$;

-- ============================================
-- Rechte: nur für Angemeldete
-- ============================================
REVOKE EXECUTE ON FUNCTION public.category_replace_in_list(JSONB, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.category_replace_in_list(JSONB, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.category_replace_in_list(JSONB, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.category_usages(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.category_usages(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.category_usages(TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.category_usage_counts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.category_usage_counts() FROM anon;
GRANT EXECUTE ON FUNCTION public.category_usage_counts() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rename_category(UUID, TEXT, BOOLEAN, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rename_category(UUID, TEXT, BOOLEAN, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.rename_category(UUID, TEXT, BOOLEAN, BOOLEAN) TO authenticated;
