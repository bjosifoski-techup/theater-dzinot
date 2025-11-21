/*
  # Fix Tickets Storage Policies

  1. Storage Policies
    - Drop and recreate policies to ensure proper permissions
    - Allow authenticated users to upload tickets
    - Allow public read access to tickets
    - Allow users to delete their own tickets
*/

DROP POLICY IF EXISTS "Authenticated users can upload tickets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view tickets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON storage.objects;

CREATE POLICY "Authenticated users can upload tickets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tickets');

CREATE POLICY "Anyone can view tickets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'tickets');

CREATE POLICY "Users can delete their own tickets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'tickets' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );