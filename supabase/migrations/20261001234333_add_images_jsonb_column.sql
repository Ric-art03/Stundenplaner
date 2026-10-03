-- Add JSONB column for multiple images (up to 3, one as cover)
-- Format: [{"path": "user-id/uuid.jpg", "isCover": true}, ...]
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Migrate any existing image_url values into the new format
UPDATE exercises
SET images = jsonb_build_array(jsonb_build_object('path', image_url, 'isCover', true))
WHERE image_url IS NOT NULL AND image_url != ''
  AND (images IS NULL OR images = '[]'::jsonb);
