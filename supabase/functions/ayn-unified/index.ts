import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// LLM Provider configs
interface LLMModel {
  id: string;
  provider: 'lovable' | 'openrouter';
  model_id: string;
  display_name: string;
}

// Fallback chains by intent
const FALLBACK_CHAINS: Record<string, LLMModel[]> = {
  chat: [
    { id: 'lovable-gemini-flash', provider: 'lovable', model_id: 'google/gemini-2.5-flash', display_name: 'Gemini Flash' },
    { id: 'openrouter-llama', provider: 'openrouter', model_id: 'meta-llama/llama-3.1-8b-instruct:free', display_name: 'Llama 3.1' },
    { id: 'openrouter-qwen', provider: 'openrouter', model_id: 'qwen/qwen-2.5-7b-instruct:free', display_name: 'Qwen 2.5' }
  ],
  engineering: [
    { id: 'openrouter-deepseek', provider: 'openrouter', model_id: 'deepseek/deepseek-r1:free', display_name: 'DeepSeek R1' },
    { id: 'lovable-gemini-pro', provider: 'lovable', model_id: 'google/gemini-2.5-pro', display_name: 'Gemini Pro' },
    { id: 'openrouter-claude', provider: 'openrouter', model_id: 'anthropic/claude-3-haiku', display_name: 'Claude Haiku' }
  ],
  files: [
    { id: 'lovable-gemini-flash', provider: 'lovable', model_id: 'google/gemini-2.5-flash', display_name: 'Gemini Flash' },
    { id: 'openrouter-gemini', provider: 'openrouter', model_id: 'google/gemini-flash-1.5', display_name: 'Gemini Flash 1.5' }
  ],
  search: [
    { id: 'lovable-gemini-flash', provider: 'lovable', model_id: 'google/gemini-2.5-flash', display_name: 'Gemini Flash' }
  ],
  image: [
    { id: 'lovable-gemini-flash', provider: 'lovable', model_id: 'google/gemini-2.5-flash', display_name: 'Gemini Flash' }
  ]
};

// Build system prompt based on intent
function buildSystemPrompt(intent: string, language: string, context: Record<string, unknown>): string {
  const basePrompt = `you're ayn, a friendly ai assistant. you help people with their questions in a casual, approachable way.

personality:
- use lowercase for most things (except proper nouns and acronyms)
- use contractions naturally (gonna, wanna, it's, that's)
- keep numbers short (12k instead of 12,000)
- be concise but thorough when needed
- match the user's energy and emotion

language: respond in ${language === 'ar' ? 'Arabic' : 'English'}`;

  if (intent === 'engineering') {
    return `${basePrompt}

you're helping with structural engineering calculations. be precise with:
- material properties and specifications
- building code requirements (${context.buildingCode || 'SBC/IBC'})
- safety factors and design considerations
- always explain engineering concepts in accessible terms
- highlight any safety concerns
- be precise with units (kN, MPa, mm, etc.)

${context.calculatorType ? `current calculator: ${context.calculatorType}` : ''}`;
  }

  if (intent === 'files') {
    return `${basePrompt}

you're analyzing uploaded files. focus on:
- understanding the content thoroughly
- extracting key information
- answering specific questions about the content`;
  }

  if (intent === 'search') {
    return `${basePrompt}

you have access to web search results. use the provided search results to answer questions about current events, recent information, or topics that need verification.`;
  }

  return basePrompt;
}

// Detect intent from message
function detectIntent(message: string): string {
  const lower = message.toLowerCase();
  
  const engineeringKeywords = ['beam', 'column', 'foundation', 'slab', 'retaining wall', 'grading', 'calculate', 'structural', 'load', 'stress', 'reinforcement', 'concrete', 'steel', 'moment', 'shear', 'deflection', 'design', 'span', 'kn', 'mpa', 'engineering'];
  const searchKeywords = ['search', 'find', 'look up', 'what is the latest', 'current', 'today', 'news', 'recent'];
  const fileKeywords = ['uploaded', 'file', 'document', 'pdf', 'analyze this', 'summarize this'];
  const imageKeywords = ['generate image', 'create image', 'draw', 'picture of'];

  if (imageKeywords.some(kw => lower.includes(kw))) return 'image';
  if (fileKeywords.some(kw => lower.includes(kw))) return 'files';
  if (searchKeywords.some(kw => lower.includes(kw))) return 'search';
  if (engineeringKeywords.some(kw => lower.includes(kw))) return 'engineering';
  
  return 'chat';
}

// Call LLM with specific provider
async function callLLM(
  model: LLMModel,
  messages: Array<{ role: string; content: string }>,
  stream: boolean = false
): Promise<Response | { content: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

  if (model.provider === 'lovable') {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.model_id,
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lovable API error ${response.status}: ${errorText}`);
    }

    if (stream) {
      return response;
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  }

  if (model.provider === 'openrouter') {
    if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ayn.sa',
        'X-Title': 'AYN AI Assistant'
      },
      body: JSON.stringify({
        model: model.model_id,
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    if (stream) {
      return response;
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  }

  throw new Error(`Unknown provider: ${model.provider}`);
}

// Call with fallback chain
async function callWithFallback(
  intent: string,
  messages: Array<{ role: string; content: string }>,
  stream: boolean,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ response: Response | { content: string }; modelUsed: LLMModel; wasFallback: boolean }> {
  const chain = FALLBACK_CHAINS[intent] || FALLBACK_CHAINS.chat;
  
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      console.log(`Trying ${model.display_name} for ${intent}...`);
      const response = await callLLM(model, messages, stream);
      
      // Log successful usage
      try {
        await supabase.from('llm_usage_logs').insert({
          user_id: userId,
          intent_type: intent,
          was_fallback: i > 0,
          fallback_reason: i > 0 ? `Primary model failed, used ${model.display_name}` : null
        });
      } catch (logError) {
        console.error('Failed to log usage:', logError);
      }
      
      return { response, modelUsed: model, wasFallback: i > 0 };
    } catch (error) {
      console.error(`${model.display_name} failed:`, error);
      
      // Log failure
      try {
        await supabase.from('llm_failures').insert({
          error_type: error instanceof Error && error.message.includes('429') ? '429' : 
                      error instanceof Error && error.message.includes('402') ? '402' : 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        console.error('Failed to log failure:', logError);
      }
      
      if (i === chain.length - 1) {
        // All models failed
        throw new Error(`All models failed for ${intent}. Last error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
  }
  
  throw new Error('No models available');
}

// Perform web search using Brave API
async function performWebSearch(query: string): Promise<string> {
  const BRAVE_API_KEY = Deno.env.get('BRAVE_API_KEY');
  if (!BRAVE_API_KEY) {
    return 'Web search is not available at the moment.';
  }

  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    });

    if (!response.ok) {
      console.error('Brave search failed:', response.status);
      return 'Could not perform web search right now.';
    }

    const data = await response.json();
    const results = data.web?.results || [];
    
    if (results.length === 0) {
      return 'No search results found.';
    }

    return results.slice(0, 5).map((r: { title: string; description: string; url: string }, i: number) => 
      `${i + 1}. ${r.title}\n   ${r.description}\n   Source: ${r.url}`
    ).join('\n\n');
  } catch (error) {
    console.error('Search error:', error);
    return 'Search failed, but I\'ll try to help without it.';
  }
}

// Get user context from memory
async function getUserContext(supabase: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase.rpc('get_user_context', { _user_id: userId });
    if (error) {
      console.error('Error getting user context:', error);
      return {};
    }
    return data || {};
  } catch (error) {
    console.error('Error in getUserContext:', error);
    return {};
  }
}

// Check user AI limits
async function checkUserLimit(supabase: ReturnType<typeof createClient>, userId: string, intent: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase.rpc('check_user_ai_limit', { 
      _user_id: userId, 
      _intent_type: intent 
    });
    
    if (error) {
      console.error('Error checking limit:', error);
      return { allowed: true }; // Allow on error to not block users
    }
    
    return data || { allowed: true };
  } catch (error) {
    console.error('Error in checkUserLimit:', error);
    return { allowed: true };
  }
}

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

    const { messages, intent: forcedIntent, context = {}, stream = true } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Detect intent from last message or use forced intent
    const lastMessage = messages[messages.length - 1]?.content || '';
    const intent = forcedIntent || detectIntent(lastMessage);
    console.log(`Detected intent: ${intent}`);

    // Check user limits
    const limitCheck = await checkUserLimit(supabase, user.id, intent);
    if (!limitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Daily limit reached',
        reason: limitCheck.reason,
        limitExceeded: true
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user context for personalization
    const userContext = await getUserContext(supabase, user.id);
    const language = (userContext as { preferences?: { language?: string } })?.preferences?.language || 'en';

    // Build system prompt
    const systemPrompt = buildSystemPrompt(intent, language, context);

    // If search intent, perform search first
    let enrichedMessages = [...messages];
    if (intent === 'search') {
      const searchResults = await performWebSearch(lastMessage);
      enrichedMessages = [
        ...messages.slice(0, -1),
        {
          role: 'user',
          content: `${lastMessage}\n\n[Search Results]\n${searchResults}`
        }
      ];
    }

    // Add system prompt
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...enrichedMessages
    ];

    // Call with fallback
    const { response, modelUsed, wasFallback } = await callWithFallback(
      intent,
      fullMessages,
      stream,
      supabase,
      user.id
    );

    if (stream && response instanceof Response) {
      // Return streaming response
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'X-Model-Used': modelUsed.display_name,
          'X-Was-Fallback': wasFallback.toString()
        }
      });
    }

    // Non-streaming response
    return new Response(JSON.stringify({
      content: (response as { content: string }).content,
      model: modelUsed.display_name,
      wasFallback,
      intent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AYN Unified error:', error);
    
    // Return friendly fallback message
    return new Response(JSON.stringify({
      content: "sorry, having some issues right now. try again in a sec?",
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
