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
        contactPerson: body?.contactPerson || ''
      };
    } catch (e) {
      console.warn(`[${requestId}] Request body was not valid JSON, using defaults`);
    }

    console.log(`[${requestId}] Request data:`, {
      message: requestData.message?.slice(0, 100) + (requestData.message?.length > 100 ? '...' : ''),
      userId: requestData.userId,
      allowPersonalization: requestData.allowPersonalization
    });

    // Prepare system message based on personalization settings
    const systemMessage = requestData.allowPersonalization && requestData.contactPerson
      ? `You can address the user as ${requestData.contactPerson} if appropriate. Keep conversations scoped to this conversationKey (${requestData.userId}).`
      : 'Do not assume or use personal names unless explicitly provided in the current message. Treat each request as stateless and scoped to this conversationKey only.';

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
        conversationKey: requestData.userId, // isolate memory per user
        system: systemMessage,
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
    
    // Apply sanitization based on personalization setting
    const sanitizedText = requestData.allowPersonalization 
      ? processedText // Keep names if personalization is enabled
      : processedText
          .replace(/^(?:hello|hi|hey)\s+[^,!]{0,40}[,!]?\s*/i, '')
          .trim();
    
    // Log name stripping if it occurred
    if (!requestData.allowPersonalization && processedText !== sanitizedText) {
      console.log(`[${requestId}] Stripped greeting with potential name:`, {
        original: processedText.slice(0, 100),
        sanitized: sanitizedText.slice(0, 100)
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