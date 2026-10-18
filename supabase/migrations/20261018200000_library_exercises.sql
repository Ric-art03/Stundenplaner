-- ============================================
-- PROJ-4: Übungsdatenbank (Starter-Datenbank)
-- ============================================
-- Rein hinzufügend. An bestehenden Tabellen kommen drei Felder an der Übung
-- dazu; keine bestehende Zugriffsregel ändert sich.
--
--   1. Tabellen der Übungsdatenbank: Blöcke, Übungen, Material, Varianten,
--      Links — aufgebaut wie die eigenen Übungen
--   2. Zugriffsregeln: nur lesen, und nur was freigegeben ist (Entwürfe nur
--      für die Vorschau-Konten ihres Blocks). Schreiben über die App: niemand
--   3. Drei Felder an der eigenen Übung: übernommen aus, übernommen am,
--      Quellenangabe — dazu „je Nutzer höchstens eine Kopie je Übung"
--   4. `copy_library_exercises` — übernehmen, ganz oder gar nicht, mit den
--      Rechten des Nutzers
--   5. `import_library_block`, `release_library_block` — nur für das
--      Prüfprogramm (Dienstschlüssel), für alle anderen gesperrt

-- ============================================
-- 1. Tabellen
-- ============================================

-- Ein Block ist eine Tabelle, die gemeinsam geprüft, eingelesen und
-- freigegeben wird. Die Vorschau-Konten sehen seine Entwürfe vorab.
CREATE TABLE library_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 100),
  preview_user_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dieselben Felder und Grenzen wie `exercises` — ohne Besitzer, Bilder,
-- Musik-Link, Arbeitsnotiz und „noch zu ergänzen". Der Schlüssel kommt aus der
-- Tabelle des Blocks und ändert sich nie; über ihn findet ein erneutes
-- Einlesen dieselbe Übung wieder.
CREATE TABLE library_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES library_blocks(id) ON DELETE RESTRICT,
  key TEXT NOT NULL UNIQUE CHECK (key ~ '^[A-Za-z0-9][A-Za-z0-9-]{0,39}$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 5000),
  notes TEXT CHECK (char_length(notes) <= 2000),
  sports JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sports) = 'array'),
  age_groups JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(age_groups) = 'array'),
  phases JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(phases) = 'array'),
  difficulty TEXT NOT NULL DEFAULT 'Mittel' CHECK (difficulty IN ('Leicht', 'Mittel', 'Schwer')),
  organization_forms JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(organization_forms) = 'array'),
  duration INTEGER NOT NULL CHECK (duration BETWEEN 1 AND 300),
  participants_min INTEGER CHECK (participants_min >= 1),
  participants_max INTEGER CHECK (participants_max >= 1),
  music_required BOOLEAN NOT NULL DEFAULT false,
  -- Wo eine Lizenz Namensnennung verlangt. Die Herkunft jeder Übung steht
  -- dagegen nur in der Tabelle des Blocks: alles hier ist für jeden
  -- angemeldeten Nutzer abrufbar.
  source_credit TEXT CHECK (char_length(source_credit) BETWEEN 1 AND 500),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'released', 'withdrawn')),
  -- Zuerst freigegeben am — Grundlage von „Zuletzt hinzugefügt". Eine
  -- Korrektur setzt es nicht neu.
  first_released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT library_participants_range CHECK (
    participants_min IS NULL OR participants_max IS NULL OR participants_min <= participants_max
  )
);

-- Die Kindtabellen heißen wie bei den eigenen Übungen `exercise_id`, damit
-- ein Filter-Baustein für beide Tabellenreihen gilt.
CREATE TABLE library_exercise_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES library_exercises(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  mode TEXT NOT NULL CHECK (mode IN ('pro Teilnehmer', 'insgesamt')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE library_exercise_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES library_exercises(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 5000),
  materials JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(materials) = 'array'),
  participants_min INTEGER CHECK (participants_min >= 1),
  participants_max INTEGER CHECK (participants_max >= 1),
  duration INTEGER CHECK (duration BETWEEN 1 AND 300),
  age_groups JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(age_groups) = 'array'),
  organization_forms JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(organization_forms) = 'array'),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE library_exercise_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES library_exercises(id) ON DELETE CASCADE,
  url TEXT NOT NULL CHECK (url ~* '^https?://'),
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_library_exercises_block ON library_exercises (block_id);
CREATE INDEX idx_library_exercises_status ON library_exercises (status);
CREATE INDEX idx_library_exercise_materials_exercise ON library_exercise_materials (exercise_id);
CREATE INDEX idx_library_exercise_variants_exercise ON library_exercise_variants (exercise_id);
CREATE INDEX idx_library_exercise_links_exercise ON library_exercise_links (exercise_id);

CREATE TRIGGER library_blocks_updated_at
  BEFORE UPDATE ON library_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER library_exercises_updated_at
  BEFORE UPDATE ON library_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. Zugriffsregeln — nur lesen
-- ============================================
-- Je Tabelle **eine** Leseregel, nur für Angemeldete. Keine Regel zum
-- Anlegen, Ändern oder Löschen: über die App schreibt niemand in den Bestand.
-- Zusätzlich sind die Schreibrechte entzogen, damit nicht allein das Fehlen
-- einer Regel schützt.
--
-- `(select auth.uid())` statt `auth.uid()`: wird einmal je Abfrage ausgewertet
-- statt einmal je Zeile.

ALTER TABLE library_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_exercise_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_exercise_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_exercise_links ENABLE ROW LEVEL SECURITY;

-- Einen Block sehen nur seine Vorschau-Konten — sonst braucht ihn niemand.
CREATE POLICY "Preview accounts see their library blocks" ON library_blocks
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = ANY (preview_user_ids));

-- Freigegeben: alle Angemeldeten. Entwurf: nur die Vorschau-Konten seines
-- Blocks. Zurückgezogen: niemand.
CREATE POLICY "Signed-in users see released library exercises" ON library_exercises
  FOR SELECT TO authenticated
  USING (
    status = 'released'
    OR (
      status = 'draft'
      AND EXISTS (
        SELECT 1 FROM library_blocks b
        WHERE b.id = library_exercises.block_id
          AND (select auth.uid()) = ANY (b.preview_user_ids)
      )
    )
  );

-- Material, Varianten und Links: sichtbar, wenn die Übung sichtbar ist. Die
-- Unterabfrage läuft selbst unter der Regel oben.
CREATE POLICY "Signed-in users see materials of visible library exercises" ON library_exercise_materials
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM library_exercises e WHERE e.id = library_exercise_materials.exercise_id));
CREATE POLICY "Signed-in users see variants of visible library exercises" ON library_exercise_variants
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM library_exercises e WHERE e.id = library_exercise_variants.exercise_id));
CREATE POLICY "Signed-in users see links of visible library exercises" ON library_exercise_links
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM library_exercises e WHERE e.id = library_exercise_links.exercise_id));

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON library_blocks FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON library_exercises FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON library_exercise_materials FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON library_exercise_variants FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON library_exercise_links FROM anon, authenticated;

-- ============================================
-- 3. Felder an der eigenen Übung
-- ============================================
-- „Übernommen" in der Übungsdatenbank ist kein gespeicherter Zustand, sondern
-- die Frage, ob der Nutzer gerade eine Kopie mit diesem Verweis hat. Löscht er
-- sie, ist der Vermerk von selbst weg.
ALTER TABLE exercises
  ADD COLUMN library_exercise_id UUID REFERENCES library_exercises(id) ON DELETE SET NULL,
  ADD COLUMN copied_at TIMESTAMPTZ,
  ADD COLUMN source_credit TEXT CHECK (char_length(source_credit) BETWEEN 1 AND 500);

-- Je Nutzer höchstens eine Kopie je Übung der Übungsdatenbank — die Datenbank
-- prüft das selbst, so entsteht auch aus zwei Tabs nur eine Kopie.
CREATE UNIQUE INDEX idx_exercises_user_library
  ON exercises (user_id, library_exercise_id)
  WHERE library_exercise_id IS NOT NULL;

-- ============================================
-- 4. Übernehmen
-- ============================================
-- Eine oder viele Übungen in das Konto des angemeldeten Nutzers kopieren:
-- Übung, Material, Varianten (mit ihren abweichenden Bedingungen) und Links;
-- die Arbeitsnotiz bleibt leer, die Quellenangabe geht mit.
--
-- Läuft mit den Rechten des Aufrufers: gelesen wird nur, was er sehen darf
-- (Regeln oben), geschrieben nur, was die Regeln der eigenen Übungen erlauben
-- — also nur in sein Konto. Ganz oder gar nicht: ein Fehler mittendrin nimmt
-- alles zurück.
--
-- Rückgabe:
--   { copied:      [{ library_id, exercise_id, name }],
--     already:     [{ library_id, exercise_id, name }],  -- schon übernommen, übersprungen
--     unavailable: [{ library_id }] }                    -- nicht (mehr) sichtbar
-- Ist `unavailable` nicht leer, wurde nichts geschrieben.
CREATE FUNCTION public.copy_library_exercises(p_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_ids UUID[];
  v_unavailable JSONB;
  v_copied JSONB := '[]'::jsonb;
  v_already JSONB := '[]'::jsonb;
  v_id UUID;
  v_src public.library_exercises%ROWTYPE;
  v_new UUID;
  v_existing UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Nicht angemeldet' USING ERRCODE = '42501';
  END IF;

  IF p_ids IS NULL OR cardinality(p_ids) = 0 THEN
    RETURN jsonb_build_object('copied', '[]'::jsonb, 'already', '[]'::jsonb, 'unavailable', '[]'::jsonb);
  END IF;
  IF cardinality(p_ids) > 500 THEN
    RAISE EXCEPTION 'Höchstens 500 Übungen auf einmal' USING ERRCODE = '22023';
  END IF;

  -- Doppelte heraus, Reihenfolge des Aufrufs bleibt.
  SELECT array_agg(d.id ORDER BY d.ord) INTO v_ids
  FROM (
    SELECT DISTINCT ON (t.id) t.id, t.ord
    FROM unnest(p_ids) WITH ORDINALITY AS t(id, ord)
    ORDER BY t.id, t.ord
  ) d;

  SELECT coalesce(jsonb_agg(jsonb_build_object('library_id', t.id) ORDER BY t.ord), '[]'::jsonb)
  INTO v_unavailable
  FROM unnest(v_ids) WITH ORDINALITY AS t(id, ord)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.library_exercises le
    WHERE le.id = t.id AND le.status IN ('draft', 'released')
  );

  IF jsonb_array_length(v_unavailable) > 0 THEN
    RETURN jsonb_build_object('copied', '[]'::jsonb, 'already', '[]'::jsonb, 'unavailable', v_unavailable);
  END IF;

  FOREACH v_id IN ARRAY v_ids LOOP
    SELECT * INTO v_src FROM public.library_exercises WHERE id = v_id;

    INSERT INTO public.exercises (
      user_id, name, description, notes, work_notes,
      sports, age_groups, phases, difficulty, organization_forms,
      duration, participants_min, participants_max, music_required,
      library_exercise_id, copied_at, source_credit
    ) VALUES (
      v_user, v_src.name, v_src.description, v_src.notes, NULL,
      v_src.sports, v_src.age_groups, v_src.phases, v_src.difficulty, v_src.organization_forms,
      v_src.duration, v_src.participants_min, v_src.participants_max, v_src.music_required,
      v_id, now(), v_src.source_credit
    )
    ON CONFLICT (user_id, library_exercise_id) WHERE library_exercise_id IS NOT NULL DO NOTHING
    RETURNING id INTO v_new;

    -- Schon übernommen (auch gleichzeitig aus einem anderen Tab): überspringen.
    IF v_new IS NULL THEN
      SELECT id INTO v_existing FROM public.exercises
      WHERE user_id = v_user AND library_exercise_id = v_id;
      v_already := v_already || jsonb_build_array(
        jsonb_build_object('library_id', v_id, 'exercise_id', v_existing, 'name', v_src.name)
      );
      CONTINUE;
    END IF;

    INSERT INTO public.exercise_materials (exercise_id, name, quantity, mode, sort_order)
    SELECT v_new, m.name, m.quantity, m.mode, m.sort_order
    FROM public.library_exercise_materials m WHERE m.exercise_id = v_id;

    INSERT INTO public.exercise_variants (
      exercise_id, title, description, materials, participants_min, participants_max,
      duration, age_groups, organization_forms, sort_order
    )
    SELECT v_new, v.title, v.description, v.materials, v.participants_min, v.participants_max,
      v.duration, v.age_groups, v.organization_forms, v.sort_order
    FROM public.library_exercise_variants v WHERE v.exercise_id = v_id;

    INSERT INTO public.exercise_links (exercise_id, url, title, sort_order)
    SELECT v_new, l.url, l.title, l.sort_order
    FROM public.library_exercise_links l WHERE l.exercise_id = v_id;

    v_copied := v_copied || jsonb_build_array(
      jsonb_build_object('library_id', v_id, 'exercise_id', v_new, 'name', v_src.name)
    );
  END LOOP;

  RETURN jsonb_build_object('copied', v_copied, 'already', v_already, 'unavailable', '[]'::jsonb);
END;
$$;

-- ============================================
-- 5. Einlesen und Freigeben (nur Prüfprogramm)
-- ============================================
-- Beide sind für `anon` und `authenticated` gesperrt; nur der Dienstschlüssel
-- des Prüfprogramms darf sie aufrufen. Das Prüfprogramm prüft jede Zeile
-- vorher gegen Grundstock und Grenzen und zeigt die Gegenüberstellung; die
-- Bedingungen der Tabellen fangen ab, was trotzdem durchrutschte.

-- Einen geprüften Block in einem Zug schreiben. Format von `p_block`:
--   { name, preview_user_ids: [uuid],
--     exercises: [{ key, name, description, notes, sports, age_groups, phases,
--                   difficulty, organization_forms, duration, participants_min,
--                   participants_max, music_required, source_credit, withdrawn,
--                   materials: [{ name, quantity, mode }],
--                   variants: [{ title, description, materials, participants_min,
--                                participants_max, duration, age_groups,
--                                organization_forms }],
--                   links: [{ url, title }] }] }
--
-- Neue Übungen kommen als Entwurf. Vorhandene (gleicher Schlüssel) werden
-- überschrieben und behalten ihren Zustand — eine Korrektur an einer
-- freigegebenen Übung ist damit sofort sichtbar (vom Nutzer am 2026-10-18 so
-- entschieden). Eine als zurückgezogen markierte wird zurückgezogen; wird sie
-- später wieder aufgenommen, ist sie erneut Entwurf.
CREATE FUNCTION public.import_library_block(p_block JSONB)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_block_id UUID;
  v_ex JSONB;
  v_id UUID;
  v_status TEXT;
  v_owner UUID;
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_withdrawn INTEGER := 0;
BEGIN
  INSERT INTO public.library_blocks (name, preview_user_ids)
  VALUES (
    p_block->>'name',
    ARRAY(SELECT jsonb_array_elements_text(coalesce(p_block->'preview_user_ids', '[]'::jsonb))::uuid)
  )
  ON CONFLICT (name) DO UPDATE SET preview_user_ids = EXCLUDED.preview_user_ids
  RETURNING id INTO v_block_id;

  FOR v_ex IN SELECT value FROM jsonb_array_elements(p_block->'exercises') LOOP
    SELECT id, status, block_id INTO v_id, v_status, v_owner
    FROM public.library_exercises WHERE key = v_ex->>'key';

    IF v_id IS NOT NULL AND v_owner <> v_block_id THEN
      RAISE EXCEPTION 'Der Schlüssel % gehört zu einem anderen Block', v_ex->>'key'
        USING ERRCODE = '23505';
    END IF;

    IF coalesce((v_ex->>'withdrawn')::boolean, false) THEN
      IF v_id IS NOT NULL AND v_status <> 'withdrawn' THEN
        UPDATE public.library_exercises SET status = 'withdrawn' WHERE id = v_id;
        v_withdrawn := v_withdrawn + 1;
      END IF;
      CONTINUE;
    END IF;

    IF v_id IS NULL THEN
      INSERT INTO public.library_exercises (
        block_id, key, name, description, notes, sports, age_groups, phases, difficulty,
        organization_forms, duration, participants_min, participants_max, music_required,
        source_credit, status
      ) VALUES (
        v_block_id, v_ex->>'key', v_ex->>'name', v_ex->>'description', v_ex->>'notes',
        v_ex->'sports', v_ex->'age_groups', v_ex->'phases', v_ex->>'difficulty',
        v_ex->'organization_forms', (v_ex->>'duration')::int,
        (v_ex->>'participants_min')::int, (v_ex->>'participants_max')::int,
        coalesce((v_ex->>'music_required')::boolean, false), v_ex->>'source_credit', 'draft'
      )
      RETURNING id INTO v_id;
      v_inserted := v_inserted + 1;
    ELSE
      UPDATE public.library_exercises SET
        name = v_ex->>'name',
        description = v_ex->>'description',
        notes = v_ex->>'notes',
        sports = v_ex->'sports',
        age_groups = v_ex->'age_groups',
        phases = v_ex->'phases',
        difficulty = v_ex->>'difficulty',
        organization_forms = v_ex->'organization_forms',
        duration = (v_ex->>'duration')::int,
        participants_min = (v_ex->>'participants_min')::int,
        participants_max = (v_ex->>'participants_max')::int,
        music_required = coalesce((v_ex->>'music_required')::boolean, false),
        source_credit = v_ex->>'source_credit',
        status = CASE WHEN status = 'withdrawn' THEN 'draft' ELSE status END
      WHERE id = v_id;
      DELETE FROM public.library_exercise_materials WHERE exercise_id = v_id;
      DELETE FROM public.library_exercise_variants WHERE exercise_id = v_id;
      DELETE FROM public.library_exercise_links WHERE exercise_id = v_id;
      v_updated := v_updated + 1;
    END IF;

    INSERT INTO public.library_exercise_materials (exercise_id, name, quantity, mode, sort_order)
    SELECT v_id, m.value->>'name', (m.value->>'quantity')::int, m.value->>'mode', m.ord::int - 1
    FROM jsonb_array_elements(coalesce(v_ex->'materials', '[]'::jsonb)) WITH ORDINALITY AS m(value, ord);

    INSERT INTO public.library_exercise_variants (
      exercise_id, title, description, materials, participants_min, participants_max,
      duration, age_groups, organization_forms, sort_order
    )
    SELECT v_id, v.value->>'title', v.value->>'description',
      coalesce(v.value->'materials', '[]'::jsonb),
      (v.value->>'participants_min')::int, (v.value->>'participants_max')::int,
      (v.value->>'duration')::int,
      coalesce(v.value->'age_groups', '[]'::jsonb),
      coalesce(v.value->'organization_forms', '[]'::jsonb),
      v.ord::int - 1
    FROM jsonb_array_elements(coalesce(v_ex->'variants', '[]'::jsonb)) WITH ORDINALITY AS v(value, ord);

    INSERT INTO public.library_exercise_links (exercise_id, url, title, sort_order)
    SELECT v_id, l.value->>'url', l.value->>'title', l.ord::int - 1
    FROM jsonb_array_elements(coalesce(v_ex->'links', '[]'::jsonb)) WITH ORDINALITY AS l(value, ord);
  END LOOP;

  RETURN jsonb_build_object(
    'block_id', v_block_id,
    'inserted', v_inserted,
    'updated', v_updated,
    'withdrawn', v_withdrawn
  );
END;
$$;

-- Alle Entwürfe eines Blocks freigeben. „Zuerst freigegeben am" wird nur beim
-- ersten Mal gesetzt. Rückgabe: wie viele Übungen freigegeben wurden.
CREATE FUNCTION public.release_library_block(p_block_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_block_id UUID;
  v_count INTEGER;
BEGIN
  SELECT id INTO v_block_id FROM public.library_blocks WHERE name = p_block_name;
  IF v_block_id IS NULL THEN
    RAISE EXCEPTION 'Einen Block „%" gibt es nicht', p_block_name USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.library_exercises
  SET status = 'released', first_released_at = coalesce(first_released_at, now())
  WHERE block_id = v_block_id AND status = 'draft';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================
-- Rechte an den Funktionen
-- ============================================
REVOKE EXECUTE ON FUNCTION public.copy_library_exercises(UUID[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.copy_library_exercises(UUID[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.copy_library_exercises(UUID[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.import_library_block(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.import_library_block(JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_library_block(JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.release_library_block(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_library_block(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_library_block(TEXT) TO service_role;
