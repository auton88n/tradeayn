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
    const { span, deadLoad, liveLoad, beamWidth, concreteGrade, steelGrade, supportType } = await req.json();

    // Material properties
    const concreteProps: Record<string, number> = { C25: 25, C30: 30, C35: 35, C40: 40 };
    const steelProps: Record<string, number> = { Fy420: 420, Fy500: 500 };
    
    const fck = concreteProps[concreteGrade] || 30;
    const fy = steelProps[steelGrade] || 420;
    
    // Support type moment factors
    const momentFactors: Record<string, number> = {
      simply_supported: 8,
      continuous: 10,
      cantilever: 2,
    };
    const momentFactor = momentFactors[supportType] || 8;

    // Load factors (ACI/Eurocode)
    const factoredLoad = 1.4 * deadLoad + 1.6 * liveLoad; // kN/m

    // Maximum moment and shear
    const maxMoment = (factoredLoad * span * span) / momentFactor; // kN·m
    const maxShear = supportType === 'cantilever' 
      ? factoredLoad * span 
      : (factoredLoad * span) / 2; // kN

    // Design constants
    const cover = 40; // mm
    const stirrupDia = factoredLoad > 50 ? 10 : 8; // mm
    const width = beamWidth; // mm

    // Required effective depth (simplified)
    const Mu = maxMoment * 1e6; // N·mm
    const bd2 = Mu / (0.138 * fck);
    const dRequired = Math.sqrt(bd2 / width);
    
    // Round up to nearest 25mm
    const effectiveDepth = Math.ceil(dRequired / 25) * 25;
    const totalDepth = effectiveDepth + cover + stirrupDia + 10; // Assume 20mm bar radius
    const roundedDepth = Math.ceil(totalDepth / 25) * 25;

    // Reinforcement calculation
    const d = roundedDepth - cover - stirrupDia - 10;
    const Ast = Mu / (0.87 * fy * 0.9 * d);
    
    // Select bar size and number
    const barSizes = [12, 16, 20, 25, 32];
    let selectedBar = 20;
    let numberOfBars = 4;
    
    for (const dia of barSizes) {
      const areaPerBar = Math.PI * dia * dia / 4;
      const barsNeeded = Math.ceil(Ast / areaPerBar);
      if (barsNeeded >= 2 && barsNeeded <= 6) {
        selectedBar = dia;
        numberOfBars = barsNeeded;
        break;
      }
    }

    // Shear reinforcement
    const Vu = maxShear * 1000; // N
    const Vc = 0.17 * Math.sqrt(fck) * width * d; // N
    const Vs = Math.max(0, Vu / 0.75 - Vc);
    
    const Asv = Math.PI * stirrupDia * stirrupDia / 4 * 2; // 2-legged stirrup
    const stirrupSpacing = Vs > 0 
      ? Math.min(Math.floor((0.87 * fy * Asv * d) / Vs), d / 2, 300)
      : Math.min(d / 2, 300);
    const roundedSpacing = Math.floor(stirrupSpacing / 25) * 25;

    // Material quantities
    const concreteVolume = (width / 1000) * (roundedDepth / 1000) * span; // m³
    const mainSteelWeight = numberOfBars * (Math.PI * selectedBar * selectedBar / 4) * span * 7850 / 1e9; // kg
    const stirrupCount = Math.ceil((span * 1000) / roundedSpacing);
    const stirrupLength = 2 * (width - 2 * cover) + 2 * (roundedDepth - 2 * cover) + 200; // mm with hooks
    const stirrupWeight = stirrupCount * stirrupLength * (Math.PI * stirrupDia * stirrupDia / 4) * 7850 / 1e9;
    const totalSteelWeight = mainSteelWeight + stirrupWeight;
    const formworkArea = 2 * (roundedDepth / 1000) * span + (width / 1000) * span; // m²

    console.log('Beam calculation completed:', { span, factoredLoad, maxMoment, roundedDepth });

    return new Response(JSON.stringify({
      // Dimensions
      beamWidth: width,
      beamDepth: roundedDepth,
      effectiveDepth: d,
      span: span,
      
      // Forces
      factoredLoad: Math.round(factoredLoad * 100) / 100,
      maxMoment: Math.round(maxMoment * 100) / 100,
      maxShear: Math.round(maxShear * 100) / 100,
      
      // Reinforcement
      mainReinforcement: `${numberOfBars}Ø${selectedBar}`,
      numberOfBars,
      barDiameter: selectedBar,
      requiredAs: Math.round(Ast),
      providedAs: Math.round(numberOfBars * Math.PI * selectedBar * selectedBar / 4),
      
      // Shear reinforcement
      stirrups: `Ø${stirrupDia}@${roundedSpacing}mm`,
      stirrupDia,
      stirrupSpacing: roundedSpacing,
      
      // Material quantities
      concreteVolume: Math.round(concreteVolume * 1000) / 1000,
      steelWeight: Math.round(totalSteelWeight * 10) / 10,
      formworkArea: Math.round(formworkArea * 100) / 100,
      
      // Material properties used
      fck,
      fy,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Beam calculation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
