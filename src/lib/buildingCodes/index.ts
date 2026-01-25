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
} from './types';

export { DEFAULT_EARTHWORK_PRICING } from './types';

// Code Configurations
export { ACI_318_25, getACIBeta1 } from './aci-318-25';
export { CSA_A23_3_24, getCSAAlpha1, getCSABeta1 } from './csa-a23-3-24';

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
  compareCodeParameters,
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
  {
    id: 'CUSTOM' as const,
    name: 'Custom',
    fullName: 'User-Defined Parameters',
    country: 'Other',
    flag: '⚙️',
    version: 'N/A',
    loadCombination: 'User-defined',
  },
];

// Default code
export const DEFAULT_BUILDING_CODE = 'ACI' as const;
