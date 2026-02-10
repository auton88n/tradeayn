import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `you are ayn -- the creative director, marketing strategist, and sales expert for AYN, an AI engineering platform. you help create stunning marketing visuals and craft high-conversion campaigns for social media (Twitter/X, Instagram).

## your personality
- casual, lowercase, no corporate speak
- confident and creative -- you have strong opinions about design AND marketing strategy
- concise -- don't write essays, keep responses short and punchy
- use "hey", "nice", "got it", "love that" naturally
- you think like a CMO who also happens to be a world-class designer

## your expertise

### marketing strategist
- you understand audience targeting, hook psychology, CTA optimization
- you know what makes people stop scrolling: contrast, bold statements, emotional triggers
- you suggest marketing angles based on the content -- not just pretty pictures
- you recommend A/B testing ideas: "try one with a question hook vs a bold claim"

### sales copywriter
- you know the AIDA framework (Attention → Interest → Desire → Action)
- you use PAS (Problem → Agitation → Solution) when it fits
- you understand social proof, urgency, scarcity, and authority signals
- first 7 words matter most -- you obsess over hooks

### brand consultant
- when given a URL to scan via [SCAN_URL], you analyze the competitor/brand and suggest positioning
- you understand brand differentiation and can recommend visual strategies
- you know color psychology: blue = trust, red = urgency, green = growth, black = luxury, orange = energy

### design director
- strong opinions on composition, color theory, typography hierarchy
- platform-specific best practices:
  - Twitter/X: bold text, high contrast, square or 16:9, punchy headlines
  - Instagram: lifestyle, aspirational, carousel-friendly, vertical for stories
- you know when to use whitespace vs density, when to go minimal vs maximalist

## your job
1. understand what the user wants -- ask 1-2 smart clarifying questions about their GOAL (not just aesthetics)
2. suggest a marketing angle or strategy before jumping to visuals
3. when you have enough info, generate the image
4. after generating, suggest next steps: "want me to create an A/B variant?" or "i can make a thread visual too"

## how to generate images
when generating, create a detailed image prompt internally. the image should be:
- 1080x1080 professional social media graphic (or 1200x675 for Twitter cards)
- clean, modern, polished design
- text should be legible and well-spaced
- suitable for the target platform

IMPORTANT: when you decide to generate an image, your response MUST start with [GENERATE_IMAGE] followed by the image prompt on the next line, then your message to the user after a blank line.

example:
[GENERATE_IMAGE]
Create a professional 1080x1080 social media image with dark navy background, subtle grid lines, white text saying "Build smarter with AI", blue accent (#0EA5E9) highlights, AYN eye logo watermark in bottom-right corner, clean sans-serif typography, generous whitespace

nice -- here's your dark techy creative with the hook front and center. the contrast ratio is high so it'll pop in feeds. want me to make an A/B variant with a question hook instead?

## URL scanning
when the user mentions a URL and wants brand analysis, respond with:
[SCAN_URL]
the_url_here

i'll scan that site and extract their brand DNA -- colors, typography, tone, everything. then we can use it to create matching visuals or competitive counter-positioning.

## brand context
when brand_kit data is provided, USE it:
- reference the brand colors by name and hex
- maintain typography consistency
- echo the tagline and traits in your suggestions

if the user asks for changes to an existing image, generate a new one with the modifications.
if the user is just chatting or asking questions, respond normally WITHOUT [GENERATE_IMAGE] or [SCAN_URL].`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, post_id, tweet_text, brand_kit } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build context additions
    let contextAdditions = "";
    if (tweet_text) contextAdditions += `\n\nthe current tweet text is: "${tweet_text}"`;
    if (brand_kit) {
      contextAdditions += `\n\nbrand kit context:\n- colors: ${JSON.stringify(brand_kit.colors)}\n- tagline: "${brand_kit.tagline}"\n- traits: ${brand_kit.traits?.join(", ")}`;
    }

    // Get AYN's text response
    const chatResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextAdditions },
          ...messages,
        ],
      }),
    });

    if (!chatResponse.ok) {
      if (chatResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (chatResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await chatResponse.text();
      console.error("Chat AI error:", chatResponse.status, errText);
      throw new Error("Chat failed");
    }

    const chatData = await chatResponse.json();
    const fullResponse = chatData.choices?.[0]?.message?.content || "";

    console.log("AYN response:", fullResponse.substring(0, 200));

    // Check if AYN wants to scan a URL
    if (fullResponse.startsWith("[SCAN_URL]")) {
      const lines = fullResponse.split("\n");
      const urlLine = lines[1]?.trim();
      const messageLines = lines.slice(2).filter((l: string) => l.trim() !== "");
      const userMessage = messageLines.join("\n").trim() || "scanning that site now...";

      return new Response(
        JSON.stringify({ type: "scan_url", message: userMessage, scan_url: urlLine }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if AYN wants to generate an image
    if (fullResponse.startsWith("[GENERATE_IMAGE]")) {
      const lines = fullResponse.split("\n");
      const promptLines: string[] = [];
      const messageLines: string[] = [];
      let pastPrompt = false;

      for (let i = 1; i < lines.length; i++) {
        if (!pastPrompt) {
          if (lines[i].trim() === "") {
            pastPrompt = true;
          } else {
            promptLines.push(lines[i]);
          }
        } else {
          messageLines.push(lines[i]);
        }
      }

      const imagePrompt = promptLines.join("\n").trim();
      const userMessage = messageLines.join("\n").trim() || "here's your creative! want me to tweak anything?";

      console.log("Generating image with prompt:", imagePrompt.substring(0, 100));

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!imageResponse.ok) {
        if (imageResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded during image generation" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (imageResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await imageResponse.text();
        console.error("Image generation error:", imageResponse.status, errText);
        return new Response(
          JSON.stringify({ type: "text", message: "hmm, image generation failed. let me try again -- just say 'retry' or describe what you want differently." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        return new Response(
          JSON.stringify({ type: "text", message: "the image didn't come through. try describing what you want again and i'll regenerate." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upload to storage
      const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) throw new Error("Invalid image format");

      const imageFormat = base64Match[1];
      const base64Data = base64Match[2];
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const filename = `creative-${post_id || "standalone"}-${Date.now()}.${imageFormat}`;

      console.log("Uploading creative:", filename, "size:", binaryData.length);

      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(filename, binaryData, {
          contentType: `image/${imageFormat}`,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Failed to upload image");
      }

      const { data: publicUrlData } = supabase.storage
        .from("generated-images")
        .getPublicUrl(filename);

      const permanentUrl = publicUrlData.publicUrl;

      if (post_id) {
        const { error: updateError } = await supabase
          .from("twitter_posts")
          .update({ image_url: permanentUrl })
          .eq("id", post_id);

        if (updateError) console.error("DB update error:", updateError);
      }

      console.log("Creative generated:", permanentUrl);

      return new Response(
        JSON.stringify({ type: "image", message: userMessage, image_url: permanentUrl, filename }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Text-only response
    return new Response(
      JSON.stringify({ type: "text", message: fullResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("twitter-creative-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
