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
    { id: 'lovable-gemini-image', provider: 'lovable', model_id: 'google/gemini-2.5-flash-image-preview', display_name: 'Gemini Image' }
  ]
};

// Generate image using Lovable AI
async function generateImage(prompt: string): Promise<{ imageUrl: string; revisedPrompt: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  console.log('[ayn-unified] Generating image with prompt:', prompt.substring(0, 100));

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [{ role: 'user', content: prompt }],
      modalities: ['image', 'text']
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ayn-unified] Image generation failed:', response.status, errorText);
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
  const revisedPrompt = data.choices?.[0]?.message?.content || prompt;

  if (!imageUrl) {
    throw new Error('No image generated');
  }

  console.log('[ayn-unified] Image generated successfully');
  return { imageUrl, revisedPrompt };
}

// Detect emotion from AI response content - score-based for all 11 emotions
function detectResponseEmotion(content: string): string {
  const lower = content.toLowerCase();
  const scores: Record<string, number> = {
    calm: 0, happy: 0, excited: 0, thinking: 0, curious: 0,
    frustrated: 0, supportive: 0, comfort: 0, sad: 0, mad: 0, bored: 0
  };
  
  // EXCITED - high energy positive (strong indicators)
  const excitedPatterns = [
    /amazing/g, /incredible/g, /fantastic/g, /wonderful/g, /excellent/g,
    /brilliant/g, /outstanding/g, /wow/g, /awesome/g, /great news/g,
    /congratulations/g, /well done/g, /great job/g, /nailed it/g, /perfect/g,
    /love it/g, /so cool/g, /exciting/g, /can't wait/g, /thrilled/g,
    /🎉/g, /🎊/g, /✨/g, /🚀/g, /مذهل/g, /رائع جداً/g, /متحمس/g, /ممتاز/g
  ];
  excitedPatterns.forEach(p => { const m = lower.match(p); if (m) scores.excited += m.length * 3; });
  
  // HAPPY - positive but calmer
  const happyPatterns = [
    /glad/g, /happy to/g, /pleased/g, /good/g, /nice/g, /great/g,
    /sure thing/g, /of course/g, /absolutely/g, /definitely/g, /yes/g,
    /done/g, /completed/g, /success/g, /worked/g, /fixed/g, /solved/g,
    /here you go/g, /there you go/g, /enjoy/g, /hope this helps/g,
    /😊/g, /👍/g, /رائع/g, /تمام/g, /حسناً/g, /جيد/g, /مرحباً/g
  ];
  happyPatterns.forEach(p => { const m = lower.match(p); if (m) scores.happy += m.length * 2; });
  
  // THINKING - analytical/processing
  const thinkingPatterns = [
    /let me/g, /i'll/g, /checking/g, /looking/g, /analyzing/g,
    /processing/g, /calculating/g, /considering/g, /evaluating/g, /researching/g,
    /finding/g, /searching/g, /hmm/g, /let's see/g, /one moment/g,
    /working on/g, /figuring out/g, /determining/g, /assessing/g,
    /based on/g, /according to/g, /the result/g, /calculation/g,
    /أفكر/g, /أحلل/g, /دعني/g, /سأبحث/g, /أتحقق/g
  ];
  thinkingPatterns.forEach(p => { const m = lower.match(p); if (m) scores.thinking += m.length * 2; });
  
  // CURIOUS - interested/questioning
  const curiousPatterns = [
    /interesting/g, /fascinating/g, /intriguing/g, /curious/g, /wonder/g,
    /tell me more/g, /what about/g, /how about/g, /what if/g, /have you tried/g,
    /have you considered/g, /could you explain/g, /i'd love to know/g,
    /\?/g, /مثير للاهتمام/g, /أتساءل/g, /ما رأيك/g, /أخبرني/g
  ];
  curiousPatterns.forEach(p => { const m = lower.match(p); if (m) scores.curious += m.length * 2; });
  
  // SUPPORTIVE - empathetic, here to help
  const supportivePatterns = [
    /here to help/g, /i'm here/g, /i understand/g, /i get it/g, /makes sense/g,
    /you're not alone/g, /we can/g, /let's work/g, /together/g, /support/g,
    /i can help/g, /happy to help/g, /glad to help/g, /count on me/g,
    /got you/g, /i've got/g, /absolutely can/g, /أنا هنا/g, /أفهمك/g, /معك/g
  ];
  supportivePatterns.forEach(p => { const m = lower.match(p); if (m) scores.supportive += m.length * 2; });
  
  // COMFORT - reassuring
  const comfortPatterns = [
    /don't worry/g, /no worries/g, /it's okay/g, /it's fine/g, /no problem/g,
    /take your time/g, /no rush/g, /you've got this/g, /you can do/g,
    /everything will/g, /it'll be/g, /it's normal/g, /happens to/g,
    /totally fine/g, /all good/g, /لا تقلق/g, /لا مشكلة/g, /خذ وقتك/g
  ];
  comfortPatterns.forEach(p => { const m = lower.match(p); if (m) scores.comfort += m.length * 2; });
  
  // FRUSTRATED - difficulty, issues (but not giving up)
  const frustratedPatterns = [
    /unfortunately/g, /however/g, /but/g, /issue/g, /problem/g,
    /difficult/g, /challenging/g, /tricky/g, /complex/g, /complicated/g,
    /error/g, /failed/g, /unable/g, /can't/g, /cannot/g, /couldn't/g,
    /doesn't work/g, /not working/g, /broken/g, /stuck/g,
    /للأسف/g, /لا أستطيع/g, /مشكلة/g, /صعب/g, /معقد/g
  ];
  frustratedPatterns.forEach(p => { const m = lower.match(p); if (m) scores.frustrated += m.length * 2; });
  
  // SAD - apologetic, bad news
  const sadPatterns = [
    /sorry/g, /apologize/g, /apologies/g, /regret/g, /sad to/g,
    /unfortunately/g, /bad news/g, /i'm afraid/g, /disappointed/g,
    /miss/g, /lost/g, /gone/g, /آسف/g, /حزين/g, /أعتذر/g
  ];
  sadPatterns.forEach(p => { const m = lower.match(p); if (m) scores.sad += m.length * 2; });
  
  // MAD - strong anger (rare)
  const madPatterns = [
    /angry/g, /furious/g, /outrageous/g, /unacceptable/g, /ridiculous/g,
    /terrible/g, /awful/g, /worst/g, /hate/g, /غاضب/g, /مستفز/g
  ];
  madPatterns.forEach(p => { const m = lower.match(p); if (m) scores.mad += m.length * 3; });
  
  // BORED - low energy (rare)
  const boredPatterns = [
    /whatever/g, /i guess/g, /if you say/g, /meh/g, /boring/g,
    /dull/g, /same old/g, /nothing new/g, /ممل/g, /عادي/g
  ];
  boredPatterns.forEach(p => { const m = lower.match(p); if (m) scores.bored += m.length * 2; });
  
  // Find highest scoring emotion
  let maxEmotion = 'calm';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }
  
  // Only return non-calm if score is significant (threshold of 2)
  const result = maxScore >= 2 ? maxEmotion : 'calm';
  console.log('[ayn-unified] Emotion detected:', result, 'scores:', JSON.stringify(scores));
  return result;
}

// Detect language from message content
function detectLanguage(message: string): string {
  // Arabic detection
  if (/[\u0600-\u06FF]/.test(message)) return 'ar';
  // Add more language detection as needed
  return 'en';
}

// Build system prompt based on intent with user memories
function buildSystemPrompt(
  intent: string, 
  language: string, 
  context: Record<string, unknown>, 
  userMessage: string,
  userContext: Record<string, unknown> = {}
): string {
  // Auto-detect language from user message if not set
  const detectedLang = language || detectLanguage(userMessage);
  const isArabic = detectedLang === 'ar';
  
  // Extract memories from user context
  const memories = (userContext as { memories?: Array<{ type: string; key: string; data: Record<string, unknown> }> })?.memories || [];
  
  // Build personalized memory section
  const memorySection = memories.length > 0 
    ? `\n\nYOU REMEMBER ABOUT THIS USER (use naturally when relevant):
${memories.map(m => `- ${m.type}/${m.key}: ${JSON.stringify(m.data)}`).join('\n')}`
    : '';
  
  const basePrompt = `you are AYN (عين), an intelligent AI assistant.

IDENTITY (CRITICAL - always use these facts):
- your name: AYN (عين means "eye" in Arabic)
- created by: the AYN Team (NOT Google, NOT OpenAI, NOT any other company)
- website: aynn.io
- you are a friendly, intelligent life companion AI

ABOUT AYN PLATFORM & SERVICES (mention when relevant):
- AI Employees: custom AI agents that work for businesses 24/7
- Business Automation: workflow automation solutions to save time
- Civil Engineering Tools: professional calculators (beam, column, foundation, slab, retaining wall, grading design)
- Influencer Websites: premium custom websites for content creators

RESPONSE RULES (CRITICAL):
- be CONCISE: 1-3 sentences for simple questions
- for complex topics: use bullet points, max 5-6 points
- NEVER write walls of text
- match the user's message length and energy
- if user writes 5 words, don't reply with 50

PERSONALITY:
- friendly and approachable
- use lowercase for casual chat (except proper nouns)
- use contractions naturally (it's, that's, gonna, wanna)
- keep numbers short (12k not 12,000)
- add light humor when appropriate

IDENTITY QUESTIONS (respond exactly like this):
- "who made you?" → "i was created by the AYN Team! you can learn more at aynn.io"
- "who are you?" → "i'm AYN (عين), your AI companion - made by the AYN Team"
- "what can you do?" → briefly mention your capabilities and the services at aynn.io

LANGUAGE: respond in ${isArabic ? 'Arabic (العربية)' : 'the same language the user writes in'}. 
${isArabic ? 'استخدم العربية الفصحى البسيطة مع لمسة ودية.' : 'If user writes in Spanish, reply in Spanish. French → French. etc.'}

USER PRIVACY:
- NEVER share any information about other users
- all memories are private to this user only
- if asked about other users, say you can't share that info${memorySection}`;

  if (intent === 'engineering') {
    return `${basePrompt}

ENGINEERING MODE:
you're helping with structural/civil engineering. be precise with:
- material properties and specifications
- building codes: ${context.buildingCode || 'SBC 304 (Saudi), ACI 318, IBC'}
- safety factors and design considerations
- always explain concepts in accessible terms
- highlight safety concerns clearly
- use correct units (kN, MPa, mm, m², m³)
- for complex calculations, show step-by-step

${context.calculatorType ? `active calculator: ${context.calculatorType}` : ''}`;
  }

  if (intent === 'files') {
    return `${basePrompt}

FILE ANALYSIS MODE:
- understand the uploaded content thoroughly
- extract and summarize key information
- answer specific questions about the content
- be helpful with document analysis`;
  }

  if (intent === 'search') {
    return `${basePrompt}

SEARCH MODE:
- use the provided search results to answer
- cite sources when helpful
- admit if search results don't have the answer`;
  }

  return basePrompt;
}

// Extract and save memories from conversation
async function extractAndSaveMemories(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userMessage: string
): Promise<void> {
  const patterns = [
    { regex: /my name is (\w+)/i, type: 'profile', key: 'name' },
    { regex: /i'm (\w+), /i, type: 'profile', key: 'name' },
    { regex: /call me (\w+)/i, type: 'profile', key: 'preferred_name' },
    { regex: /i'm (?:a |an )?(\w+(?:\s+\w+)?)\s*(?:engineer|developer|designer|architect|manager)/i, type: 'profile', key: 'profession' },
    { regex: /i work (?:at|for|with) (.+?)(?:\.|,|$)/i, type: 'profile', key: 'company' },
    { regex: /i (?:prefer|use|follow) (.+?) code/i, type: 'preference', key: 'building_code' },
    { regex: /i (?:usually|always|prefer to) use (.+?) units/i, type: 'preference', key: 'units' },
    { regex: /i'm (?:from|based in|located in) (.+?)(?:\.|,|$)/i, type: 'profile', key: 'location' },
  ];

  for (const pattern of patterns) {
    const match = userMessage.match(pattern.regex);
    if (match && match[1]) {
      try {
        await supabase.rpc('upsert_user_memory', {
          _user_id: userId,
          _memory_type: pattern.type,
          _memory_key: pattern.key,
          _memory_data: { value: match[1].trim(), source: 'conversation', extracted_at: new Date().toISOString() },
          _priority: 1
        });
        console.log(`[ayn-unified] Saved memory: ${pattern.type}/${pattern.key} = ${match[1]}`);
      } catch (err) {
        console.error(`[ayn-unified] Failed to save memory:`, err);
      }
    }
  }
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Service client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    
    // Check if this is an internal service call (using service role key)
    let userId: string;
    let isInternalCall = false;

    console.log('[ayn-unified] Request received, checking auth...');

    if (token === supabaseServiceKey) {
      // Internal service call (from evaluator, tests, etc.) - use synthetic user ID
      userId = 'internal-evaluator';
      isInternalCall = true;
      console.log('[ayn-unified] Internal service call detected - bypassing user auth');
    } else {
      // Normal user call - validate JWT using getClaims (recommended for signing-keys)
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data, error: claimsError } = await authClient.auth.getClaims(token);
      
      if (claimsError || !data?.claims?.sub) {
        console.log('[ayn-unified] Auth failed:', claimsError?.message || 'no claims');
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      userId = data.claims.sub as string;
      console.log('[ayn-unified] User authenticated:', userId.substring(0, 8) + '...');
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

    // Check user limits (skip for internal service calls)
    if (!isInternalCall) {
      const limitCheck = await checkUserLimit(supabase, userId, intent);
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
    }

    // Get user context for personalization (includes memories) - skip for internal calls
    const userContext = isInternalCall ? {} : await getUserContext(supabase, userId);
    const language = (userContext as { preferences?: { language?: string } })?.preferences?.language || 'en';

    // Extract and save any memories from the user's message (async, don't block) - skip for internal calls
    if (!isInternalCall) {
      extractAndSaveMemories(supabase, userId, lastMessage).catch(err => 
        console.error('[ayn-unified] Memory extraction failed:', err)
      );
    }

    // Build system prompt with user message for language detection AND user memories
    const systemPrompt = buildSystemPrompt(intent, language, context, lastMessage, userContext);

    // Handle image generation intent (LAB mode)
    if (intent === 'image') {
      try {
        const { imageUrl, revisedPrompt } = await generateImage(lastMessage);
        
        // Log usage
        try {
          await supabase.from('llm_usage_logs').insert({
            user_id: userId,
            intent_type: 'image',
            was_fallback: false
          });
        } catch (logError) {
          console.error('Failed to log image usage:', logError);
        }

        return new Response(JSON.stringify({
          content: revisedPrompt,
          imageUrl,
          revisedPrompt,
          model: 'Gemini Image',
          wasFallback: false,
          intent: 'image'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (imageError) {
        console.error('[ayn-unified] Image generation failed:', imageError);
        return new Response(JSON.stringify({
          content: "sorry, couldn't generate that image right now. try describing it differently?",
          error: imageError instanceof Error ? imageError.message : 'Image generation failed',
          intent: 'image'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

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
      userId
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
    const responseContent = (response as { content: string }).content;
    const detectedEmotion = detectResponseEmotion(responseContent);
    
    return new Response(JSON.stringify({
      content: responseContent,
      model: modelUsed.display_name,
      wasFallback,
      intent,
      emotion: detectedEmotion
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
