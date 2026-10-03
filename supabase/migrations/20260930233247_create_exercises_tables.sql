-- ============================================
-- PROJ-3: Übungsdatenbank (Exercise Database)
-- ============================================

-- 1. Main exercises table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 5000),
  notes TEXT CHECK (char_length(notes) <= 2000),
  work_notes TEXT CHECK (char_length(work_notes) <= 2000),
  sports JSONB NOT NULL DEFAULT '[]'::jsonb,
  age_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Leicht', 'Mittel', 'Schwer')) DEFAULT 'Mittel',
  organization_forms JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration INTEGER NOT NULL CHECK (duration BETWEEN 1 AND 300),
  participants_min INTEGER CHECK (participants_min >= 1),
  participants_max INTEGER CHECK (participants_max >= 1),
  music_required BOOLEAN NOT NULL DEFAULT false,
  music_link TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT participants_range CHECK (
    participants_min IS NULL OR participants_max IS NULL OR participants_min <= participants_max
  )
);

-- 2. Exercise materials
CREATE TABLE exercise_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  mode TEXT NOT NULL CHECK (mode IN ('pro Teilnehmer', 'insgesamt')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 3. Exercise variants
CREATE TABLE exercise_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT NOT NULL CHECK (char_length(description) >= 1),
  materials JSONB DEFAULT '[]'::jsonb,
  participants_min INTEGER CHECK (participants_min >= 1),
  participants_max INTEGER CHECK (participants_max >= 1),
  duration INTEGER CHECK (duration >= 1),
  age_groups JSONB DEFAULT '[]'::jsonb,
  organization_forms JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 4. Exercise links
CREATE TABLE exercise_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 5. Custom categories (shared table for all category types)
CREATE TABLE custom_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_type TEXT NOT NULL CHECK (category_type IN ('sport', 'age_group', 'phase', 'organization_form', 'material')),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_type, name)
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_exercises_updated_at ON exercises(updated_at DESC);
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_exercises_sports ON exercises USING gin(sports);
CREATE INDEX idx_exercises_age_groups ON exercises USING gin(age_groups);
CREATE INDEX idx_exercises_phases ON exercises USING gin(phases);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);

CREATE INDEX idx_exercise_materials_exercise_id ON exercise_materials(exercise_id);
CREATE INDEX idx_exercise_variants_exercise_id ON exercise_variants(exercise_id);
CREATE INDEX idx_exercise_links_exercise_id ON exercise_links(exercise_id);
CREATE INDEX idx_custom_categories_user_type ON custom_categories(user_id, category_type);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

-- Exercises: users see and manage only their own
CREATE POLICY "Users can view own exercises"
  ON exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exercises"
  ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
  ON exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises"
  ON exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Exercise materials: access via exercise ownership
CREATE POLICY "Users can view own exercise materials"
  ON exercise_materials FOR SELECT
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_materials.exercise_id AND exercises.user_id = auth.uid()));

CREATE POLICY "Users can create own exercise materials"
  ON exercise_materials FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_materials.exercise_id AND exercises.user_id = auth.uid()));

CREATE POLICY "Users can update own exercise materials"
  ON exercise_materials FOR UPDATE
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_materials.exercise_id AND exercises.user_id = auth.uid()));

CREATE POLICY "Users can delete own exercise materials"
  ON exercise_materials FOR DELETE
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_materials.exercise_id AND exercises.user_id = auth.uid()));

-- Exercise variants: access via exercise ownership
CREATE POLICY "Users can view own exercise variants"
  ON exercise_variants FOR SELECT
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_variants.exercise_id AND exercises.user_id = auth.uid()));

CREATE POLICY "Users can create own exercise variants"
  ON exercise_variants FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_variants.exercise_id AND exercises.user_id = auth.uid()));

CREATE POLICY "Users can update own exercise variants"
  ON exercise_variants FOR UPDATE
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_variants.exercise_id AND exercises.user_id = auth.uid()));

CREATE POLICY "Users can delete own exercise variants"
  ON exercise_variants FOR DELETE
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_variants.exercise_id AND exercises.user_id = auth.uid()));

-- Exercise links: access via exercise ownership
CREATE POLICY "Users can view own exercise links"
  ON exercise_links FOR SELECT
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_links.exercise_id AND exercises.user_id = auth.uid()));

CREATE POLICY "Users can create own exercise links"
  ON exercise_links FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_links.exercise_id AND exercises.user_id = auth.uid()));

CREATE POLICY "Users can update own exercise links"
  ON exercise_links FOR UPDATE
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_links.exercise_id AND exercises.user_id = auth.uid()));

CREATE POLICY "Users can delete own exercise links"
  ON exercise_links FOR DELETE
  USING (EXISTS (SELECT 1 FROM exercises WHERE exercises.id = exercise_links.exercise_id AND exercises.user_id = auth.uid()));

-- Custom categories: users see and manage only their own
CREATE POLICY "Users can view own custom categories"
  ON custom_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own custom categories"
  ON custom_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom categories"
  ON custom_categories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
