import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface SurveyPoint {
  id: string;
  x: number;
  y: number;
  z: number;
}

interface TerrainAnalysis {
  minElevation: number;
  maxElevation: number;
  elevationRange: number;
  avgElevation: number;
  pointCount: number;
  estimatedArea: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Saudi earthwork prices (SAR per m³)
const EARTHWORK_PRICES = {
  excavation: 25,      // SAR/m³
  fill: 35,            // SAR/m³ (imported material)
  compaction: 8,       // SAR/m³
  disposal: 15,        // SAR/m³ (off-site)
  surveying: 2,        // SAR/m²
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { points, terrainAnalysis, requirements } = await req.json();
    
    if (!points || points.length === 0) {
      throw new Error('No survey points provided');
    }

    console.log(`Generating grading design for ${points.length} points`);
    console.log('Requirements:', requirements);
    console.log('Terrain analysis:', terrainAnalysis);

    // Create a summary of the terrain for the AI
    const terrainSummary = `
Site Terrain Summary:
- Point count: ${terrainAnalysis.pointCount}
- Elevation range: ${terrainAnalysis.minElevation}m to ${terrainAnalysis.maxElevation}m (range: ${terrainAnalysis.elevationRange}m)
- Average elevation: ${terrainAnalysis.avgElevation}m
- Estimated area: ${terrainAnalysis.estimatedArea} m² (${(terrainAnalysis.estimatedArea / 10000).toFixed(2)} hectares)
- X coordinates: ${terrainAnalysis.minX} to ${terrainAnalysis.maxX}
- Y coordinates: ${terrainAnalysis.minY} to ${terrainAnalysis.maxY}
`;

    // Sample points for AI (send representative subset if too many)
    const samplePoints = points.length > 50 
      ? points.filter((_: SurveyPoint, i: number) => i % Math.ceil(points.length / 50) === 0)
      : points;

    const prompt = `You are a civil engineering grading design expert. Analyze this site survey and generate an optimal grading design.

${terrainSummary}

Sample NGL (Natural Ground Level) points:
${samplePoints.map((p: SurveyPoint) => `Point ${p.id}: (${p.x}, ${p.y}) Elev: ${p.z}m`).join('\n')}

User Requirements:
${requirements || 'Standard site grading for construction with proper drainage'}

Generate a grading design with the following JSON structure:
{
  "designElevation": <recommended finished grade elevation in meters>,
  "slopeDirection": "<N/S/E/W or combination>",
  "slopePercentage": <drainage slope percentage, typically 1-3%>,
  "gradingZones": [
    {
      "name": "<zone name>",
      "area": <area in m²>,
      "nglAvg": <average existing elevation>,
      "fglTarget": <target finished elevation>,
      "cutVolume": <cut volume in m³>,
      "fillVolume": <fill volume in m³>
    }
  ],
  "totalCutVolume": <total cut in m³>,
  "totalFillVolume": <total fill in m³>,
  "netVolume": <positive = excess cut, negative = fill needed>,
  "designNotes": ["<important design consideration 1>", "<design note 2>"],
  "drainageRecommendations": "<drainage design recommendation>",
  "compactionRequirements": "<compaction specifications>"
}

Consider:
1. Minimize earthwork by balancing cut and fill
2. Ensure proper drainage (min 1% slope away from structures)
3. Account for compaction factor (typically 10-15% for fill)
4. Provide adequate slopes for storm water management
5. Consider Saudi building code requirements

Return ONLY valid JSON, no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional civil engineer specializing in site grading and earthwork design. Always respond with valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse the AI response
    let designResult;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        designResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to parse grading design from AI');
    }

    // Calculate costs
    const cutVolume = designResult.totalCutVolume || 0;
    const fillVolume = designResult.totalFillVolume || 0;
    const netVolume = designResult.netVolume || (cutVolume - fillVolume);
    
    const costBreakdown = {
      excavation: cutVolume * EARTHWORK_PRICES.excavation,
      fill: fillVolume * EARTHWORK_PRICES.fill,
      compaction: fillVolume * EARTHWORK_PRICES.compaction,
      disposal: netVolume > 0 ? netVolume * EARTHWORK_PRICES.disposal : 0,
      surveying: terrainAnalysis.estimatedArea * EARTHWORK_PRICES.surveying,
    };

    const totalCost = Object.values(costBreakdown).reduce((a, b) => a + b, 0);

    // Generate FGL points based on design
    const fglPoints = points.map((p: SurveyPoint) => {
      // Calculate FGL based on design elevation and slope
      const centerX = (terrainAnalysis.minX + terrainAnalysis.maxX) / 2;
      const centerY = (terrainAnalysis.minY + terrainAnalysis.maxY) / 2;
      
      // Apply slope from center
      const slopeFactor = (designResult.slopePercentage || 1.5) / 100;
      const distanceFromCenter = Math.sqrt(
        Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2)
      );
      
      // Calculate FGL with slope
      const baseElevation = designResult.designElevation || terrainAnalysis.avgElevation;
      const slopeAdjustment = distanceFromCenter * slopeFactor * 
        (p.y < centerY ? 1 : -1); // Slope towards south by default
      
      const fgl = baseElevation + slopeAdjustment;
      const cutFill = p.z - fgl; // Positive = cut, Negative = fill
      
      return {
        ...p,
        fgl: Math.round(fgl * 100) / 100,
        cutFill: Math.round(cutFill * 100) / 100,
      };
    });

    return new Response(JSON.stringify({
      success: true,
      design: designResult,
      fglPoints,
      costBreakdown,
      totalCost: Math.round(totalCost),
      prices: EARTHWORK_PRICES,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating grading design:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
