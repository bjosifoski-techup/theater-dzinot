/*
  # Create Storage Bucket for Tickets

  1. New Storage
    - Create `tickets` bucket for storing PDF tickets
    - Enable public access for ticket downloads
  
  2. Security
    - Allow authenticated users to upload tickets
    - Allow public access to read tickets
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('tickets', 'tickets', true)
ON CONFLICT (id) DO NOTHING;

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
  USING (bucket_id = 'tickets' AND auth.uid()::text = (storage.foldername(name))[1]);