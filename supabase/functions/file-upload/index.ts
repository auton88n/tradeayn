import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // JWT Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify JWT and get user
    const jwt = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      await supabaseClient.rpc('log_security_event', {
        _action: 'unauthorized_file_upload_attempt',
        _details: { error: authError?.message || 'Invalid JWT' },
        _severity: 'high'
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting - 10 uploads per hour
    const { data: rateLimitOk } = await supabaseClient.rpc('check_rate_limit', {
      _action_type: 'file_upload',
      _max_attempts: 10,
      _window_minutes: 60
    });

    if (!rateLimitOk) {
      await supabaseClient.rpc('log_security_event', {
        _action: 'rate_limit_exceeded',
        _details: { action: 'file_upload', user_id: user.id },
        _severity: 'medium'
      });
      
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { file, fileName, fileType, userId }: FileUploadRequest = await req.json();
    
    // Verify userId matches authenticated user
    if (userId !== user.id) {
      await supabaseClient.rpc('log_security_event', {
        _action: 'user_id_mismatch',
        _details: { provided_user_id: userId, actual_user_id: user.id },
        _severity: 'high'
      });
      
      return new Response(
        JSON.stringify({ error: 'Forbidden: User ID mismatch' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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

    // Log successful upload
    await supabaseClient.rpc('log_security_event', {
      _action: 'file_upload_success',
      _details: { 
        file_name: fileName, 
        file_type: fileType, 
        file_size: fileBuffer.length,
        user_id: user.id 
      },
      _severity: 'low'
    });

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