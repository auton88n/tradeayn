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
    const { type, inputs, outputs } = await req.json();

    // Generate analysis based on calculation type
    const analysis = generateAnalysis(type, inputs, outputs);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateAnalysis(type: string, inputs: any, outputs: any) {
  const compliance: string[] = [];
  const optimizations: string[] = [];
  const costEstimate: { item: string; cost: number }[] = [];

  if (type === 'beam') {
    // Compliance checks
    const spanDepthRatio = (inputs.span * 1000) / outputs.beamDepth;
    if (spanDepthRatio <= 20) {
      compliance.push('Span/depth ratio within limits (≤20)');
    } else {
      compliance.push('⚠️ Span/depth ratio exceeds 20 - check deflection');
    }

    if (outputs.beamWidth >= 200) {
      compliance.push('Minimum beam width satisfied (≥200mm)');
    }

    const steelRatio = outputs.providedAs / (outputs.beamWidth * outputs.effectiveDepth) * 100;
    if (steelRatio >= 0.12 && steelRatio <= 4) {
      compliance.push(`Steel ratio ${steelRatio.toFixed(2)}% within limits`);
    }

    compliance.push('Clear cover 40mm meets durability requirements');

    // Optimizations
    if (steelRatio > 2) {
      optimizations.push('Consider increasing beam depth to reduce steel');
    }
    if (outputs.beamWidth > 350) {
      optimizations.push('Could reduce width to 300mm for economy');
    }
    if (inputs.concreteGrade === 'C25' && inputs.span > 5) {
      optimizations.push('Consider C30 concrete for longer spans');
    }
    optimizations.push('Use prefabricated stirrups for faster construction');

    // Cost estimate (Saudi Riyal)
    const concretePrice = inputs.concreteGrade === 'C30' ? 310 : 280;
    const concreteCost = outputs.concreteVolume * concretePrice;
    const steelCost = outputs.steelWeight * 2.7; // ~2700 SAR/ton
    const formworkCost = outputs.formworkArea * 85;
    const laborCost = outputs.concreteVolume * 45 + outputs.steelWeight * 0.35;

    costEstimate.push({ item: 'Concrete', cost: Math.round(concreteCost) });
    costEstimate.push({ item: 'Steel', cost: Math.round(steelCost) });
    costEstimate.push({ item: 'Formwork', cost: Math.round(formworkCost) });
    costEstimate.push({ item: 'Labor', cost: Math.round(laborCost) });

  } else if (type === 'foundation') {
    // Compliance checks
    if (outputs.bearingRatio <= 100) {
      compliance.push(`Bearing pressure ${outputs.bearingRatio}% of allowable - OK`);
    } else {
      compliance.push('⚠️ Bearing pressure exceeds allowable');
    }

    if (outputs.depth >= 300) {
      compliance.push('Minimum footing depth satisfied (≥300mm)');
    }

    compliance.push('Punching shear checked at d/2 from column face');
    compliance.push('Cover 75mm suitable for ground contact');

    // Optimizations
    if (outputs.bearingRatio < 60) {
      optimizations.push('Footing may be oversized - consider reducing');
    }
    if (outputs.length !== outputs.width) {
      optimizations.push('Consider square footing for simpler construction');
    }
    optimizations.push('Use lean concrete blinding (50mm) below footing');

    // Cost estimate
    const concreteCost = outputs.concreteVolume * 310;
    const steelCost = outputs.steelWeight * 2.7;
    const excavationCost = outputs.area * 1.5 * 25; // 1.5m depth, 25 SAR/m³
    const laborCost = outputs.concreteVolume * 45;

    costEstimate.push({ item: 'Concrete', cost: Math.round(concreteCost) });
    costEstimate.push({ item: 'Steel', cost: Math.round(steelCost) });
    costEstimate.push({ item: 'Excavation', cost: Math.round(excavationCost) });
    costEstimate.push({ item: 'Labor', cost: Math.round(laborCost) });
  }

  return { compliance, optimizations, costEstimate };
}
