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
    const { columnLoad, momentX, momentY, columnWidth, columnDepth, bearingCapacity, concreteGrade } = await req.json();

    const concreteProps: Record<string, number> = { C25: 25, C30: 30, C35: 35 };
    const fck = concreteProps[concreteGrade] || 30;
    const fy = 420;

    // Required area based on bearing capacity (with FOS = 1.5 for service loads)
    const allowableBearing = bearingCapacity / 1.5;
    const requiredArea = columnLoad / allowableBearing;
    
    // Calculate footing size (square or rectangular)
    let length = Math.sqrt(requiredArea);
    let width = length;
    
    // Adjust for moments (eccentricity)
    if (momentX > 0 || momentY > 0) {
      const ex = momentX / columnLoad;
      const ey = momentY / columnLoad;
      length = Math.max(length, 6 * ex + columnWidth / 1000);
      width = Math.max(width, 6 * ey + columnDepth / 1000);
    }
    
    // Round up to 100mm increments
    length = Math.ceil(length * 10) / 10;
    width = Math.ceil(width * 10) / 10;
    const area = length * width;

    // Check actual bearing pressure
    const actualPressure = columnLoad / area;
    
    // Punching shear check to determine depth
    const cover = 75;
    const barDia = 16;
    
    // Factored load for strength design
    const Pu = columnLoad * 1.4;
    
    // Critical perimeter for punching shear
    const d_trial = 350;
    const b0 = 2 * (columnWidth + d_trial) + 2 * (columnDepth + d_trial);
    const Vc_punch = 0.33 * Math.sqrt(fck) * b0 * d_trial / 1000;
    
    let depth = d_trial;
    if (Pu > Vc_punch * 0.75) {
      depth = Math.ceil((Pu * 1000) / (0.33 * Math.sqrt(fck) * b0 * 0.75) / 25) * 25;
    }
    depth = Math.max(depth, 300);
    
    const totalDepth = depth + cover + barDia;
    const roundedDepth = Math.ceil(totalDepth / 25) * 25;

    // Flexural reinforcement (simplified)
    const cantilever = (length * 1000 - columnWidth) / 2;
    const qu = (Pu / area) / 1000; // kN/m²
    const Mu = qu * width * cantilever * cantilever / 2 / 1e6; // kN·m
    
    const d = roundedDepth - cover - barDia / 2;
    const Ast = Mu * 1e6 / (0.87 * fy * 0.9 * d);
    
    // Minimum reinforcement
    const AstMin = 0.0012 * width * 1000 * d;
    const AstRequired = Math.max(Ast, AstMin);
    
    // Select bars
    const barArea = Math.PI * barDia * barDia / 4;
    const numberOfBars = Math.ceil(AstRequired / barArea);
    const spacing = Math.floor((width * 1000 - 2 * cover) / (numberOfBars - 1));
    const roundedSpacing = Math.floor(spacing / 25) * 25;

    // Material quantities
    const concreteVolume = length * width * (roundedDepth / 1000);
    const steelWeightX = numberOfBars * (length - 0.1) * barArea * 7850 / 1e9;
    const steelWeightY = numberOfBars * (width - 0.1) * barArea * 7850 / 1e9;
    const totalSteelWeight = steelWeightX + steelWeightY;

    console.log('Foundation calculation completed:', { columnLoad, length, width, roundedDepth });

    return new Response(JSON.stringify({
      // Dimensions
      length: Math.round(length * 100) / 100,
      width: Math.round(width * 100) / 100,
      depth: roundedDepth,
      area: Math.round(area * 100) / 100,
      
      // Column dimensions (pass through)
      columnWidth,
      columnDepth,
      
      // Bearing
      allowableBearing: Math.round(allowableBearing),
      actualPressure: Math.round(actualPressure * 10) / 10,
      bearingRatio: Math.round((actualPressure / allowableBearing) * 100),
      
      // Reinforcement
      reinforcementX: `${numberOfBars}Ø${barDia}@${roundedSpacing}mm`,
      reinforcementY: `${numberOfBars}Ø${barDia}@${roundedSpacing}mm`,
      barDiameter: barDia,
      spacing: roundedSpacing,
      
      // Material quantities
      concreteVolume: Math.round(concreteVolume * 1000) / 1000,
      steelWeight: Math.round(totalSteelWeight * 10) / 10,
      
      // Design values
      fck,
      fy,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Foundation calculation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
