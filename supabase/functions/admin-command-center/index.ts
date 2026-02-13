import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { getAgentEmoji, getAgentDisplayName } from "../_shared/aynBrand.ts";
import { loadCompanyState, loadActiveObjectives, loadEmployeeState, buildEmployeeContext } from "../_shared/employeeState.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXECUTIVE = ['system', 'chief_of_staff'];
const STRATEGIC = ['advisor', 'innovation', 'hr_manager'];
const OPERATIONAL = ['sales', 'investigator', 'follow_up', 'marketing', 'customer_success', 'qa_watchdog', 'security_guard', 'lawyer'];

const WAR_ROOM_ROLES: Record<string, string> = {
  system: "Co-Founder & orchestrator. You set direction and make final calls.",
  chief_of_staff: "Meta-orchestrator. You align the team and gate priorities.",
  advisor: "Strategic advisor. You synthesize data into long-term direction.",
  innovation: "Innovation lead. You push experiments and new ideas.",
  hr_manager: "HR & culture lead. You track performance and team health.",
  sales: "Sales hunter. You push for revenue, pipeline, and closing deals.",
  investigator: "Data investigator. You dig deep to find hidden patterns.",
  follow_up: "Follow-up agent. You ensure nothing falls through the cracks.",
  marketing: "Marketing strategist. You drive brand, content, and positioning.",
  customer_success: "Customer success. You fight churn and improve retention.",
  qa_watchdog: "QA watchdog. You monitor quality, uptime, and system health.",
  security_guard: "Security guard. You flag risks, threats, and vulnerabilities.",
  lawyer: "Legal counsel. You ensure compliance and manage legal risk.",
};

// Map @mention names to employee IDs and edge function names
const AGENT_ROUTES: Record<string, { employeeId: string; functionName: string; defaultMode: string }> = {
  sales: { employeeId: 'sales', functionName: 'ayn-sales-outreach', defaultMode: 'prospect' },
  investigator: { employeeId: 'investigator', functionName: 'ayn-investigator', defaultMode: 'investigate' },
  marketing: { employeeId: 'marketing', functionName: 'twitter-auto-market', defaultMode: 'scan' },
  security: { employeeId: 'security_guard', functionName: 'ayn-security-guard', defaultMode: 'scan' },
  lawyer: { employeeId: 'lawyer', functionName: 'ayn-lawyer', defaultMode: 'review' },
  advisor: { employeeId: 'advisor', functionName: 'ayn-advisor', defaultMode: 'analyze' },
  qa: { employeeId: 'qa_watchdog', functionName: 'ayn-qa-watchdog', defaultMode: 'check' },
  followup: { employeeId: 'follow_up', functionName: 'ayn-follow-up-agent', defaultMode: 'check' },
  customer: { employeeId: 'customer_success', functionName: 'ayn-customer-success', defaultMode: 'check' },
};

function selectRelevantAgents(topic: string): string[] {
  const msg = topic.toLowerCase();
  const selected = new Set<string>([...EXECUTIVE, ...STRATEGIC]);

  if (msg.includes('sale') || msg.includes('lead') || msg.includes('revenue')) selected.add('sales');
  if (msg.includes('market') || msg.includes('brand') || msg.includes('content')) selected.add('marketing');
  if (msg.includes('security') || msg.includes('attack') || msg.includes('threat')) selected.add('security_guard');
  if (msg.includes('legal') || msg.includes('compliance') || msg.includes('contract')) selected.add('lawyer');
  if (msg.includes('customer') || msg.includes('churn') || msg.includes('retention')) selected.add('customer_success');
  if (msg.includes('quality') || msg.includes('bug') || msg.includes('uptime')) selected.add('qa_watchdog');
  if (msg.includes('data') || msg.includes('analyz') || msg.includes('research')) selected.add('investigator');
  if (msg.includes('follow') || msg.includes('email') || msg.includes('outreach')) selected.add('follow_up');

  const remaining = OPERATIONAL.filter(a => !selected.has(a));
  while (selected.size < 10 && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    selected.add(remaining.splice(idx, 1)[0]);
  }
  return Array.from(selected);
}

// ─── Load founder directives ───
async function loadDirectives(supabase: any) {
  const { data } = await supabase
    .from('founder_directives')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });
  return data || [];
}

// ─── Load past discussion memory ───
async function loadDiscussionMemory(supabase: any, limit = 3) {
  // Get unique recent discussion IDs
  const { data: recentDiscussions } = await supabase
    .from('employee_discussions')
    .select('discussion_id, topic, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!recentDiscussions?.length) return [];

  const seen = new Set<string>();
  const uniqueTopics: { discussion_id: string; topic: string; created_at: string }[] = [];
  for (const d of recentDiscussions) {
    if (!seen.has(d.discussion_id)) {
      seen.add(d.discussion_id);
      uniqueTopics.push(d);
      if (uniqueTopics.length >= limit) break;
    }
  }
  return uniqueTopics;
}

// ─── MODE: Discuss (with memory + directives) ───
async function handleDiscuss(supabase: any, topic: string, apiKey: string, followUpId?: string) {
  const selectedAgents = selectRelevantAgents(topic);
  const discussionId = followUpId || crypto.randomUUID();

  const [companyState, objectives, directives, pastDiscussions] = await Promise.all([
    loadCompanyState(supabase),
    loadActiveObjectives(supabase),
    loadDirectives(supabase),
    loadDiscussionMemory(supabase),
  ]);

  // Build context with directives
  const directivesBlock = directives.length > 0
    ? `\nFOUNDER DIRECTIVES (YOU MUST FOLLOW):\n${directives.map((d: any) => `- [P${d.priority}] ${d.directive}`).join('\n')}`
    : '';

  const memoryBlock = pastDiscussions.length > 0
    ? `\nPast discussions (do NOT repeat these topics or suggestions):\n${pastDiscussions.map((d: any) => `- "${d.topic}" (${new Date(d.created_at).toLocaleDateString()})`).join('\n')}`
    : '';

  // If follow-up, load the original discussion thread
  let followUpContext = '';
  if (followUpId) {
    const { data: prevMessages } = await supabase
      .from('employee_discussions')
      .select('employee_id, position')
      .eq('discussion_id', followUpId)
      .order('created_at', { ascending: true });
    if (prevMessages?.length) {
      followUpContext = `\n[Previous discussion on this topic]:\n${prevMessages.map((m: any) => `${getAgentDisplayName(m.employee_id)}: "${m.position}"`).join('\n')}\n\nContinue the discussion with NEW insights. Do NOT repeat what was said.`;
    }
  }

  const contextBlock = `Company: momentum=${companyState?.momentum}, stress=${companyState?.stress_level}. Active objectives: ${objectives.slice(0, 3).map((o: any) => `${o.title} (P${o.priority})`).join(', ')}${directivesBlock}${memoryBlock}${followUpContext}`;

  const orderedAgents = ['system', ...selectedAgents.filter(a => a !== 'system')];
  const conversationThread: { name: string; reply: string }[] = [];
  const allInserted: any[] = [];

  for (const agentId of orderedAgents) {
    const state = await loadEmployeeState(supabase, agentId);
    const name = getAgentDisplayName(agentId);
    const role = WAR_ROOM_ROLES[agentId] || 'Team member.';

    let discussionSoFar = '';
    if (conversationThread.length > 0) {
      discussionSoFar = conversationThread.map(m => `${m.name}: "${m.reply}"`).join('\n');
    }

    const isFirst = conversationThread.length === 0;
    const systemMsg = `You are ${name}. ${role} STRICT RULE: Reply in ONE sentence only. Maximum 20 words. No fluff. Stay in character.${directivesBlock}`;

    const userMsg = isFirst
      ? `${contextBlock}\n\nThe founder wants the team to discuss: "${topic}"\n\nYou speak FIRST. Set the direction.`
      : `${contextBlock}\n\nTopic: "${topic}"\n\n[Discussion so far]\n${discussionSoFar}\n\nYour turn. React to what others said. Agree, disagree, or build on their points.`;

    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemMsg },
            { role: 'user', content: userMsg },
          ],
          max_tokens: 60,
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) continue;

      const { data: inserted, error: insertError } = await supabase
        .from('employee_discussions')
        .insert({
          discussion_id: discussionId,
          employee_id: agentId,
          topic,
          position: reply,
          confidence: state?.confidence ?? 0.7,
          impact_level: 'medium',
        })
        .select()
        .single();

      if (!insertError && inserted) {
        allInserted.push(inserted);
        conversationThread.push({ name, reply });
      }
    } catch { /* skip */ }
  }

  return { discussion_id: discussionId, messages: allInserted, agents: orderedAgents };
}

// ─── MODE: Command (route to specific agent) ───
async function handleCommand(supabase: any, agentKey: string, command: string, authToken: string) {
  const route = AGENT_ROUTES[agentKey];
  if (!route) {
    return { error: `Unknown agent: @${agentKey}. Available: ${Object.keys(AGENT_ROUTES).join(', ')}` };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${route.functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: route.defaultMode,
        command,
        source: 'command_center',
      }),
    });

    const data = await res.json();

    // Log the command execution
    await supabase.from('ayn_activity_log').insert({
      triggered_by: route.employeeId,
      action_type: 'command_center_execution',
      summary: `Direct command: "${command.substring(0, 100)}"`,
      details: { command, result: data, source: 'command_center' },
    });

    return {
      agent: route.employeeId,
      agent_name: getAgentDisplayName(route.employeeId),
      command,
      result: data,
      success: res.ok,
    };
  } catch (err) {
    return { error: `Failed to execute command for @${agentKey}: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

// ─── MODE: Directive (save founder instruction) ───
async function handleDirective(supabase: any, directive: string, category = 'general', priority = 1) {
  const { data, error } = await supabase
    .from('founder_directives')
    .insert({ directive, category, priority })
    .select()
    .single();

  if (error) return { error: error.message };

  // Log it
  await supabase.from('ayn_activity_log').insert({
    triggered_by: 'founder',
    action_type: 'directive_created',
    summary: `New directive: "${directive.substring(0, 80)}"`,
    details: { directive, category, priority },
  });

  return { success: true, directive: data };
}

// ─── MAIN HANDLER ───
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

    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { mode, topic, directive, category, priority, agent, command, follow_up_id } = body;

    const apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
    if (!apiKey && mode !== 'directive' && mode !== 'list_directives' && mode !== 'delete_directive') {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let result: any;

    switch (mode) {
      case 'discuss':
      case 'follow_up':
        if (!topic) {
          return new Response(JSON.stringify({ error: 'Topic required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        result = await handleDiscuss(supabase, topic, apiKey, follow_up_id);
        break;

      case 'command':
        if (!agent || !command) {
          return new Response(JSON.stringify({ error: 'Agent and command required. Use @agent_name command' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        result = await handleCommand(supabase, agent, command, token);
        break;

      case 'directive':
        if (!directive) {
          return new Response(JSON.stringify({ error: 'Directive text required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        result = await handleDirective(supabase, directive, category, priority);
        break;

      case 'list_directives':
        const { data: allDirectives } = await supabase
          .from('founder_directives')
          .select('*')
          .order('priority', { ascending: true });
        result = { directives: allDirectives || [] };
        break;

      case 'delete_directive':
        const { id: directiveId } = body;
        if (!directiveId) {
          return new Response(JSON.stringify({ error: 'Directive ID required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        await supabase.from('founder_directives').delete().eq('id', directiveId);
        result = { success: true, deleted: directiveId };
        break;

      default:
        // Legacy support: if just topic is provided, treat as discuss
        if (topic) {
          result = await handleDiscuss(supabase, topic, apiKey);
        } else {
          return new Response(JSON.stringify({ error: `Unknown mode: ${mode}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Command center error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
