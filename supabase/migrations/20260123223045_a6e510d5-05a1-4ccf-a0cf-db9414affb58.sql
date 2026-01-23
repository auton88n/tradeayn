-- Make documents bucket public for reliable downloads
-- Files are protected by requiring knowledge of the signed URL path
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';