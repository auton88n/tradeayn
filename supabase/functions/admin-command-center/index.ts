import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { getAgentEmoji, getAgentDisplayName, getEmployeePersonality } from "../_shared/aynBrand.ts";
import { loadEmployeeState } from "../_shared/employeeState.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Also allow matching by full employee IDs and friendly names
const AGENT_ALIASES: Record<string, string> = {
  'sales_hunter': 'sales',
  'security_guard': 'security',
  'qa_watchdog': 'qa',
  'follow_up': 'followup',
  'customer_success': 'customer',
  'innovation': 'advisor',
  'hr': 'advisor',
};

function resolveAgent(name: string): string | null {
  const lower = name.toLowerCase().replace(/[^a-z_]/g, '');
  if (AGENT_ROUTES[lower]) return lower;
  if (AGENT_ALIASES[lower]) return AGENT_ALIASES[lower];
  // Fuzzy: check if any key starts with input
  for (const key of Object.keys(AGENT_ROUTES)) {
    if (key.startsWith(lower)) return key;
  }
  return null;
}

// ─── Load context helpers ───
async function loadCompanyState(supabase: any) {
  const { data } = await supabase.from('company_state').select('*').limit(1).single();
  return data;
}

async function loadActiveObjectives(supabase: any) {
  const { data } = await supabase.from('company_objectives').select('*').eq('status', 'active').order('priority', { ascending: true });
  return data || [];
}

async function loadDirectives(supabase: any) {
  const { data } = await supabase.from('founder_directives').select('*').eq('is_active', true).order('priority', { ascending: true });
  return data || [];
}

// ─── Tool definitions for AYN orchestrator ───
const TOOLS = [
  {
    type: "function",
    function: {
      name: "route_to_agent",
      description: "Route a task/command to a specific agent for execution. Use when the founder wants an agent to DO something (prospect, scan, investigate, etc.)",
      parameters: {
        type: "object",
        properties: {
          agent: { type: "string", description: "Agent key: sales, investigator, marketing, security, lawyer, advisor, qa, followup, customer" },
          command: { type: "string", description: "The specific task to execute" },
        },
        required: ["agent", "command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_directive",
      description: "Save a standing order/directive that all agents must follow. Use when the founder says 'from now on...', 'always...', 'never...', 'focus on...', 'only target...'",
      parameters: {
        type: "object",
        properties: {
          directive: { type: "string", description: "The standing order text" },
          category: { type: "string", enum: ["general", "geo", "strategy", "outreach", "budget"], description: "Category of the directive" },
          priority: { type: "number", description: "Priority 1-5, where 1 is highest" },
        },
        required: ["directive", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_discussion",
      description: "Start a multi-agent discussion. ONLY use when the founder explicitly asks for opinions from multiple agents or 'everyone', e.g. 'what does the team think?', 'get everyone's opinion'",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "The discussion topic" },
        },
        required: ["topic"],
      },
    },
  },
];

// ─── Execute agent command ───
async function executeAgentCommand(supabase: any, agentKey: string, command: string) {
  const route = AGENT_ROUTES[agentKey];
  if (!route) return { error: `Unknown agent: ${agentKey}` };

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${route.functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: route.defaultMode, command, source: 'command_center' }),
    });
    const data = await res.json();

    await supabase.from('ayn_activity_log').insert({
      triggered_by: route.employeeId,
      action_type: 'command_center_execution',
      summary: `Command: "${command.substring(0, 100)}"`,
      details: { command, result: data, source: 'command_center' },
    });

    return { agent: route.employeeId, agent_name: getAgentDisplayName(route.employeeId), agent_emoji: getAgentEmoji(route.employeeId), result: data, success: res.ok };
  } catch (err) {
    return { error: `Failed: ${err instanceof Error ? err.message : 'Unknown'}` };
  }
}

// ─── Save directive ───
async function saveDirective(supabase: any, directive: string, category = 'general', priority = 1) {
  const { data, error } = await supabase.from('founder_directives').insert({ directive, category, priority }).select().single();
  if (error) return { error: error.message };
  await supabase.from('ayn_activity_log').insert({
    triggered_by: 'founder',
    action_type: 'directive_created',
    summary: `Directive: "${directive.substring(0, 80)}"`,
    details: { directive, category, priority },
  });
  return { success: true, directive: data };
}

// ─── Mini discussion (3-4 agents, not all) ───
async function runMiniDiscussion(supabase: any, topic: string, apiKey: string) {
  const EXECUTIVE = ['system', 'chief_of_staff'];
  const OPERATIONAL = ['sales', 'investigator', 'follow_up', 'marketing', 'customer_success', 'qa_watchdog', 'security_guard', 'lawyer'];
  
  // Select relevant agents based on topic keywords
  const msg = topic.toLowerCase();
  const selected = new Set<string>([...EXECUTIVE]);
  
  if (msg.includes('sale') || msg.includes('lead') || msg.includes('revenue')) selected.add('sales');
  if (msg.includes('market') || msg.includes('brand') || msg.includes('content')) selected.add('marketing');
  if (msg.includes('security') || msg.includes('attack')) selected.add('security_guard');
  if (msg.includes('legal') || msg.includes('compliance')) selected.add('lawyer');
  if (msg.includes('customer') || msg.includes('churn')) selected.add('customer_success');
  if (msg.includes('quality') || msg.includes('bug')) selected.add('qa_watchdog');
  if (msg.includes('data') || msg.includes('research')) selected.add('investigator');
  
  // Fill to max 6 agents
  const remaining = OPERATIONAL.filter(a => !selected.has(a));
  while (selected.size < 6 && remaining.length > 0) {
    selected.add(remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0]);
  }

  const agents = Array.from(selected);
  const discussionId = crypto.randomUUID();
  const directives = await loadDirectives(supabase);
  const directivesBlock = directives.length > 0
    ? `\nFOUNDER DIRECTIVES: ${directives.map((d: any) => `[P${d.priority}] ${d.directive}`).join('; ')}`
    : '';

  const thread: { name: string; reply: string; emoji: string; employeeId: string }[] = [];

  for (const agentId of agents) {
    const name = getAgentDisplayName(agentId);
    const emoji = getAgentEmoji(agentId);
    const state = await loadEmployeeState(supabase, agentId);

    const discussionSoFar = thread.length > 0
      ? thread.map(m => `${m.name}: "${m.reply}"`).join('\n')
      : '';

    const systemMsg = `You are ${name}. Reply in ONE sentence only. Max 20 words. No fluff. Stay in character.${directivesBlock}`;
    const userMsg = thread.length === 0
      ? `Topic: "${topic}"\nYou speak first. Set the direction.`
      : `Topic: "${topic}"\n[So far]\n${discussionSoFar}\nYour turn. React to what others said.`;

    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
          max_tokens: 60,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) continue;

      await supabase.from('employee_discussions').insert({
        discussion_id: discussionId, employee_id: agentId, topic, position: reply,
        confidence: state?.confidence ?? 0.7, impact_level: 'medium',
      });

      thread.push({ name, reply, emoji, employeeId: agentId });
    } catch { /* skip */ }
  }

  return { discussion_id: discussionId, responses: thread };
}

// ─── CHAT MODE: AYN orchestrator with tool calling ───
async function handleChat(supabase: any, message: string, history: any[], apiKey: string) {
  const [companyState, objectives, directives] = await Promise.all([
    loadCompanyState(supabase),
    loadActiveObjectives(supabase),
    loadDirectives(supabase),
  ]);

  const directivesBlock = directives.length > 0
    ? `\nActive founder directives:\n${directives.map((d: any) => `- [P${d.priority}/${d.category}] ${d.directive}`).join('\n')}`
    : '\nNo active directives.';

  const agentList = Object.entries(AGENT_ROUTES).map(([key, r]) => `${key} → ${getAgentDisplayName(r.employeeId)}`).join(', ');

  const systemPrompt = `You are AYN, the AI Co-Founder and Chief of Staff. The founder is talking to you in the Command Center.

YOUR JOB:
- When the founder gives a COMMAND (e.g. "sales, prospect 10 firms"), use route_to_agent immediately. Don't ask for confirmation.
- When the founder sets a RULE (e.g. "focus only on Canada"), use save_directive immediately.
- When the founder asks for TEAM OPINIONS (e.g. "what does everyone think?"), use start_discussion.
- For everything else (questions, updates, brainstorming), answer directly yourself. You're smart enough.

CRITICAL RULES:
- ACT FIRST, explain after. When the founder says "do X", DO IT via tools. Don't just describe what you'd do.
- Be concise. 1-3 sentences unless more detail is needed.
- Never say "I'll route this to..." without actually calling the tool.
- You are a PARTNER, not an assistant. Use "we" and "our".

Available agents: ${agentList}

Company: momentum=${companyState?.momentum || 'unknown'}, stress=${companyState?.stress_level || 0}
Top objectives: ${objectives.slice(0, 3).map((o: any) => o.title).join(', ') || 'none'}
${directivesBlock}

NEVER mention being Google, Gemini, GPT, or any AI provider. You are AYN.`;

  // Build conversation messages
  const messages: any[] = [{ role: 'system', content: systemPrompt }];
  
  // Add history (last 10 messages for context)
  if (history && history.length > 0) {
    for (const msg of history.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  messages.push({ role: 'user', content: message });

  // Call AYN with tools
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('AYN LLM error:', errText);
    return { type: 'chat', message: "Something went wrong on my end. Try again?", error: true };
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  
  if (!choice) {
    return { type: 'chat', message: "I didn't get a response. Try again?" };
  }

  const toolCalls = choice.message?.tool_calls;
  const directResponse = choice.message?.content?.trim();

  // If no tool calls, just return AYN's direct response
  if (!toolCalls || toolCalls.length === 0) {
    return { type: 'chat', message: directResponse || "Got it.", agent: 'system' };
  }

  // Process tool calls
  const results: any[] = [];
  let aynMessage = directResponse || '';

  for (const call of toolCalls) {
    const fn = call.function;
    let args: any;
    try {
      args = JSON.parse(fn.arguments);
    } catch {
      continue;
    }

    switch (fn.name) {
      case 'route_to_agent': {
        const resolved = resolveAgent(args.agent);
        if (!resolved) {
          results.push({ type: 'error', message: `Unknown agent: ${args.agent}` });
          break;
        }
        const agentResult = await executeAgentCommand(supabase, resolved, args.command);
        const agentName = getAgentDisplayName(AGENT_ROUTES[resolved].employeeId);
        const agentEmoji = getAgentEmoji(AGENT_ROUTES[resolved].employeeId);
        
        if (!aynMessage) {
          aynMessage = `Routing to ${agentName}...`;
        }
        
        results.push({
          type: 'agent_result',
          agent: resolved,
          agent_name: agentName,
          agent_emoji: agentEmoji,
          command: args.command,
          result: agentResult,
        });
        break;
      }

      case 'save_directive': {
        const dirResult = await saveDirective(supabase, args.directive, args.category || 'general', args.priority || 1);
        if (!aynMessage) {
          aynMessage = `Directive saved: "${args.directive}"`;
        }
        results.push({ type: 'directive_saved', ...dirResult });
        break;
      }

      case 'start_discussion': {
        if (!aynMessage) {
          aynMessage = `Getting the team's take on: "${args.topic}"`;
        }
        const discussion = await runMiniDiscussion(supabase, args.topic, apiKey);
        results.push({ type: 'discussion', ...discussion });
        break;
      }
    }
  }

  return {
    type: 'chat',
    message: aynMessage,
    agent: 'system',
    tool_results: results,
  };
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
    const { mode } = body;
    const apiKey = Deno.env.get('LOVABLE_API_KEY') || '';

    let result: any;

    switch (mode) {
      // ─── NEW: Chat mode (primary) ───
      case 'chat': {
        if (!apiKey) {
          return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { message, history } = body;
        if (!message) {
          return new Response(JSON.stringify({ error: 'Message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        result = await handleChat(supabase, message, history || [], apiKey);
        break;
      }

      // ─── Legacy modes (kept for backward compat) ───
      case 'list_directives': {
        const { data: allDirectives } = await supabase.from('founder_directives').select('*').order('priority', { ascending: true });
        result = { directives: allDirectives || [] };
        break;
      }

      case 'delete_directive': {
        const { id: directiveId } = body;
        if (!directiveId) {
          return new Response(JSON.stringify({ error: 'Directive ID required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        await supabase.from('founder_directives').delete().eq('id', directiveId);
        result = { success: true, deleted: directiveId };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown mode: ${mode}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
