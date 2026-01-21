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
    const body = await req.json();
    
    // Handle both formats: { inputs: {...} } OR {...} directly
    const rawInputs = body.inputs || body;
    
    // Validate all required numeric fields
    const validations = [
      validateNumeric(rawInputs.axialLoad, 'axialLoad', { min: 0 }),
      validateNumeric(rawInputs.momentX, 'momentX', { min: 0, required: false }),
      validateNumeric(rawInputs.momentY, 'momentY', { min: 0, required: false }),
      validateNumeric(rawInputs.columnWidth, 'columnWidth', { min: 150, max: 2000 }),
      validateNumeric(rawInputs.columnDepth, 'columnDepth', { min: 150, max: 2000 }),
      validateNumeric(rawInputs.columnHeight, 'columnHeight', { min: 1, max: 50 }),
      validateNumeric(rawInputs.coverThickness, 'coverThickness', { min: 20, max: 100, required: false }),
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
    
    // Extract validated inputs with defaults
    const inputs = {
      axialLoad: Number(rawInputs.axialLoad),
      momentX: Number(rawInputs.momentX) || 0,
      momentY: Number(rawInputs.momentY) || 0,
      columnWidth: Number(rawInputs.columnWidth),
      columnDepth: Number(rawInputs.columnDepth),
      columnHeight: Number(rawInputs.columnHeight),
      concreteGrade: rawInputs.concreteGrade || 'C30',
      steelGrade: rawInputs.steelGrade || '420',
      coverThickness: Number(rawInputs.coverThickness) || 40,
      columnType: rawInputs.columnType || 'interior'
    };

    const {
      axialLoad,
      momentX,
      momentY,
      columnWidth,
      columnDepth,
      columnHeight,
      concreteGrade,
      steelGrade,
      coverThickness,
      columnType
    } = inputs;

    // Material properties
    const fck = parseInt(String(concreteGrade).replace('C', '')) || 30;
    const fy = parseInt(String(steelGrade)) || 420;
    
    // Partial safety factors (EC2)
    const gammaC = 1.5;
    const gammaS = 1.15;
    
    // Design strengths
    const fcd = 0.85 * fck / gammaC;
    const fyd = fy / gammaS;
    
    // Section properties
    const b = columnWidth;
    const h = columnDepth;
    const Ac = b * h; // Gross area in mm²
    const cover = coverThickness;
    
    // Effective depths
    const d = h - cover - 10; // Assuming 10mm tie and 20mm main bar
    const dPrime = cover + 10 + 10;
    
    // Slenderness check (EC2)
    const Le = columnHeight * 1000; // Convert to mm
    const i = Math.min(b, h) / Math.sqrt(12); // Radius of gyration
    const lambda = Le / i;
    const lambdaLim = 20 * Math.sqrt(fck) / Math.sqrt(axialLoad * 1000 / Ac);
    const isSlender = lambda > lambdaLim;
    
    // Minimum eccentricity (EC2)
    const e0 = Math.max(h / 30, 20); // mm
    
    // First order eccentricities
    const ex = axialLoad > 0 ? (momentX * 1000000) / (axialLoad * 1000) + e0 : e0;
    const ey = axialLoad > 0 ? (momentY * 1000000) / (axialLoad * 1000) + e0 : e0;
    
    // Second order effects (simplified for slender columns)
    let e2x = 0, e2y = 0;
    if (isSlender) {
      const Kr = 1; // Correction factor (simplified)
      const Kphi = 1 + 0.35 * (lambda / lambdaLim);
      const beta = 0.35 + fck / 200 - lambda / 150;
      e2x = Kr * Kphi * (Le * Le) / (10 * d) * (1 / 175);
      e2y = Kr * Kphi * (Le * Le) / (10 * d) * (1 / 175);
    }
    
    // Total eccentricities
    const etotX = ex + e2x;
    const etotY = ey + e2y;
    
    // Design moments
    const Mdx = axialLoad * etotX / 1000;
    const Mdy = axialLoad * etotY / 1000;
    
    // Required steel area calculation (simplified interaction diagram approach)
    const nu = (axialLoad * 1000) / (Ac * fcd);
    const muX = (Mdx * 1000000) / (Ac * h * fcd);
    const muY = (Mdy * 1000000) / (Ac * b * fcd);
    
    // Biaxial bending check (Bresler equation simplified)
    const alpha = 1.5; // For rectangular sections
    const biaxialRatio = Math.pow(muX, alpha) + Math.pow(muY, alpha);
    
    // Required reinforcement ratio
    let omega = 0.1 + 0.5 * nu + 2 * Math.sqrt(biaxialRatio);
    omega = Math.max(omega, 0.1);
    omega = Math.min(omega, 1.0);
    
    // Steel area
    let AsRequired = omega * Ac * fcd / fyd;
    
    // Code limits (EC2)
    const AsMin = Math.max(0.002 * Ac, 0.1 * axialLoad * 1000 / fyd);
    const AsMax = 0.04 * Ac;
    
    AsRequired = Math.max(AsRequired, AsMin);
    AsRequired = Math.min(AsRequired, AsMax);
    
    // Bar selection
    const barDiameters = [16, 20, 25, 32];
    let selectedBarDia = 20;
    let numberOfBars = 8;
    
    for (const dia of barDiameters) {
      const barArea = Math.PI * dia * dia / 4;
      const minBars = 8; // Minimum for rectangular column
      const requiredBars = Math.ceil(AsRequired / barArea);
      if (requiredBars <= 12 && requiredBars >= minBars) {
        selectedBarDia = dia;
        numberOfBars = Math.max(requiredBars, minBars);
        break;
      }
    }
    
    const AsProvided = numberOfBars * Math.PI * selectedBarDia * selectedBarDia / 4;
    const reinforcementRatio = (AsProvided / Ac) * 100;
    
    // Tie design (EC2)
    const tieDia = Math.max(6, Math.ceil(selectedBarDia / 4));
    const tieSpacing = Math.min(
      12 * selectedBarDia,
      Math.min(b, h),
      300
    );
    
    // Capacity check
    const NRd = 0.8 * (Ac * fcd + AsProvided * fyd) / 1000;
    const utilizationRatio = (axialLoad / NRd) * 100;
    
    // Design status
    const isAdequate = utilizationRatio <= 100 && reinforcementRatio <= 4 && reinforcementRatio >= 0.2;
    
    console.log('Column calculation completed:', {
      axialLoad,
      columnWidth,
      columnDepth,
      AsRequired,
      AsProvided,
      utilizationRatio,
      isSlender
    });

    return new Response(JSON.stringify({
      // Section properties
      grossArea: Ac,
      effectiveDepthX: d,
      effectiveDepthY: h - cover - 10,
      
      // Slenderness
      slendernessRatio: lambda.toFixed(1),
      slendernessLimit: lambdaLim.toFixed(1),
      isSlender,
      
      // Eccentricities
      firstOrderEccentricityX: ex.toFixed(1),
      firstOrderEccentricityY: ey.toFixed(1),
      secondOrderEccentricityX: e2x.toFixed(1),
      secondOrderEccentricityY: e2y.toFixed(1),
      
      // Design moments
      designMomentX: Mdx.toFixed(1),
      designMomentY: Mdy.toFixed(1),
      
      // Reinforcement
      steelAreaRequired: Math.ceil(AsRequired),
      steelAreaProvided: Math.ceil(AsProvided),
      numberOfBars,
      barDiameter: selectedBarDia,
      reinforcementRatio: reinforcementRatio.toFixed(2),
      barArrangement: `${numberOfBars}Ø${selectedBarDia}`,
      
      // Ties
      tieDiameter: tieDia,
      tieSpacing,
      
      // Capacity
      axialCapacity: NRd.toFixed(0),
      utilizationRatio: utilizationRatio.toFixed(1),
      
      // Material properties used
      designConcreteStrength: fcd.toFixed(1),
      designSteelStrength: fyd.toFixed(1),
      
      // Status
      isAdequate,
      designStatus: isAdequate ? 'ADEQUATE' : 'INADEQUATE',
      
      // Warnings
      warnings: [
        ...(isSlender ? ['Column is slender - second order effects included'] : []),
        ...(reinforcementRatio > 3 ? ['High reinforcement ratio - consider increasing section'] : []),
        ...(utilizationRatio > 90 ? ['High utilization - consider increasing section or reinforcement'] : [])
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Column calculation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Invalid request',
      validationFailed: true 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
