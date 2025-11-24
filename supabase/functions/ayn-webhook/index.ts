import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Webhook URL mapping for different modes - Updated to match UI mode names
const WEBHOOK_URLS = {
  'General': Deno.env.get('WEBHOOK_URL_GENERAL') || '',
  'Nen Mode ⚡': Deno.env.get('WEBHOOK_URL_NEN_MODE') || '',
  'Research Pro': Deno.env.get('WEBHOOK_URL_RESEARCH_PRO') || '',
  'PDF Analyst': Deno.env.get('WEBHOOK_URL_PDF_ANALYST') || '',
  'Vision Lab': Deno.env.get('WEBHOOK_URL_VISION_LAB') || '',
  'Crypto': Deno.env.get('WEBHOOK_URL_CRYPTO') || '',
  'Civil Engineering': Deno.env.get('WEBHOOK_URL_CIVIL_ENGINEERING') || '',
};

// Validate webhook URL
function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

interface WebhookRequest {
  message?: string;
  userId?: string;
  mode?: string;
  fileData?: {
    url: string;
    filename: string;
    content?: string;
    type: string;
  } | null;
}

interface WebhookResponse {
  response: string;
  status: 'success' | 'error' | 'upstream_error';
  upstream?: {
    status: number;
    contentType: string;
  };
  error?: string;
}

// Simple text extraction from various response formats
function extractResponseText(rawText: string, contentType: string): string {
  if (!rawText) return '';
  
  // Handle JSON responses
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawText);
      // Common JSON response patterns
      return parsed.output || parsed.response || parsed.message || parsed.text || rawText;
    } catch {
      return rawText;
    }
  }
  
  // Handle NDJSON (newline-delimited JSON)
  if (rawText.includes('\n') && rawText.trim().startsWith('{')) {
    try {
      const lines = rawText.trim().split('\n').filter(line => line.trim());
      const lastLine = lines[lines.length - 1];
      const parsed = JSON.parse(lastLine);
      return parsed.output || parsed.response || parsed.message || parsed.text || rawText;
    } catch {
      return rawText;
    }
  }
  
  // Return raw text as-is
  return rawText.trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Processing webhook request`);

  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // 1. Check for emergency shutdown first
    const { data: isShutdown, error: shutdownError } = await supabase.rpc('check_emergency_shutdown');
    
    if (shutdownError) {
      console.error(`[${requestId}] Error checking emergency shutdown:`, shutdownError);
    }

    if (isShutdown) {
      console.warn(`[${requestId}] Emergency shutdown is active`);
      return new Response(JSON.stringify({
        response: "The system is currently under emergency maintenance. Please try again later.",
        status: 'error',
        error: 'Emergency shutdown active'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Authentication Check - Verify user is logged in
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[${requestId}] Missing or invalid authorization header`);
      return new Response(JSON.stringify({
        response: 'Authentication required. Please log in to use this service.',
        status: 'error',
        error: 'Missing authorization'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.log(`[${requestId}] Invalid token:`, authError?.message);
      return new Response(JSON.stringify({
        response: 'Invalid authentication. Please log in again.',
        status: 'error',
        error: 'Invalid token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Authenticated user:`, user.id);

    // 2. Rate Limiting Check
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc(
      'check_webhook_rate_limit',
      { 
        p_user_id: user.id,
        p_endpoint: 'ayn-webhook'
      }
    );

    if (rateLimitError) {
      console.error(`[${requestId}] Rate limit check error:`, rateLimitError);
      return new Response(JSON.stringify({
        response: 'Rate limit service temporarily unavailable. Please try again.',
        status: 'error',
        error: 'Rate limit check failed'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!rateLimitOk) {
      console.log(`[${requestId}] Rate limit exceeded for user:`, user.id);
      return new Response(JSON.stringify({
        response: 'Rate limit exceeded. You can make up to 50 requests per hour. Please wait and try again.',
        status: 'error',
        error: 'Rate limit exceeded'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Parse request body
    let requestData: any = {};
    
    try {
      const body = await req.json();
      
      // 🔍 EDGE FUNCTION DEBUG - Log raw request
      console.log(`[${requestId}] RAW REQUEST BODY:`, JSON.stringify(body, null, 2));
      console.log(`[${requestId}] body.fileData specifically:`, body.fileData);
      
      requestData = {
        message: body?.message || '',
        userId: user.id, // Use authenticated user ID
        allowPersonalization: body?.allowPersonalization || false,
        contactPerson: body?.contactPerson || '',
        detectedLanguage: body?.detectedLanguage || 'en',
        concise: body?.concise ?? true,
        mode: body?.mode || 'General',
        conversationHistory: body?.conversationHistory || [],
        userContext: body?.userContext || null,
        sessionId: body?.sessionId || '',
        fileData: body?.fileData || null
      };
    } catch (e) {
      console.warn(`[${requestId}] Request body was not valid JSON, using defaults`);
      requestData.userId = user.id; // Ensure user ID is set even if parsing fails
    }

    console.log(`[${requestId}] Request data:`, {
      message: requestData.message?.slice(0, 100) + (requestData.message?.length > 100 ? '...' : ''),
      userId: requestData.userId,
      allowPersonalization: requestData.allowPersonalization,
      detectedLanguage: requestData.detectedLanguage,
      concise: requestData.concise,
      mode: requestData.mode,
      conversationHistoryLength: requestData.conversationHistory?.length || 0,
      hasUserContext: !!requestData.userContext
    });

    // DIAGNOSTIC: Track file data received from frontend
    console.log(`[${requestId}] File attachment data received:`, {
      hasFileData: !!requestData.fileData,
      filename: requestData.fileData?.filename || 'none',
      fileType: requestData.fileData?.type || 'none',
      hasUrl: !!requestData.fileData?.url,
      hasContent: !!requestData.fileData?.content
    });

    // 4. Get webhook URL from environment variables
    const upstreamUrl = WEBHOOK_URLS[requestData.mode as keyof typeof WEBHOOK_URLS];
    if (!upstreamUrl || !isValidUrl(upstreamUrl)) {
      console.error(`[${requestId}] Invalid webhook URL for mode: ${requestData.mode}, URL: ${upstreamUrl || 'undefined'}`);
      return new Response(JSON.stringify({
        response: `Mode "${requestData.mode}" is not currently available. Please try a different mode.`,
        status: 'error',
        error: `Invalid or missing webhook URL for mode: ${requestData.mode}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Using webhook URL for mode '${requestData.mode}': ${upstreamUrl.slice(0, 50)}...`);

    // DIAGNOSTIC: Track payload being sent to n8n
    const upstreamPayload = {
      user_id: requestData.userId,
      message: requestData.message,
      mode: requestData.mode,
      conversation_history: requestData.conversationHistory,
      user_context: requestData.userContext,
      session_id: requestData.sessionId,
      allow_personalization: requestData.allowPersonalization,
      detected_language: requestData.detectedLanguage,
      concise: requestData.concise,
      has_attachment: !!requestData.fileData,
      file_data: requestData.fileData
    };

    console.log(`[${requestId}] Payload being sent to n8n:`, {
      has_attachment: upstreamPayload.has_attachment,
      file_data_present: !!upstreamPayload.file_data,
      filename: upstreamPayload.file_data?.filename || 'none',
      fileType: upstreamPayload.file_data?.type || 'none',
      mode: upstreamPayload.mode
    });

    // Call upstream webhook with enhanced context payload
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upstreamPayload),
    });

    const contentType = upstream.headers.get('content-type') || '';
    const rawText = await upstream.text();

    console.log(`[${requestId}] Upstream response:`, {
      status: upstream.status,
      contentType,
      bodyLength: rawText.length,
      bodyPreview: rawText.slice(0, 200) + (rawText.length > 200 ? '...' : '')
    });

    // Extract response text without processing
    const finalText = extractResponseText(rawText, contentType);

    console.log(`[${requestId}] Response extracted:`, {
      original: rawText.slice(0, 100),
      final: finalText.slice(0, 100),
      lengthChange: `${rawText.length} -> ${finalText.length}`
    });

    // Prepare response
    const response: WebhookResponse = {
      response: finalText || 'I received your message but got an empty response. Please try again.',
      status: upstream.ok ? 'success' : 'upstream_error',
      upstream: {
        status: upstream.status,
        contentType
      }
    };

    if (!upstream.ok) {
      response.error = `Upstream returned ${upstream.status}: ${finalText || 'No response body'}`;
    }

    console.log(`[${requestId}] Final response prepared, length: ${response.response.length}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestId}] Error processing webhook:`, error);
    
    const errorResponse: WebhookResponse = {
      response: 'I encountered an error while processing your request. Please try again.',
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});