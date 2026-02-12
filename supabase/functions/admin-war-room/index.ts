import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { getEmployeePersonality, getAgentEmoji, getAgentDisplayName } from "../_shared/aynBrand.ts";
import { loadCompanyState, loadActiveObjectives, loadEmployeeState } from "../_shared/employeeState.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FULL_ROSTER = ['system', 'chief_of_staff', 'advisor', 'sales', 'marketing', 'security_guard', 'lawyer', 'innovation', 'customer_success', 'qa_watchdog'];

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

  // Fill up to 6 agents from the roster randomly
  const remaining = FULL_ROSTER.filter(a => !selected.has(a));
  while (selected.size < 6 && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    selected.add(remaining.splice(idx, 1)[0]);
  }

  return Array.from(selected);
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

    // Ensure AYN (system) goes first
    const orderedAgents = ['system', ...selectedAgents.filter(a => a !== 'system')];

    // Sequential generation: each agent sees what previous agents said
    const conversationThread: { name: string; reply: string }[] = [];
    const allInserted: any[] = [];

    for (const agentId of orderedAgents) {
      const state = await loadEmployeeState(supabase, agentId);
      const personality = getEmployeePersonality(agentId);
      const name = getAgentDisplayName(agentId);

      // Build conversation history for this agent
      let discussionSoFar = '';
      if (conversationThread.length > 0) {
        discussionSoFar = `\n[Discussion so far]\n${conversationThread.map(m => `${m.name}: "${m.reply}"`).join('\n')}\n`;
      }

      const isFirst = conversationThread.length === 0;
      const prompt = `You are ${name} in AYN's AI workforce war room discussion.
${personality}

${contextBlock}

The founder wants the team to discuss: "${topic}"
${discussionSoFar}
${isFirst
  ? `You speak FIRST. Set the direction in 2 sentences max as ${name}.`
  : `Now it's YOUR turn. React to what others said above. Agree, disagree, challenge, or build on their points. Reference them by name.`
}

Reply in 1-2 sentences MAX. Maximum 30 words. Be punchy and direct. No fluff. Stay in character.
${state?.confidence ? `Your current confidence: ${state.confidence}` : ''}

Reply with ONLY your message text. No prefixes, no emoji, no name tag.`;

      try {
        const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 80,
          }),
        });

        if (!res.ok) continue;
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (!reply) continue;

        // Insert immediately so real-time subscription picks it up
        const { data: inserted, error: insertError } = await supabase
          .from('employee_discussions')
          .insert({
            discussion_id: discussionId,
            employee_id: agentId,
            topic,
            position: reply,
            reasoning: null,
            confidence: state?.confidence ?? 0.7,
            impact_level: 'medium',
          })
          .select()
          .single();

        if (!insertError && inserted) {
          allInserted.push(inserted);
          conversationThread.push({ name, reply });
        }
      } catch {
        // skip failed agent
      }
    }

    return new Response(JSON.stringify({
      discussion_id: discussionId,
      messages: allInserted,
      agents: orderedAgents,
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
