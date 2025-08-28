import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let message: string | undefined;
    let userId: string | undefined;

    try {
      const body = await req.json();
      message = body?.message;
      userId = body?.userId;
    } catch (e) {
      console.warn('Request body was not valid JSON, proceeding with empty values.');
    }

    console.log('Calling AYN webhook with message:', message);

    // Call the webhook
    const upstream = await fetch('https://n8n.srv846714.hstgr.cloud/webhook-test/d8453419-8880-4bc4-b351-a0d0376b1fce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message ?? '',
        userId: userId ?? '',
        timestamp: new Date().toISOString()
      }),
    });

    const contentType = upstream.headers.get('content-type') || '';
    const rawText = await upstream.text();

    let parsed: any = null;
    if (contentType.includes('application/json') && rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        console.warn('Upstream responded with invalid JSON. Falling back to text.');
      }
    }

    const normalized = (parsed?.output || parsed?.response || parsed?.message || rawText || '').toString().trim();

    console.log('Upstream status:', upstream.status, 'content-type:', contentType);
    console.log('Upstream body (first 200 chars):', (rawText || '').slice(0, 200));

    if (upstream.ok) {
      return new Response(JSON.stringify({
        response: normalized || 'Received empty response from webhook.',
        status: 'success',
        upstream: { status: upstream.status, contentType }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Do not fail hard; surface the upstream error to the client while keeping 200 to avoid UI crash
      return new Response(JSON.stringify({
        response: `Upstream webhook error (${upstream.status}). ${normalized || 'No response body.'}`,
        status: 'upstream_error',
        upstream: { status: upstream.status, contentType }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error calling AYN webhook:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
