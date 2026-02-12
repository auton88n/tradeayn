import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { getEmployeePersonality, getAgentEmoji, getAgentDisplayName } from "../_shared/aynBrand.ts";
import { loadCompanyState, loadActiveObjectives, loadEmployeeState } from "../_shared/employeeState.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function selectRelevantAgents(topic: string): string[] {
  const msg = topic.toLowerCase();
  const selected = new Set<string>(['system']);

  if (msg.includes('sale') || msg.includes('lead') || msg.includes('revenue') || msg.includes('client') || msg.includes('pipeline') || msg.includes('deal')) selected.add('sales');
  if (msg.includes('market') || msg.includes('brand') || msg.includes('content') || msg.includes('campaign') || msg.includes('social') || msg.includes('competitor')) selected.add('marketing');
  if (msg.includes('security') || msg.includes('attack') || msg.includes('threat') || msg.includes('breach') || msg.includes('hack')) selected.add('security_guard');
  if (msg.includes('strategy') || msg.includes('growth') || msg.includes('plan') || msg.includes('direction') || msg.includes('objective') || msg.includes('vision')) selected.add('advisor');
  if (msg.includes('team') || msg.includes('align') || msg.includes('priority') || msg.includes('objective') || msg.includes('doctrine') || msg.includes('focus')) selected.add('chief_of_staff');
  if (msg.includes('legal') || msg.includes('compliance') || msg.includes('gdpr') || msg.includes('contract') || msg.includes('risk')) selected.add('lawyer');
  if (msg.includes('innovat') || msg.includes('idea') || msg.includes('experiment') || msg.includes('new feature') || msg.includes('build')) selected.add('innovation');
  if (msg.includes('customer') || msg.includes('churn') || msg.includes('retention') || msg.includes('user') || msg.includes('onboard')) selected.add('customer_success');
  if (msg.includes('quality') || msg.includes('bug') || msg.includes('uptime') || msg.includes('monitor')) selected.add('qa_watchdog');

  if (selected.size < 3) {
    selected.add('chief_of_staff');
    selected.add('advisor');
  }

  return Array.from(selected).slice(0, 5);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check admin
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { topic } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const selectedAgents = selectRelevantAgents(topic);
    const discussionId = crypto.randomUUID();

    // Load shared context
    const [companyState, objectives] = await Promise.all([
      loadCompanyState(supabase),
      loadActiveObjectives(supabase),
    ]);

    const contextBlock = `Company: momentum=${companyState?.momentum}, stress=${companyState?.stress_level}
Active objectives: ${objectives.slice(0, 3).map((o: any) => `${o.title} (P${o.priority})`).join(', ')}`;

    // Generate all responses in parallel
    const responsePromises = selectedAgents.map(async (agentId) => {
      const state = await loadEmployeeState(supabase, agentId);
      const personality = getEmployeePersonality(agentId);
      const emoji = getAgentEmoji(agentId);
      const name = getAgentDisplayName(agentId);

      const prompt = `You are ${name} in AYN's AI workforce war room discussion.
${personality}

${contextBlock}

The founder wants the team to discuss: "${topic}"

Respond naturally as ${name}. Keep it SHORT (2-4 sentences). Be conversational and substantive. Stay in character.
${agentId === 'system' ? 'As AYN, synthesize or set direction.' : `Focus on your expertise as ${name}.`}
${state?.confidence ? `Your current confidence: ${state.confidence}` : ''}

Reply with ONLY your message text. No prefixes, no emoji, no name tag.`;

      try {
        const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (!reply) return null;

        return { agentId, reply, confidence: state?.confidence ?? 0.7 };
      } catch {
        return null;
      }
    });

    const responses = (await Promise.all(responsePromises)).filter(Boolean);

    // Insert into employee_discussions
    const insertRows = responses.map((r: any) => ({
      discussion_id: discussionId,
      employee_id: r.agentId,
      topic,
      position: r.reply,
      reasoning: null,
      confidence: r.confidence,
      impact_level: 'medium',
    }));

    // System (AYN) first, then others
    const systemRow = insertRows.find((r: any) => r.employee_id === 'system');
    const otherRows = insertRows.filter((r: any) => r.employee_id !== 'system');
    const orderedRows = systemRow ? [systemRow, ...otherRows] : otherRows;

    const { data: insertedData, error: insertError } = await supabase
      .from('employee_discussions')
      .insert(orderedRows)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to save discussion' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      discussion_id: discussionId,
      messages: insertedData || [],
      agents: selectedAgents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('War room error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
