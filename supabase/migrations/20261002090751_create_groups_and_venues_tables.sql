-- ============================================
-- PROJ-5: Gruppenprofile — Venues & Groups
-- ============================================

-- 1. Venues (Hallen/Orte)
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  notes TEXT CHECK (char_length(notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own venues" ON venues
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own venues" ON venues
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own venues" ON venues
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own venues" ON venues
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_venues_user_id ON venues(user_id);

CREATE TRIGGER venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 2. Venue Materials
CREATE TABLE venue_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE venue_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own venue materials" ON venue_materials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM venues WHERE venues.id = venue_materials.venue_id AND venues.user_id = auth.uid())
  );
CREATE POLICY "Users insert own venue materials" ON venue_materials
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM venues WHERE venues.id = venue_materials.venue_id AND venues.user_id = auth.uid())
  );
CREATE POLICY "Users update own venue materials" ON venue_materials
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM venues WHERE venues.id = venue_materials.venue_id AND venues.user_id = auth.uid())
  );
CREATE POLICY "Users delete own venue materials" ON venue_materials
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM venues WHERE venues.id = venue_materials.venue_id AND venues.user_id = auth.uid())
  );

CREATE INDEX idx_venue_materials_venue_id ON venue_materials(venue_id);

-- 3. Groups (Gruppenprofile)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  sports JSONB NOT NULL DEFAULT '[]'::jsonb,
  age_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  participants_min INTEGER CHECK (participants_min >= 1),
  participants_max INTEGER CHECK (participants_max >= 1),
  unit_duration INTEGER NOT NULL CHECK (unit_duration >= 5 AND unit_duration <= 300),
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own groups" ON groups
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own groups" ON groups
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own groups" ON groups
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_groups_user_id ON groups(user_id);
CREATE INDEX idx_groups_venue_id ON groups(venue_id);
CREATE INDEX idx_groups_sports ON groups USING GIN (sports);
CREATE INDEX idx_groups_age_groups ON groups USING GIN (age_groups);

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4. Group Schedules (Trainingszeiten)
CREATE TABLE group_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  weekday TEXT NOT NULL CHECK (weekday = ANY (ARRAY[
    'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'
  ])),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

ALTER TABLE group_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own group schedules" ON group_schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_schedules.group_id AND groups.user_id = auth.uid())
  );
CREATE POLICY "Users insert own group schedules" ON group_schedules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_schedules.group_id AND groups.user_id = auth.uid())
  );
CREATE POLICY "Users update own group schedules" ON group_schedules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_schedules.group_id AND groups.user_id = auth.uid())
  );
CREATE POLICY "Users delete own group schedules" ON group_schedules
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_schedules.group_id AND groups.user_id = auth.uid())
  );

CREATE INDEX idx_group_schedules_group_id ON group_schedules(group_id);
