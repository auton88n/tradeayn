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
    const { message, userId } = await req.json();
    
    console.log('Calling AYN webhook with message:', message);
    
    // Call the webhook
    const response = await fetch('https://n8n.srv846714.hstgr.cloud/webhook-test/d8453419-8880-4bc4-b351-a0d0376b1fce', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        userId: userId,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Webhook response:', data);

    return new Response(JSON.stringify({ 
      response: data.response || data.message || 'Response received from AYN AI',
      status: 'success' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calling AYN webhook:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});