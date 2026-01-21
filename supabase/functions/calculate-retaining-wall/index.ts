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
      validateNumeric(rawInputs.wallHeight, 'wallHeight', { min: 1, max: 15 }),
      validateNumeric(rawInputs.stemThicknessTop, 'stemThicknessTop', { min: 150, max: 1000 }),
      validateNumeric(rawInputs.stemThicknessBottom, 'stemThicknessBottom', { min: 200, max: 1500 }),
      validateNumeric(rawInputs.baseWidth, 'baseWidth', { min: 500, max: 10000 }),
      validateNumeric(rawInputs.baseThickness, 'baseThickness', { min: 200, max: 2000 }),
      validateNumeric(rawInputs.toeWidth, 'toeWidth', { min: 0, max: 5000 }),
      validateNumeric(rawInputs.soilUnitWeight, 'soilUnitWeight', { min: 14, max: 25 }),
      validateNumeric(rawInputs.soilFrictionAngle, 'soilFrictionAngle', { min: 15, max: 45 }),
      validateNumeric(rawInputs.surchargeLoad, 'surchargeLoad', { min: 0, required: false }),
      validateNumeric(rawInputs.allowableBearingPressure, 'allowableBearingPressure', { min: 50, max: 1000 }),
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

    const wallHeight = Number(rawInputs.wallHeight);
    const stemThicknessTop = Number(rawInputs.stemThicknessTop);
    const stemThicknessBottom = Number(rawInputs.stemThicknessBottom);
    const baseWidth = Number(rawInputs.baseWidth);
    const baseThickness = Number(rawInputs.baseThickness);
    const toeWidth = Number(rawInputs.toeWidth);
    const soilUnitWeight = Number(rawInputs.soilUnitWeight);
    const soilFrictionAngle = Number(rawInputs.soilFrictionAngle);
    const surchargeLoad = Number(rawInputs.surchargeLoad) || 0;
    const concreteGrade = rawInputs.concreteGrade || 'C30';
    const steelGrade = rawInputs.steelGrade || 'Fy420';
    const waterTableDepth = Number(rawInputs.waterTableDepth) || null;
    const backfillSlope = Number(rawInputs.backfillSlope) || 0;
    const allowableBearingPressure = Number(rawInputs.allowableBearingPressure);

    console.log('Retaining wall calculation started:', { wallHeight, baseWidth, soilFrictionAngle });

    // Material properties
    const concreteProps: Record<string, number> = { C25: 25, C30: 30, C35: 35, C40: 40 };
    const steelProps: Record<string, number> = { Fy420: 420, Fy500: 500 };
    
    const fck = concreteProps[concreteGrade] || 30;
    const fy = steelProps[steelGrade] || 420;
    const gammaConcrete = 24;
    
    // Convert to consistent units (m, kN)
    const H = wallHeight;
    const tTop = stemThicknessTop / 1000;
    const tBottom = stemThicknessBottom / 1000;
    const B = baseWidth / 1000;
    const D = baseThickness / 1000;
    const toe = toeWidth / 1000;
    const heel = B - toe - tBottom;
    
    const gamma = soilUnitWeight;
    const phi = soilFrictionAngle * Math.PI / 180;
    const q = surchargeLoad;
    const beta = (backfillSlope || 0) * Math.PI / 180;
    
    // Active earth pressure coefficient
    const Ka = beta === 0 
      ? Math.pow(Math.tan(Math.PI/4 - phi/2), 2)
      : (Math.cos(beta) - Math.sqrt(Math.cos(beta)**2 - Math.cos(phi)**2)) / 
        (Math.cos(beta) + Math.sqrt(Math.cos(beta)**2 - Math.cos(phi)**2)) * Math.cos(beta);
    
    const Kp = Math.pow(Math.tan(Math.PI/4 + phi/2), 2);
    
    const Pa_soil = 0.5 * Ka * gamma * H * H;
    const Pa_surcharge = Ka * q * H;
    const Pa_total = Pa_soil + Pa_surcharge;
    
    const ya_soil = H / 3;
    const ya_surcharge = H / 2;
    const ya = (Pa_soil * ya_soil + Pa_surcharge * ya_surcharge) / Pa_total;
    
    const embedDepth = 0.3;
    const Pp = 0.5 * Kp * gamma * embedDepth * embedDepth;
    
    // Weight calculations
    const W1 = tTop * H * gammaConcrete;
    const W2 = 0.5 * (tBottom - tTop) * H * gammaConcrete;
    const W3 = B * D * gammaConcrete;
    const W4 = heel * H * gamma;
    const W5 = q * heel;
    
    const Wtotal = W1 + W2 + W3 + W4 + W5;
    
    const x1 = toe + tBottom / 2;
    const x2 = toe + tBottom - (tBottom - tTop) / 3;
    const x3 = B / 2;
    const x4 = toe + tBottom + heel / 2;
    const x5 = x4;
    
    const Mr = W1 * x1 + W2 * x2 + W3 * x3 + W4 * x4 + W5 * x5 + Pp * embedDepth / 3;
    const Mo = Pa_total * ya;
    
    const FOS_overturning = Mr / Mo;
    
    const frictionCoeff = Math.tan(phi * 0.67);
    const FOS_sliding = (Wtotal * frictionCoeff + Pp) / Pa_total;
    
    const e = B / 2 - (Mr - Mo) / Wtotal;
    const eMax = B / 6;
    
    let qToe: number, qHeel: number;
    if (Math.abs(e) <= eMax) {
      qToe = (Wtotal / B) * (1 + 6 * e / B);
      qHeel = (Wtotal / B) * (1 - 6 * e / B);
    } else {
      const Beff = 3 * (B / 2 - e);
      qToe = 2 * Wtotal / Beff;
      qHeel = 0;
    }
    
    const FOS_bearing = allowableBearingPressure / Math.max(qToe, qHeel);
    
    // Stem design
    const Mu_stem = Pa_soil * H / 3 + Pa_surcharge * H / 2;
    const dStem = (tBottom * 1000) - 50 - 8;
    const Ast_stem = (Mu_stem * 1e6) / (0.87 * fy * 0.9 * dStem);
    
    const barDia = 16;
    const areaPerBar = Math.PI * barDia * barDia / 4;
    const stemSpacing = Math.min(Math.floor((1000 * areaPerBar) / Ast_stem / 25) * 25, 200);
    
    const Ast_dist = 0.002 * tBottom * 1000 * 1000;
    const distBarDia = 10;
    const distSpacing = Math.min(Math.floor((1000 * Math.PI * distBarDia * distBarDia / 4) / Ast_dist / 25) * 25, 300);
    
    // Heel design
    const avgBearing = (qToe + qHeel) / 2;
    const heelLoad = gamma * H + q - avgBearing;
    const Mu_heel = 0.5 * Math.abs(heelLoad) * heel * heel;
    
    const dHeel = (D * 1000) - 50 - 8;
    const Ast_heel = Math.max((Mu_heel * 1e6) / (0.87 * fy * 0.9 * dHeel), 0.0018 * 1000 * D * 1000);
    const heelSpacing = Math.min(Math.floor((1000 * areaPerBar) / Ast_heel / 25) * 25, 200);
    
    // Toe design
    const toeLoad = qToe - gammaConcrete * D;
    const Mu_toe = 0.5 * toeLoad * toe * toe;
    
    const dToe = (D * 1000) - 50 - 8;
    const Ast_toe = Math.max((Mu_toe * 1e6) / (0.87 * fy * 0.9 * dToe), 0.0018 * 1000 * D * 1000);
    const toeSpacing = Math.min(Math.floor((1000 * areaPerBar) / Ast_toe / 25) * 25, 200);
    
    // Volumes
    const stemVolume = ((tTop + tBottom) / 2) * H * 1;
    const baseVolume = B * D * 1;
    const concreteVolume = stemVolume + baseVolume;
    const steelWeight = concreteVolume * 120;
    
    const stabilityStatus = {
      overturning: FOS_overturning >= 2.0 ? 'OK' : 'INADEQUATE',
      sliding: FOS_sliding >= 1.5 ? 'OK' : 'INADEQUATE',
      bearing: FOS_bearing >= 3.0 ? 'OK' : 'INADEQUATE',
      eccentricity: Math.abs(e) <= eMax ? 'OK (within middle third)' : 'TENSION AT HEEL',
    };
    
    const overallStatus = Object.values(stabilityStatus).every(s => s.includes('OK')) ? 'PASS' : 'REVIEW REQUIRED';

    console.log('Retaining wall calculation complete:', { FOS_overturning, FOS_sliding, FOS_bearing });

    return new Response(
      JSON.stringify({
        wallHeight: H,
        stemThicknessTop: tTop * 1000,
        stemThicknessBottom: tBottom * 1000,
        baseWidth: B * 1000,
        baseThickness: D * 1000,
        toeWidth: toe * 1000,
        heelWidth: heel * 1000,
        
        earthPressure: {
          Ka,
          Kp,
          Pa_soil: parseFloat(Pa_soil.toFixed(2)),
          Pa_surcharge: parseFloat(Pa_surcharge.toFixed(2)),
          Pa_total: parseFloat(Pa_total.toFixed(2)),
          applicationHeight: parseFloat(ya.toFixed(3)),
          Pp: parseFloat(Pp.toFixed(2)),
        },
        
        stability: {
          totalWeight: parseFloat(Wtotal.toFixed(2)),
          resistingMoment: parseFloat(Mr.toFixed(2)),
          overturningMoment: parseFloat(Mo.toFixed(2)),
          FOS_overturning: parseFloat(FOS_overturning.toFixed(2)),
          FOS_sliding: parseFloat(FOS_sliding.toFixed(2)),
          FOS_bearing: parseFloat(FOS_bearing.toFixed(2)),
          eccentricity: parseFloat(e.toFixed(3)),
          maxEccentricity: parseFloat(eMax.toFixed(3)),
        },
        
        bearingPressure: {
          toe: parseFloat(qToe.toFixed(2)),
          heel: parseFloat(qHeel.toFixed(2)),
          allowable: allowableBearingPressure,
        },
        
        reinforcement: {
          stem: {
            mainBars: `T${barDia}@${stemSpacing}mm c/c (rear face)`,
            distributionBars: `T${distBarDia}@${distSpacing}mm c/c (horizontal)`,
            area: parseFloat(Ast_stem.toFixed(0)),
          },
          heel: {
            topBars: `T${barDia}@${heelSpacing}mm c/c`,
            area: parseFloat(Ast_heel.toFixed(0)),
          },
          toe: {
            bottomBars: `T${barDia}@${toeSpacing}mm c/c`,
            area: parseFloat(Ast_toe.toFixed(0)),
          },
        },
        
        stabilityStatus,
        overallStatus,
        
        concreteVolume: parseFloat(concreteVolume.toFixed(3)),
        steelWeight: parseFloat(steelWeight.toFixed(1)),
        formworkArea: parseFloat((2 * H + B + heel + toe).toFixed(2)),
        
        concreteGrade,
        steelGrade,
        fck,
        fy,
        
        status: 'OK',
        designCode: 'Rankine Theory / ACI 318',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Retaining wall calculation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Invalid request',
        validationFailed: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
