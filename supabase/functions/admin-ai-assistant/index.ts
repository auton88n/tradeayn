import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin AI system prompt
const ADMIN_SYSTEM_PROMPT = `you're an ai assistant helping admins manage the ayn platform. you have access to:
- user data and activity logs
- llm usage and cost data
- rate limit information
- system health metrics
- security logs

be helpful and proactive:
- explain issues clearly
- suggest actionable solutions
- offer to perform actions when appropriate
- keep responses concise but informative

when suggesting actions, format them as:
[ACTION:action_type:params] - description

available actions:
- [ACTION:unblock_user:user_id] - unblock a rate-limited user
- [ACTION:set_limit:user_id:limit_type:value] - set user's daily limit
- [ACTION:toggle_model:model_id:enabled] - enable/disable an llm model
- [ACTION:send_alert:type:message] - send admin notification

always be helpful and explain your reasoning.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { message, context = {} } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Gather context data based on the question
    let contextData: Record<string, unknown> = {};

    // Get recent LLM usage stats
    const { data: usageStats } = await supabase
      .from('llm_usage_logs')
      .select('intent_type, was_fallback, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (usageStats) {
      const intentCounts: Record<string, number> = {};
      let fallbackCount = 0;
      usageStats.forEach((log: { intent_type: string; was_fallback: boolean }) => {
        intentCounts[log.intent_type] = (intentCounts[log.intent_type] || 0) + 1;
        if (log.was_fallback) fallbackCount++;
      });
      contextData.llmUsage24h = {
        total: usageStats.length,
        byIntent: intentCounts,
        fallbackCount,
        fallbackRate: usageStats.length > 0 ? (fallbackCount / usageStats.length * 100).toFixed(1) + '%' : '0%'
      };
    }

    // Get recent failures
    const { data: failures } = await supabase
      .from('llm_failures')
      .select('error_type, error_message, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (failures) {
      const failureCounts: Record<string, number> = {};
      failures.forEach((f: { error_type: string }) => {
        failureCounts[f.error_type] = (failureCounts[f.error_type] || 0) + 1;
      });
      contextData.failures24h = {
        total: failures.length,
        byType: failureCounts,
        recent: failures.slice(0, 5)
      };
    }

    // Get rate limit stats
    const { data: rateLimits } = await supabase
      .from('api_rate_limits')
      .select('user_id, endpoint, request_count, blocked_until, violation_count')
      .order('violation_count', { ascending: false })
      .limit(10);

    if (rateLimits) {
      contextData.rateLimits = {
        blockedUsers: rateLimits.filter((r: { blocked_until: string | null }) => r.blocked_until && new Date(r.blocked_until) > new Date()).length,
        topViolators: rateLimits.slice(0, 5)
      };
    }

    // Get user count stats
    const { count: totalUsers } = await supabase
      .from('access_grants')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('access_grants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    contextData.users = {
      total: totalUsers || 0,
      active: activeUsers || 0
    };

    // Build messages for AI
    const messages = [
      { role: 'system', content: ADMIN_SYSTEM_PROMPT },
      { 
        role: 'user', 
        content: `Context data:
${JSON.stringify(contextData, null, 2)}

Admin question: ${message}` 
      }
    ];

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', errorText);
      return new Response(JSON.stringify({ error: 'AI request failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    // Parse actions from response
    const actionRegex = /\[ACTION:([^:]+):([^\]]+)\]/g;
    const actions: Array<{ type: string; params: string; description?: string }> = [];
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      actions.push({
        type: match[1],
        params: match[2]
      });
    }

    // Log admin AI conversation
    try {
      await supabase.from('admin_ai_conversations').insert({
        admin_id: user.id,
        role: 'user',
        message,
        context: contextData
      });
      await supabase.from('admin_ai_conversations').insert({
        admin_id: user.id,
        role: 'assistant',
        message: content,
        actions_taken: actions.length > 0 ? actions : null
      });
    } catch (logError) {
      console.error('Failed to log conversation:', logError);
    }

    return new Response(JSON.stringify({
      content,
      actions,
      contextData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin AI error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
