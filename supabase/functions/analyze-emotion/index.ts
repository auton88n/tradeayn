import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an emotion analysis AI for AYN, an empathetic AI companion. Analyze the user's message to understand their emotional state and determine how AYN should respond empathetically.

IMPORTANT: AYN should NOT mirror negative emotions. Instead, AYN should respond with supportive, understanding emotions.

Emotion Response Guidelines:
- User is SAD/GRIEVING → AYN shows CALM warmth and comfort (not sad)
- User is FRUSTRATED/ANGRY → AYN shows CURIOUS patience and understanding (not frustrated)
- User is ANXIOUS/WORRIED → AYN shows CALM reassurance (not anxious)
- User is CONFUSED → AYN shows CURIOUS helpfulness (not confused)
- User is HAPPY → AYN MIRRORS happiness
- User is EXCITED → AYN MIRRORS excitement

Respond ONLY with valid JSON in this exact format:
{
  "userEmotion": {
    "primary": "happy|sad|frustrated|excited|anxious|confused|neutral|angry|grieving|overwhelmed",
    "secondary": "optional secondary emotion or null",
    "intensity": 0.0-1.0,
    "indicators": ["keyword1", "keyword2"]
  },
  "aynResponse": {
    "emotion": "calm|happy|excited|thinking|curious",
    "behavior": "supportive|celebratory|patient|reassuring|attentive|playful",
    "pupilReaction": "normal|dilate-slightly|dilate-more|contract",
    "blinkPattern": "normal|slow-comfort|quick-attentive|double-understanding",
    "colorIntensity": 0.0-1.0
  },
  "empathyNote": "Brief description of why AYN responds this way"
}`;

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
            content: `Analyze this message for emotional content and determine AYN's empathetic response:

Message: "${message}"

${conversationContext ? `Recent conversation context: ${conversationContext}` : ''}

Respond with JSON only.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Return default empathetic response on error
      return new Response(JSON.stringify({
        userEmotion: { primary: "neutral", intensity: 0.5, indicators: [] },
        aynResponse: { 
          emotion: "calm", 
          behavior: "attentive",
          pupilReaction: "normal",
          blinkPattern: "normal",
          colorIntensity: 0.5
        },
        empathyNote: "Default response due to analysis error"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse the JSON response
    let analysisResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      analysisResult = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return safe default
      analysisResult = {
        userEmotion: { primary: "neutral", intensity: 0.5, indicators: [] },
        aynResponse: { 
          emotion: "calm", 
          behavior: "attentive",
          pupilReaction: "normal",
          blinkPattern: "normal",
          colorIntensity: 0.5
        },
        empathyNote: "Default response due to parse error"
      };
    }

    console.log("Emotion analysis:", analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in analyze-emotion:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      userEmotion: { primary: "neutral", intensity: 0.5, indicators: [] },
      aynResponse: { emotion: "calm", behavior: "attentive" }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
