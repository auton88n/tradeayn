import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helper
function validateNumeric(value: unknown, fieldName: string, options: { min?: number; max?: number; required?: boolean } = {}): { valid: boolean; error?: string; value?: number } {
  const { min, max, required = true } = options;
  
  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, error: `Missing required field: ${fieldName}` };
    }
    return { valid: true, value: undefined };
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} cannot be less than ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} cannot be greater than ${max}` };
  }
  
  return { valid: true, value: num };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Defensive body parsing to handle malformed requests during concurrent execution
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON body',
        validationFailed: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle both formats: { inputs: {...} } OR {...} directly
    const rawInputs = body?.inputs || body || {};
    
    // Validate we have inputs
    if (!rawInputs || Object.keys(rawInputs).length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No input data provided',
        validationFailed: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate all required numeric fields
    const validations = [
      validateNumeric(rawInputs.columnLoad, 'columnLoad', { min: 0 }),
      validateNumeric(rawInputs.momentX, 'momentX', { min: 0, required: false }),
      validateNumeric(rawInputs.momentY, 'momentY', { min: 0, required: false }),
      validateNumeric(rawInputs.columnWidth, 'columnWidth', { min: 150, max: 2000 }),
      validateNumeric(rawInputs.columnDepth, 'columnDepth', { min: 150, max: 2000 }),
      validateNumeric(rawInputs.bearingCapacity, 'bearingCapacity', { min: 50, max: 2000 }),
    ];
    
    const errors = validations.filter(v => !v.valid).map(v => v.error);
    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        error: errors.join('; '),
        validationFailed: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const columnLoad = Number(rawInputs.columnLoad);
    const momentX = Number(rawInputs.momentX) || 0;
    const momentY = Number(rawInputs.momentY) || 0;
    const columnWidth = Number(rawInputs.columnWidth);
    const columnDepth = Number(rawInputs.columnDepth);
    const bearingCapacity = Number(rawInputs.bearingCapacity);
    const concreteGrade = rawInputs.concreteGrade || 'C30';

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
      const ex = columnLoad > 0 ? momentX / columnLoad : 0;
      const ey = columnLoad > 0 ? momentY / columnLoad : 0;
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
    return new Response(JSON.stringify({ 
      error: error.message || 'Invalid request',
      validationFailed: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
