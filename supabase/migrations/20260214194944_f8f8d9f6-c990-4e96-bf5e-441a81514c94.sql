
-- Create storage bucket for generated files
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-files', 'generated-files', true);

-- RLS: authenticated users upload to their own folder
CREATE POLICY "Users upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: public read access
CREATE POLICY "Public read generated files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'generated-files');
