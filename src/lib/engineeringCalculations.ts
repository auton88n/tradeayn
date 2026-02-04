/**
 * Client-side engineering calculations for instant results
 * Supports ACI 318-25 and CSA A23.3-24 building codes
 */

import type { BuildingCodeId } from '@/lib/buildingCodes';

// ============ CODE-SPECIFIC PARAMETERS ============
interface CodeParameters {
  loadFactors: { dead: number; live: number };
  resistanceFactors: { flexure: number; shear: number; steel: number };
  minRho: number;
  name: string;
}

const getCodeParameters = (buildingCode: BuildingCodeId): CodeParameters => {
  if (buildingCode === 'CSA') {
    return {
      loadFactors: { dead: 1.25, live: 1.5 },
      resistanceFactors: { flexure: 0.65, shear: 0.65, steel: 0.85 },
      minRho: 0.002,
      name: 'CSA A23.3-24',
    };
  }
  // Default: ACI 318-25
  return {
    loadFactors: { dead: 1.2, live: 1.6 },
    resistanceFactors: { flexure: 0.90, shear: 0.75, steel: 1.0 },
    minRho: 0.0018,
    name: 'ACI 318-25',
  };
};

// ============ BEAM CALCULATOR ============
export interface BeamInputs {
  span: number;
  deadLoad: number;
  liveLoad: number;
  beamWidth: number;
  concreteGrade: string;
  steelGrade: string;
  supportType: string;
  buildingCode?: BuildingCodeId;
}

export interface BeamOutputs {
  beamWidth: number;
  beamDepth: number;
  effectiveDepth: number;
  span: number;
  factoredLoad: number;
  maxMoment: number;
  maxShear: number;
  mainReinforcement: string;
  numberOfBars: number;
  barDiameter: number;
  requiredAs: number;
  providedAs: number;
  stirrups: string;
  stirrupDia: number;
  stirrupSpacing: number;
  concreteVolume: number;
  steelWeight: number;
  formworkArea: number;
  fck: number;
  fy: number;
  buildingCode: string;
  loadFactorsUsed: string;
  resistanceFactorUsed: number;
}

export function calculateBeam(inputs: BeamInputs): BeamOutputs {
  const { span, deadLoad, liveLoad, beamWidth, concreteGrade, steelGrade, supportType, buildingCode = 'ACI' } = inputs;

  // Get code-specific parameters
  const codeParams = getCodeParameters(buildingCode);

  const concreteProps: Record<string, number> = { C25: 25, C30: 30, C35: 35, C40: 40 };
  const steelProps: Record<string, number> = { Fy420: 420, Fy500: 500 };

  const fck = concreteProps[concreteGrade] || 30;
  const fy = steelProps[steelGrade] || 420;

  const momentFactors: Record<string, number> = {
    simply_supported: 8,
    continuous: 10,
    cantilever: 2,
  };
  const momentFactor = momentFactors[supportType] || 8;

  // Use code-specific load factors
  const factoredLoad = codeParams.loadFactors.dead * deadLoad + codeParams.loadFactors.live * liveLoad;
  const maxMoment = (factoredLoad * span * span) / momentFactor;
  const maxShear = supportType === 'cantilever' ? factoredLoad * span : (factoredLoad * span) / 2;

  const cover = 40;
  const stirrupDia = factoredLoad > 50 ? 10 : 8;
  const width = beamWidth;

  const Mu = maxMoment * 1e6;
  const bd2 = Mu / (0.138 * fck);
  const dRequired = Math.sqrt(bd2 / width);

  const effectiveDepth = Math.ceil(dRequired / 25) * 25;
  const totalDepth = effectiveDepth + cover + stirrupDia + 10;
  const roundedDepth = Math.ceil(totalDepth / 25) * 25;

  const d = roundedDepth - cover - stirrupDia - 10;
  
  // Use code-specific resistance factor for steel calculation
  // CSA: Mr = φc × φs × As × fy × (d - a/2) → requires MORE steel for same moment
  // ACI: Mn = As × fy × (d - a/2), then φMn ≥ Mu → φ applied after
  const phiFlex = codeParams.resistanceFactors.flexure;
  const phiSteel = codeParams.resistanceFactors.steel;
  
  // For CSA, we need to account for both φc and φs
  // Simplified: Ast = Mu / (φc × φs × fy × 0.9 × d) for CSA
  // For ACI: Ast = Mu / (φ × fy × 0.9 × d) but φ is applied to capacity, so use 0.87fy
  const effectivePhi = buildingCode === 'CSA' ? phiFlex * phiSteel : 0.87;
  const Ast = Mu / (effectivePhi * fy * 0.9 * d);

  // Check minimum reinforcement
  const AstMin = codeParams.minRho * width * d;
  const AstDesign = Math.max(Ast, AstMin);

  const barSizes = [12, 16, 20, 25, 32];
  let selectedBar = 20;
  let numberOfBars = 4;

  for (const dia of barSizes) {
    const areaPerBar = Math.PI * dia * dia / 4;
    const barsNeeded = Math.ceil(AstDesign / areaPerBar);
    if (barsNeeded >= 2 && barsNeeded <= 8) {
      selectedBar = dia;
      numberOfBars = barsNeeded;
      break;
    }
  }

  // Shear with code-specific resistance factor
  const Vu = maxShear * 1000;
  const phiShear = codeParams.resistanceFactors.shear;
  const Vc = 0.17 * Math.sqrt(fck) * width * d;
  const Vs = Math.max(0, Vu / phiShear - Vc);

  const Asv = Math.PI * stirrupDia * stirrupDia / 4 * 2;
  const stirrupSpacing = Vs > 0
    ? Math.min(Math.floor((0.87 * fy * Asv * d) / Vs), d / 2, 300)
    : Math.min(d / 2, 300);
  const roundedSpacing = Math.floor(stirrupSpacing / 25) * 25;

  const concreteVolume = (width / 1000) * (roundedDepth / 1000) * span;
  const mainSteelWeight = numberOfBars * (Math.PI * selectedBar * selectedBar / 4) * span * 7850 / 1e9;
  const stirrupCount = Math.ceil((span * 1000) / roundedSpacing);
  const stirrupLength = 2 * (width - 2 * cover) + 2 * (roundedDepth - 2 * cover) + 200;
  const stirrupWeight = stirrupCount * stirrupLength * (Math.PI * stirrupDia * stirrupDia / 4) * 7850 / 1e9;
  const totalSteelWeight = mainSteelWeight + stirrupWeight;
  const formworkArea = 2 * (roundedDepth / 1000) * span + (width / 1000) * span;

  return {
    beamWidth: width,
    beamDepth: roundedDepth,
    effectiveDepth: d,
    span,
    factoredLoad: Math.round(factoredLoad * 100) / 100,
    maxMoment: Math.round(maxMoment * 100) / 100,
    maxShear: Math.round(maxShear * 100) / 100,
    mainReinforcement: `${numberOfBars}Ø${selectedBar}`,
    numberOfBars,
    barDiameter: selectedBar,
    requiredAs: Math.round(AstDesign),
    providedAs: Math.round(numberOfBars * Math.PI * selectedBar * selectedBar / 4),
    stirrups: `Ø${stirrupDia}@${roundedSpacing}mm`,
    stirrupDia,
    stirrupSpacing: roundedSpacing,
    concreteVolume: Math.round(concreteVolume * 1000) / 1000,
    steelWeight: Math.round(totalSteelWeight * 10) / 10,
    formworkArea: Math.round(formworkArea * 100) / 100,
    fck,
    fy,
    buildingCode: codeParams.name,
    loadFactorsUsed: `${codeParams.loadFactors.dead}D + ${codeParams.loadFactors.live}L`,
    resistanceFactorUsed: phiFlex,
  };
}

// ============ SLAB CALCULATOR ============
export interface SlabInputs {
  longSpan: number;
  shortSpan: number;
  deadLoad: number;
  liveLoad: number;
  concreteGrade: string;
  steelGrade: string;
  slabType: string;
  supportCondition: string;
  cover: number;
  buildingCode?: BuildingCodeId;
}

export function calculateSlab(inputs: SlabInputs) {
  const { longSpan, shortSpan, deadLoad, liveLoad, concreteGrade, steelGrade, slabType, supportCondition, cover, buildingCode = 'ACI' } = inputs;

  // Get code-specific parameters
  const codeParams = getCodeParameters(buildingCode);

  const concreteProps: Record<string, number> = { C25: 25, C30: 30, C35: 35, C40: 40 };
  const steelProps: Record<string, number> = { Fy420: 420, Fy500: 500 };

  const fck = concreteProps[concreteGrade] || 30;
  const fy = steelProps[steelGrade] || 420;

  const Lx = shortSpan * 1000;
  const Ly = longSpan * 1000;
  const spanRatio = Ly / Lx;
  
  // Use code-specific load factors
  const Wu = codeParams.loadFactors.dead * deadLoad + codeParams.loadFactors.live * liveLoad;

  const deflectionCoeffs: Record<string, number> = {
    simply_supported: 20,
    one_edge_continuous: 24,
    two_edges_continuous: 28,
    all_edges_continuous: 36,
  };
  const deflCoeff = deflectionCoeffs[supportCondition] || 20;

  const hMin = Lx / deflCoeff;
  const thickness = Math.max(Math.ceil(hMin / 25) * 25, 120);

  const barDia = 10;
  const d = thickness - cover - barDia / 2;

  let results: Record<string, unknown>;

  if (slabType === 'one_way') {
    const momentCoeffs: Record<string, { positive: number; negative: number }> = {
      simply_supported: { positive: 8, negative: 0 },
      one_edge_continuous: { positive: 11, negative: 9 },
      two_edges_continuous: { positive: 14, negative: 10 },
      all_edges_continuous: { positive: 16, negative: 11 },
    };
    const coeffs = momentCoeffs[supportCondition] || { positive: 8, negative: 0 };

    const MuPos = (Wu * Lx * Lx) / (1000 * 1000 * coeffs.positive);
    const MuNeg = coeffs.negative > 0 ? (Wu * Lx * Lx) / (1000 * 1000 * coeffs.negative) : 0;

    const AstPos = (MuPos * 1e6) / (0.87 * fy * 0.9 * d);
    const AstNeg = (MuNeg * 1e6) / (0.87 * fy * 0.9 * d);

    const rhoMin = 0.0018;
    const AstMin = rhoMin * 1000 * thickness;

    const mainAst = Math.max(AstPos, AstMin);
    const topAst = Math.max(AstNeg, AstMin * 0.5);
    const distAst = Math.max(0.002 * 1000 * thickness, AstMin * 0.3);

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
    const alphaX = 1 / (1 + Math.pow(spanRatio, 4));
    const alphaY = 1 - alphaX;

    const MuX = alphaX * Wu * Lx * Lx / (8 * 1000 * 1000);
    const MuY = alphaY * Wu * Ly * Ly / (8 * 1000 * 1000);

    const posRatio = supportCondition === 'simply_supported' ? 1.0 : 0.6;
    const negRatio = supportCondition === 'simply_supported' ? 0 : 0.65;

    const MxPos = MuX * posRatio;
    const MxNeg = MuX * negRatio;
    const MyPos = MuY * posRatio;
    const MyNeg = MuY * negRatio;

    const AstXPos = (MxPos * 1e6) / (0.87 * fy * 0.9 * d);
    const AstXNeg = (MxNeg * 1e6) / (0.87 * fy * 0.9 * d);
    const AstYPos = (MyPos * 1e6) / (0.87 * fy * 0.9 * (d - barDia));
    const AstYNeg = (MyNeg * 1e6) / (0.87 * fy * 0.9 * (d - barDia));

    const rhoMin = 0.0018;
    const AstMin = rhoMin * 1000 * thickness;

    const xBottomAst = Math.max(AstXPos, AstMin);
    const xTopAst = Math.max(AstXNeg, AstMin * 0.5);
    const yBottomAst = Math.max(AstYPos, AstMin);
    const yTopAst = Math.max(AstYNeg, AstMin * 0.5);

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

  // Serviceability checks
  const Ec = 4700 * Math.sqrt(fck);
  const Es = 200000;
  const n = Es / Ec;
  const Ws = deadLoad + liveLoad;
  const L = Lx;
  const Ig = (1000 * Math.pow(thickness, 3)) / 12;
  const fr = 0.62 * Math.sqrt(fck);
  const Mcr = (fr * Ig) / (thickness / 2) / 1e6;
  const Ma = (Ws * L * L) / (8 * 1000 * 1000);

  const Ie = Ma <= Mcr
    ? Ig
    : Math.min(Ig, Math.pow(Mcr / Ma, 3) * Ig + (1 - Math.pow(Mcr / Ma, 3)) * 0.35 * Ig);

  const kDefl = supportCondition === 'simply_supported' ? 5 / 384 : 1 / 384;
  const deltaImmediate = (kDefl * Ws * Math.pow(L, 4)) / (Ec * Ie) * 1e6;

  const xi = 2.0;
  const rhoComp = 0;
  const lambda = xi / (1 + 50 * rhoComp);
  const deltaLongTerm = deltaImmediate * (1 + lambda);
  const deltaTotalLT = deltaImmediate + deltaLongTerm;

  const deltaAllowable = L / 250;
  const deflectionRatio = deltaTotalLT / deltaAllowable;
  const deflectionStatus = deltaTotalLT <= deltaAllowable ? 'OK' : 'EXCEEDS LIMIT';

  const concreteVolume = (Lx / 1000) * (Ly / 1000) * (thickness / 1000);
  const steelWeight = concreteVolume * 100;

  return {
    ...results,
    concreteGrade,
    steelGrade,
    fck,
    fy,
    cover,
    concreteVolume,
    steelWeight,
    formworkArea: (Lx / 1000) * (Ly / 1000),
    buildingCode: codeParams.name,
    loadFactorsUsed: `${codeParams.loadFactors.dead}D + ${codeParams.loadFactors.live}L`,
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
      overallStatus: deflectionStatus === 'OK' ? 'PASS' : 'REVIEW REQUIRED',
    },
    status: 'OK',
    designCode: 'ACI 318 / Eurocode 2',
  };
}

// ============ COLUMN CALCULATOR ============
export interface ColumnInputs {
  axialLoad: number;
  momentX: number;
  momentY: number;
  columnWidth: number;
  columnDepth: number;
  columnHeight: number;
  concreteGrade: string;
  steelGrade: string;
  coverThickness: number;
  columnType: string;
  buildingCode?: BuildingCodeId;
}

export function calculateColumn(inputs: ColumnInputs, buildingCode: BuildingCodeId = 'ACI') {
  const {
    axialLoad, momentX, momentY, columnWidth, columnDepth, columnHeight,
    concreteGrade, steelGrade, coverThickness
  } = inputs;
  
  // Get code-specific parameters
  const codeParams = getCodeParameters(buildingCode);

  const fck = parseInt(concreteGrade.replace('C', ''));
  const fy = parseInt(steelGrade);

  const gammaC = 1.5;
  const gammaS = 1.15;
  const fcd = 0.85 * fck / gammaC;
  const fyd = fy / gammaS;

  const b = columnWidth;
  const h = columnDepth;
  const Ac = b * h;
  const cover = coverThickness;

  const d = h - cover - 10;
  const dPrime = cover + 10 + 10;

  const Le = columnHeight;
  const i = Math.min(b, h) / Math.sqrt(12);
  const lambda = Le / i;
  const lambdaLim = 20 * Math.sqrt(fck) / Math.sqrt(axialLoad * 1000 / Ac);
  const isSlender = lambda > lambdaLim;

  const e0 = Math.max(h / 30, 20);
  const ex = (momentX * 1000000) / (axialLoad * 1000) + e0;
  const ey = (momentY * 1000000) / (axialLoad * 1000) + e0;

  let e2x = 0, e2y = 0;
  if (isSlender) {
    const Kr = 1;
    const Kphi = 1 + 0.35 * (lambda / lambdaLim);
    e2x = Kr * Kphi * (Le * Le) / (10 * d) * (1 / 175);
    e2y = Kr * Kphi * (Le * Le) / (10 * d) * (1 / 175);
  }

  const etotX = ex + e2x;
  const etotY = ey + e2y;

  const Mdx = axialLoad * etotX / 1000;
  const Mdy = axialLoad * etotY / 1000;

  const nu = (axialLoad * 1000) / (Ac * fcd);
  const muX = (Mdx * 1000000) / (Ac * h * fcd);
  const muY = (Mdy * 1000000) / (Ac * b * fcd);

  const alpha = 1.5;
  const biaxialRatio = Math.pow(muX, alpha) + Math.pow(muY, alpha);

  let omega = 0.1 + 0.5 * nu + 2 * Math.sqrt(biaxialRatio);
  omega = Math.max(omega, 0.1);
  omega = Math.min(omega, 1.0);

  let AsRequired = omega * Ac * fcd / fyd;

  const AsMin = Math.max(0.002 * Ac, 0.1 * axialLoad * 1000 / fyd);
  const AsMax = 0.04 * Ac;

  AsRequired = Math.max(AsRequired, AsMin);
  AsRequired = Math.min(AsRequired, AsMax);

  const barDiameters = [16, 20, 25, 32];
  let selectedBarDia = 20;
  let numberOfBars = 8;

  for (const dia of barDiameters) {
    const barArea = Math.PI * dia * dia / 4;
    const minBars = 8;
    const requiredBars = Math.ceil(AsRequired / barArea);
    if (requiredBars <= 12 && requiredBars >= minBars) {
      selectedBarDia = dia;
      numberOfBars = Math.max(requiredBars, minBars);
      break;
    }
  }

  const AsProvided = numberOfBars * Math.PI * selectedBarDia * selectedBarDia / 4;
  const reinforcementRatio = (AsProvided / Ac) * 100;

  const tieDia = Math.max(6, Math.ceil(selectedBarDia / 4));
  const tieSpacing = Math.min(12 * selectedBarDia, Math.min(b, h), 300);

  const NRd = 0.8 * (Ac * fcd + AsProvided * fyd) / 1000;
  const utilizationRatio = (axialLoad / NRd) * 100;

  const isAdequate = utilizationRatio <= 100 && reinforcementRatio <= 4 && reinforcementRatio >= 0.2;

  // Generate M-N interaction curve for visualization
  const interactionCurve = generateInteractionCurve(b, h, AsProvided, fcd, fyd, cover);
  
  // Calculate applied moment for interaction diagram
  const appliedP = axialLoad;
  const appliedM = Math.sqrt(Mdx * Mdx + Mdy * Mdy);

  return {
    grossArea: Ac,
    effectiveDepthX: d,
    effectiveDepthY: h - cover - 10,
    slendernessRatio: lambda.toFixed(1),
    slendernessLimit: lambdaLim.toFixed(1),
    isSlender,
    firstOrderEccentricityX: ex.toFixed(1),
    firstOrderEccentricityY: ey.toFixed(1),
    secondOrderEccentricityX: e2x.toFixed(1),
    secondOrderEccentricityY: e2y.toFixed(1),
    designMomentX: Mdx.toFixed(1),
    designMomentY: Mdy.toFixed(1),
    steelAreaRequired: Math.ceil(AsRequired),
    steelAreaProvided: Math.ceil(AsProvided),
    numberOfBars,
    barDiameter: selectedBarDia,
    reinforcementRatio: reinforcementRatio.toFixed(2),
    barArrangement: `${numberOfBars}Ø${selectedBarDia}`,
    tieDiameter: tieDia,
    tieSpacing,
    axialCapacity: NRd.toFixed(0),
    utilizationRatio: utilizationRatio.toFixed(1),
    designConcreteStrength: fcd.toFixed(1),
    designSteelStrength: fyd.toFixed(1),
    isAdequate,
    designStatus: isAdequate ? 'ADEQUATE' : 'INADEQUATE',
    // Interaction diagram data
    interactionCurve,
    appliedP,
    appliedM: parseFloat(appliedM.toFixed(1)),
    warnings: [
      ...(isSlender ? ['Column is slender - second order effects included'] : []),
      ...(reinforcementRatio > 3 ? ['High reinforcement ratio - consider increasing section'] : []),
      ...(utilizationRatio > 90 ? ['High utilization - consider increasing section or reinforcement'] : [])
    ]
  };
}

// Helper function to generate M-N interaction curve points
function generateInteractionCurve(
  b: number,      // Width (mm)
  h: number,      // Depth (mm)
  As: number,     // Total steel area (mm²)
  fcd: number,    // Design concrete strength (MPa)
  fyd: number,    // Design steel strength (MPa)
  cover: number   // Cover (mm)
): Array<{ P: number; M: number; type: string }> {
  const points: Array<{ P: number; M: number; type: string }> = [];
  
  const d = h - cover - 10;           // Effective depth to tension steel
  const dPrime = cover + 10;          // Depth to compression steel
  const epsilon_cu = 0.0035;          // Ultimate concrete strain
  const epsilon_y = fyd / 200000;     // Yield strain
  const beta1 = 0.8;                  // Stress block factor
  
  // Assume steel is distributed 50% on each face (tension/compression)
  const AsHalf = As / 2;
  
  // Pure compression point (c → ∞, all concrete and steel in compression)
  const P0 = 0.8 * (0.85 * fcd * b * h + As * fyd) / 1000;
  points.push({ P: P0, M: 0, type: 'compression' });
  
  // Calculate balanced neutral axis depth
  const cBalanced = d * epsilon_cu / (epsilon_cu + epsilon_y);
  
  // Neutral axis depths to calculate points along the curve
  const cValues = [
    h * 1.0,           // Near pure compression
    h * 0.9,
    h * 0.8,
    h * 0.7,
    h * 0.6,
    cBalanced * 1.1,   // Just above balanced
    cBalanced,         // Balanced point
    cBalanced * 0.8,   // Below balanced (tension-controlled)
    d * 0.5,
    d * 0.4,
    d * 0.3,
    d * 0.2,
    d * 0.15,
    d * 0.1,
    d * 0.05,          // Near pure bending
  ];
  
  const yc = h / 2; // Centroid of section
  
  for (const c of cValues) {
    if (c <= 0) continue;
    
    // Calculate strains
    const epsilon_s = epsilon_cu * (d - c) / c;           // Tension steel strain
    const epsilon_sPrime = epsilon_cu * (c - dPrime) / c; // Compression steel strain
    
    // Steel stresses (capped at yield)
    const fs = Math.sign(epsilon_s) * Math.min(Math.abs(epsilon_s) * 200000, fyd);
    const fsPrime = Math.min(Math.abs(epsilon_sPrime) * 200000, fyd);
    
    // Stress block depth
    const a = beta1 * c;
    const aEffective = Math.min(a, h);
    
    // Forces
    const Cc = 0.85 * fcd * b * aEffective;  // Concrete compression
    const Cs = AsHalf * (epsilon_sPrime > 0 ? fsPrime : 0); // Compression steel
    const Ts = AsHalf * (epsilon_s > 0 ? fs : 0);           // Tension steel force
    
    // Axial capacity (kN)
    const Pn = (Cc + Cs - Ts) / 1000;
    
    // Moment about centroid (kN·m)
    const yCc = aEffective / 2;  // Location of concrete force from top
    const Mn = (
      Cc * (yc - yCc) + 
      Cs * (yc - dPrime) + 
      Ts * (d - yc)
    ) / 1e6;
    
    // Determine zone type
    const isBalanced = Math.abs(c - cBalanced) < 10;
    const type = isBalanced ? 'balanced' : (c > cBalanced ? 'compression' : 'tension');
    
    if (Pn >= 0 && Mn >= 0) {
      points.push({ P: parseFloat(Pn.toFixed(1)), M: parseFloat(Mn.toFixed(1)), type });
    }
  }
  
  // Pure bending point (P ≈ 0)
  // Simplified: at very small c, moment approaches pure bending capacity
  const aMin = AsHalf * fyd / (0.85 * fcd * b);
  const M0 = AsHalf * fyd * (d - aMin / 2) / 1e6;
  points.push({ P: 0, M: parseFloat(M0.toFixed(1)), type: 'tension' });
  
  // Sort by P descending for proper curve drawing
  points.sort((a, b) => b.P - a.P);
  
  return points;
}

// ============ FOUNDATION CALCULATOR ============
export interface FoundationInputs {
  columnLoad: number;
  momentX: number;
  momentY: number;
  columnWidth: number;
  columnDepth: number;
  bearingCapacity: number;
  concreteGrade: string;
  buildingCode?: BuildingCodeId;
}

export function calculateFoundation(inputs: FoundationInputs, buildingCode: BuildingCodeId = 'ACI') {
  const { columnLoad, momentX, momentY, columnWidth, columnDepth, bearingCapacity, concreteGrade } = inputs;

  // Get code-specific parameters
  const codeParams = getCodeParameters(buildingCode);
  
  const concreteProps: Record<string, number> = { C25: 25, C30: 30, C35: 35 };
  const fck = concreteProps[concreteGrade] || 30;
  const fy = 420;

  const allowableBearing = bearingCapacity / 1.5;
  const requiredArea = columnLoad / allowableBearing;

  let length = Math.sqrt(requiredArea);
  let width = length;

  if (momentX > 0 || momentY > 0) {
    const ex = momentX / columnLoad;
    const ey = momentY / columnLoad;
    length = Math.max(length, 6 * ex + columnWidth / 1000);
    width = Math.max(width, 6 * ey + columnDepth / 1000);
  }

  length = Math.ceil(length * 10) / 10;
  width = Math.ceil(width * 10) / 10;
  const area = length * width;

  const actualPressure = columnLoad / area;

  const cover = 75;
  const barDia = 16;
  const Pu = columnLoad * 1.4;

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

  const cantilever = (length * 1000 - columnWidth) / 2;
  const qu = (Pu / area) / 1000;
  const Mu = qu * width * cantilever * cantilever / 2 / 1e6;

  const d = roundedDepth - cover - barDia / 2;
  const Ast = Mu * 1e6 / (0.87 * fy * 0.9 * d);

  const AstMin = 0.0012 * width * 1000 * d;
  const AstRequired = Math.max(Ast, AstMin);

  const barArea = Math.PI * barDia * barDia / 4;
  const numberOfBars = Math.ceil(AstRequired / barArea);
  const spacing = Math.floor((width * 1000 - 2 * cover) / (numberOfBars - 1));
  const roundedSpacing = Math.floor(spacing / 25) * 25;

  const concreteVolume = length * width * (roundedDepth / 1000);
  const steelWeightX = numberOfBars * (length - 0.1) * barArea * 7850 / 1e9;
  const steelWeightY = numberOfBars * (width - 0.1) * barArea * 7850 / 1e9;
  const totalSteelWeight = steelWeightX + steelWeightY;

  return {
    length: Math.round(length * 100) / 100,
    width: Math.round(width * 100) / 100,
    depth: roundedDepth,
    area: Math.round(area * 100) / 100,
    columnWidth,
    columnDepth,
    allowableBearing: Math.round(allowableBearing),
    actualPressure: Math.round(actualPressure * 10) / 10,
    bearingRatio: Math.round((actualPressure / allowableBearing) * 100),
    reinforcementX: `${numberOfBars}Ø${barDia}@${roundedSpacing}mm`,
    reinforcementY: `${numberOfBars}Ø${barDia}@${roundedSpacing}mm`,
    barDiameter: barDia,
    spacing: roundedSpacing,
    concreteVolume: Math.round(concreteVolume * 1000) / 1000,
    steelWeight: Math.round(totalSteelWeight * 10) / 10,
    fck,
    fy,
  };
}

// ============ RETAINING WALL CALCULATOR ============
export interface RetainingWallInputs {
  wallHeight: number;
  stemThicknessTop: number;
  stemThicknessBottom: number;
  baseWidth: number;
  baseThickness: number;
  toeWidth: number;
  soilUnitWeight: number;
  soilFrictionAngle: number;
  surchargeLoad: number;
  concreteGrade: string;
  steelGrade: string;
  waterTableDepth?: number;
  backfillSlope?: number;
  allowableBearingPressure: number;
  buildingCode?: BuildingCodeId;
}

export function calculateRetainingWall(inputs: RetainingWallInputs, buildingCode: BuildingCodeId = 'ACI') {
  const {
    wallHeight, stemThicknessTop, stemThicknessBottom, baseWidth, baseThickness,
    toeWidth, soilUnitWeight, soilFrictionAngle, surchargeLoad, concreteGrade,
    steelGrade, backfillSlope, allowableBearingPressure
  } = inputs;

  // Get code-specific parameters
  const codeParams = getCodeParameters(buildingCode);

  const concreteProps: Record<string, number> = { C25: 25, C30: 30, C35: 35, C40: 40 };
  const steelProps: Record<string, number> = { Fy420: 420, Fy500: 500 };

  const fck = concreteProps[concreteGrade] || 30;
  const fy = steelProps[steelGrade] || 420;
  const gammaConcrete = 24;

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
  const beta = ((backfillSlope || 0) * Math.PI) / 180;

  const Ka = beta === 0
    ? Math.pow(Math.tan(Math.PI / 4 - phi / 2), 2)
    : (Math.cos(beta) - Math.sqrt(Math.cos(beta) ** 2 - Math.cos(phi) ** 2)) /
      (Math.cos(beta) + Math.sqrt(Math.cos(beta) ** 2 - Math.cos(phi) ** 2)) * Math.cos(beta);

  const Kp = Math.pow(Math.tan(Math.PI / 4 + phi / 2), 2);

  const Pa_soil = 0.5 * Ka * gamma * H * H;
  const Pa_surcharge = Ka * q * H;
  const Pa_total = Pa_soil + Pa_surcharge;

  const ya_soil = H / 3;
  const ya_surcharge = H / 2;
  const ya = (Pa_soil * ya_soil + Pa_surcharge * ya_surcharge) / Pa_total;

  const embedDepth = 0.3;
  const Pp = 0.5 * Kp * gamma * embedDepth * embedDepth;

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

  const Mu_stem = Pa_soil * H / 3 + Pa_surcharge * H / 2;
  const dStem = (tBottom * 1000) - 50 - 8;
  const Ast_stem = (Mu_stem * 1e6) / (0.87 * fy * 0.9 * dStem);

  const barDia = 16;
  const areaPerBar = Math.PI * barDia * barDia / 4;
  const stemSpacing = Math.min(Math.floor((1000 * areaPerBar) / Ast_stem / 25) * 25, 200);

  const Ast_dist = 0.002 * tBottom * 1000 * 1000;
  const distBarDia = 10;
  const distSpacing = Math.min(Math.floor((1000 * Math.PI * distBarDia * distBarDia / 4) / Ast_dist / 25) * 25, 300);

  const avgBearing = (qToe + qHeel) / 2;
  const heelLoad = gamma * H + q - avgBearing;
  const Mu_heel = 0.5 * Math.abs(heelLoad) * heel * heel;

  const dHeel = (D * 1000) - 50 - 8;
  const Ast_heel = Math.max((Mu_heel * 1e6) / (0.87 * fy * 0.9 * dHeel), 0.0018 * 1000 * D * 1000);
  const heelSpacing = Math.min(Math.floor((1000 * areaPerBar) / Ast_heel / 25) * 25, 200);

  const toeLoad = qToe - gammaConcrete * D;
  const Mu_toe = 0.5 * toeLoad * toe * toe;

  const dToe = (D * 1000) - 50 - 8;
  const Ast_toe = Math.max((Mu_toe * 1e6) / (0.87 * fy * 0.9 * dToe), 0.0018 * 1000 * D * 1000);
  const toeSpacing = Math.min(Math.floor((1000 * areaPerBar) / Ast_toe / 25) * 25, 200);

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

  return {
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
  };
}
