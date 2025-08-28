import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing file upload request');
    
    // Get the authorization header for user identification
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error('No authorization token provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user from the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Invalid token or user not found:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`File upload request from user: ${user.id}`);

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const messageContent = formData.get('message') as string || '';

    if (!file) {
      console.error('No file provided in the request');
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Validate file type and size
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      console.error(`Unsupported file type: ${file.type}`);
      return new Response(JSON.stringify({ 
        error: 'Unsupported file type. Please upload PDF, Word documents, or images.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check file size (10MB limit)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      console.error(`File too large: ${file.size} bytes`);
      return new Response(JSON.stringify({ 
        error: 'File too large. Maximum size is 10MB.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${user.id}/${timestamp}_${sanitizedFileName}`;

    console.log(`Uploading file to storage path: ${fileName}`);

    // Upload file to Supabase Storage
    const fileArrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, fileArrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(JSON.stringify({ 
        error: 'Failed to upload file to storage' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File uploaded successfully to storage:', uploadData.path);

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;
    console.log('File public URL:', fileUrl);

    // Save message with attachment to database
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        content: messageContent || `Uploaded file: ${file.name}`,
        attachment_url: fileUrl,
        attachment_name: file.name,
        attachment_type: file.type
      })
      .select()
      .single();

    if (messageError) {
      console.error('Database insert error:', messageError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('attachments').remove([fileName]);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to save message to database' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Message saved to database:', messageData.id);

    // Process file content for AI analysis (background task)
    let extractedText = '';
    let processedContent = '';

    if (file.type.startsWith('image/')) {
      processedContent = `I've received an image file: ${file.name}. I can see the image and analyze it for you.`;
    } else if (file.type === 'application/pdf') {
      processedContent = `I've received a PDF document: ${file.name}. I can analyze the document content for you.`;
    } else if (file.type.includes('word') || file.type.includes('document')) {
      processedContent = `I've received a Word document: ${file.name}. I can analyze the document content for you.`;
    } else if (file.type === 'text/plain') {
      // For text files, we can extract the content
      const textContent = await file.text();
      extractedText = textContent.substring(0, 2000); // Limit to 2000 characters
      processedContent = `I've received a text file: ${file.name}. Here's what I can see:\n\n${extractedText}${textContent.length > 2000 ? '...' : ''}`;
    } else {
      processedContent = `I've received a file: ${file.name}. I can help analyze or work with this file.`;
    }

    console.log('File processing completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: {
        id: messageData.id,
        content: messageData.content,
        attachment_url: fileUrl,
        attachment_name: file.name,
        attachment_type: file.type,
        created_at: messageData.created_at
      },
      ai_response: processedContent,
      extracted_text: extractedText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in file-upload function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});