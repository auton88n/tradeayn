import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      post_id,
      tweet_text,
      background_color = "white",
      header_text,
      accent_color = "#0EA5E9",
      include_logo = true,
      cta_text = "",
    } = await req.json();

    if (!post_id || !tweet_text) {
      return new Response(JSON.stringify({ error: "post_id and tweet_text are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const displayText = header_text || tweet_text;

    // Build background instruction
    const bgMap: Record<string, string> = {
      white: "Clean white/light background with subtle light gray engineering grid lines and geometric blueprint patterns",
      dark: "Dark navy/charcoal background (#1a1a2e) with subtle glowing grid lines in dark blue",
      blue: `Gradient background using brand blue (${accent_color}) fading to a darker shade, with subtle geometric patterns`,
    };
    const bgInstruction = bgMap[background_color] || bgMap.white;

    // Build logo instruction
    const logoInstruction = include_logo
      ? "Include the AYN brand eye symbol (a stylized eye/brain icon) subtly in the bottom-right corner as a watermark"
      : "Do NOT include any logo or watermark";

    // Build CTA instruction
    const ctaInstruction = cta_text
      ? `Include a call-to-action button or text at the bottom: "${cta_text}" styled as a pill-shaped element with the accent color`
      : "";

    // Text color based on background
    const textColor = background_color === "dark" || background_color === "blue"
      ? "white/light text for readability"
      : "dark charcoal/black text for readability";

    const imagePrompt = `Create a professional 1080x1080 social media marketing image for an AI engineering platform called AYN.

Design requirements:
- ${bgInstruction}
- The following text should be displayed in a small, elegant sans-serif font at moderate size (occupying about 30% of the image, NOT large or oversized): "${displayText}"
- Text color: ${textColor}, with select keywords highlighted in accent color (${accent_color})
- ${logoInstruction}
- Generous whitespace around the text, clean layout with text centered vertically
- Professional, polished, and elegant — suitable for Twitter/X and Instagram
- The text must be fully legible, well-spaced, and not cut off
- Do NOT make the text large or bold — keep it refined and understated
${ctaInstruction ? `- ${ctaInstruction}` : ""}`;

    console.log("Generating image for post:", post_id, "bg:", background_color);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      throw new Error("Image generation failed");
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) throw new Error("No image generated");

    // Extract base64 data and upload to storage
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image format returned");

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const filename = `tweet-${post_id}-${Date.now()}.${imageFormat}`;

    console.log("Uploading image to storage:", filename, "size:", binaryData.length);

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(filename, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    const { data: publicUrlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(filename);

    const permanentUrl = publicUrlData.publicUrl;

    // Update the twitter_posts row
    const { error: updateError } = await supabase
      .from("twitter_posts")
      .update({ image_url: permanentUrl })
      .eq("id", post_id);

    if (updateError) {
      console.error("DB update error:", updateError);
      throw new Error("Failed to save image URL");
    }

    console.log("Image generated and saved:", permanentUrl);

    return new Response(
      JSON.stringify({ image_url: permanentUrl, filename }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("twitter-generate-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
