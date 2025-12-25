import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DesignElement {
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontFamily: string;
  color: string;
  x: number;
  y: number;
  shadow?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  textStroke?: { width: number; color: string } | null;
  gradient?: { from: string; to: string; angle: number } | null;
  opacity?: number;
  effect?: 'none' | 'neon' | 'outline' | 'shadow3d' | 'glass';
}

interface AIDesignVariation {
  headline?: DesignElement;
  subtitle?: DesignElement;
  hashtags?: DesignElement;
  cta?: DesignElement;
  mood: string;
  colorPalette: string[];
}

interface AIDesignResult {
  variations: AIDesignVariation[];
  imageAnalysis: {
    dominantColors: string[];
    mood: string;
    safeZones: { x: number; y: number }[];
    suggestedFontCategory: string;
  };
}

// Professional font categories
const fontCategories = {
  display: ['Bebas Neue', 'Oswald', 'Anton', 'Playfair Display', 'Abril Fatface'],
  elegant: ['Cormorant Garamond', 'Libre Baskerville', 'EB Garamond', 'Crimson Pro', 'Lora'],
  modern: ['Montserrat', 'Poppins', 'Raleway', 'Nunito Sans', 'Source Sans 3'],
  bold: ['Archivo Black', 'Rubik', 'Work Sans', 'Barlow', 'DM Sans'],
  creative: ['Pacifico', 'Lobster', 'Righteous', 'Satisfy', 'Dancing Script'],
};

const industryStyles = {
  fashion: { fonts: ['Playfair Display', 'Cormorant Garamond'], colors: ['#E0C097', '#5C4033', '#FAF3E0'] },
  tech: { fonts: ['Montserrat', 'Source Sans 3'], colors: ['#00D4FF', '#7C3AED', '#1A1A2E'] },
  food: { fonts: ['Lobster', 'Lora'], colors: ['#C73E1D', '#F4A259', '#FEF3E2'] },
  fitness: { fonts: ['Bebas Neue', 'Oswald'], colors: ['#FF4500', '#1A1A1A', '#00FF88'] },
  luxury: { fonts: ['Cormorant Garamond', 'EB Garamond'], colors: ['#D4AF37', '#1A1A1A', '#FFFEF7'] },
  travel: { fonts: ['Abril Fatface', 'Raleway'], colors: ['#2E7D32', '#87CEEB', '#FFF8DC'] },
  entertainment: { fonts: ['Anton', 'Righteous'], colors: ['#FF1493', '#00CED1', '#FFD700'] },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, context, style, industry } = await req.json();
    
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

    // Get industry-specific styling if provided
    const industryConfig = industry && industryStyles[industry as keyof typeof industryStyles];
    const suggestedFonts = industryConfig?.fonts || ['Montserrat', 'Playfair Display'];
    const suggestedColors = industryConfig?.colors || ['#FFFFFF', '#000000', '#FFD700'];

    const styleGuide = {
      minimalist: "Create a clean, minimal design with just ONE bold headline. Less is more. Use generous white space.",
      engaging: "Create an engaging design with headline, subtitle, and hashtags. Balance visual hierarchy.",
      promotional: "Create a promotional design focused on sales/offers with a STRONG CTA and urgency elements.",
      inspirational: "Create an inspirational quote-style design with elegant, centered typography.",
    }[style || 'engaging'] || "Create an engaging design with proper visual hierarchy.";

    const systemPrompt = `You are an elite social media designer working for top brands. Your designs are used by millions.

DESIGN BRIEF:
${styleGuide}
${industry ? `Industry: ${industry} - Use appropriate tone and style.` : ''}
User context: ${context || 'Create compelling social media content for this image.'}

CRITICAL DESIGN RULES:
1. ANALYZE the image deeply - extract exact dominant colors (5-7 hex codes)
2. DETECT safe text zones - areas WITHOUT important subjects/faces
3. MATCH font style to image mood (elegant serif for luxury, bold sans for energy)
4. CREATE 4 DISTINCT design variations with different:
   - Typography choices (headline + subtitle font pairing)
   - Color schemes (derived from image)
   - Text placements (rule of thirds, avoiding focal points)
   - Moods (professional, playful, bold, elegant)

TYPOGRAPHY RULES:
- Headline: 6 words MAX, punchy, memorable
- Use font pairings: Display + Body (e.g., "Bebas Neue" + "Montserrat")
- Suggested fonts: ${suggestedFonts.join(', ')}
- Letter spacing: 0-5 for body, 2-10 for display headlines
- Line height: 1.1-1.3 for headlines, 1.4-1.6 for body

COLOR RULES:
- Extract ACTUAL colors from the image for text
- Ensure WCAG AA contrast (4.5:1 minimum)
- Use complementary or analogous colors
- Suggested palette: ${suggestedColors.join(', ')}

POSITION RULES (x,y as percentages 0-100):
- Headlines: upper third (y: 15-35) or center (y: 40-55)
- Subtitles: 10-15% below headline
- CTAs: lower third (y: 70-85), centered horizontally
- Hashtags: bottom (y: 85-95)
- NEVER place text on faces or key subjects
- Apply rule of thirds for visual balance

EFFECTS (choose appropriate for mood):
- "none": Clean, no effects
- "neon": Glowing text effect for energetic content
- "outline": Text stroke for readability on busy backgrounds
- "shadow3d": 3D pop effect for bold statements
- "glass": Glassmorphism backdrop for modern look

RESPOND WITH VALID JSON ONLY (no markdown):
{
  "variations": [
    {
      "headline": { 
        "text": "...", 
        "fontSize": 48-72, 
        "fontWeight": "bold", 
        "fontFamily": "Bebas Neue",
        "color": "#hex", 
        "x": 50, 
        "y": 25, 
        "shadow": true,
        "letterSpacing": 3,
        "lineHeight": 1.1,
        "textStroke": { "width": 2, "color": "#000" } or null,
        "gradient": { "from": "#hex", "to": "#hex", "angle": 135 } or null,
        "opacity": 1,
        "effect": "none|neon|outline|shadow3d|glass"
      },
      "subtitle": { ... } or null,
      "hashtags": { ... } or null,
      "cta": { ... } or null,
      "mood": "professional|playful|bold|elegant|energetic|calm",
      "colorPalette": ["#hex1", "#hex2", "#hex3"]
    },
    // ... 3 more variations
  ],
  "imageAnalysis": {
    "dominantColors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
    "mood": "energetic|calm|luxurious|playful|professional|dramatic",
    "safeZones": [{ "x": 50, "y": 25 }, { "x": 50, "y": 80 }],
    "suggestedFontCategory": "display|elegant|modern|bold|creative"
  }
}`;

    console.log('Calling OpenAI GPT-4o for professional design generation...');

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Analyze this image deeply and generate 4 professional design variations with perfect typography and color choices." },
              { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
            ]
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('OpenAI Response:', content);

    // Parse JSON from response (handle markdown code blocks)
    let designResult: AIDesignResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      designResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a professional fallback design
      designResult = {
        variations: [
          {
            headline: {
              text: context?.slice(0, 30) || "Your Story Matters",
              fontSize: 56,
              fontWeight: 'bold',
              fontFamily: 'Montserrat',
              color: '#ffffff',
              x: 50,
              y: 30,
              shadow: true,
              letterSpacing: 2,
              lineHeight: 1.1,
              textStroke: null,
              gradient: null,
              opacity: 1,
              effect: 'shadow3d'
            },
            subtitle: {
              text: "Share your journey",
              fontSize: 24,
              fontWeight: 'normal',
              fontFamily: 'Inter',
              color: '#ffffff',
              x: 50,
              y: 42,
              shadow: true,
              letterSpacing: 1,
              lineHeight: 1.4,
              textStroke: null,
              gradient: null,
              opacity: 0.9,
              effect: 'none'
            },
            hashtags: {
              text: "#trending #viral #explore",
              fontSize: 18,
              fontWeight: 'normal',
              fontFamily: 'Inter',
              color: '#ffffff',
              x: 50,
              y: 88,
              shadow: true,
              letterSpacing: 0,
              lineHeight: 1.4,
              textStroke: null,
              gradient: null,
              opacity: 0.8,
              effect: 'none'
            },
            mood: 'professional',
            colorPalette: ['#ffffff', '#000000', '#FFD700']
          }
        ],
        imageAnalysis: {
          dominantColors: ['#1a1a2e', '#ffffff', '#FFD700'],
          mood: 'professional',
          safeZones: [{ x: 50, y: 25 }, { x: 50, y: 85 }],
          suggestedFontCategory: 'modern'
        }
      };
    }

    // For backward compatibility, also return the first variation as 'design'
    const firstVariation = designResult.variations?.[0];
    
    console.log('Design result:', designResult);

    return new Response(
      JSON.stringify({ 
        design: firstVariation, // Backward compatible
        variations: designResult.variations,
        imageAnalysis: designResult.imageAnalysis
      }),
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
