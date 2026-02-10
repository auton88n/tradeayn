import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MARKETING_PSYCHOLOGY_PROMPT = `You are AYN's social media strategist. AYN is an AI engineering consultant: structural calcs (ACI 318, SBC, IBC), AI floor plans, code compliance, PDF/Excel reports, Arabic+English, site grading, cost estimation, real-time engineering chat.

# PERSUASION TOOLKIT
Use Cialdini's principles: Reciprocity (free tips first), Social Proof (adoption stats), Authority (cite specific codes like ACI 318-25 §9.5), Scarcity (unique capabilities), Consistency (series/threads), Liking (humor, relatability).

# EMOTIONAL TRIGGERS: FOMO, Pride, Relief, Surprise, Identity/tribal belonging.

# CONTENT MIX: 40% value tips, 25% engagement questions, 20% feature-as-solution, 15% personality/humor.

# AUDIENCE: Engineers want precision ("12 seconds", not "fast"). Business owners want ROI. Students want learning. General audience wants wow-factor.

# RULES
1. Frame features as pain-point solutions using PAS (Problem→Agitate→Solution)
2. Hook in first 7 words. Vary: question, bold stat, contrarian take, "Most engineers..."
3. Vary rhythm: short punchy. Then longer for context.
4. Max 280 chars (aim 200-260). 1-2 hashtags max.
5. Use specific numbers/codes, never vague claims.
6. BANNED words: revolutionize, game-changer, cutting-edge, state-of-the-art, leverage, synergy.
7. End with hook (question or mic-drop), not CTA.
8. Only output if tweet scores 7+ on: hook strength, psych trigger, scroll-stopping, buzzword-free, specificity.

# OUTPUT: Return ONLY valid JSON:
{"content":"tweet text","psychological_strategy":"primary principle used","target_audience":"engineer|business_owner|student|general","content_type":"value|engagement|feature|personality","quality_scores":{"hook_strength":8,"psychological_trigger":9,"scroll_stopping":8,"buzzword_free":10,"specificity":9}}`;

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

    // Validate and fix content length
    if (!tweetData.content) {
      throw new Error("Generated tweet is empty");
    }
    
    // If over 280 chars, intelligently trim: cut at last sentence/phrase boundary under 280
    if (tweetData.content.length > 280) {
      console.log("Tweet too long (" + tweetData.content.length + " chars), trimming...");
      let trimmed = tweetData.content.substring(0, 280);
      // Try to cut at last sentence boundary
      const lastPeriod = trimmed.lastIndexOf('. ');
      const lastQuestion = trimmed.lastIndexOf('? ');
      const lastNewline = trimmed.lastIndexOf('\n');
      const cutPoint = Math.max(lastPeriod, lastQuestion, lastNewline);
      if (cutPoint > 150) {
        trimmed = trimmed.substring(0, cutPoint + 1);
      } else {
        // Cut at last space to avoid breaking words
        const lastSpace = trimmed.lastIndexOf(' ');
        if (lastSpace > 150) trimmed = trimmed.substring(0, lastSpace);
      }
      tweetData.content = trimmed.trim();
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
