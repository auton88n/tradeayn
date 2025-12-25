import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EditAction = 'remove-background' | 'enhance' | 'style-transfer';

interface StyleTransferOptions {
  style: 'instagram' | 'cyberpunk' | 'vintage' | 'luxury' | 'minimal' | 'neon' | 'cinematic';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, action, options } = await req.json() as { 
      imageUrl: string; 
      action: EditAction; 
      options?: StyleTransferOptions;
    };
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    let prompt = '';
    
    switch (action) {
      case 'remove-background':
        prompt = "Remove the background completely, keeping only the main subject. Make the background pure transparent/white. Preserve all details of the subject with clean edges.";
        break;
        
      case 'enhance':
        prompt = "Enhance this image professionally: improve color vibrancy, sharpen details, optimize contrast and exposure. Make it look like it was shot by a professional photographer. Keep the same composition but elevate the quality.";
        break;
        
      case 'style-transfer':
        const stylePrompts: Record<string, string> = {
          instagram: "Apply a warm, high-contrast Instagram aesthetic with slightly lifted shadows, warm golden tones, and soft vignette. Make it Instagram-worthy and engagement-ready.",
          cyberpunk: "Transform into a cyberpunk aesthetic with neon pink/cyan color grading, high contrast, lens flares, and a futuristic sci-fi atmosphere.",
          vintage: "Apply a vintage film aesthetic with faded colors, slight sepia tones, film grain, and a nostalgic 70s/80s vibe.",
          luxury: "Apply an elegant luxury aesthetic with rich deep blacks, gold/champagne accents, high contrast, and a premium sophisticated feel.",
          minimal: "Create a clean minimal aesthetic with desaturated colors, soft contrast, plenty of negative space feel, and Scandinavian-inspired tones.",
          neon: "Apply vibrant neon colors with glowing effects, high saturation, dark backgrounds, and an electric nightlife atmosphere.",
          cinematic: "Apply cinematic color grading with teal and orange tones, letterbox aspect ratio feel, dramatic shadows, and movie-like atmosphere.",
        };
        prompt = stylePrompts[options?.style || 'instagram'] || stylePrompts.instagram;
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: remove-background, enhance, or style-transfer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Processing image with action: ${action}`);

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: await createFormData(imageUrl, prompt),
    });

    if (!response.ok) {
      // Fallback to chat completion with image for editing guidance
      console.log('Falling back to GPT-4o for image analysis...');
      
      const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: "You are an image editing assistant. Describe the edits that should be made to the image." 
            },
            { 
              role: "user", 
              content: [
                { type: "text", text: `I want to: ${prompt}. Please describe how to achieve this effect and any color adjustments needed.` },
                { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
              ]
            }
          ],
          max_tokens: 500,
        }),
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        const instructions = chatData.choices?.[0]?.message?.content;
        
        return new Response(
          JSON.stringify({ 
            success: true,
            editedImageUrl: imageUrl, // Return original for now
            instructions,
            message: 'Image analysis complete. Full editing requires gpt-image-1 model.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Image editing failed');
    }

    const data = await response.json();
    const editedImageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;

    console.log('Image editing successful');

    return new Response(
      JSON.stringify({ 
        success: true,
        editedImageUrl,
        action
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-edit-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createFormData(imageUrl: string, prompt: string): Promise<FormData> {
  const formData = new FormData();
  
  // Fetch the image and convert to blob
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();
  
  formData.append('image', imageBlob, 'image.png');
  formData.append('prompt', prompt);
  formData.append('model', 'dall-e-2');
  formData.append('n', '1');
  formData.append('size', '1024x1024');
  
  return formData;
}
