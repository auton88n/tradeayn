import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { createHash, createHmac } from "https://deno.land/std@0.190.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ayn-api-key, x-ayn-signature, x-ayn-timestamp',
};

interface WebhookRequest {
  message?: string;
  userId?: string;
  allowPersonalization?: boolean;
  contactPerson?: string;
  detectedLanguage?: 'ar' | 'en';
  concise?: boolean;
  mode?: string;
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

// Security utilities
const security = {
  // Validate API key
  validateApiKey(request: Request): boolean {
    const apiKey = request.headers.get('x-ayn-api-key');
    const expectedKey = Deno.env.get('AYN_WEBHOOK_API_KEY');
    
    if (!apiKey || !expectedKey) {
      return false;
    }
    
    return apiKey === expectedKey;
  },

  // Validate HMAC signature for request integrity
  validateSignature(request: Request, body: string): boolean {
    const signature = request.headers.get('x-ayn-signature');
    const timestamp = request.headers.get('x-ayn-timestamp');
    const apiKey = Deno.env.get('AYN_WEBHOOK_API_KEY');
    
    if (!signature || !timestamp || !apiKey) {
      return false;
    }

    // Create payload for signature verification
    const payload = `${timestamp}.${body}`;
    const expectedSignature = createHmac('sha256', apiKey)
      .update(payload)
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    // Use time-safe comparison
    return this.timeSafeCompare(expectedSignature, providedSignature);
  },

  // Time-safe string comparison to prevent timing attacks
  timeSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  },

  // Validate timestamp to prevent replay attacks (5 minute window)
  validateTimestamp(request: Request): boolean {
    const timestamp = request.headers.get('x-ayn-timestamp');
    
    if (!timestamp) {
      return false;
    }
    
    const requestTime = parseInt(timestamp) * 1000;
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);
    
    // Allow 5 minute window
    return timeDiff <= (5 * 60 * 1000);
  },

  // Sanitize input to prevent injection attacks
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/eval\(/gi, '')
        .trim()
        .slice(0, 10000); // Limit length
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        if (key.length <= 100) { // Limit key length
          sanitized[key] = this.sanitizeInput(value);
        }
      }
      return sanitized;
    }
    
    return input;
  },

  // Extract client IP for logging
  getClientIP(request: Request): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           'unknown';
  }
};

// Enhanced text processing utilities
const textProcessor = {
  // Extract content from various object structures
  extractContent(obj: any): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    
    const contentFields = ['output', 'response', 'message', 'content', 'text', 'data'];
    for (const field of contentFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return obj[field];
      }
    }
    return undefined;
  },

  // Parse NDJSON (newline-delimited JSON)
  parseNDJSON(text: string): any[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const items: any[] = [];
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        items.push(parsed);
      } catch {
        // Skip invalid JSON lines
      }
    }
    return items;
  },

  // Clean and normalize text
  normalizeText(text: string): string {
    if (!text) return '';
    
    return text
      // Replace multiple newlines with single spaces
      .replace(/\n+/g, ' ')
      // Replace multiple spaces/tabs with single space
      .replace(/[\s\t]+/g, ' ')
      // Remove leading/trailing whitespace
      .trim()
      // Ensure proper sentence spacing
      .replace(/([.!?])\s+/g, '$1 ')
      // Fix common formatting issues
      .replace(/\s+([,.!?;:])/g, '$1');
  },

  // Process raw response into clean text
  processResponse(rawText: string, contentType: string): string {
    let normalized = '';

    // Try single JSON first
    if (contentType.includes('application/json') || rawText.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(rawText);
        const content = this.extractContent(parsed);
        if (content) {
          normalized = content;
        }
      } catch {
        // Not single JSON, continue to NDJSON parsing
      }
    }

    // If no single JSON content found, try NDJSON
    if (!normalized && rawText.includes('\n')) {
      const ndjsonItems = this.parseNDJSON(rawText);
      if (ndjsonItems.length > 0) {
        const contents = ndjsonItems
          .map(item => this.extractContent(item))
          .filter(Boolean) as string[];
        
        if (contents.length > 0) {
          normalized = contents.join(' ');
        }
      }
    }

    // Fallback to raw text
    if (!normalized) {
      normalized = rawText;
    }

    return this.normalizeText(normalized);
  }
};

// Enforce concise responses: limit to 3 sentences or ~320 characters and plain text style
function enforceConciseness(text: string): string {
  if (!text) return '';
  // Remove bullet/numbered list formatting to keep plain text
  let t = text.replace(/^[\s*-•]+\s*/gm, '').replace(/^\d+\.\s+/gm, '');
  // Split into sentences (support Arabic question mark)
  const parts = t.split(/(?<=[.!?؟])\s+/).filter(Boolean);
  t = parts.slice(0, 3).join(' ');
  // Hard cap length
  if (t.length > 320) t = t.slice(0, 320).replace(/\s+\S*$/, '') + '...';
  // Remove leading greetings
  t = t.replace(/^(hello|hi|hey)[,!\s]*/i, '');
  return t.trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  const clientIP = security.getClientIP(req);
  console.log(`[${requestId}] Processing webhook request from IP: ${clientIP}`);

  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Security validation
    
    // 1. Validate API key
    if (!security.validateApiKey(req)) {
      await supabase.rpc('log_webhook_security_event', {
        p_endpoint: 'ayn-webhook',
        p_action: 'api_key_validation_failed',
        p_details: { ip: clientIP, requestId },
        p_severity: 'high'
      });
      
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate timestamp (prevent replay attacks)
    if (!security.validateTimestamp(req)) {
      await supabase.rpc('log_webhook_security_event', {
        p_endpoint: 'ayn-webhook',
        p_action: 'timestamp_validation_failed',
        p_details: { ip: clientIP, requestId, timestamp: req.headers.get('x-ayn-timestamp') },
        p_severity: 'high'
      });
      
      return new Response(JSON.stringify({ error: 'Invalid or expired timestamp' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Get request body for signature validation
    const bodyText = await req.text();
    
    // 4. Validate HMAC signature
    if (!security.validateSignature(req, bodyText)) {
      await supabase.rpc('log_webhook_security_event', {
        p_endpoint: 'ayn-webhook',
        p_action: 'signature_validation_failed',
        p_details: { ip: clientIP, requestId },
        p_severity: 'critical'
      });
      
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and sanitize request body
    let requestData: WebhookRequest = {};
    
    try {
      const body = JSON.parse(bodyText);
      const sanitizedBody = security.sanitizeInput(body);
      
      requestData = {
        message: sanitizedBody?.message || '',
        userId: sanitizedBody?.userId || '',
        allowPersonalization: sanitizedBody?.allowPersonalization || false,
        contactPerson: sanitizedBody?.contactPerson || '',
        detectedLanguage: sanitizedBody?.detectedLanguage || 'en',
        concise: sanitizedBody?.concise ?? true,
        mode: sanitizedBody?.mode || 'General'
      };
    } catch (e) {
      console.warn(`[${requestId}] Request body was not valid JSON, using defaults`);
    }

    // 5. Rate limiting check
    const rateLimitCheck = await supabase.rpc('check_webhook_rate_limit', {
      p_user_id: requestData.userId || null,
      p_endpoint: 'ayn-webhook'
    });

    if (rateLimitCheck.error || !rateLimitCheck.data) {
      await supabase.rpc('log_webhook_security_event', {
        p_endpoint: 'ayn-webhook',
        p_action: 'rate_limit_exceeded',
        p_user_id: requestData.userId || null,
        p_details: { ip: clientIP, requestId },
        p_severity: 'high'
      });
      
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log successful authentication
    await supabase.rpc('log_webhook_security_event', {
      p_endpoint: 'ayn-webhook',
      p_action: 'authenticated_request',
      p_user_id: requestData.userId || null,
      p_details: { ip: clientIP, requestId, mode: requestData.mode },
      p_severity: 'info'
    });

    console.log(`[${requestId}] Request data:`, {
      message: requestData.message?.slice(0, 100) + (requestData.message?.length > 100 ? '...' : ''),
      userId: requestData.userId,
      allowPersonalization: requestData.allowPersonalization,
      detectedLanguage: requestData.detectedLanguage,
      concise: requestData.concise,
      mode: requestData.mode
    });

    // Get webhook URL for the selected mode
    const { data: modeConfig, error: modeError } = await supabase
      .from('ai_mode_configs')
      .select('webhook_url')
      .eq('mode_name', requestData.mode)
      .eq('is_active', true)
      .maybeSingle();

    if (modeError) {
      console.error(`[${requestId}] Database error fetching mode config:`, modeError);
      throw new Error(`Failed to fetch webhook configuration for mode: ${requestData.mode}`);
    }

    if (!modeConfig) {
      console.error(`[${requestId}] No active webhook found for mode: ${requestData.mode}`);
      throw new Error(`No active webhook configuration found for mode: ${requestData.mode}`);
    }

    const upstreamUrl = modeConfig.webhook_url;
    console.log(`[${requestId}] Using webhook URL for mode '${requestData.mode}': ${upstreamUrl}`);

    // Prepare conversation key and system message based on personalization settings
    const conversationKey = requestData.allowPersonalization
      ? requestData.userId
      : `${requestData.userId}:np`; // separate non-personalized memory to avoid name bleed

    const languageInstruction = requestData.detectedLanguage === 'ar' 
      ? 'Always respond in Arabic (العربية). Use proper Arabic grammar and natural expressions.'
      : 'Always respond in English. Use clear, professional English.';

    const conciseInstruction = requestData.concise
      ? 'Be concise: 1-3 short sentences. Answer directly. No greetings, no coaching tone, no fluff, no bullet points unless explicitly requested.'
      : '';

    const systemMessage = requestData.allowPersonalization && requestData.contactPerson
      ? `You may address the user as ${requestData.contactPerson}. ${languageInstruction} ${conciseInstruction} Scope all context strictly to conversationKey (${conversationKey}).`
      : `Do not use or infer personal names. Ignore any prior memory of names. ${languageInstruction} ${conciseInstruction} Treat each request as stateless and scope strictly to conversationKey (${conversationKey}).`;

    // Call upstream webhook
    const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: requestData.message,
          userId: requestData.userId,
          contactPerson: requestData.contactPerson,
          conversationKey, // isolate memory per user and mode
          system: systemMessage,
          detectedLanguage: requestData.detectedLanguage,
          concise: requestData.concise,
          mode: requestData.mode,
          timestamp: new Date().toISOString(),
          requestId
        }),
      });

      const contentType = upstream.headers.get('content-type') || '';
      const rawText = await upstream.text();

      console.log(`[${requestId}] Upstream response:`, {
        status: upstream.status,
        contentType,
        bodyLength: rawText.length,
        bodyPreview: rawText.slice(0, 200) + (rawText.length > 200 ? '...' : '')
      });

      // Process the response
      const processedText = textProcessor.processResponse(rawText, contentType);

      // Enhanced sanitization when personalization is disabled
      const sanitizeNonPersonalized = (text: string) => {
        let t = text;

        // Remove leading greetings with potential names
        t = t.replace(/^(?:hello|hi|hey)\s+[^,!]{0,40}[,!]?\s*/i, '');

        // Remove explicit statements about the user's name
        t = t.replace(/\b(your name is|you are called|I'll call you|I will call you)\s+[A-Z][a-z]{1,30}[.!?]?/gi, '');

        // Remove addressing patterns like 'Name,' at sentence start
        t = t.replace(/^([A-Z][a-z]{1,30}),\s+/gm, '');

        // If we know a contactPerson, strip it anywhere
        if (requestData.contactPerson) {
          const escaped = requestData.contactPerson.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const nameRegex = new RegExp(`\\b${escaped}\\b`, 'g');
          t = t.replace(nameRegex, '');
        }

        return textProcessor.normalizeText(t);
      };

      // When personalization is enabled, normalize greetings to the user's contact person
      const applyPersonalization = (text: string) => {
        if (!requestData.contactPerson) return text;

        const name = requestData.contactPerson.trim();
        if (!name) return text;

        // Title-case the name for greetings
        const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

        let t = text;

        // Replace greeting at start of text like "Hi Sara," -> "Hi Ghazi,"
        t = t.replace(/^(hello|hi|hey)\s+[A-Z][a-z]{1,30}([,!])?/i, (_m, g1, g2) => {
          const greet = String(g1);
          const punct = g2 ?? ',';
          const greetCap = greet.charAt(0).toUpperCase() + greet.slice(1).toLowerCase();
          return `${greetCap} ${titleCase(name)}${punct} `;
        });

        // Replace greetings at the start of sentences
        t = t.replace(/([.!?]\s+)(hello|hi|hey)\s+[A-Z][a-z]{1,30}([,!])?/g, (_m, p1, g1, g3) => {
          const greetCap = String(g1).charAt(0).toUpperCase() + String(g1).slice(1).toLowerCase();
          const punct = g3 ?? ',';
          return `${p1}${greetCap} ${titleCase(name)}${punct} `;
        });

        return textProcessor.normalizeText(t);
      };

      const sanitizedText = requestData.allowPersonalization ? applyPersonalization(processedText) : sanitizeNonPersonalized(processedText);

      // Log name stripping if it occurred
      if (!requestData.allowPersonalization && processedText !== sanitizedText) {
        console.log(`[${requestId}] Stripped potential personalization:`, {
          original: processedText.slice(0, 120),
          sanitized: sanitizedText.slice(0, 120)
        });
      }

      const finalText = requestData.concise ? enforceConciseness(sanitizedText) : sanitizedText;

      console.log(`[${requestId}] Text processing:`, {
        original: rawText.slice(0, 100),
        processed: finalText.slice(0, 100),
        lengthChange: `${rawText.length} -> ${finalText.length}`,
        personalizationEnabled: requestData.allowPersonalization
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
        response.error = `Upstream returned ${upstream.status}: ${sanitizedText || 'No response body'}`;
      }

      console.log(`[${requestId}] Final response prepared, length: ${response.response.length}`);

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

  } catch (error) {
    console.error(`[${requestId}] Error processing webhook:`, error);
    
    // Log the error
    await supabase.rpc('log_webhook_security_event', {
      p_endpoint: 'ayn-webhook',
      p_action: 'processing_error',
      p_details: { ip: clientIP, requestId, error: error instanceof Error ? error.message : String(error) },
      p_severity: 'high'
    });
    
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
