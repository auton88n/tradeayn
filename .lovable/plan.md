

## Plan: Fix Image Display and Excel Download Bugs

### Scope
Fix only the two critical bugs. localStorage migration is a separate, lower-priority effort that should not be mixed in.

### What We're Fixing
1. Images show as "codes" instead of rendering -- caused by massive base64 data URLs in markdown
2. Excel downloads redirect to landing page -- caused by data URLs being truncated in database

### Step 1: Create Storage Bucket (Database Migration)

Create a `generated-files` public storage bucket with RLS policies:
- Authenticated users can upload to their own folder (`{user_id}/`)
- Anyone can read (public bucket for sharing generated content)

### Step 2: Create Shared Upload Utility

**New file: `supabase/functions/_shared/storageUpload.ts`**

Two functions:
- `uploadImageToStorage(base64DataUrl, userId)` -- decodes base64, uploads to `generated-files/{userId}/images/{timestamp}.png`, returns public HTTPS URL
- `uploadDocumentToStorage(fileData: Uint8Array, userId, filename, contentType)` -- uploads binary directly, returns public HTTPS URL

Both use the Supabase service role client for storage uploads.

### Step 3: Fix Image Generation in `ayn-unified/index.ts`

In `generateImage()` (lines 53-88):
- After getting the base64 `imageUrl` from the API response
- Upload to storage via the new utility
- Return the permanent HTTPS URL instead of the data URL

Also update the image handling at line 638 and line 1033 where `generateImage` results are used -- no changes needed there since they just pass through the returned URL.

### Step 4: Fix Document Generation in `generate-document/index.ts`

Replace the `toDataUrl()` call (line 477):
- Instead of converting `fileData` to a data URL, upload to storage
- Return the public HTTPS URL in the `downloadUrl` field
- The `toDataUrl()` function can be removed entirely

### Step 5: Keep the History Stripping (No Frontend Changes Needed)

The `stripBase64` function at line 413 of `useMessages.ts` strips data URLs from **conversation history sent to the LLM** -- this is correct and should stay. With storage URLs, new images will be regular HTTPS URLs that don't need stripping.

No frontend display changes are needed -- markdown already renders `![alt](https://...)` URLs correctly.

### Technical Details

**Files to create:**
- `supabase/functions/_shared/storageUpload.ts`

**Files to modify:**
- `supabase/functions/ayn-unified/index.ts` -- upload image to storage before returning
- `supabase/functions/generate-document/index.ts` -- upload file to storage, return public URL

**Database migration:**
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-files', 'generated-files', true);

-- RLS: authenticated users upload to their own folder
CREATE POLICY "Users upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: public read access
CREATE POLICY "Public read generated files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'generated-files');
```

**Storage upload pattern (edge function):**
```text
1. Get SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from env
2. Create service-role Supabase client
3. Upload via supabase.storage.from('generated-files').upload(path, data)
4. Get public URL via supabase.storage.from('generated-files').getPublicUrl(path)
5. Return the public URL
```

### What This Does NOT Include (Intentionally)
- localStorage/sessionStorage migration -- separate effort, different risk profile
- Frontend display changes -- not needed, markdown handles HTTPS URLs natively
- Old data cleanup -- can be done later as a one-off SQL script

### Testing
- Generate an image via AYN and verify it renders as an image (not codes)
- Generate an Excel file and verify the download link works
- Generate a PDF and verify the download link works
- Refresh the page and verify old generated images/documents still load from storage URLs

