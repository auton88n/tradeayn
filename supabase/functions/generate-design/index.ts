import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DesignElement {
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  x: number;
  y: number;
  shadow?: boolean;
}

interface AIDesignResult {
  headline?: DesignElement;
  subtitle?: DesignElement;
  hashtags?: DesignElement;
  cta?: DesignElement;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, context, style } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const styleGuide = {
      minimalist: "Create a clean, minimal design with just a bold headline. Less is more.",
      engaging: "Create an engaging design with headline, subtitle, and hashtags to drive engagement.",
      promotional: "Create a promotional design focused on sales/offers with a strong CTA and urgency.",
      inspirational: "Create an inspirational quote-style design with elegant typography.",
    }[style || 'engaging'] || "Create an engaging design with headline, subtitle, and hashtags.";

    const systemPrompt = `You are a professional social media designer. Analyze the provided image and create text overlay suggestions for a social media post.

${styleGuide}

Context from user: ${context || 'Create appropriate social media text for this image.'}

IMPORTANT RULES:
1. Analyze the image colors to choose contrasting text colors (white for dark images, dark for light images)
2. Position text in areas that don't cover important parts of the image
3. Use positions as percentages (0-100) where 50,50 is center
4. Keep headline short and punchy (max 6 words)
5. Hashtags should be relevant and popular (3-5 hashtags)
6. CTA should be action-oriented

Respond with a JSON object containing design elements. Each element should have:
- text: The actual text content
- fontSize: Size in pixels (headline: 36-56, subtitle: 20-28, hashtags: 16-20, cta: 22-30)
- fontWeight: "normal" or "bold"
- color: Hex color that contrasts with the image
- x: Horizontal position as percentage (0-100)
- y: Vertical position as percentage (0-100)
- shadow: true for readability on complex backgrounds

Return ONLY valid JSON in this exact format:
{
  "headline": { "text": "...", "fontSize": 48, "fontWeight": "bold", "color": "#ffffff", "x": 50, "y": 25, "shadow": true },
  "subtitle": { "text": "...", "fontSize": 24, "fontWeight": "normal", "color": "#ffffff", "x": 50, "y": 35, "shadow": true },
  "hashtags": { "text": "#tag1 #tag2 #tag3", "fontSize": 18, "fontWeight": "normal", "color": "#ffffff", "x": 50, "y": 85, "shadow": true },
  "cta": { "text": "Shop Now →", "fontSize": 26, "fontWeight": "bold", "color": "#ffffff", "x": 50, "y": 70, "shadow": true }
}

Omit any element that doesn't fit the style or image.`;

    console.log('Calling Lovable AI with image analysis...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Analyze this image and generate the design overlay text elements." },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI Response:', content);

    // Parse JSON from response (handle markdown code blocks)
    let designResult: AIDesignResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      designResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a fallback design
      designResult = {
        headline: {
          text: context || "Your Amazing Post",
          fontSize: 48,
          fontWeight: 'bold',
          color: '#ffffff',
          x: 50,
          y: 30,
          shadow: true
        },
        hashtags: {
          text: "#trending #viral #explore",
          fontSize: 18,
          fontWeight: 'normal',
          color: '#ffffff',
          x: 50,
          y: 85,
          shadow: true
        }
      };
    }

    console.log('Design result:', designResult);

    return new Response(
      JSON.stringify({ design: designResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-design function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
