import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

/**
 * Upload a base64 data URL image to Supabase Storage.
 * Returns the permanent public HTTPS URL.
 */
export async function uploadImageToStorage(
  base64DataUrl: string,
  userId: string
): Promise<string> {
  const supabase = getServiceClient();

  // Parse base64 data URL: data:image/png;base64,iVBOR...
  const match = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) {
    console.error('[storageUpload] Invalid base64 data URL format');
    throw new Error('Invalid base64 image data URL');
  }

  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const base64Data = match[2];

  // Decode base64 to binary using chunked approach
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const timestamp = Date.now();
  const path = `${userId}/images/image_${timestamp}.${extension}`;
  const contentType = `image/${match[1]}`;

  const { error } = await supabase.storage
    .from('generated-files')
    .upload(path, bytes, { contentType, upsert: false });

  if (error) {
    console.error('[storageUpload] Image upload failed:', error.message);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('generated-files')
    .getPublicUrl(path);

  console.log('[storageUpload] Image uploaded:', path);
  return urlData.publicUrl;
}

/**
 * Upload a binary document (PDF, Excel) to Supabase Storage.
 * Returns the permanent public HTTPS URL.
 */
export async function uploadDocumentToStorage(
  fileData: Uint8Array,
  userId: string,
  filename: string,
  contentType: string
): Promise<string> {
  const supabase = getServiceClient();

  const timestamp = Date.now();
  const path = `${userId}/documents/${timestamp}_${filename}`;

  const { error } = await supabase.storage
    .from('generated-files')
    .upload(path, fileData, { contentType, upsert: false });

  if (error) {
    console.error('[storageUpload] Document upload failed:', error.message);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('generated-files')
    .getPublicUrl(path);

  console.log('[storageUpload] Document uploaded:', path);
  return urlData.publicUrl;
}
