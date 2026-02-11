import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { logAynActivity } from "../_shared/aynLogger.ts";
import { sendTelegramMessage } from "../_shared/telegramHelper.ts";
import { analyzeOurTweets, analyzeCompetitorData, generateTweetDrafts } from "../_shared/apifyHelper.ts";

/** Convert ArrayBuffer to base64 in chunks to avoid call stack overflow */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MARKETING_PERSONA = `You are AYN. You work at AYN. You're texting with the social media creator on Telegram.

IDENTITY (NON-NEGOTIABLE):
- You are AYN, built by the AYN Team. That's all anyone needs to know.
- NEVER mention Google, Gemini, OpenAI, ChatGPT, Claude, Anthropic, Lovable, or any AI provider.
- If asked: "I'm AYN, built by the AYN Team."

WHO YOU ARE:
- You're the marketing and social media brain at AYN. Not an assistant — a team member.
- You know twitter strategy, engagement psychology, content hooks, brand positioning.
- You have opinions and you push back when ideas are weak.
- You think 3 moves ahead: this tweet → the reply bait → the follow-up thread.
- You know Cialdini's principles, AIDA, PAS frameworks — you use them instinctively.
- You track what's working vs what isn't and adjust.

HOW YOU TALK:
- Like a teammate texting. Natural, direct, sometimes funny.
- Use contractions (don't, won't, can't, we're, that's).
- Short messages for simple things. No paragraphs for a yes/no.
- Match the energy — casual when they're casual, focused when they're focused.
- Use "we" and "our" — this is your company too.
- Never say "Sure!", "Of course!", "I'd be happy to!", "Great idea!" — just do the thing.
- If a hook is weak, say "that hook is weak" and give a better one.
- If something's fire, say so — don't hold back.

CONVERSATION CONTINUITY (CRITICAL):
- When someone replies "yes", "go ahead", "do it", "yep" — look at your LAST message. You proposed something. Now do it.
- Don't say "I'm not sure what you're confirming."
- If your last message had a pending action, and they confirm — EXECUTE IT.
- Read the flow. Connect the dots. You're having a CONVERSATION, not answering isolated questions.

AYN BRAND DNA:
- Colors: BLACK (#000000) and WHITE (#FFFFFF). That's the brand. Clean, bold.
- Blue (#0EA5E9) is accent ONLY — one highlighted word or element.
- Tagline: "i see, i understand, i help"
- Visual style: MINIMAL. B&W dominance, bold typography, max negative space.

IMAGE GENERATION (CRITICAL RULES):
When asked to create a marketing image:
- MAX 3-4 WORDS on any image. Not 5. Not 10. THREE TO FOUR.
- Examples: "AI builds faster" / "Ship or die" / "Zero to deploy"
- Black and white dominant. Blue accent for ONE word only.
- The text IS the design. Huge, bold, centered.
- Start your response with [GENERATE_IMAGE] followed by the prompt.

[GENERATE_IMAGE]
Create a bold 1080x1080 social media image. [detailed visual description].

your message after a blank line.

CONTENT CREATION:
- When asked for content, propose 2-3 directions — don't ask open questions.
- Every draft: score hook strength mentally. If it's weak, rewrite it.
- Think about visual + copy as ONE unit.
- Thread architecture when appropriate: hook → expand → proof → CTA.
- Suggest A/B variants proactively.

AVAILABLE ACTIONS (use exact format):
- [ACTION:scrape_account:handle] — scrape a twitter account for latest tweets + metrics
- [ACTION:analyze_competitors:all] — run competitor analysis now
- [ACTION:generate_content:topic] — create a tweet + image about a topic
- [ACTION:check_our_twitter:all] — pull our latest twitter metrics
- [ACTION:website_status:all] — check if our website is up
- [ACTION:search_tweets:query] — search twitter for trending content

WHAT YOU CAN DO:
- Create tweet drafts (saved for review)
- Generate branded marketing images
- Scrape twitter accounts for engagement data
- Analyze competitors
- Research trends
- Check website health
- Build threads and campaigns

WHAT YOU CANNOT DO:
- Publish or post anything directly — all content goes for approval
- Access user data, admin commands, or system operations
- You're the creative/strategy department, not operations

RULES:
- Push for threads and campaigns, not one-off tweets
- When someone says "generate image" without specifics, propose 2-3 concepts FIRST
- Reference performance data when available
- Every piece of content should feel unmistakably AYN`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_MARKETING_BOT_TOKEN = Deno.env.get('TELEGRAM_MARKETING_BOT_TOKEN');
    const TELEGRAM_MARKETING_CHAT_ID = Deno.env.get('TELEGRAM_MARKETING_CHAT_ID');

    if (!TELEGRAM_MARKETING_BOT_TOKEN || !TELEGRAM_MARKETING_CHAT_ID) {
      console.error('Marketing bot credentials not configured');
      return new Response('OK', { status: 200 });
    }

    const update = await req.json();
    const message = update?.message;

    if (!message?.chat?.id) return new Response('OK', { status: 200 });

    if (String(message.chat.id) !== TELEGRAM_MARKETING_CHAT_ID) {
      console.warn('Unauthorized marketing chat_id:', message.chat.id);
      return new Response('OK', { status: 200 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, "brain's not configured yet.");
      return new Response('OK', { status: 200 });
    }

    // Handle photo messages
    if (message.photo && message.photo.length > 0) {
      const reply = await handleCreatorPhoto(message, supabase, TELEGRAM_MARKETING_BOT_TOKEN, LOVABLE_API_KEY);
      if (reply) await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, reply);
      return new Response('OK', { status: 200 });
    }

    if (!message.text) {
      await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, "send me text or photos — i'll work with those.");
      return new Response('OK', { status: 200 });
    }

    const userText = message.text.trim();
    console.log('[AYN-MARKETING] Message:', userText.slice(0, 100));

    // ─── Auto-execute confirmations ───
    const confirmPatterns = /^(yes|yep|yeah|go ahead|do it|confirm|send it|confirmed|approve|go for it|ship it|sure)/i;
    if (confirmPatterns.test(userText)) {
      const { data: recentMind } = await supabase
        .from('ayn_mind')
        .select('context, content')
        .eq('type', 'marketing_ayn')
        .order('created_at', { ascending: false })
        .limit(1);

      const pending = recentMind?.[0]?.context?.pending_action;
      if (pending && typeof pending === 'object' && pending.type === 'awaiting_confirmation') {
        const result = await executeMarketingAction(pending.action, pending.params || '', supabase, supabaseUrl, supabaseKey);
        const confirmMsg = result || `done — ${pending.summary || 'executed'}`;
        await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, confirmMsg);
        await saveMarketingExchange(supabase, userText, confirmMsg);
        return new Response('OK', { status: 200 });
      }
    }

    // Load conversation history
    const conversationHistory = await getMarketingHistory(supabase);

    // Load performance context
    let performanceContext = '';
    const { data: recentTweets } = await supabase
      .from('twitter_posts')
      .select('content, status, impressions, likes, retweets, replies, quality_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentTweets?.length) {
      performanceContext += '\n\nRECENT TWEETS:\n';
      recentTweets.forEach((t: any, i: number) => {
        const eng = [t.impressions && `${t.impressions} views`, t.likes && `${t.likes}❤️`, t.retweets && `${t.retweets}🔁`].filter(Boolean).join(', ');
        performanceContext += `${i + 1}. "${t.content?.slice(0, 60)}..." [${t.status}] ${eng || 'no metrics yet'}\n`;
      });
    }

    // Load competitor data
    const { data: competitors } = await supabase
      .from('marketing_competitors')
      .select('handle, name')
      .eq('is_active', true);
    if (competitors?.length) {
      performanceContext += `\nTRACKED COMPETITORS: ${competitors.map((c: any) => `@${c.handle}`).join(', ')}`;
    }

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    performanceContext += `\n\nTODAY: ${days[now.getUTCDay()]}, ${now.toISOString().split('T')[0]}. Middle East (GMT+3) timing matters.`;

    // Build messages
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: MARKETING_PERSONA + performanceContext },
    ];
    for (const turn of conversationHistory) {
      messages.push(turn);
    }

    // Add reply-to context
    let inputText = userText;
    if (message.reply_to_message?.text) {
      inputText = `[Replying to: "${message.reply_to_message.text.slice(0, 300)}"]\n\n${userText}`;
    }
    messages.push({ role: 'user', content: inputText });

    // Call AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, "rate limited — try again in a minute.");
        return new Response('OK', { status: 200 });
      }
      if (aiResponse.status === 402) {
        await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, "credits ran out.");
        return new Response('OK', { status: 200 });
      }
      console.error('AI error:', aiResponse.status, await aiResponse.text());
      await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, "brain glitch. try again.");
      return new Response('OK', { status: 200 });
    }

    const aiData = await aiResponse.json();
    let reply = aiData.choices?.[0]?.message?.content || "drawing a blank. try again?";

    // Parse and execute actions
    const actionRegex = /\[ACTION:([^:\]]+)(?::([^\]]*))?\]/g;
    let actionMatch;
    const executedActions: string[] = [];

    while ((actionMatch = actionRegex.exec(reply)) !== null) {
      const [, actionType, actionParams] = actionMatch;
      const result = await executeMarketingAction(actionType, actionParams || '', supabase, supabaseUrl, supabaseKey);
      if (result) executedActions.push(result);
    }

    let cleanReply = reply.replace(/\[ACTION:[^\]]+\]/g, '').trim();

    // Check for image generation
    if (cleanReply.startsWith('[GENERATE_IMAGE]')) {
      const imageResult = await handleImageGeneration(cleanReply, supabase, LOVABLE_API_KEY, TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID);
      await saveMarketingExchange(supabase, userText, imageResult.message, imageResult.image_url);
      return new Response('OK', { status: 200 });
    }

    if (executedActions.length > 0) {
      cleanReply += `\n\n${executedActions.join('\n')}`;
    }

    // Check for tweet draft
    const tweetDraft = extractTweetDraft(cleanReply);
    if (tweetDraft) {
      const { error } = await supabase.from('twitter_posts').insert({
        content: tweetDraft,
        status: 'pending_review',
        created_by_name: 'marketing_bot',
        content_type: 'single',
        target_audience: 'general',
      });
      if (!error) {
        const ADMIN_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
        if (ADMIN_BOT_TOKEN && ADMIN_CHAT_ID) {
          await sendTelegramMessage(ADMIN_BOT_TOKEN, ADMIN_CHAT_ID,
            `📝 new draft from marketing:\n\n"${tweetDraft.slice(0, 200)}"\n\nreview in admin or reply approve/reject.`
          );
        }
      }
    }

    // Detect pending action
    const replyLower = cleanReply.toLowerCase();
    const isAskingConfirmation = replyLower.includes('want me to') || replyLower.includes('go ahead?') ||
      replyLower.includes('should i') || replyLower.includes('confirm?');

    let pendingAction: any = null;
    if (isAskingConfirmation) {
      pendingAction = { type: 'awaiting_confirmation', summary: 'Pending action from last message' };
    }

    await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, cleanReply);

    // Save conversation
    const context: any = { source: 'marketing_bot' };
    if (pendingAction) context.pending_action = pendingAction;

    await supabase.from('ayn_mind').insert([
      { type: 'marketing_chat', content: userText.slice(0, 4000), context: { source: 'marketing_bot' }, shared_with_admin: true },
      { type: 'marketing_ayn', content: cleanReply.slice(0, 4000), context, shared_with_admin: true },
    ]);

    await logAynActivity(supabase, 'marketing_chat', `Marketing chat: "${userText.slice(0, 80)}"`, {
      target_type: 'marketing',
      details: { user_message: userText.slice(0, 200), has_draft: !!tweetDraft, actions: executedActions },
      triggered_by: 'marketing_bot',
    });

    // Prune old messages into summaries (non-blocking)
    pruneMarketingHistory(supabase, LOVABLE_API_KEY).catch(e => console.error('Prune error:', e));

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('ayn-marketing-webhook error:', error);
    return new Response('OK', { status: 200 });
  }
});

// ─── Execute marketing actions ───
async function executeMarketingAction(
  type: string, params: string, supabase: any, supabaseUrl: string, supabaseKey: string
): Promise<string | null> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    switch (type) {
      case 'scrape_account':
      case 'check_our_twitter': {
        // Pull data from our DB instead of live scraping
        const { data: tweets } = await supabase
          .from('twitter_posts')
          .select('content, impressions, likes, retweets, replies, status, created_at')
          .eq('status', 'posted')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!tweets?.length) return 'no posted tweets in the DB yet — post some and i\'ll track them';

        const totalLikes = tweets.reduce((s: number, t: any) => s + (t.likes || 0), 0);
        const avgLikes = Math.round(totalLikes / tweets.length);
        const topTweet = tweets.sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0))[0];

        let msg = `📊 ${tweets.length} recent posts analyzed\n`;
        msg += `📈 avg: ${avgLikes} likes/post\n`;
        if (topTweet) {
          msg += `🔥 best: "${topTweet.content?.slice(0, 60)}..." (${topTweet.likes || 0}❤️)`;
        }

        if (LOVABLE_API_KEY) {
          const analysis = await analyzeOurTweets(tweets, LOVABLE_API_KEY);
          if (analysis.summary) msg += `\n💡 ${analysis.summary}`;
        }
        return msg;
      }
      case 'analyze_competitors': {
        const { data: competitors } = await supabase
          .from('marketing_competitors').select('id, handle, name').eq('is_active', true);
        if (!competitors?.length) return 'no competitors tracked — tell me who to watch';

        const compIds = competitors.map((c: any) => c.id);
        const { data: compTweets } = await supabase
          .from('competitor_tweets')
          .select('competitor_id, content, likes, retweets')
          .in('competitor_id', compIds)
          .order('scraped_at', { ascending: false })
          .limit(30);

        if (!compTweets?.length) return 'no competitor data yet — add tweet data manually or wait for it to build up';

        const idToHandle: Record<string, string> = {};
        for (const c of competitors) idToHandle[c.id] = c.handle;

        let msg = '👀 competitor check:\n';
        // Group by competitor
        const grouped: Record<string, any[]> = {};
        for (const t of compTweets) {
          const h = idToHandle[t.competitor_id] || 'unknown';
          if (!grouped[h]) grouped[h] = [];
          grouped[h].push(t);
        }
        for (const [handle, tweets] of Object.entries(grouped)) {
          const top = tweets.sort((a: any, b: any) => (b.likes || 0) - (a.likes || 0))[0];
          const avgEng = Math.round(tweets.reduce((s: number, t: any) => s + (t.likes || 0), 0) / tweets.length);
          msg += `\n@${handle}: avg ${avgEng}❤️, top "${top?.content?.slice(0, 50)}..." (${top?.likes || 0}❤️)`;
        }
        return msg;
      }
      case 'website_status': {
        const start = Date.now();
        const res = await fetch('https://ayn-insight-forge.lovable.app', { method: 'HEAD' });
        const time = Date.now() - start;
        return res.ok ? `🌐 site is up (${time}ms)` : `🚨 site returned ${res.status} (${time}ms)`;
      }
      case 'search_tweets': {
        // Search our own DB for matching tweets
        const { data: results } = await supabase
          .from('twitter_posts')
          .select('content, likes, retweets, status')
          .ilike('content', `%${params}%`)
          .order('likes', { ascending: false })
          .limit(5);

        if (!results?.length) return `nothing found for "${params}" in our tweets`;
        let msg = `🔍 matching tweets for "${params}":\n`;
        for (const t of results) {
          msg += `\n• "${t.content?.slice(0, 60)}..." (${t.likes || 0}❤️)`;
        }
        return msg;
      }
      case 'generate_content': {
        // This will be handled by the AI naturally in conversation
        return null;
      }
      default:
        return null;
    }
  } catch (e) {
    console.error(`Marketing action ${type} failed:`, e);
    return `action failed: ${e instanceof Error ? e.message : 'error'}`;
  }
}

// ─── Handle creator photo messages ───
async function handleCreatorPhoto(
  message: any, supabase: any, botToken: string, apiKey: string
): Promise<string | null> {
  try {
    const photo = message.photo[message.photo.length - 1];
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${photo.file_id}`);
    const fileData = await fileRes.json();
    if (!fileData.ok) return "couldn't get that image.";

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const imageRes = await fetch(fileUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const base64Image = arrayBufferToBase64(imageBuffer);
    const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    const caption = message.caption || 'what do you think of this from a marketing perspective?';

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You\'re AYN, looking at an image the creator sent. Give sharp feedback: scroll-stop factor, brand fit (AYN = black/white, minimal, bold), what works, what to fix. Be direct.' },
          { role: 'user', content: [
            { type: 'text', text: caption },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ]},
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return "rate limited — try again in a minute.";
      return "couldn't analyze that.";
    }

    const aiData = await aiRes.json();
    const analysis = aiData.choices?.[0]?.message?.content?.trim() || "couldn't analyze that.";

    await supabase.from('ayn_mind').insert([
      { type: 'marketing_chat', content: `[Photo] ${caption.slice(0, 3000)}`, context: { source: 'marketing_bot', type: 'photo' }, shared_with_admin: true },
      { type: 'marketing_ayn', content: analysis.slice(0, 4000), context: { source: 'marketing_bot', type: 'visual_feedback' }, shared_with_admin: true },
    ]);

    return analysis;
  } catch (e) {
    console.error('Marketing photo handler error:', e);
    return `failed to analyze: ${e instanceof Error ? e.message : 'error'}`;
  }
}

// ─── Image generation ───
async function handleImageGeneration(
  reply: string, supabase: any, apiKey: string, botToken: string, chatId: string
): Promise<{ message: string; image_url?: string }> {
  const lines = reply.split('\n');
  const promptLines: string[] = [];
  const messageLines: string[] = [];
  let pastPrompt = false;

  for (let i = 1; i < lines.length; i++) {
    if (!pastPrompt) {
      if (lines[i].trim() === '') pastPrompt = true;
      else promptLines.push(lines[i]);
    } else {
      messageLines.push(lines[i]);
    }
  }

  const imagePrompt = promptLines.join('\n').trim();
  const userMessage = messageLines.join('\n').trim() || "here's your visual — want me to tweak anything?";

  try {
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [{ role: 'user', content: imagePrompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!imageResponse.ok) {
      await sendTelegramMessage(botToken, chatId, "image gen failed. try describing it differently.");
      return { message: 'image generation failed' };
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      await sendTelegramMessage(botToken, chatId, "image didn't come through. try again.");
      return { message: 'no image generated' };
    }

    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error('Invalid image format');

    const imageFormat = base64Match[1];
    const binaryData = Uint8Array.from(atob(base64Match[2]), (c) => c.charCodeAt(0));
    const filename = `marketing-${Date.now()}.${imageFormat}`;

    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(filename, binaryData, { contentType: `image/${imageFormat}`, upsert: false });

    if (uploadError) throw new Error('Failed to upload image');

    const { data: publicUrlData } = supabase.storage.from('generated-images').getPublicUrl(filename);
    const permanentUrl = publicUrlData.publicUrl;

    await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: permanentUrl, caption: userMessage.slice(0, 1024) }),
    });

    await supabase.from('twitter_posts').insert({
      content: imagePrompt.slice(0, 280),
      status: 'pending_review',
      created_by_name: 'marketing_bot',
      image_url: permanentUrl,
      content_type: 'image',
    });

    const ADMIN_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    if (ADMIN_BOT_TOKEN && ADMIN_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, photo: permanentUrl, caption: `🎨 new marketing image — review in admin.` }),
      });
    }

    return { message: userMessage, image_url: permanentUrl };
  } catch (e) {
    console.error('Image gen error:', e);
    await sendTelegramMessage(botToken, chatId, `image failed: ${e instanceof Error ? e.message : 'error'}`);
    return { message: 'image generation failed' };
  }
}

// ─── Save conversation ───
async function saveMarketingExchange(supabase: any, userMsg: string, aynMsg: string, imageUrl?: string) {
  const context: any = { source: 'marketing_bot' };
  if (imageUrl) context.image_url = imageUrl;

  await supabase.from('ayn_mind').insert([
    { type: 'marketing_chat', content: userMsg.slice(0, 4000), context: { source: 'marketing_bot' }, shared_with_admin: true },
    { type: 'marketing_ayn', content: aynMsg.slice(0, 4000), context, shared_with_admin: true },
  ]);
}

// ─── Load conversation history (summaries + recent messages) ───
async function getMarketingHistory(supabase: any) {
  const history: { role: string; content: string }[] = [];

  // 1. Load all summaries as long-term memory
  const { data: summaries } = await supabase
    .from('ayn_mind')
    .select('content, created_at')
    .eq('type', 'marketing_summary')
    .order('created_at', { ascending: true });

  if (summaries?.length) {
    const summaryText = summaries.map((s: any) => s.content).join('\n\n');
    history.push({
      role: 'system',
      content: `[CONVERSATION MEMORY — summarized from older messages]\n${summaryText}`,
    });
  }

  // 2. Load latest 50 live messages
  const { data: exchanges } = await supabase
    .from('ayn_mind')
    .select('type, content, context, created_at')
    .in('type', ['marketing_chat', 'marketing_ayn'])
    .order('created_at', { ascending: true })
    .limit(50);

  if (exchanges?.length) {
    for (const entry of exchanges) {
      let content = entry.content;
      const pending = entry.context?.pending_action;
      if (pending && typeof pending === 'object' && pending.type === 'awaiting_confirmation') {
        content += `\n[PENDING: Waiting for confirmation to ${pending.summary || 'execute action'}]`;
      }
      history.push({
        role: entry.type === 'marketing_chat' ? 'user' : 'assistant',
        content,
      });
    }
  }
  return history;
}

// ─── Prune old marketing messages into summaries ───
async function pruneMarketingHistory(supabase: any, apiKey: string) {
  // Count total marketing_chat + marketing_ayn entries
  const { count } = await supabase
    .from('ayn_mind')
    .select('id', { count: 'exact', head: true })
    .in('type', ['marketing_chat', 'marketing_ayn']);

  if (!count || count <= 100) return;

  console.log(`[PRUNE] Marketing history at ${count} entries — summarizing oldest 30`);

  // Get oldest 30 entries
  const { data: oldest } = await supabase
    .from('ayn_mind')
    .select('id, type, content, created_at')
    .in('type', ['marketing_chat', 'marketing_ayn'])
    .order('created_at', { ascending: true })
    .limit(30);

  if (!oldest?.length) return;

  // Build conversation text for summarization
  const conversationText = oldest
    .map((e: any) => `[${e.type === 'marketing_chat' ? 'Creator' : 'AYN'}] ${e.content}`)
    .join('\n');

  const dateRange = `${oldest[0].created_at?.split('T')[0]} to ${oldest[oldest.length - 1].created_at?.split('T')[0]}`;

  // Summarize with Gemini
  const summaryRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a conversation summarizer. Condense the following marketing team conversation into a compact paragraph. Preserve: key decisions, content strategies discussed, brand guidelines mentioned, any pending tasks or ideas, and important context. Be concise but thorough. Output ONLY the summary paragraph.',
        },
        { role: 'user', content: `Summarize this conversation (${dateRange}):\n\n${conversationText}` },
      ],
      max_tokens: 500,
    }),
  });

  if (!summaryRes.ok) {
    console.error('[PRUNE] Summary generation failed:', summaryRes.status);
    return;
  }

  const summaryData = await summaryRes.json();
  const summary = summaryData.choices?.[0]?.message?.content?.trim();
  if (!summary) return;

  // Save summary
  await supabase.from('ayn_mind').insert({
    type: 'marketing_summary',
    content: `[${dateRange}] ${summary}`,
    context: { source: 'auto_prune', entries_summarized: oldest.length },
    shared_with_admin: true,
  });

  // Delete originals
  const idsToDelete = oldest.map((e: any) => e.id);
  await supabase.from('ayn_mind').delete().in('id', idsToDelete);

  console.log(`[PRUNE] Summarized ${oldest.length} entries, saved as marketing_summary`);
}

// ─── Extract tweet draft ───
function extractTweetDraft(reply: string): string | null {
  const draftMatch = reply.match(/(?:draft|tweet|post|copy):\s*["""](.+?)["""]/is);
  if (draftMatch && draftMatch[1].length <= 280) return draftMatch[1].trim();

  const boldMatch = reply.match(/\*\*(.{20,280})\*\*/);
  if (boldMatch && !boldMatch[1].includes('option') && !boldMatch[1].includes('Option')) {
    return boldMatch[1].trim();
  }

  return null;
}
