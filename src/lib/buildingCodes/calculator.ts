/**
 * Building Code Calculator Helpers
 * 
 * Functions that apply the selected building code to structural calculations.
 * These bridge the gap between the code configurations and the actual calculations.
 */

import type { BuildingCodeConfig, BuildingCodeId, LoadFactors } from './types';
import { ACI_318_25, getACIBeta1 } from './aci-318-25';
import { CSA_A23_3_24, getCSAAlpha1, getCSABeta1 } from './csa-a23-3-24';

/**
 * Get the building code configuration by ID
 */
export function getBuildingCode(id: BuildingCodeId): BuildingCodeConfig {
  switch (id) {
    case 'ACI':
      return ACI_318_25;
    case 'CSA':
      return CSA_A23_3_24;
    case 'CUSTOM':
      // Custom codes should be passed explicitly
      return ACI_318_25; // Default fallback
    default:
      return ACI_318_25;
  }
}

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

/**
 * Calculate concrete shear strength Vc
 * For ACI: Vc = 0.17λ√f'c × bw × d
 * For CSA: Vc = φc × β × √f'c × bw × dv (simplified)
 */
export function getShearStrength(
  code: BuildingCodeConfig,
  fck: number,
  bw: number,
  d: number,
  hasMinStirrups: boolean = true
): number {
  const { shear, resistanceFactors } = code;
  
  if (code.id === 'CSA') {
    // CSA MCFT-based approach
    const beta = hasMinStirrups ? 0.18 : 0.21;
    const dv = Math.max(0.9 * d, 0.72 * d); // Effective shear depth
    const phi_c = resistanceFactors.shear;
    return phi_c * beta * Math.sqrt(fck) * bw * dv / 1000; // kN
  } else {
    // ACI approach
    const lambda = shear.lambda;
    const phi = resistanceFactors.shear;
    return phi * shear.vcCoefficient * lambda * Math.sqrt(fck) * bw * d / 1000; // kN
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
    
    const eq1 = 0.33 * Math.sqrt(fck);
    const eq2 = 0.17 * (1 + 2 / columnRatio) * Math.sqrt(fck);
    const eq3 = 0.083 * (alphaS * d / bo + 2) * Math.sqrt(fck);
    
    const vc = Math.min(eq1, eq2, eq3);
    return phi * vc * bo * d / 1000; // kN
  } else {
    // CSA approach
    const vc = shear.punchingCoefficient * Math.sqrt(fck);
    return phi * vc * bo * d / 1000; // kN
  }
}

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

/**
 * Get maximum stirrup spacing
 */
export function getMaxStirrupSpacing(
  code: BuildingCodeConfig,
  d: number,
  highShear: boolean = false
): number {
  const { stirrupSpacing } = code;
  
  let spacing = d * stirrupSpacing.dFactor;
  
  // Reduce spacing in high shear regions
  if (highShear) {
    spacing = spacing / 2;
  }
  
  return Math.min(spacing, stirrupSpacing.maxSpacing);
}

/**
 * Calculate modulus of elasticity for concrete
 */
export function getConcreteEc(code: BuildingCodeConfig, fck: number): number {
  return code.concrete.EcCoefficient * Math.sqrt(fck); // MPa
}

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
 * Compare two codes side by side
 */
export function compareCodeParameters(
  code1: BuildingCodeConfig,
  code2: BuildingCodeConfig
): Record<string, { code1: string | number; code2: string | number }> {
  return {
    'Dead Load Factor': {
      code1: code1.loadFactors.dead,
      code2: code2.loadFactors.dead,
    },
    'Live Load Factor': {
      code1: code1.loadFactors.live,
      code2: code2.loadFactors.live,
    },
    'Flexure φ': {
      code1: code1.resistanceFactors.flexure,
      code2: code2.resistanceFactors.flexure,
    },
    'Shear φ': {
      code1: code1.resistanceFactors.shear,
      code2: code2.resistanceFactors.shear,
    },
    'Min Flexural ρ': {
      code1: code1.reinforcement.minFlexural,
      code2: code2.reinforcement.minFlexural,
    },
    'Max Column ρ': {
      code1: code1.reinforcement.maxColumn,
      code2: code2.reinforcement.maxColumn,
    },
    'Floor Deflection': {
      code1: `L/${code1.deflection.floor}`,
      code2: `L/${code2.deflection.floor}`,
    },
  };
}
