/**
 * Building Codes Configuration Module
 * 
 * Supports:
 * - ACI 318-25 / ASCE 7-22 (USA)
 * - CSA A23.3-24 / NBC 2025 (Canada)
 * - Custom user-defined configurations
 * 
 * Usage:
 * ```ts
 * import { getBuildingCode, getFactoredLoad, getShearStrength } from '@/lib/buildingCodes';
 * 
 * const code = getBuildingCode('ACI');
 * const Wu = getFactoredLoad(code, deadLoad, liveLoad);
 * const Vc = getShearStrength(code, fck, bw, d);
 * ```
 */

// Types
export type {
  BuildingCodeId,
  BuildingCodeConfig,
  LoadFactors,
  ResistanceFactors,
  StressBlockParams,
  ReinforcementLimits,
  ShearDesign,
  StirrupSpacing,
  DeflectionLimits,
  ConcreteProperties,
  CoverRequirements,
  StabilityFactors,
  ParkingAccessibility,
  CustomCodeConfig,
  EarthworkPricing,
  // New types
  LoadCombination,
  LoadCombinationPurpose,
  CodeReferences,
  DesignWarning,
  DesignWarningSeverity,
  DesignWarningThresholds,
  DevelopmentLengthFactors,
  DesignCheckResult,
} from './types';

export { DEFAULT_EARTHWORK_PRICING } from './types';

// Code Configurations
export { ACI_318_25, getACIBeta1 } from './aci-318-25';
export { CSA_A23_3_24, getCSAAlpha1, getCSABeta1, getCSABetaWithoutStirrups } from './csa-a23-3-24';

// Geotechnical
export {
  GEOTECHNICAL_SAFETY_FACTORS,
  getFoundationBearingFOS,
  getRetainingWallFOS,
  getAllowableBearingPressure,
  getEarthPressureCoefficients,
  TYPICAL_SOIL_PROPERTIES,
} from './geotechnical';
export type { GeotechnicalConfig } from './geotechnical';

// Calculator Helpers
export {
  getBuildingCode,
  getFactoredLoad,
  getApplicableLoadCombinations,
  getStressBlockParams,
  getShearStrength,
  getPunchingShearStrength,
  getMinReinforcement,
  getMaxColumnReinforcement,
  getMaxStirrupSpacing,
  getConcreteEc,
  getDeflectionLimit,
  getConcreteCover,
  getLoadCombinationText,
  getCodeReferenceText,
  getResistanceFactorText,
  getCodeReference,
  compareCodeParameters,
  // New functions
  getSizeEffectFactor,
  getShearDepth,
  getDevelopmentLengthTension,
  getDevelopmentLengthCompression,
  getLapSpliceLength,
  checkDesignWarnings,
} from './calculator';

// Available building codes list (for UI dropdowns)
export const AVAILABLE_CODES = [
  {
    id: 'ACI' as const,
    name: 'ACI 318-25',
    fullName: 'American Concrete Institute',
    country: 'United States',
    flag: '🇺🇸',
    version: '2025',
    loadCombination: '1.2D + 1.6L',
  },
  {
    id: 'CSA' as const,
    name: 'CSA A23.3-24',
    fullName: 'Canadian Standards Association',
    country: 'Canada',
    flag: '🇨🇦',
    version: '2024',
    loadCombination: '1.25D + 1.5L',
  },
];

// Default code
export const DEFAULT_BUILDING_CODE = 'ACI' as const;

// Get full building code config for AI context
import { ACI_318_25 } from './aci-318-25';
import { CSA_A23_3_24 } from './csa-a23-3-24';
import type { BuildingCodeId, BuildingCodeConfig } from './types';

export const getBuildingCodeConfig = (codeId: BuildingCodeId): BuildingCodeConfig => {
  return codeId === 'CSA' ? CSA_A23_3_24 : ACI_318_25;
};

/**
 * Get full building code details for AI context generation
 */
export const getFullBuildingCodeContext = (codeId: BuildingCodeId) => {
  const config = getBuildingCodeConfig(codeId);
  
  return {
    id: config.id,
    name: config.name,
    fullName: config.fullName,
    version: config.version,
    country: config.country,
    flag: config.flag,
    releaseDate: config.releaseDate,
    officialSource: config.officialSource,
    loadFactors: config.loadFactors,
    loadCombinations: config.loadCombinations,
    resistanceFactors: config.resistanceFactors,
    codeReferences: config.codeReferences,
    designWarnings: config.designWarnings,
    developmentLength: config.developmentLength,
    reinforcement: config.reinforcement,
    shear: config.shear,
    stirrupSpacing: config.stirrupSpacing,
    deflection: config.deflection,
    concrete: config.concrete,
    cover: config.cover,
    notes: config.notes,
  };
};
