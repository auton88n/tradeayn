-- Create floor-plans storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('floor-plans', 'floor-plans', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload floor plans
CREATE POLICY "Authenticated users can upload floor plans"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'floor-plans');

-- Allow public read for download links
CREATE POLICY "Public can read floor plans"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'floor-plans');

-- Allow users to delete their own floor plans
CREATE POLICY "Users can delete own floor plans"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'floor-plans' AND (storage.foldername(name))[1] = auth.uid()::text);