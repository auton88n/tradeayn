/**
 * Building Code Calculator Helpers
 * 
 * Functions that apply the selected building code to structural calculations.
 * These bridge the gap between the code configurations and the actual calculations.
 */

import type { 
  BuildingCodeConfig, 
  BuildingCodeId, 
  DesignWarning,
  LoadCombination,
} from './types';
import { ACI_318_25, getACIBeta1 } from './aci-318-25';
import { CSA_A23_3_24, getCSAAlpha1, getCSABeta1 } from './csa-a23-3-24';

// ============================================================================
// CORE CODE ACCESS
// ============================================================================

/**
 * Get the building code configuration by ID
 */
export function getBuildingCode(id: BuildingCodeId): BuildingCodeConfig {
  switch (id) {
    case 'ACI':
      return ACI_318_25;
    case 'CSA':
      return CSA_A23_3_24;
    default:
      return ACI_318_25;
  }
}

// ============================================================================
// LOAD CALCULATIONS
// ============================================================================

/**
 * Calculate factored load combination
 * U = γD × D + γL × L
 */
export function getFactoredLoad(
  code: BuildingCodeConfig,
  deadLoad: number,
  liveLoad: number,
  windLoad: number = 0,
  seismicLoad: number = 0,
  snowLoad: number = 0
): number {
  const { loadFactors } = code;
  
  // Basic gravity load combination
  let U = loadFactors.dead * deadLoad + loadFactors.live * liveLoad;
  
  // Add environmental loads if present
  if (windLoad > 0) {
    U += loadFactors.wind * windLoad;
  }
  if (seismicLoad > 0) {
    U += loadFactors.seismic * seismicLoad;
  }
  if (snowLoad > 0) {
    U += loadFactors.snow * snowLoad;
  }
  
  // Check against dead load only case
  const deadOnly = loadFactors.deadOnly * deadLoad;
  
  return Math.max(U, deadOnly);
}

/**
 * Get all applicable load combinations for a given scenario
 */
export function getApplicableLoadCombinations(
  code: BuildingCodeConfig,
  hasWind: boolean = false,
  hasSeismic: boolean = false,
  hasSnow: boolean = false
): LoadCombination[] {
  return code.loadCombinations.filter(lc => {
    if (lc.purpose === 'dead_only') return true;
    if (lc.purpose === 'gravity') return true;
    if (lc.purpose === 'wind' || lc.purpose === 'wind_uplift') return hasWind;
    if (lc.purpose === 'seismic' || lc.purpose === 'seismic_overturning') return hasSeismic;
    if (lc.purpose === 'snow') return hasSnow;
    return false;
  });
}

// ============================================================================
// STRESS BLOCK PARAMETERS
// ============================================================================

/**
 * Get stress block parameters (α1 and β1)
 */
export function getStressBlockParams(
  code: BuildingCodeConfig,
  fck: number
): { alpha1: number; beta1: number } {
  const { stressBlock } = code;
  
  const alpha1 = typeof stressBlock.alpha1 === 'function'
    ? stressBlock.alpha1(fck)
    : stressBlock.alpha1;
    
  const beta1 = typeof stressBlock.beta1 === 'function'
    ? stressBlock.beta1(fck)
    : stressBlock.beta1;
  
  return {
    alpha1: Math.max(alpha1, stressBlock.alpha1Min ?? 0),
    beta1: Math.max(beta1, stressBlock.beta1Min ?? 0),
  };
}

// ============================================================================
// SIZE EFFECT FACTOR
// ============================================================================

/**
 * Calculate size effect factor λs per ACI 318-25 Section 22.5.5.1.3
 * λs = √(2/(1+0.004d)) ≤ 1.0
 * 
 * For CSA, size effect is integrated into MCFT method
 * 
 * @param code Building code configuration
 * @param d Effective depth in mm
 * @returns Size effect factor (1.0 for shallow members, <1.0 for deep members)
 */
export function getSizeEffectFactor(code: BuildingCodeConfig, d: number): number {
  if (code.id === 'ACI') {
    const lambdaS = Math.sqrt(2 / (1 + 0.004 * d));
    return Math.min(lambdaS, 1.0);
  }
  // CSA integrates size effect in MCFT β calculation
  return 1.0;
}

// ============================================================================
// SHEAR DEPTH (CSA)
// ============================================================================

/**
 * Calculate effective shear depth dv per CSA A23.3-24
 * dv = max(0.9d, 0.72h)
 * 
 * ACI uses d directly
 * 
 * @param code Building code configuration
 * @param d Effective depth in mm
 * @param h Total depth in mm
 * @returns Effective shear depth
 */
export function getShearDepth(code: BuildingCodeConfig, d: number, h: number): number {
  if (code.id === 'CSA') {
    return Math.max(0.9 * d, 0.72 * h);
  }
  return d;
}

// ============================================================================
// SHEAR STRENGTH
// ============================================================================

/**
 * Calculate concrete shear strength Vc
 * For ACI: Vc = 0.17λ√f'c × bw × d (with size effect)
 * For CSA: Vc = φc × β × √f'c × bw × dv (MCFT)
 */
export function getShearStrength(
  code: BuildingCodeConfig,
  fck: number,
  bw: number,
  d: number,
  hasMinStirrups: boolean = true,
  h?: number
): number {
  const { shear, resistanceFactors } = code;
  
  if (code.id === 'CSA') {
    // CSA MCFT-based approach
    const beta = hasMinStirrups 
      ? (shear.betaWithStirrups ?? 0.18)
      : (typeof shear.betaWithoutStirrups === 'function' 
          ? shear.betaWithoutStirrups(d) 
          : 230 / (1000 + d));
    const dv = getShearDepth(code, d, h ?? d / 0.9);
    const phi_c = resistanceFactors.shear;
    return phi_c * beta * Math.sqrt(fck) * bw * dv / 1000; // kN
  } else {
    // ACI approach with size effect
    const lambda = shear.lambda;
    const phi = resistanceFactors.shear;
    const lambdaS = getSizeEffectFactor(code, d);
    return phi * shear.vcCoefficient * lambdaS * lambda * Math.sqrt(fck) * bw * d / 1000; // kN
  }
}

/**
 * Calculate punching shear strength
 */
export function getPunchingShearStrength(
  code: BuildingCodeConfig,
  fck: number,
  bo: number,
  d: number,
  columnRatio: number = 1.0,  // β = long side / short side
  columnPosition: 'interior' | 'edge' | 'corner' = 'interior'
): number {
  const { shear, resistanceFactors } = code;
  const phi = resistanceFactors.shear;
  
  if (code.id === 'ACI') {
    // ACI Table 22.6.5.2 - minimum of three equations
    const alphaS = columnPosition === 'interior' ? 40 
                 : columnPosition === 'edge' ? 30 
                 : 20; // corner
    
    const lambdaS = getSizeEffectFactor(code, d);
    
    const eq1 = 0.33 * lambdaS * shear.lambda * Math.sqrt(fck);
    const eq2 = 0.17 * (1 + 2 / columnRatio) * lambdaS * shear.lambda * Math.sqrt(fck);
    const eq3 = 0.083 * (alphaS * d / bo + 2) * lambdaS * shear.lambda * Math.sqrt(fck);
    
    const vc = Math.min(eq1, eq2, eq3);
    return phi * vc * bo * d / 1000; // kN
  } else {
    // CSA approach - simpler single equation
    const vc = shear.punchingCoefficient * shear.lambda * Math.sqrt(fck);
    return phi * vc * bo * d / 1000; // kN
  }
}

// ============================================================================
// DEVELOPMENT LENGTH
// ============================================================================

/**
 * Development length modification factors
 */
interface DevelopmentFactors {
  psiT: number;  // Bar location factor (top bars)
  psiE: number;  // Coating factor (epoxy)
  psiS: number;  // Bar size factor
  psiG: number;  // Grade factor
}

/**
 * Calculate development length for tension bars
 * ACI: ld = (fy × ψt × ψe × ψs × ψg × db)/(25λ√f'c)
 * 
 * @param code Building code configuration
 * @param db Bar diameter in mm
 * @param fy Steel yield strength in MPa
 * @param fck Concrete strength in MPa
 * @param isTopBar Whether bar is a top bar (more than 300mm concrete below)
 * @param isEpoxyCoated Whether bar is epoxy coated
 * @returns Development length in mm
 */
export function getDevelopmentLengthTension(
  code: BuildingCodeConfig,
  db: number,
  fy: number,
  fck: number,
  isTopBar: boolean = false,
  isEpoxyCoated: boolean = false
): number {
  const lambda = code.shear.lambda;
  
  if (code.id === 'ACI') {
    // ACI 318-25 Chapter 25
    const psiT = isTopBar ? 1.3 : 1.0;
    const psiE = isEpoxyCoated ? 1.5 : 1.0;
    const psiS = db <= 19 ? 0.8 : 1.0;
    const psiG = fy <= 420 ? 1.0 : 1.15;
    
    const ld = (fy * psiT * psiE * psiS * psiG * db) / (25 * lambda * Math.sqrt(fck));
    return Math.max(ld, code.developmentLength.minimumTension);
  } else {
    // CSA A23.3-24 Clause 12
    const k1 = isTopBar ? 1.3 : 1.0;
    const k2 = isEpoxyCoated ? 1.5 : 1.0;
    const k3 = 1.0; // Normal density concrete
    const k4 = db <= 20 ? 0.8 : 1.0;
    
    const ld = 0.45 * k1 * k2 * k3 * k4 * (fy / Math.sqrt(fck)) * db;
    return Math.max(ld, code.developmentLength.minimumTension);
  }
}

/**
 * Calculate development length for compression bars
 */
export function getDevelopmentLengthCompression(
  code: BuildingCodeConfig,
  db: number,
  fy: number,
  fck: number
): number {
  if (code.id === 'ACI') {
    // ACI 318-25 simplified
    const ldc = (fy * db) / (50 * Math.sqrt(fck));
    return Math.max(ldc, code.developmentLength.minimumCompression, 0.043 * fy * db);
  } else {
    // CSA A23.3-24
    const ldc = (0.24 * fy * db) / Math.sqrt(fck);
    return Math.max(ldc, code.developmentLength.minimumCompression);
  }
}

/**
 * Calculate lap splice length (Class B)
 */
export function getLapSpliceLength(
  code: BuildingCodeConfig,
  db: number,
  fy: number,
  fck: number,
  isTopBar: boolean = false,
  isEpoxyCoated: boolean = false
): number {
  const ld = getDevelopmentLengthTension(code, db, fy, fck, isTopBar, isEpoxyCoated);
  return ld * code.developmentLength.lapSpliceMultiplier;
}

// ============================================================================
// REINFORCEMENT LIMITS
// ============================================================================

/**
 * Get minimum flexural reinforcement ratio
 */
export function getMinReinforcement(
  code: BuildingCodeConfig,
  elementType: 'beam' | 'slab' | 'column' | 'wall',
  fck: number,
  fy: number
): number {
  const { reinforcement } = code;
  
  switch (elementType) {
    case 'beam':
      // More detailed formula: max(0.25√f'c/fy, 1.4/fy)
      if (code.id === 'ACI') {
        return Math.max(0.25 * Math.sqrt(fck) / fy, 1.4 / fy, reinforcement.minFlexural);
      }
      // CSA: As,min = (0.2√f'c × bt × h)/fy
      return reinforcement.minFlexural;
      
    case 'slab':
      return reinforcement.tempShrinkage;
      
    case 'column':
      return reinforcement.minColumn;
      
    case 'wall':
      return reinforcement.tempShrinkage;
      
    default:
      return reinforcement.minFlexural;
  }
}

/**
 * Get maximum column reinforcement ratio
 */
export function getMaxColumnReinforcement(code: BuildingCodeConfig): number {
  return code.reinforcement.maxColumn;
}

// ============================================================================
// STIRRUP SPACING
// ============================================================================

/**
 * Get maximum stirrup spacing
 */
export function getMaxStirrupSpacing(
  code: BuildingCodeConfig,
  d: number,
  highShear: boolean = false,
  h?: number
): number {
  const { stirrupSpacing } = code;
  
  // Use dv for CSA
  const effectiveD = code.id === 'CSA' ? getShearDepth(code, d, h ?? d / 0.9) : d;
  
  let spacing: number;
  
  if (highShear) {
    // Reduced spacing in high shear regions
    const reducedFactor = stirrupSpacing.reducedDFactor ?? stirrupSpacing.dFactor / 2;
    const reducedMax = stirrupSpacing.reducedMaxSpacing ?? stirrupSpacing.maxSpacing / 2;
    spacing = Math.min(effectiveD * reducedFactor, reducedMax);
  } else {
    spacing = Math.min(effectiveD * stirrupSpacing.dFactor, stirrupSpacing.maxSpacing);
  }
  
  return spacing;
}

// ============================================================================
// CONCRETE PROPERTIES
// ============================================================================

/**
 * Calculate modulus of elasticity for concrete
 */
export function getConcreteEc(code: BuildingCodeConfig, fck: number): number {
  return code.concrete.EcCoefficient * Math.sqrt(fck); // MPa
}

// ============================================================================
// DEFLECTION
// ============================================================================

/**
 * Get deflection limit
 */
export function getDeflectionLimit(
  code: BuildingCodeConfig,
  span: number,
  memberType: 'floor' | 'roof' | 'cantilever',
  hasPartitions: boolean = false
): number {
  const { deflection } = code;
  
  let limit: number;
  
  switch (memberType) {
    case 'floor':
      limit = hasPartitions ? deflection.afterPartitions : deflection.floor;
      break;
    case 'roof':
      limit = deflection.roof;
      break;
    case 'cantilever':
      limit = deflection.cantilever;
      break;
    default:
      limit = deflection.floor;
  }
  
  return (span * 1000) / limit; // mm
}

// ============================================================================
// COVER REQUIREMENTS
// ============================================================================

/**
 * Get concrete cover requirement
 */
export function getConcreteCover(
  code: BuildingCodeConfig,
  exposure: 'interior' | 'exterior' | 'earth' | 'aggressive',
  elementType: 'slab' | 'beam' | 'column' | 'footing' = 'beam'
): number {
  const { cover } = code;
  
  if (elementType === 'slab' && exposure === 'interior') {
    return cover.slabInterior;
  }
  
  switch (exposure) {
    case 'interior':
      return cover.interior;
    case 'exterior':
      return cover.exterior;
    case 'earth':
      return cover.earth;
    case 'aggressive':
      return cover.aggressive;
    default:
      return cover.interior;
  }
}

// ============================================================================
// DESIGN WARNINGS CHECKER
// ============================================================================

/**
 * Check design parameters against code limits and return warnings
 */
export function checkDesignWarnings(
  code: BuildingCodeConfig,
  params: {
    actualRho?: number;
    minRho?: number;
    maxRho?: number;
    barSpacing?: number;
    actualCover?: number;
    requiredCover?: number;
    actualVu?: number;
    capacityVn?: number;
    actualDeflection?: number;
    allowableDeflection?: number;
  }
): DesignWarning[] {
  const warnings: DesignWarning[] = [];
  const { designWarnings } = code;
  
  // Check brittle failure (under-reinforced)
  if (params.actualRho !== undefined && params.minRho !== undefined) {
    if (params.actualRho < params.minRho) {
      warnings.push(designWarnings.brittleFailure);
    }
  }
  
  // Check over-reinforced
  if (params.actualRho !== undefined && params.maxRho !== undefined) {
    if (params.actualRho > params.maxRho) {
      warnings.push(designWarnings.overReinforced);
    }
  }
  
  // Check congestion
  if (params.barSpacing !== undefined) {
    if (params.barSpacing < designWarnings.congestion.minSpacing) {
      warnings.push(designWarnings.congestion);
    }
  }
  
  // Check cover
  if (params.actualCover !== undefined && params.requiredCover !== undefined) {
    if (params.actualCover < params.requiredCover) {
      warnings.push(designWarnings.coverInadequate);
    }
  }
  
  // Check shear
  if (params.actualVu !== undefined && params.capacityVn !== undefined) {
    if (params.actualVu > params.capacityVn) {
      warnings.push(designWarnings.shearFailure);
    }
  }
  
  // Check deflection
  if (params.actualDeflection !== undefined && params.allowableDeflection !== undefined) {
    if (params.actualDeflection > params.allowableDeflection) {
      warnings.push(designWarnings.deflectionExceeded);
    }
  }
  
  return warnings;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get load combination description for display
 */
export function getLoadCombinationText(code: BuildingCodeConfig): string {
  const { loadFactors } = code;
  return `${loadFactors.dead}D + ${loadFactors.live}L`;
}

/**
 * Get design code reference text for display
 */
export function getCodeReferenceText(code: BuildingCodeConfig): string {
  return `${code.name} (${code.version})`;
}

/**
 * Get resistance factor description
 */
export function getResistanceFactorText(
  code: BuildingCodeConfig,
  type: 'flexure' | 'shear' | 'compression'
): string {
  const { resistanceFactors } = code;
  
  if (code.id === 'CSA') {
    switch (type) {
      case 'flexure':
        return `φc = ${resistanceFactors.flexure}, φs = ${resistanceFactors.steel}`;
      case 'shear':
        return `φc = ${resistanceFactors.shear}`;
      case 'compression':
        return `φc = ${resistanceFactors.compressionTied}`;
    }
  } else {
    switch (type) {
      case 'flexure':
        return `φ = ${resistanceFactors.flexure}`;
      case 'shear':
        return `φ = ${resistanceFactors.shear}`;
      case 'compression':
        return `φ = ${resistanceFactors.compressionTied}`;
    }
  }
}

/**
 * Get code reference for a specific topic
 */
export function getCodeReference(
  code: BuildingCodeConfig,
  topic: keyof BuildingCodeConfig['codeReferences']
): string {
  return code.codeReferences[topic] ?? '';
}

/**
 * Compare two codes side by side
 */
// ============================================================================
// DESIGN PARAMETERS (simplified shape for calculators)
// ============================================================================

/**
 * Get simplified design parameters for calculator functions.
 * Maps the comprehensive BuildingCodeConfig to the shape used by engineeringCalculations.ts
 */
export function getCodeDesignParameters(codeId: BuildingCodeId) {
  const config = getBuildingCode(codeId);
  return {
    loadFactors: { dead: config.loadFactors.dead, live: config.loadFactors.live },
    resistanceFactors: {
      flexure: config.resistanceFactors.flexure,
      shear: config.resistanceFactors.shear,
      steel: config.resistanceFactors.steel,
    },
    minRho: config.reinforcement.minFlexural,
    name: config.name,
  };
}

export function compareCodeParameters(
  code1: BuildingCodeConfig,
  code2: BuildingCodeConfig
): Record<string, { code1: string | number; code2: string | number; note?: string }> {
  return {
    'Dead Load Factor': {
      code1: code1.loadFactors.dead,
      code2: code2.loadFactors.dead,
    },
    'Live Load Factor': {
      code1: code1.loadFactors.live,
      code2: code2.loadFactors.live,
    },
    'Wind Load Factor': {
      code1: code1.loadFactors.wind,
      code2: code2.loadFactors.wind,
      note: code1.id === 'ACI' ? 'ASCE 7-22 changed from 1.6 to 1.0' : undefined,
    },
    'Flexure φ': {
      code1: code1.resistanceFactors.flexure,
      code2: code2.resistanceFactors.flexure,
      note: 'CSA more conservative (requires ~38% more steel)',
    },
    'Shear φ': {
      code1: code1.resistanceFactors.shear,
      code2: code2.resistanceFactors.shear,
    },
    'Min Flexural ρ': {
      code1: code1.reinforcement.minFlexural,
      code2: code2.reinforcement.minFlexural,
      note: 'CSA requires higher minimum (0.002 vs 0.0018)',
    },
    'Max Column ρ': {
      code1: code1.reinforcement.maxColumn,
      code2: code2.reinforcement.maxColumn,
      note: 'CSA more restrictive (4% vs 8%)',
    },
    'Floor Deflection': {
      code1: `L/${code1.deflection.floor}`,
      code2: `L/${code2.deflection.floor}`,
      note: 'CSA more stringent (L/240 vs L/360)',
    },
    'Ec Coefficient': {
      code1: code1.concrete.EcCoefficient,
      code2: code2.concrete.EcCoefficient,
      note: 'Different elastic modulus calculation',
    },
  };
}
