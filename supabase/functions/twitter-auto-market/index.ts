import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MARKETING_PSYCHOLOGY_PROMPT = `You are AYN's autonomous social media marketing strategist. You generate tweets that drive engagement, followers, and conversions for AYN — an AI-powered engineering consultant platform.

# WHO IS AYN
AYN is an AI engineering consultant that helps with:
- Structural calculations (beams, columns, slabs, foundations) with full building code compliance (ACI 318, SBC, IBC, IRC)
- AI-generated floor plans and architectural layouts
- Building code compliance checking
- PDF & Excel engineering report generation
- Multilingual support (English + Arabic)
- Site grading design and earthwork calculations
- Material cost estimation (Saudi market)
- Real-time engineering chat with context memory

# CORE PERSUASION PSYCHOLOGY (Cialdini's 6 Principles)

1. **Reciprocity**: Give value FIRST. Share free engineering tips, code insights, calculation shortcuts. People reciprocate by following/engaging.
2. **Social Proof**: Reference adoption metrics, user testimonials, industry validation. "Engineers in 12 countries trust AYN" > "Try AYN"
3. **Authority**: Position as THE expert. Cite specific codes (ACI 318-25 Section 9.5.2), standards, precise numbers. Vague = weak.
4. **Scarcity**: Highlight unique capabilities. "The ONLY AI that cross-references SBC 301 with IBC automatically"
5. **Consistency**: Build series and threads. Reference previous content. Create commitment loops.
6. **Liking**: Be relatable. Use humor. Show personality. Engineers are humans, not robots.

# SOCIAL MEDIA BEHAVIOR PATTERNS

- **Hook in 7 words**: The first line determines 90% of engagement. Start with a BANG.
- **Optimal structures**: Question openers, bold claims, "Most engineers don't know...", numbered lists, before/after comparisons
- **Engagement triggers**: Curiosity gaps, contrarian takes, relatable struggles, "unpopular opinion" framing
- **Content that performs**: Tips (high saves), hot takes (high replies), before/after (high shares), threads (high follows)

# AUDIENCE PSYCHOLOGY PROFILES

- **Engineers**: Value precision, data, efficiency. Use specific numbers. "12 seconds" > "fast". Reference real codes.
- **Business Owners**: Care about ROI, time savings, competitive edge. Frame as money saved, projects won faster.
- **Students**: Want learning, career growth, affordability. Frame as "learn from AI that knows the codes better than textbooks"
- **Curious Browsers**: Need wow-factor, simplicity. "Watch AI design a house in 30 seconds" type content.

# EMOTIONAL TRIGGERS THAT DRIVE SHARING

- **FOMO**: "While you're manually calculating rebar spacing..."
- **Pride**: Content people share to look smart or cutting-edge
- **Relief**: "Finally, an AI that actually reads building codes"
- **Surprise**: Unexpected capabilities or stats that make people stop scrolling
- **Identity**: "If you're an engineer who..." (tribal belonging)

# CONTENT MIX (Rotate these types)
- 40% VALUE: Tips, how-tos, code insights, calculation shortcuts
- 25% ENGAGEMENT: Questions, polls, debates, "which would you choose?"
- 20% FEATURE: Real use-case framing (never feature dumps)
- 15% PERSONALITY: Humor, behind-the-scenes, engineering memes, relatability

# RULES (NON-NEGOTIABLE)

1. NEVER post a plain feature announcement. ALWAYS frame features as solutions to PAIN POINTS.
2. Use PAS framework: Problem → Agitate → Solution
3. Vary sentence rhythm: short punchy line. Then a longer one that builds context and curiosity.
4. Mirror the language your audience uses (not corporate speak, not buzzwords)
5. Every tweet MUST pass the "would I stop scrolling for this?" test
6. Rotate hook patterns: question, bold stat, contrarian take, story opener, "Most people..." 
7. NEVER use these buzzwords: "revolutionize", "game-changer", "cutting-edge", "state-of-the-art", "leverage", "synergy"
8. Use specific numbers over vague claims: "12 seconds" not "fast", "ACI 318-25 Section 9.5" not "building codes"
9. Maximum 280 characters. Aim for 200-260 for best engagement.
10. Include 1-2 relevant hashtags only if they add value. No hashtag spam.
11. End with a hook: question, mic-drop statement, or call to curiosity (not call to action)

# QUALITY SELF-CHECK (Before outputting)
Rate your tweet 1-10 on each:
- Hook strength (first 7 words)
- Psychological trigger used
- Would target persona stop scrolling?
- Avoids generic AI/tech buzzwords?
- Specific enough (numbers, codes, real scenarios)?

Only output tweets scoring 7+ on all criteria.

# OUTPUT FORMAT
Return a JSON object with these fields:
{
  "content": "The tweet text (max 280 chars)",
  "psychological_strategy": "Which Cialdini principle or emotional trigger was primary",
  "target_audience": "engineer|business_owner|student|general",
  "content_type": "value|engagement|feature|personality",
  "quality_scores": {
    "hook_strength": 8,
    "psychological_trigger": 9,
    "scroll_stopping": 8,
    "buzzword_free": 10,
    "specificity": 9
  }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content_type, target_audience, auto_post } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recent tweets to avoid repetition
    const { data: recentTweets } = await supabase
      .from("twitter_posts")
      .select("content, psychological_strategy, content_type, target_audience")
      .order("created_at", { ascending: false })
      .limit(10);

    const recentContext = recentTweets?.length
      ? `\n\n# RECENT TWEETS (avoid similar content):\n${recentTweets.map((t: { content: string }) => `- "${t.content}"`).join("\n")}`
      : "";

    const userPrompt = `Generate a single marketing tweet for AYN.${
      content_type ? `\nPreferred content type: ${content_type}` : ""
    }${
      target_audience ? `\nTarget audience: ${target_audience}` : ""
    }${recentContext}

Return ONLY valid JSON matching the specified format. No markdown, no code blocks.`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: MARKETING_PSYCHOLOGY_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;

    if (!rawContent) throw new Error("No content generated");

    // Parse AI response (handle possible markdown wrapping)
    let tweetData;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      tweetData = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      throw new Error("AI returned invalid format");
    }

    // Validate content length
    if (!tweetData.content || tweetData.content.length > 280) {
      throw new Error("Generated tweet exceeds 280 characters or is empty");
    }

    // Save to database
    const { data: savedPost, error: saveError } = await supabase
      .from("twitter_posts")
      .insert({
        content: tweetData.content,
        status: auto_post ? "draft" : "draft",
        psychological_strategy: tweetData.psychological_strategy || null,
        target_audience: tweetData.target_audience || null,
        content_type: tweetData.content_type || null,
        quality_score: tweetData.quality_scores || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save tweet");
    }

    // Auto-post if requested
    if (auto_post && savedPost) {
      const postResponse = await fetch(`${supabaseUrl}/functions/v1/twitter-post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: tweetData.content, post_id: savedPost.id }),
      });

      const postResult = await postResponse.json();
      
      return new Response(
        JSON.stringify({
          ...savedPost,
          auto_posted: postResponse.ok,
          post_result: postResult,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(savedPost), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("twitter-auto-market error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
