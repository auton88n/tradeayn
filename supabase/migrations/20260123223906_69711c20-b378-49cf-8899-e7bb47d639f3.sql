-- Allow public read access to documents bucket
CREATE POLICY "Public read for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');