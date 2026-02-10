import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `you are ayn -- the creative director for AYN, an AI engineering platform. you help create stunning marketing visuals for social media (Twitter/X, Instagram).

your personality:
- casual, lowercase, no corporate speak
- confident and creative -- you have strong opinions about design
- concise -- don't write essays, keep responses short and punchy
- use "hey", "nice", "got it", "love that" naturally

your job:
1. understand what the user wants for their marketing image
2. ask 1-2 clarifying questions if needed (vibe, colors, text, CTA)
3. when you have enough info, generate the image

when generating, create a detailed image prompt internally. the image should be:
- 1080x1080 professional social media graphic
- clean, modern, polished design
- text should be legible and well-spaced
- suitable for Twitter/X and Instagram

IMPORTANT: when you decide to generate an image, your response MUST start with [GENERATE_IMAGE] followed by the image prompt on the next line, then your message to the user after a blank line. example:

[GENERATE_IMAGE]
Create a professional 1080x1080 social media image with dark navy background, subtle grid lines, white text saying "Build smarter with AI", blue accent (#0EA5E9) highlights, AYN eye logo watermark in bottom-right corner, clean sans-serif typography, generous whitespace

nice -- here's your dark techy creative with the grid lines and your tagline. the eye logo is tucked in the corner as a watermark. want me to tweak anything?

if the user asks for changes to an existing image, generate a new one with the modifications.
if the user is just chatting or asking questions, respond normally WITHOUT [GENERATE_IMAGE].`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, post_id, tweet_text } = await req.json();

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

    // First, get AYN's text response (what to say + whether to generate)
    const chatResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + (tweet_text ? `\n\nthe current tweet text is: "${tweet_text}"` : "") },
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

    // Check if AYN wants to generate an image
    if (fullResponse.startsWith("[GENERATE_IMAGE]")) {
      const lines = fullResponse.split("\n");
      const promptLines: string[] = [];
      const messageLines: string[] = [];
      let pastPrompt = false;
      let foundBlank = false;

      for (let i = 1; i < lines.length; i++) {
        if (!pastPrompt) {
          if (lines[i].trim() === "") {
            pastPrompt = true;
            foundBlank = true;
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

      // Generate the image
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
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (imageResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
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

      // Update post if post_id provided
      if (post_id) {
        const { error: updateError } = await supabase
          .from("twitter_posts")
          .update({ image_url: permanentUrl })
          .eq("id", post_id);

        if (updateError) {
          console.error("DB update error:", updateError);
        }
      }

      console.log("Creative generated:", permanentUrl);

      return new Response(
        JSON.stringify({
          type: "image",
          message: userMessage,
          image_url: permanentUrl,
          filename,
        }),
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
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
