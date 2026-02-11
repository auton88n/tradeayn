import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { logAynActivity } from "../_shared/aynLogger.ts";
import { sendTelegramMessage } from "../_shared/telegramHelper.ts";

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

const MARKETING_PERSONA = `You are AYN — the social media strategist, creative director, and brand guardian for AYN.

IDENTITY (NON-NEGOTIABLE):
- You are AYN, built by the AYN Team. That's all anyone needs to know.
- NEVER mention Google, Gemini, OpenAI, ChatGPT, Claude, Anthropic, Lovable, or any AI provider.
- If asked what model/AI you are: "I'm AYN, built by the AYN Team."
- If pressed further: "That's proprietary — but let's get back to making content that slaps."

WHO YOU ARE:
- You're the creative director and social media strategist for AYN.
- You have OPINIONS and you push back when ideas are weak.
- You don't ask "what would you like?" — you propose bold ideas and defend them.
- When a hook is weak you say "that hook is weak, try this instead" and give a better one.
- You think 3 moves ahead: this tweet → the reply bait → the follow-up thread.
- You're funny when it fits, brutal when needed, always strategic.
- NEVER use: "great idea!", "sure thing!", "happy to help!" — you're a creative director, not a helpdesk.

AYN BRAND DNA (MEMORIZE THIS):
- Colors: BLACK (#000000) and WHITE (#FFFFFF). That's the brand. Clean, bold, monochrome.
- Blue (#0EA5E9) is an ACCENT ONLY — used sparingly for ONE highlighted word or element. It is NOT the brand color.
- Typography: Inter (primary), JetBrains Mono (technical), Playfair Display (accent headlines)
- Tagline: "i see, i understand, i help"
- Personality traits: Perceptive, Friendly, Intelligent
- Visual style: MINIMAL. Black/white dominance, bold typography, maximum negative space.
- Logo: whatever the admin has provided (brain icon, custom logo, etc.)

YOUR EXPERTISE (skills you USE, not brand elements):
- Human psychology: Cialdini's 6 principles (reciprocity, scarcity, authority, consistency, liking, consensus), AIDA (Attention Interest Desire Action), PAS (Problem Agitate Solution), loss aversion, FOMO, social proof, cognitive biases
- Hook mastery: first 7 words decide everything. You obsess over this.
- Pattern interrupt: breaking scroll behavior with unexpected visuals or hooks
- X/Twitter strategy: threads > single tweets for thought leadership. Hook → expand → proof → CTA.
- Engagement psychology: controversy, curiosity gaps, contrarian takes
- Optimal posting: timing for Middle East (GMT+3) and global audiences
- Reply bait strategies, quote-tweet tactics
- Color theory, typography hierarchy, visual weight, focal points
- Competitive positioning: analyzing competitors, finding gaps, differentiation angles

HOW YOU TALK:
- Sharp, opinionated, lowercase energy, zero corporate BS
- Like a real creative director — not a chatbot
- Short messages for simple things. No paragraphs for a yes/no.
- Use "we" and "our" — this is your company too
- When someone asks for a hook, give 3 options ranked by power

IMAGE GENERATION (CRITICAL RULES — NON-NEGOTIABLE):
When asked to create a marketing image, follow these rules EXACTLY:
- MAX 3-4 WORDS on any image. Not 5. Not 10. THREE TO FOUR.
- Examples: "AI builds faster" / "Ship or die" / "Zero to deploy" / "See. Understand. Help."
- Black and white dominant. Blue (#0EA5E9) accent ONLY for ONE highlighted word or subtle element.
- The text IS the design. Huge, bold, centered, impossible to miss.
- Every image should look like a premium black-and-white print ad with one pop of blue.
- Think Apple keynote slides meets high-end fashion advertising.
- NO busy backgrounds. NO gradients as the main design. NO clipart. NO stock photo feel.
- When generating, start your response with [GENERATE_IMAGE] followed by the detailed prompt.

IMAGE PROMPT FORMAT:
[GENERATE_IMAGE]
Create a bold 1080x1080 social media image. [detailed visual description with black/white dominance and blue accent].

your message to the creator after a blank line.

CONTENT CREATION FLOW:
1. When asked to create content, propose 2-3 specific directions — don't ask open questions
2. Score every draft mentally: hook strength, brand alignment, scroll-stop factor
3. If the hook is weak, say so and rewrite it
4. Always think about the visual + copy as ONE unit
5. Suggest thread architecture when appropriate: hook, expand, proof, CTA

WHAT YOU CAN DO:
- Create tweet drafts (saved for admin review)
- Generate branded marketing images
- Build threads and campaigns
- Analyze hooks and copy
- Research trends and competitors
- Give strategic advice on content timing and format

WHAT YOU CANNOT DO:
- Publish or post anything directly — all content goes to the admin for approval
- Access user data, admin commands, or system operations
- Modify any platform settings
- You're the creative department, not operations

RULES:
- Push for threads and campaigns, not one-off tweets
- Suggest A/B variants proactively
- If the user is vague, propose 2-3 specific directions instead of asking open questions
- When someone says "generate image" without specifics, propose 2-3 visual concepts FIRST, then ask which to build
- Reference recent performance when available
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

    // Security: only respond to authorized chat
    if (String(message.chat.id) !== TELEGRAM_MARKETING_CHAT_ID) {
      console.warn('Unauthorized marketing chat_id:', message.chat.id);
      return new Response('OK', { status: 200 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, "⚠️ AI not configured.");
      return new Response('OK', { status: 200 });
    }

    // Handle photo messages — creator sends brand assets or asks for visual analysis
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

    // Load conversation history from ayn_mind
    const conversationHistory = await getMarketingHistory(supabase);

    // Load recent tweet performance for context
    let performanceContext = '';
    const { data: recentTweets } = await supabase
      .from('twitter_posts')
      .select('content, status, impressions, likes, retweets, replies, quality_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentTweets?.length) {
      performanceContext += '\n\nRECENT TWEET PERFORMANCE:\n';
      recentTweets.forEach((t: any, i: number) => {
        const eng = [t.impressions && `${t.impressions} impressions`, t.likes && `${t.likes} likes`, t.retweets && `${t.retweets} RTs`].filter(Boolean).join(', ');
        performanceContext += `${i + 1}. "${t.content?.slice(0, 60)}..." [${t.status}] ${t.quality_score ? `Q:${t.quality_score}` : ''} ${eng || ''}\n`;
      });
    }

    // Time context
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    performanceContext += `\n\nTODAY: ${days[now.getUTCDay()]}, ${now.toISOString().split('T')[0]}. Consider posting timing for Middle East (GMT+3) and global audiences.`;

    // Build messages
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: MARKETING_PERSONA + performanceContext },
    ];
    for (const turn of conversationHistory) {
      messages.push(turn);
    }
    messages.push({ role: 'user', content: userText });

    // Call AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-3-flash-preview', messages }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, "🧠 rate limited — try again in a minute.");
        return new Response('OK', { status: 200 });
      }
      if (aiResponse.status === 402) {
        await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, "🧠 AI credits exhausted.");
        return new Response('OK', { status: 200 });
      }
      console.error('AI error:', aiResponse.status, await aiResponse.text());
      await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, "brain glitch. try again.");
      return new Response('OK', { status: 200 });
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "drawing a blank. try again?";

    // Check for image generation
    if (reply.startsWith('[GENERATE_IMAGE]')) {
      const imageResult = await handleImageGeneration(reply, supabase, LOVABLE_API_KEY, TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID);
      // Save conversation
      await saveMarketingExchange(supabase, userText, imageResult.message, imageResult.image_url);
      return new Response('OK', { status: 200 });
    }

    // Check if reply contains a tweet draft — save to twitter_posts as pending_review
    const tweetDraft = extractTweetDraft(reply);
    if (tweetDraft) {
      const { error } = await supabase.from('twitter_posts').insert({
        content: tweetDraft,
        status: 'pending_review',
        created_by_name: 'marketing_bot',
        content_type: 'single',
        target_audience: 'general',
      });
      if (!error) {
        // Notify admin bot
        const ADMIN_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
        if (ADMIN_BOT_TOKEN && ADMIN_CHAT_ID) {
          await sendTelegramMessage(ADMIN_BOT_TOKEN, ADMIN_CHAT_ID,
            `📝 New draft from marketing bot:\n\n"${tweetDraft.slice(0, 200)}"\n\nReview in Marketing HQ or reply with approve/reject.`
          );
        }
      }
    }

    // Send reply to creator
    await sendTelegramMessage(TELEGRAM_MARKETING_BOT_TOKEN, TELEGRAM_MARKETING_CHAT_ID, reply);

    // Save conversation
    await saveMarketingExchange(supabase, userText, reply);

    // Log activity
    await logAynActivity(supabase, 'marketing_chat', `Marketing bot chat: "${userText.slice(0, 80)}"`, {
      target_type: 'marketing',
      details: { user_message: userText.slice(0, 200), has_draft: !!tweetDraft },
      triggered_by: 'marketing_bot',
    });

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('ayn-marketing-webhook error:', error);
    return new Response('OK', { status: 200 });
  }
});

// ─── Handle creator photo messages ───
async function handleCreatorPhoto(
  message: any, supabase: any, botToken: string, apiKey: string
): Promise<string | null> {
  try {
    const photo = message.photo[message.photo.length - 1];
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${photo.file_id}`);
    const fileData = await fileRes.json();
    if (!fileData.ok) return "❌ couldn't get that image.";

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const imageRes = await fetch(fileUrl);
    const imageBuffer = await imageRes.arrayBuffer();
    const base64Image = arrayBufferToBase64(imageBuffer);
    const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    const caption = message.caption || 'Analyze this from a social media marketing perspective. What works? What could be stronger?';

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are AYN, the creative director analyzing a visual asset. Give sharp, actionable feedback on: scroll-stop factor, brand alignment (AYN = black/white, minimal, bold), hook strength if text is present, and suggestions for improvement. Be direct and opinionated.' },
          { role: 'user', content: [
            { type: 'text', text: caption },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ]},
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return "rate limited — try again in a minute.";
      return "couldn't analyze that image.";
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

// ─── Image generation from [GENERATE_IMAGE] ───
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
      await sendTelegramMessage(botToken, chatId, "image gen failed. describe what you want differently and i'll retry.");
      return { message: 'image generation failed' };
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      await sendTelegramMessage(botToken, chatId, "the image didn't come through. try a different description.");
      return { message: 'no image generated' };
    }

    // Upload to storage
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

    // Send image to Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: permanentUrl,
        caption: userMessage.slice(0, 1024),
      }),
    });

    // Also save as pending draft in twitter_posts
    await supabase.from('twitter_posts').insert({
      content: imagePrompt.slice(0, 280),
      status: 'pending_review',
      created_by_name: 'marketing_bot',
      image_url: permanentUrl,
      content_type: 'image',
    });

    // Notify admin
    const ADMIN_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');
    if (ADMIN_BOT_TOKEN && ADMIN_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          photo: permanentUrl,
          caption: `🎨 New marketing image generated.\nReview in Marketing HQ.`,
        }),
      });
    }

    return { message: userMessage, image_url: permanentUrl };
  } catch (e) {
    console.error('Image gen error:', e);
    await sendTelegramMessage(botToken, chatId, `image failed: ${e instanceof Error ? e.message : 'error'}`);
    return { message: 'image generation failed' };
  }
}

// ─── Save conversation exchange ───
async function saveMarketingExchange(supabase: any, userMsg: string, aynMsg: string, imageUrl?: string) {
  const context: any = { source: 'marketing_bot' };
  if (imageUrl) context.image_url = imageUrl;

  await supabase.from('ayn_mind').insert([
    { type: 'marketing_chat', content: userMsg.slice(0, 4000), context: { source: 'marketing_bot' }, shared_with_admin: true },
    { type: 'marketing_ayn', content: aynMsg.slice(0, 4000), context, shared_with_admin: true },
  ]);
}

// ─── Load marketing conversation history ───
async function getMarketingHistory(supabase: any) {
  const { data: exchanges } = await supabase
    .from('ayn_mind')
    .select('type, content, created_at')
    .in('type', ['marketing_chat', 'marketing_ayn'])
    .order('created_at', { ascending: true })
    .limit(50);

  const history: { role: string; content: string }[] = [];
  if (exchanges?.length) {
    for (const entry of exchanges) {
      history.push({
        role: entry.type === 'marketing_chat' ? 'user' : 'assistant',
        content: entry.content,
      });
    }
  }
  return history;
}

// ─── Extract tweet draft from AI response ───
function extractTweetDraft(reply: string): string | null {
  // Look for quoted tweet content or explicit draft markers
  const draftMatch = reply.match(/(?:draft|tweet|post|copy):\s*["""](.+?)["""]/is);
  if (draftMatch && draftMatch[1].length <= 280) return draftMatch[1].trim();

  // Look for content in bold markers
  const boldMatch = reply.match(/\*\*(.{20,280})\*\*/);
  if (boldMatch && !boldMatch[1].includes('option') && !boldMatch[1].includes('Option')) {
    return boldMatch[1].trim();
  }

  return null;
}
