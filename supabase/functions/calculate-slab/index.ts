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
      longSpan, 
      shortSpan, 
      deadLoad, 
      liveLoad, 
      concreteGrade, 
      steelGrade, 
      slabType,
      supportCondition,
      cover 
    } = await req.json();

    // Material properties
    const concreteProps: Record<string, number> = { C25: 25, C30: 30, C35: 35, C40: 40 };
    const steelProps: Record<string, number> = { Fy420: 420, Fy500: 500 };
    
    const fck = concreteProps[concreteGrade] || 30;
    const fy = steelProps[steelGrade] || 420;
    
    // Convert spans to mm
    const Lx = shortSpan * 1000; // Short span in mm
    const Ly = longSpan * 1000;  // Long span in mm
    const spanRatio = Ly / Lx;

    // Factored load (kN/m²)
    const Wu = 1.4 * deadLoad + 1.6 * liveLoad;

    // Minimum thickness calculation based on ACI 318
    // Deflection control coefficients
    const deflectionCoeffs: Record<string, number> = {
      simply_supported: 20,
      one_edge_continuous: 24,
      two_edges_continuous: 28,
      all_edges_continuous: 36,
    };
    const deflCoeff = deflectionCoeffs[supportCondition] || 20;
    
    // Minimum thickness
    const hMin = Lx / deflCoeff;
    const thickness = Math.max(Math.ceil(hMin / 25) * 25, 120); // Round to 25mm, min 120mm
    
    // Effective depth
    const barDia = 10; // Assumed 10mm bars
    const d = thickness - cover - barDia / 2;

    let results: Record<string, unknown>;

    if (slabType === 'one_way') {
      // One-way slab design
      // Moment coefficient based on support condition
      const momentCoeffs: Record<string, { positive: number; negative: number }> = {
        simply_supported: { positive: 8, negative: 0 },
        one_edge_continuous: { positive: 11, negative: 9 },
        two_edges_continuous: { positive: 14, negative: 10 },
        all_edges_continuous: { positive: 16, negative: 11 },
      };
      const coeffs = momentCoeffs[supportCondition] || { positive: 8, negative: 0 };

      // Moments per meter width (kN·m/m)
      const MuPos = (Wu * Lx * Lx) / (1000 * 1000 * coeffs.positive);
      const MuNeg = coeffs.negative > 0 ? (Wu * Lx * Lx) / (1000 * 1000 * coeffs.negative) : 0;

      // Required steel area (mm²/m)
      const AstPos = (MuPos * 1e6) / (0.87 * fy * 0.9 * d);
      const AstNeg = (MuNeg * 1e6) / (0.87 * fy * 0.9 * d);
      
      // Minimum steel ratio
      const rhoMin = 0.0018;
      const AstMin = rhoMin * 1000 * thickness;
      
      // Final steel areas
      const mainAst = Math.max(AstPos, AstMin);
      const topAst = Math.max(AstNeg, AstMin * 0.5);
      const distAst = Math.max(0.002 * 1000 * thickness, AstMin * 0.3); // Distribution steel

      // Bar spacing calculations
      const areaPerBar = Math.PI * barDia * barDia / 4;
      const mainSpacing = Math.min(Math.floor((1000 * areaPerBar) / mainAst / 25) * 25, 300);
      const distSpacing = Math.min(Math.floor((1000 * areaPerBar) / distAst / 25) * 25, 450);
      const topSpacing = Math.min(Math.floor((1000 * areaPerBar) / topAst / 25) * 25, 300);

      results = {
        slabType: 'One-Way',
        thickness,
        effectiveDepth: d,
        factoredLoad: Wu,
        spanRatio,
        positiveMoment: MuPos,
        negativeMoment: MuNeg,
        mainReinforcement: {
          direction: 'Short Span',
          area: mainAst,
          barDia,
          spacing: mainSpacing,
          description: `T${barDia}@${mainSpacing}mm c/c`,
        },
        distributionReinforcement: {
          direction: 'Long Span',
          area: distAst,
          barDia,
          spacing: distSpacing,
          description: `T${barDia}@${distSpacing}mm c/c`,
        },
        topReinforcement: topAst > AstMin * 0.5 ? {
          area: topAst,
          barDia,
          spacing: topSpacing,
          description: `T${barDia}@${topSpacing}mm c/c`,
        } : null,
        length: Ly,
        width: Lx,
        topBarSpacing: topSpacing,
        bottomBarSpacing: mainSpacing,
      };
    } else {
      // Two-way slab design (Direct Design Method / Coefficient Method)
      // Moment coefficients for two-way slabs (simplified)
      const alphaX = 1 / (1 + Math.pow(spanRatio, 4));
      const alphaY = 1 - alphaX;

      // Total moment per meter width
      const MuX = alphaX * Wu * Lx * Lx / (8 * 1000 * 1000);
      const MuY = alphaY * Wu * Ly * Ly / (8 * 1000 * 1000);

      // Positive and negative moment distribution
      const posRatio = supportCondition === 'simply_supported' ? 1.0 : 0.6;
      const negRatio = supportCondition === 'simply_supported' ? 0 : 0.65;

      const MxPos = MuX * posRatio;
      const MxNeg = MuX * negRatio;
      const MyPos = MuY * posRatio;
      const MyNeg = MuY * negRatio;

      // Required steel areas
      const AstXPos = (MxPos * 1e6) / (0.87 * fy * 0.9 * d);
      const AstXNeg = (MxNeg * 1e6) / (0.87 * fy * 0.9 * d);
      const AstYPos = (MyPos * 1e6) / (0.87 * fy * 0.9 * (d - barDia));
      const AstYNeg = (MyNeg * 1e6) / (0.87 * fy * 0.9 * (d - barDia));

      // Minimum steel
      const rhoMin = 0.0018;
      const AstMin = rhoMin * 1000 * thickness;

      // Final areas
      const xBottomAst = Math.max(AstXPos, AstMin);
      const xTopAst = Math.max(AstXNeg, AstMin * 0.5);
      const yBottomAst = Math.max(AstYPos, AstMin);
      const yTopAst = Math.max(AstYNeg, AstMin * 0.5);

      // Spacings
      const areaPerBar = Math.PI * barDia * barDia / 4;
      const xBottomSpacing = Math.min(Math.floor((1000 * areaPerBar) / xBottomAst / 25) * 25, 200);
      const xTopSpacing = Math.min(Math.floor((1000 * areaPerBar) / xTopAst / 25) * 25, 200);
      const yBottomSpacing = Math.min(Math.floor((1000 * areaPerBar) / yBottomAst / 25) * 25, 200);
      const yTopSpacing = Math.min(Math.floor((1000 * areaPerBar) / yTopAst / 25) * 25, 200);

      results = {
        slabType: 'Two-Way',
        thickness,
        effectiveDepth: d,
        factoredLoad: Wu,
        spanRatio,
        momentX: MuX,
        momentY: MuY,
        momentDistribution: { alphaX, alphaY },
        xDirection: {
          positiveMoment: MxPos,
          negativeMoment: MxNeg,
          bottomReinforcement: {
            area: xBottomAst,
            barDia,
            spacing: xBottomSpacing,
            description: `T${barDia}@${xBottomSpacing}mm c/c`,
          },
          topReinforcement: xTopAst > AstMin * 0.5 ? {
            area: xTopAst,
            barDia,
            spacing: xTopSpacing,
            description: `T${barDia}@${xTopSpacing}mm c/c`,
          } : null,
        },
        yDirection: {
          positiveMoment: MyPos,
          negativeMoment: MyNeg,
          bottomReinforcement: {
            area: yBottomAst,
            barDia,
            spacing: yBottomSpacing,
            description: `T${barDia}@${yBottomSpacing}mm c/c`,
          },
          topReinforcement: yTopAst > AstMin * 0.5 ? {
            area: yTopAst,
            barDia,
            spacing: yTopSpacing,
            description: `T${barDia}@${yTopSpacing}mm c/c`,
          } : null,
        },
        length: Ly,
        width: Lx,
        topBarSpacing: Math.min(xTopSpacing, yTopSpacing),
        bottomBarSpacing: Math.min(xBottomSpacing, yBottomSpacing),
      };
    }

    // ============ SERVICEABILITY CHECKS ============
    
    // Elastic modulus of concrete (MPa)
    const Ec = 4700 * Math.sqrt(fck);
    // Elastic modulus of steel (MPa)
    const Es = 200000;
    // Modular ratio
    const n = Es / Ec;
    
    // Service load (unfactored)
    const Ws = deadLoad + liveLoad; // kN/m²
    
    // === DEFLECTION CHECK (Eurocode 2 / ACI 318 simplified) ===
    // Immediate deflection using Branson's equation (simplified)
    const L = Lx; // Governing span in mm
    const Ig = (1000 * Math.pow(thickness, 3)) / 12; // Gross moment of inertia per meter width
    
    // Cracking moment
    const fr = 0.62 * Math.sqrt(fck); // Modulus of rupture (MPa)
    const Mcr = (fr * Ig) / (thickness / 2) / 1e6; // kN·m/m
    
    // Service moment
    const Ma = (Ws * L * L) / (8 * 1000 * 1000); // kN·m/m
    
    // Effective moment of inertia (Branson)
    const Ie = Ma <= Mcr 
      ? Ig 
      : Math.min(Ig, Math.pow(Mcr / Ma, 3) * Ig + (1 - Math.pow(Mcr / Ma, 3)) * 0.35 * Ig);
    
    // Immediate deflection
    const kDefl = supportCondition === 'simply_supported' ? 5/384 : 
                  supportCondition === 'cantilever' ? 1/8 : 1/384;
    const deltaImmediate = (kDefl * Ws * Math.pow(L, 4)) / (Ec * Ie) * 1e6; // mm
    
    // Long-term deflection (considering creep and shrinkage)
    const xi = 2.0; // Time-dependent factor for 5+ years
    const rhoComp = 0; // Compression reinforcement ratio (assumed 0 for slabs)
    const lambda = xi / (1 + 50 * rhoComp);
    const deltaLongTerm = deltaImmediate * (1 + lambda);
    const deltaTotalLT = deltaImmediate + deltaLongTerm;
    
    // Allowable deflection (L/250 for total, L/500 for live load)
    const deltaAllowable = L / 250;
    const deltaLiveAllowable = L / 500;
    const deflectionRatio = deltaTotalLT / deltaAllowable;
    const deflectionStatus = deltaTotalLT <= deltaAllowable ? 'OK' : 'EXCEEDS LIMIT';
    
    // === CRACK WIDTH CHECK (Eurocode 2 approach) ===
    // Steel stress under service load
    const As = (results as any).mainReinforcement?.area || 
               (results as any).xDirection?.bottomReinforcement?.area || 300; // mm²/m
    const sigma_s = (Ma * 1e6) / (0.9 * d * As); // MPa (approximate)
    
    // Maximum bar spacing for crack control
    const k1 = 0.8; // High bond bars
    const k2 = 0.5; // Bending
    const k3 = 3.4;
    const k4 = 0.425;
    const c = cover;
    
    // Effective tension area
    const hceff = Math.min(2.5 * (thickness - d), (thickness - d) / 3, thickness / 2);
    const Aceff = 1000 * hceff;
    const rhoEff = As / Aceff;
    
    // Crack spacing
    const srMax = k3 * c + k1 * k2 * k4 * barDia / rhoEff;
    
    // Mean strain difference
    const kt = 0.4; // Long-term loading
    const fctEff = 0.3 * Math.pow(fck, 2/3); // Mean tensile strength
    const esmEcm = Math.max(
      (sigma_s - kt * (fctEff / rhoEff) * (1 + n * rhoEff)) / Es,
      0.6 * sigma_s / Es
    );
    
    // Crack width
    const wk = srMax * esmEcm;
    
    // Allowable crack width based on exposure
    const wkAllowable = 0.3; // mm (normal exposure)
    const crackWidthStatus = wk <= wkAllowable ? 'OK' : 'EXCEEDS LIMIT';
    
    // Common outputs
    const concreteVolume = (Lx / 1000) * (Ly / 1000) * (thickness / 1000);
    const steelWeight = concreteVolume * 100; // Approximate 100 kg/m³

    return new Response(
      JSON.stringify({
        ...results,
        concreteGrade,
        steelGrade,
        fck,
        fy,
        cover,
        concreteVolume,
        steelWeight,
        formworkArea: (Lx / 1000) * (Ly / 1000),
        // Serviceability checks
        serviceabilityChecks: {
          deflection: {
            immediate: parseFloat(deltaImmediate.toFixed(2)),
            longTerm: parseFloat(deltaLongTerm.toFixed(2)),
            total: parseFloat(deltaTotalLT.toFixed(2)),
            allowable: parseFloat(deltaAllowable.toFixed(2)),
            ratio: parseFloat(deflectionRatio.toFixed(3)),
            status: deflectionStatus,
            spanToDeflection: parseFloat((L / deltaTotalLT).toFixed(0)),
          },
          crackWidth: {
            calculated: parseFloat(wk.toFixed(3)),
            allowable: wkAllowable,
            crackSpacing: parseFloat(srMax.toFixed(1)),
            steelStress: parseFloat(sigma_s.toFixed(1)),
            status: crackWidthStatus,
          },
          overallStatus: deflectionStatus === 'OK' && crackWidthStatus === 'OK' ? 'PASS' : 'REVIEW REQUIRED',
        },
        status: 'OK',
        designCode: 'ACI 318 / Eurocode 2',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Slab calculation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
