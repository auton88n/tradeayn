import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrainstormNode {
  id: string;
  label: string;
  level: number;
  parentId: string | null;
}

interface BrainstormEdge {
  from: string;
  to: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, language = 'en' } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Brainstorm service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating brainstorm for topic: "${topic}"`);

    const systemPrompt = language === 'ar' 
      ? `أنت مساعد عصف ذهني إبداعي. عند إعطائك موضوعًا، قم بإنشاء خريطة ذهنية منظمة بأفكار مترابطة.

قم بإرجاع JSON بالتنسيق التالي:
{
  "centralIdea": "الموضوع الرئيسي",
  "branches": [
    {
      "id": "1",
      "label": "الفرع الرئيسي 1",
      "subIdeas": [
        { "id": "1-1", "label": "فكرة فرعية 1" },
        { "id": "1-2", "label": "فكرة فرعية 2" }
      ]
    }
  ]
}

أنشئ 4-6 فروع رئيسية، كل منها يحتوي على 2-3 أفكار فرعية. اجعل الأفكار إبداعية وقابلة للتنفيذ.`
      : `You are a creative brainstorming assistant. When given a topic, generate a structured mind map with connected ideas.

Return JSON in this exact format:
{
  "centralIdea": "The main topic",
  "branches": [
    {
      "id": "1",
      "label": "Main Branch 1",
      "subIdeas": [
        { "id": "1-1", "label": "Sub-idea 1" },
        { "id": "1-2", "label": "Sub-idea 2" }
      ]
    }
  ]
}

Create 4-6 main branches, each with 2-3 sub-ideas. Make ideas creative and actionable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a mind map for: ${topic}` }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate brainstorm' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No brainstorm generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    const brainstormData = JSON.parse(content);
    
    // Convert to nodes and edges format for the mind map
    const nodes: BrainstormNode[] = [];
    const edges: BrainstormEdge[] = [];

    // Add central node
    const centralId = 'central';
    nodes.push({
      id: centralId,
      label: brainstormData.centralIdea || topic,
      level: 0,
      parentId: null
    });

    // Add branch nodes and sub-ideas
    brainstormData.branches?.forEach((branch: any, branchIndex: number) => {
      const branchId = `branch-${branchIndex}`;
      nodes.push({
        id: branchId,
        label: branch.label,
        level: 1,
        parentId: centralId
      });
      edges.push({ from: centralId, to: branchId });

      branch.subIdeas?.forEach((subIdea: any, subIndex: number) => {
        const subId = `sub-${branchIndex}-${subIndex}`;
        nodes.push({
          id: subId,
          label: subIdea.label,
          level: 2,
          parentId: branchId
        });
        edges.push({ from: branchId, to: subId });
      });
    });

    console.log(`Generated ${nodes.length} nodes and ${edges.length} edges`);

    return new Response(
      JSON.stringify({ 
        nodes,
        edges,
        topic: brainstormData.centralIdea || topic
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Brainstorm generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
