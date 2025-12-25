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
    const { 
      wallHeight,
      stemThicknessTop,
      stemThicknessBottom,
      baseWidth,
      baseThickness,
      toeWidth,
      soilUnitWeight,
      soilFrictionAngle,
      surchargeLoad,
      concreteGrade,
      steelGrade,
      waterTableDepth,
      backfillSlope,
      allowableBearingPressure,
    } = await req.json();

    console.log('Retaining wall calculation started:', { wallHeight, baseWidth, soilFrictionAngle });

    // Material properties
    const concreteProps: Record<string, number> = { C25: 25, C30: 30, C35: 35, C40: 40 };
    const steelProps: Record<string, number> = { Fy420: 420, Fy500: 500 };
    
    const fck = concreteProps[concreteGrade] || 30;
    const fy = steelProps[steelGrade] || 420;
    const gammaConcrete = 24; // kN/m³
    
    // Convert to consistent units (m, kN)
    const H = wallHeight; // m
    const tTop = stemThicknessTop / 1000; // m
    const tBottom = stemThicknessBottom / 1000; // m
    const B = baseWidth / 1000; // m
    const D = baseThickness / 1000; // m
    const toe = toeWidth / 1000; // m
    const heel = B - toe - tBottom;
    
    const gamma = soilUnitWeight; // kN/m³
    const phi = soilFrictionAngle * Math.PI / 180; // radians
    const q = surchargeLoad; // kN/m²
    const beta = (backfillSlope || 0) * Math.PI / 180; // backfill slope in radians
    
    // ============ LATERAL EARTH PRESSURE (Rankine Theory) ============
    
    // Active earth pressure coefficient (with sloping backfill)
    const Ka = beta === 0 
      ? Math.pow(Math.tan(Math.PI/4 - phi/2), 2)
      : (Math.cos(beta) - Math.sqrt(Math.cos(beta)**2 - Math.cos(phi)**2)) / 
        (Math.cos(beta) + Math.sqrt(Math.cos(beta)**2 - Math.cos(phi)**2)) * Math.cos(beta);
    
    // Passive earth pressure coefficient
    const Kp = Math.pow(Math.tan(Math.PI/4 + phi/2), 2);
    
    // Active earth pressure at base (triangular)
    const Pa_soil = 0.5 * Ka * gamma * H * H; // kN/m
    const Pa_surcharge = Ka * q * H; // kN/m (rectangular)
    const Pa_total = Pa_soil + Pa_surcharge;
    
    // Point of application
    const ya_soil = H / 3; // from base
    const ya_surcharge = H / 2;
    const ya = (Pa_soil * ya_soil + Pa_surcharge * ya_surcharge) / Pa_total;
    
    // Passive pressure (in front of toe, if embedded)
    const embedDepth = 0.3; // Assume 0.3m embedment
    const Pp = 0.5 * Kp * gamma * embedDepth * embedDepth;
    
    // ============ STABILITY ANALYSIS ============
    
    // Weight calculations (per meter length)
    const W1 = tTop * H * gammaConcrete; // Stem (simplified as rectangle)
    const W2 = 0.5 * (tBottom - tTop) * H * gammaConcrete; // Stem taper
    const W3 = B * D * gammaConcrete; // Base slab
    const W4 = heel * H * gamma; // Backfill on heel
    const W5 = q * heel; // Surcharge on heel
    
    const Wtotal = W1 + W2 + W3 + W4 + W5;
    
    // Moment arms from toe
    const x1 = toe + tBottom / 2;
    const x2 = toe + tBottom - (tBottom - tTop) / 3;
    const x3 = B / 2;
    const x4 = toe + tBottom + heel / 2;
    const x5 = x4;
    
    // Resisting moment (about toe)
    const Mr = W1 * x1 + W2 * x2 + W3 * x3 + W4 * x4 + W5 * x5 + Pp * embedDepth / 3;
    
    // Overturning moment (about toe)
    const Mo = Pa_total * ya;
    
    // Factor of Safety against Overturning
    const FOS_overturning = Mr / Mo;
    
    // Factor of Safety against Sliding
    const frictionCoeff = Math.tan(phi * 0.67); // Base friction (2/3 of soil friction)
    const FOS_sliding = (Wtotal * frictionCoeff + Pp) / Pa_total;
    
    // ============ BEARING PRESSURE CHECK ============
    
    // Eccentricity
    const e = B / 2 - (Mr - Mo) / Wtotal;
    const eMax = B / 6; // Middle third rule
    
    // Bearing pressures
    let qToe: number, qHeel: number;
    if (Math.abs(e) <= eMax) {
      // Trapezoidal distribution
      qToe = (Wtotal / B) * (1 + 6 * e / B);
      qHeel = (Wtotal / B) * (1 - 6 * e / B);
    } else {
      // Triangular distribution (tension at heel)
      const Beff = 3 * (B / 2 - e);
      qToe = 2 * Wtotal / Beff;
      qHeel = 0;
    }
    
    const FOS_bearing = allowableBearingPressure / Math.max(qToe, qHeel);
    
    // ============ STEM DESIGN ============
    
    // Critical section at base of stem
    const Mu_stem = Pa_soil * H / 3 + Pa_surcharge * H / 2;
    
    // Stem reinforcement
    const dStem = (tBottom * 1000) - 50 - 8; // effective depth (mm)
    const Ast_stem = (Mu_stem * 1e6) / (0.87 * fy * 0.9 * dStem);
    
    // Select bars
    const barDia = 16;
    const areaPerBar = Math.PI * barDia * barDia / 4;
    const stemSpacing = Math.min(Math.floor((1000 * areaPerBar) / Ast_stem / 25) * 25, 200);
    
    // Distribution steel
    const Ast_dist = 0.002 * tBottom * 1000 * 1000;
    const distBarDia = 10;
    const distSpacing = Math.min(Math.floor((1000 * Math.PI * distBarDia * distBarDia / 4) / Ast_dist / 25) * 25, 300);
    
    // ============ HEEL DESIGN ============
    
    // Net pressure on heel (upward bearing - downward soil + surcharge)
    const avgBearing = (qToe + qHeel) / 2;
    const heelLoad = gamma * H + q - avgBearing;
    const Mu_heel = 0.5 * Math.abs(heelLoad) * heel * heel;
    
    const dHeel = (D * 1000) - 50 - 8;
    const Ast_heel = Math.max((Mu_heel * 1e6) / (0.87 * fy * 0.9 * dHeel), 0.0018 * 1000 * D * 1000);
    const heelSpacing = Math.min(Math.floor((1000 * areaPerBar) / Ast_heel / 25) * 25, 200);
    
    // ============ TOE DESIGN ============
    
    // Net upward pressure on toe
    const toeLoad = qToe - gammaConcrete * D;
    const Mu_toe = 0.5 * toeLoad * toe * toe;
    
    const dToe = (D * 1000) - 50 - 8;
    const Ast_toe = Math.max((Mu_toe * 1e6) / (0.87 * fy * 0.9 * dToe), 0.0018 * 1000 * D * 1000);
    const toeSpacing = Math.min(Math.floor((1000 * areaPerBar) / Ast_toe / 25) * 25, 200);
    
    // ============ VOLUME & COST ============
    
    const stemVolume = ((tTop + tBottom) / 2) * H * 1; // per meter length
    const baseVolume = B * D * 1;
    const concreteVolume = stemVolume + baseVolume;
    const steelWeight = concreteVolume * 120; // ~120 kg/m³ for retaining walls
    
    // Status checks
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
        // Input echo
        wallHeight: H,
        stemThicknessTop: tTop * 1000,
        stemThicknessBottom: tBottom * 1000,
        baseWidth: B * 1000,
        baseThickness: D * 1000,
        toeWidth: toe * 1000,
        heelWidth: heel * 1000,
        
        // Earth pressure
        earthPressure: {
          Ka,
          Kp,
          Pa_soil: parseFloat(Pa_soil.toFixed(2)),
          Pa_surcharge: parseFloat(Pa_surcharge.toFixed(2)),
          Pa_total: parseFloat(Pa_total.toFixed(2)),
          applicationHeight: parseFloat(ya.toFixed(3)),
          Pp: parseFloat(Pp.toFixed(2)),
        },
        
        // Stability
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
        
        // Bearing pressure
        bearingPressure: {
          toe: parseFloat(qToe.toFixed(2)),
          heel: parseFloat(qHeel.toFixed(2)),
          allowable: allowableBearingPressure,
        },
        
        // Reinforcement
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
        
        // Status
        stabilityStatus,
        overallStatus,
        
        // Quantities
        concreteVolume: parseFloat(concreteVolume.toFixed(3)),
        steelWeight: parseFloat(steelWeight.toFixed(1)),
        formworkArea: parseFloat((2 * H + B + heel + toe).toFixed(2)),
        
        // Materials
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
