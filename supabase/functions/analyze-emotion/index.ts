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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const systemPrompt = `You are an emotion analysis AI for AYN, an empathetic AI companion. Analyze the user's message to understand their emotional state and determine how AYN should respond empathetically.

IMPORTANT: AYN should NOT mirror negative emotions. Instead, AYN should respond with warm, supportive emotions that provide comfort.

Emotion Response Guidelines (use the EXACT emotion names):
- User is SAD/GRIEVING/LONELY → AYN shows "comfort" (warm amber/peach glow for nurturing warmth)
- User is ANXIOUS/WORRIED/STRESSED → AYN shows "comfort" (soothing, reassuring presence)
- User is FRUSTRATED/ANGRY → AYN shows "supportive" (patient rose-pink understanding)
- User is OVERWHELMED/CONFUSED → AYN shows "supportive" (encouraging, helping presence)
- User is DISAPPOINTED → AYN shows "comfort" (gentle, warm understanding)
- User is HAPPY → AYN shows "happy" (mirrors positivity)
- User is EXCITED → AYN shows "excited" (mirrors enthusiasm)
- User is CURIOUS/ASKING → AYN shows "curious" (engaged, interested)
- User is NEUTRAL → AYN shows "calm" (peaceful, ready to help)

The "comfort" emotion creates a warm amber/peach glow - use it for sadness, grief, loneliness, anxiety.
The "supportive" emotion creates a soft rose-pink glow - use it for frustration, overwhelm, confusion, needing encouragement.

Respond ONLY with valid JSON in this exact format:
{
  "userEmotion": {
    "primary": "happy|sad|frustrated|excited|anxious|confused|neutral|angry|grieving|overwhelmed|lonely|stressed|disappointed",
    "secondary": "optional secondary emotion or null",
    "intensity": 0.0-1.0,
    "indicators": ["keyword1", "keyword2"]
  },
  "aynResponse": {
    "emotion": "calm|comfort|supportive|happy|excited|thinking|curious",
    "behavior": "nurturing|comforting|encouraging|celebratory|patient|reassuring|attentive|playful",
    "pupilReaction": "normal|dilate-slightly|dilate-more|contract",
    "blinkPattern": "normal|slow-comfort|quick-attentive|double-understanding",
    "colorIntensity": 0.0-1.0
  },
  "empathyNote": "Brief description of why AYN responds this way"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
