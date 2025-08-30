import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  message?: string;
  userId?: string;
  allowPersonalization?: boolean;
  contactPerson?: string;
  detectedLanguage?: 'ar' | 'en';
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Processing webhook request`);

  try {
    // Parse request body
    let requestData: WebhookRequest = {};
    
    try {
      const body = await req.json();
      requestData = {
        message: body?.message || '',
        userId: body?.userId || '',
        allowPersonalization: body?.allowPersonalization || false,
        contactPerson: body?.contactPerson || '',
        detectedLanguage: body?.detectedLanguage || 'en'
      };
    } catch (e) {
      console.warn(`[${requestId}] Request body was not valid JSON, using defaults`);
    }

    console.log(`[${requestId}] Request data:`, {
      message: requestData.message?.slice(0, 100) + (requestData.message?.length > 100 ? '...' : ''),
      userId: requestData.userId,
      allowPersonalization: requestData.allowPersonalization,
      detectedLanguage: requestData.detectedLanguage
    });

  // Prepare conversation key and system message based on personalization settings
  const conversationKey = requestData.allowPersonalization
    ? requestData.userId
    : `${requestData.userId}:np`; // separate non-personalized memory to avoid name bleed

  const languageInstruction = requestData.detectedLanguage === 'ar' 
    ? 'Always respond in Arabic (العربية). Use proper Arabic grammar and natural expressions.'
    : 'Always respond in English. Use clear, professional English.';

  const systemMessage = requestData.allowPersonalization && requestData.contactPerson
    ? `You may address the user as ${requestData.contactPerson}. ${languageInstruction} Scope all context strictly to conversationKey (${conversationKey}).`
    : `Do not use or infer personal names. Ignore any prior memory of names. ${languageInstruction} Treat each request as stateless and scope strictly to conversationKey (${conversationKey}).`;

  // Call upstream webhook
  const upstreamUrl = 'https://n8n.srv846714.hstgr.cloud/webhook/d8453419-8880-4bc4-b351-a0d0376b1fce';
  
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

    console.log(`[${requestId}] Text processing:`, {
      original: rawText.slice(0, 100),
      processed: sanitizedText.slice(0, 100),
      lengthChange: `${rawText.length} -> ${sanitizedText.length}`,
      personalizationEnabled: requestData.allowPersonalization
    });

    // Prepare response
    const response: WebhookResponse = {
      response: sanitizedText || 'I received your message but got an empty response. Please try again.',
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