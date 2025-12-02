import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'; script-src 'none'; object-src 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
}

interface FileUploadRequest {
  file: string; // base64 encoded file
  fileName: string;
  fileType: string;
  userId: string;
}

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/json'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // SERVER-SIDE RATE LIMIT CHECK (50 uploads per hour)
    const { data: rateLimitResult, error: rateLimitError } = await supabaseClient
      .rpc('check_api_rate_limit', {
        p_user_id: user.id,
        p_endpoint: 'file-upload',
        p_max_requests: 50,
        p_window_minutes: 60
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (rateLimitResult && rateLimitResult.length > 0 && !rateLimitResult[0].allowed) {
      const result = rateLimitResult[0];
      console.warn('Rate limit exceeded for file upload, user:', user.id);
      
      return new Response(
        JSON.stringify({ 
          error: 'Upload rate limit exceeded. Please try again later.',
          retryAfter: result.retry_after_seconds || 3600
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(result.retry_after_seconds || 3600)
          }
        }
      );
    }

    const { file, fileName, fileType, userId }: FileUploadRequest = await req.json();
    
    // Verify user can only upload their own files
    if (user.id !== userId) {
      throw new Error('Cannot upload files for other users');
    }
    
    console.log('Received file upload request:', { fileName, fileType, userId });

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      return new Response(
        JSON.stringify({ error: 'File type not allowed' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Convert base64 to buffer
    const fileBuffer = Uint8Array.from(atob(file), c => c.charCodeAt(0));
    
    console.log('File size:', fileBuffer.length);

    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 10MB limit' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${userId}/${timestamp}_${fileName}`;
    
    console.log('Uploading file to path:', uniqueFileName);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('attachments')
      .upload(uniqueFileName, fileBuffer, {
        contentType: fileType,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('File uploaded successfully:', uploadData);

    // Get signed URL for the uploaded file
    const { data: urlData } = await supabaseClient.storage
      .from('attachments')
      .createSignedUrl(uniqueFileName, 60 * 60 * 24 * 7); // 7 days

    const fileUrl = urlData?.signedUrl || '';

    return new Response(
      JSON.stringify({
        success: true,
        fileUrl,
        fileName,
        fileType,
        filePath: uniqueFileName
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in file upload:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});