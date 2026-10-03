-- Create storage bucket for exercise images (private, requires auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-images',
  'exercise-images',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Policy: Users can upload images to their own folder
CREATE POLICY "Users upload own exercise images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exercise-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own images
CREATE POLICY "Users read own exercise images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own images
CREATE POLICY "Users update own exercise images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own images
CREATE POLICY "Users delete own exercise images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exercise-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
