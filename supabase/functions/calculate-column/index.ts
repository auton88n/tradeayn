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
    
    // ========================================
    // M-N INTERACTION CURVE GENERATION
    // ========================================
    const epsilon_cu = 0.0035; // Ultimate concrete strain
    const epsilon_y = fyd / 200000; // Yield strain
    const Es = 200000; // Steel modulus (MPa)
    
    interface InteractionPoint {
      P: number;
      M: number;
      type: 'compression' | 'balanced' | 'tension';
    }
    
    const interactionCurve: InteractionPoint[] = [];
    
    // Pure compression point (P0, M=0)
    const P0 = 0.8 * (0.85 * fcd * b * h + AsProvided * fyd) / 1000;
    interactionCurve.push({ P: P0, M: 0, type: 'compression' });
    
    // Balanced neutral axis depth
    const cBalanced = d * epsilon_cu / (epsilon_cu + epsilon_y);
    
    // Generate points by varying neutral axis depth c
    const cValues = [
      h * 1.5,      // Above pure compression
      h,            // Full depth
      0.9 * h,
      0.8 * h,
      0.7 * h,
      0.6 * h,
      cBalanced,    // Balanced point
      0.5 * d,
      0.4 * d,
      0.3 * d,
      0.2 * d,
      0.15 * d,
      0.1 * d,
      0.05 * d,
    ];
    
    for (const c of cValues) {
      if (c <= 0) continue;
      
      // Calculate strains
      const epsilon_s = epsilon_cu * (d - c) / c;  // Tension steel strain
      const epsilon_sPrime = c > dPrime ? epsilon_cu * (c - dPrime) / c : 0;  // Compression steel strain
      
      // Steel stresses (capped at yield, can be negative for tension)
      const fs = Math.min(Math.abs(epsilon_s) * Es, fyd) * Math.sign(epsilon_s);
      const fsPrime = Math.min(Math.abs(epsilon_sPrime) * Es, fyd);
      
      // Stress block depth
      const beta1 = 0.8; // For fck <= 50 MPa
      const a = beta1 * c;
      
      // Concrete compression force
      const Cc = 0.85 * fcd * b * Math.min(a, h);
      
      // Steel forces (assuming equal distribution on tension/compression faces)
      const AsPrime = AsProvided / 2; // Compression steel area
      const As = AsProvided / 2;      // Tension steel area
      const Cs = AsPrime * fsPrime;   // Compression steel force
      const Ts = As * Math.abs(fs);   // Tension steel force (positive)
      
      // Axial capacity
      let Pn: number;
      if (fs >= 0) {
        // Compression in tension steel
        Pn = (Cc + Cs + Ts) / 1000;
      } else {
        // Tension in tension steel
        Pn = (Cc + Cs - Ts) / 1000;
      }
      
      // Moment about centroid
      const yc = h / 2;  // Distance from top to centroid
      const yCc = Math.min(a, h) / 2;  // Distance from top to concrete force
      const Mn = (
        Cc * (yc - yCc) +
        Cs * (yc - dPrime) +
        Ts * (d - yc)
      ) / 1e6;
      
      // Determine zone type
      const isBalancedPt = Math.abs(c - cBalanced) < 10;
      const type: 'compression' | 'balanced' | 'tension' = 
        isBalancedPt ? 'balanced' : (c > cBalanced ? 'compression' : 'tension');
      
      if (Pn >= 0 && Mn >= 0) {
        interactionCurve.push({ P: Pn, M: Mn, type });
      }
    }
    
    // Pure bending point (P=0, M0)
    // Simplified: use tension-controlled section
    const aFlexure = (AsProvided / 2) * fyd / (0.85 * fcd * b);
    const M0 = (AsProvided / 2) * fyd * (d - aFlexure / 2) / 1e6;
    interactionCurve.push({ P: 0, M: M0, type: 'tension' });
    
    // Sort curve points by axial load descending for proper plotting
    interactionCurve.sort((a, b) => b.P - a.P);
    
    // Find balanced point values
    const balancedPoint = interactionCurve.find(p => p.type === 'balanced') || 
                          { P: 0, M: 0 };
    
    // Resultant applied moment for biaxial case
    const appliedMoment = Math.sqrt(Mdx * Mdx + Mdy * Mdy);
    
    console.log('Column calculation completed:', {
      axialLoad,
      columnWidth,
      columnDepth,
      AsRequired,
      AsProvided,
      utilizationRatio,
      isSlender,
      interactionCurvePoints: interactionCurve.length
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
      
      // M-N Interaction Diagram Data
      interactionCurve,
      appliedP: axialLoad,
      appliedM: appliedMoment,
      balancedPoint: { P: balancedPoint.P, M: balancedPoint.M },
      pureCompression: P0,
      pureBending: M0,
      
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
