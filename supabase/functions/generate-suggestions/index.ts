import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lastUserMessage, lastAynResponse, mode } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful assistant that generates contextual follow-up suggestions for a conversation with an AI assistant named AYN.

Based on the conversation context, generate 3 short, relevant follow-up suggestions that the user might want to ask next.

Rules:
- Each suggestion must be 2-5 words maximum
- Make them action-oriented and specific to the context
- Include an appropriate emoji for each
- Suggestions should feel natural and helpful
- Consider the AI mode: ${mode || 'general'}

Return ONLY a JSON array with exactly 3 objects, each with "content" (string) and "emoji" (single emoji string).
Example: [{"content":"Tell me more","emoji":"💬"},{"content":"Show examples","emoji":"📝"},{"content":"Simplify this","emoji":"🔍"}]`;

    const userPrompt = `User asked: "${lastUserMessage}"

AYN responded: "${lastAynResponse?.substring(0, 500) || 'No response yet'}"

Generate 3 contextual follow-up suggestions based on this conversation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limited",
            suggestions: getDefaultSuggestions() 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Payment required",
            suggestions: getDefaultSuggestions() 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ suggestions: getDefaultSuggestions() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response
    let suggestions;
    try {
      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = getDefaultSuggestions();
      }
    } catch {
      console.error("Failed to parse suggestions:", content);
      suggestions = getDefaultSuggestions();
    }

    // Validate and limit to 3 suggestions
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      suggestions = getDefaultSuggestions();
    }
    
    suggestions = suggestions.slice(0, 3).map((s: any) => ({
      content: String(s.content || "Tell me more").substring(0, 30),
      emoji: String(s.emoji || "💡").substring(0, 2),
    }));

    return new Response(
      JSON.stringify({ suggestions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-suggestions error:", error);
    return new Response(
      JSON.stringify({ suggestions: getDefaultSuggestions() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getDefaultSuggestions() {
  return [
    { content: "Tell me more", emoji: "💬" },
    { content: "Give examples", emoji: "📝" },
    { content: "Explain simpler", emoji: "🔍" },
  ];
}
