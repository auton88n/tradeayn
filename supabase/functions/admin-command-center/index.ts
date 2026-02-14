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
  marketing: { employeeId: 'marketing', functionName: 'ayn-marketing-strategist', defaultMode: 'analyze_pipeline' },
  security: { employeeId: 'security_guard', functionName: 'ayn-security-guard', defaultMode: 'scan' },
  lawyer: { employeeId: 'lawyer', functionName: 'ayn-lawyer', defaultMode: 'review' },
  advisor: { employeeId: 'advisor', functionName: 'ayn-advisor', defaultMode: 'analyze' },
  qa: { employeeId: 'qa_watchdog', functionName: 'ayn-qa-watchdog', defaultMode: 'check' },
  followup: { employeeId: 'follow_up', functionName: 'ayn-follow-up-agent', defaultMode: 'check' },
  customer: { employeeId: 'customer_success', functionName: 'ayn-customer-success', defaultMode: 'check' },
};

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

// ─── Agent-specific parameter hints for AYN ───
const AGENT_PARAM_HINTS: Record<string, string> = {
  sales: `Sales Hunter modes: "prospect" (needs url), "search_leads" (needs search_query), "pipeline_status", "draft_email" (needs lead_id). For natural commands like "find firms", use search_leads with a search_query.`,
  investigator: `Investigator modes: "investigate" (needs topic or url). Pass the topic or URL directly.`,
  marketing: `Marketing Strategist modes: "campaign" (needs target_audience or industry — creates full outreach campaign with emails), "email_copy" (needs lead_id or company_name or industry — drafts personalized email), "positioning" (needs competitor_url — analyzes competitor and recommends positioning), "content_plan" (creates content plan based on pipeline), "analyze_pipeline" (reviews pipeline for marketing priorities). For natural commands about reaching companies or industries, use "campaign" with industry param.`,
  security: `Security Guard modes: "scan" (run security scan), "check" (check specific threat).`,
  lawyer: `Lawyer modes: "review" (review document/situation), "compliance" (check compliance).`,
  advisor: `Advisor modes: "analyze" (strategic analysis), "recommend" (recommendations).`,
  qa: `QA Watchdog modes: "check" (run checks), "report" (status report).`,
  followup: `Follow-Up modes: "check" (check pending follow-ups), "send" (send follow-up).`,
  customer: `Customer Success modes: "check" (check churn risks), "report" (satisfaction report).`,
};

// ─── Tool definitions ───
const TOOLS = [
  {
    type: "function",
    function: {
      name: "route_to_agent",
      description: "Route a task to a specific agent. Use when the founder wants an agent to DO something.",
      parameters: {
        type: "object",
        properties: {
          agent: { type: "string", description: "Agent key: sales, investigator, marketing, security, lawyer, advisor, qa, followup, customer" },
          command: { type: "string", description: "Natural language description of the task" },
          agent_params: {
            type: "object",
            description: "Structured parameters to pass directly to the agent function. Include 'mode' and any other required params. If unsure, omit and let the system figure it out.",
            properties: {
              mode: { type: "string", description: "The agent's operation mode" },
            },
            additionalProperties: true,
          },
        },
        required: ["agent", "command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_directive",
      description: "Save a standing order. Use when the founder says 'from now on...', 'always...', 'never...', 'focus on...', 'only target...'",
      parameters: {
        type: "object",
        properties: {
          directive: { type: "string", description: "The standing order text" },
          category: { type: "string", enum: ["general", "geo", "strategy", "outreach", "budget"] },
          priority: { type: "number", description: "Priority 1-5, 1 is highest" },
        },
        required: ["directive", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_discussion",
      description: "Start a multi-agent discussion. ONLY use when the founder explicitly asks for opinions from multiple agents or 'everyone'.",
      parameters: {
        type: "object",
        properties: { topic: { type: "string" } },
        required: ["topic"],
      },
    },
  },
];

// ─── Build a simple fallback summary from raw data (no LLM needed) ───
function buildFallbackSummary(agentKey: string, rawResult: any): string {
  const route = AGENT_ROUTES[agentKey];
  const agentName = route ? getAgentDisplayName(route.employeeId) : agentKey;

  if (!rawResult) return `${agentName} completed the task but returned no data.`;

  // Handle errors conversationally
  if (rawResult.error) {
    const err = typeof rawResult.error === 'string' ? rawResult.error : JSON.stringify(rawResult.error);
    // Common parameter errors → helpful hints
    if (err.includes('url') || err.includes('URL')) return `I need a URL to work with. Try something like: "prospect https://example.com"`;
    if (err.includes('required') || err.includes('missing')) return `I'm missing some info to do that. Could you be more specific about what you need?`;
    if (err.includes('not found')) return `I couldn't find what you're looking for. Want me to try a different approach?`;
    return `I ran into an issue: ${err.substring(0, 200)}. Want me to try again?`;
  }

  // Handle success with data summaries
  if (rawResult.success === false) return `That didn't work as expected. Let me know if you want me to try differently.`;

  // Array results (leads, items, etc.)
  if (Array.isArray(rawResult.data || rawResult.leads || rawResult.results)) {
    const items = rawResult.data || rawResult.leads || rawResult.results;
    const count = items.length;
    if (count === 0) return `I looked but didn't find anything matching that criteria.`;
    const names = items.slice(0, 3).map((i: any) => i.company_name || i.name || i.title || 'item').join(', ');
    return `Found ${count} result${count > 1 ? 's' : ''}${names ? ': ' + names : ''}${count > 3 ? '...' : ''}.`;
  }

  // Pipeline/status results
  if (rawResult.pipeline || rawResult.status) return `Here's the current status. Check the details below for the full picture.`;

  // Generic success
  if (rawResult.success === true) return `Done! Task completed successfully.`;

  // Default: mention something happened
  const keys = Object.keys(rawResult).filter(k => k !== 'source').slice(0, 3);
  if (keys.length > 0) return `Got results back (${keys.join(', ')}). Check the details for more.`;

  return `Task completed.`;
}

// ─── Generate natural language summary from agent result ───
async function generateAgentMessage(agentKey: string, command: string, rawResult: any, apiKey: string): Promise<string> {
  const route = AGENT_ROUTES[agentKey];
  if (!route) return buildFallbackSummary(agentKey, rawResult);
  if (!apiKey) return buildFallbackSummary(agentKey, rawResult);

  const personality = getEmployeePersonality(route.employeeId);
  const resultStr = JSON.stringify(rawResult).substring(0, 2000);
  const hasError = rawResult?.error || rawResult?.success === false;

  const systemMsg = `${personality || `You are ${getAgentDisplayName(route.employeeId)}.`}

Summarize this result for the founder in 1-3 sentences. Be direct, stay in character.
${hasError ? 'There was an error. Explain what you need from the founder to proceed. Be helpful, not robotic.' : 'Report what you found/did. If relevant, suggest next steps.'}
Never show raw JSON. Never mention "parameters" or "API". Talk like a real team member.`;

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: `Command was: "${command}"\n\nResult:\n${resultStr}` },
        ],
        max_tokens: 150,
      }),
    });
    if (!res.ok) return buildFallbackSummary(agentKey, rawResult);
    const data = await res.json();
    const msg = data.choices?.[0]?.message?.content?.trim();
    return msg || buildFallbackSummary(agentKey, rawResult);
  } catch {
    return buildFallbackSummary(agentKey, rawResult);
  }
}

// ─── Execute agent command (with smart params + natural response) ───
async function executeAgentCommand(supabase: any, agentKey: string, command: string, agentParams?: any, apiKey?: string) {
  const route = AGENT_ROUTES[agentKey];
  if (!route) return { error: `Unknown agent: ${agentKey}` };

  // Build the request body — use agent_params if provided, otherwise fall back to defaults
  const requestBody: any = agentParams && agentParams.mode
    ? { ...agentParams, command, source: 'command_center' }
    : { mode: route.defaultMode, command, source: 'command_center' };

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${route.functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    const data = await res.json();

    // Generate natural language message from the agent
    const agentMessage = apiKey ? await generateAgentMessage(agentKey, command, data, apiKey) : '';

    await supabase.from('ayn_activity_log').insert({
      triggered_by: route.employeeId,
      action_type: 'command_center_execution',
      summary: `Command: "${command.substring(0, 100)}"`,
      details: { command, agent_params: agentParams, result: data, source: 'command_center' },
    });

    return {
      agent: agentKey,
      agent_name: getAgentDisplayName(route.employeeId),
      agent_emoji: getAgentEmoji(route.employeeId),
      result: data,
      message: agentMessage,
      success: res.ok,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown';
    const agentMessage = apiKey
      ? await generateAgentMessage(agentKey, command, { error: errorMsg }, apiKey)
      : '';
    return { error: `Failed: ${errorMsg}`, message: agentMessage };
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

// ─── Mini discussion ───
async function runMiniDiscussion(supabase: any, topic: string, apiKey: string) {
  const EXECUTIVE = ['system', 'chief_of_staff'];
  const OPERATIONAL = ['sales', 'investigator', 'follow_up', 'marketing', 'customer_success', 'qa_watchdog', 'security_guard', 'lawyer'];

  const msg = topic.toLowerCase();
  const selected = new Set<string>([...EXECUTIVE]);

  if (msg.includes('sale') || msg.includes('lead') || msg.includes('revenue')) selected.add('sales');
  if (msg.includes('market') || msg.includes('brand') || msg.includes('content')) selected.add('marketing');
  if (msg.includes('security') || msg.includes('attack')) selected.add('security_guard');
  if (msg.includes('legal') || msg.includes('compliance')) selected.add('lawyer');
  if (msg.includes('customer') || msg.includes('churn')) selected.add('customer_success');
  if (msg.includes('quality') || msg.includes('bug')) selected.add('qa_watchdog');
  if (msg.includes('data') || msg.includes('research')) selected.add('investigator');

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

// ─── CHAT MODE ───
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
  const paramHints = Object.entries(AGENT_PARAM_HINTS).map(([k, v]) => `${k}: ${v}`).join('\n');

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
- When using route_to_agent, TRY to include agent_params with the correct mode and parameters. Use the hints below.

AGENT PARAMETER HINTS:
${paramHints}

Available agents: ${agentList}

Company: momentum=${companyState?.momentum || 'unknown'}, stress=${companyState?.stress_level || 0}
Top objectives: ${objectives.slice(0, 3).map((o: any) => o.title).join(', ') || 'none'}
${directivesBlock}

NEVER mention being Google, Gemini, GPT, or any AI provider. You are AYN.`;

  const messages: any[] = [{ role: 'system', content: systemPrompt }];

  if (history && history.length > 0) {
    for (const msg of history.slice(-20)) {
      if (msg.role && msg.content) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }
  messages.push({ role: 'user', content: message });

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

  if (!toolCalls || toolCalls.length === 0) {
    return { type: 'chat', message: directResponse || "Got it.", agent: 'system' };
  }

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
        const agentResult = await executeAgentCommand(supabase, resolved, args.command, args.agent_params, apiKey);
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
          result: agentResult.result || agentResult,
          message: agentResult.message || '',
          success: agentResult.success,
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
