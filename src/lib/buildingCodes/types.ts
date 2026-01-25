/**
 * Building Code Configuration Types
 * Supports ACI 318-25 (USA) and CSA A23.3-24 (Canada)
 */

export type BuildingCodeId = 'ACI' | 'CSA';

// ============================================================================
// LOAD COMBINATIONS
// ============================================================================

export type LoadCombinationPurpose = 
  | 'dead_only' 
  | 'gravity' 
  | 'wind' 
  | 'seismic' 
  | 'wind_uplift' 
  | 'seismic_overturning'
  | 'snow';

export interface LoadCombination {
  id: string;                    // "LC1", "LC2", etc.
  formula: string;               // "1.2D + 1.6L + 0.5S"
  purpose: LoadCombinationPurpose;
  description?: string;          // Human-readable description
}

// ============================================================================
// CODE SECTION REFERENCES
// ============================================================================

export interface CodeReferences {
  loadCombinations: string;      // "ASCE 7-22 Section 2.3.2"
  phiFactors: string;            // "Table 21.2.1"
  stressBlock: string;           // "Section 22.2.2.4.1"
  minReinforcement: string;      // "Sections 9.6.1.2, 7.6.1.1"
  shearDesign: string;           // "Chapter 22, Table 22.5.5.1"
  stirrupSpacing: string;        // "Table 9.7.6.2.2"
  punchingShear: string;         // "Table 22.6.5.2"
  deflection: string;            // "Table 24.2.2"
  cover: string;                 // "Table 20.5.1.3.1"
  developmentLength: string;     // "Chapter 25"
  sizeEffect?: string;           // "Section 22.5.5.1.3"
}

// ============================================================================
// DESIGN WARNINGS
// ============================================================================

export type DesignWarningSeverity = 'warning' | 'critical';

export interface DesignWarning {
  id: string;
  condition: string;             // "ρ < ρmin"
  message: string;               // "BRITTLE FAILURE RISK - Increase reinforcement..."
  severity: DesignWarningSeverity;
}

export interface DesignWarningThresholds {
  brittleFailure: DesignWarning;
  overReinforced: DesignWarning;
  congestion: DesignWarning & { minSpacing: number };
  coverInadequate: DesignWarning;
  shearFailure: DesignWarning;
  deflectionExceeded: DesignWarning;
}

// ============================================================================
// DEVELOPMENT LENGTH PARAMETERS
// ============================================================================

export interface DevelopmentLengthFactors {
  tensionFormula: string;        // Full formula string for display
  compressionFormula: string;    // Full formula string for display
  lapSpliceMultiplier: number;   // 1.3 for Class B
  minimumTension: number;        // mm (e.g., 300)
  minimumCompression: number;    // mm (e.g., 200)
}

// ============================================================================
// EXISTING INTERFACES (EXTENDED)
// ============================================================================

export interface LoadFactors {
  dead: number;           // Dead load factor (1.2 ACI, 1.25 CSA)
  deadOnly: number;       // Dead load only case (1.4 ACI)
  live: number;           // Live load factor (1.6 ACI, 1.5 CSA)
  wind: number;           // Wind load factor (1.0 ACI, 1.4 CSA)
  seismic: number;        // Seismic load factor (1.0 both)
  snow: number;           // Snow load factor (1.0 ACI, 1.5 CSA)
  roof: number;           // Roof live load factor
}

export interface ResistanceFactors {
  flexure: number;           // φ for flexure (0.90 ACI, 0.65 CSA)
  shear: number;             // φ for shear (0.75 ACI, 0.65 CSA)
  compressionTied: number;   // φ for tied columns (0.65 both)
  compressionSpiral: number; // φ for spiral columns (0.75 both)
  bearing: number;           // φ for bearing (0.65 both)
  anchorage: number;         // φ for anchorage (0.70 ACI)
  steel: number;             // φs for steel (0.85 CSA, 1.0 ACI implicit)
}

export interface StressBlockParams {
  alpha1: number | ((fck: number) => number);  // Stress block factor
  beta1: number | ((fck: number) => number);   // Depth factor
  alpha1Min?: number;
  beta1Min?: number;
}

export interface ReinforcementLimits {
  minFlexural: number;      // Min flexural reinforcement ratio (0.0018 ACI, 0.002 CSA)
  minColumn: number;        // Min column reinforcement (0.01 both)
  maxColumn: number;        // Max column reinforcement (0.08 ACI, 0.04 CSA)
  tempShrinkage: number;    // Temperature/shrinkage steel ratio
}

export interface ShearDesign {
  method: string;           // Design method name
  vcCoefficient: number;    // Basic shear coefficient (0.17 ACI, 0.18 CSA)
  punchingCoefficient: number; // Punching shear (0.33 ACI, 0.38 CSA)
  maxVsCoefficient: number; // Max shear reinforcement coefficient
  lambda: number;           // Lightweight concrete factor (1.0 normal)
  sizeEffectFormula?: string; // Size effect calculation
  betaWithStirrups?: number;  // β for CSA with stirrups
  betaWithoutStirrups?: ((d: number) => number); // β for CSA without stirrups
}

export interface StirrupSpacing {
  alongLength: string;      // Formula for spacing along length
  maxSpacing: number;       // Maximum spacing in mm
  dFactor: number;          // Factor of d for spacing (0.5 ACI, 0.7 CSA)
  reducedMaxSpacing?: number; // Reduced max when high shear (300mm)
  reducedDFactor?: number;   // Reduced factor when high shear (0.25)
}

export interface DeflectionLimits {
  floor: number;            // L/360 ACI, L/240 CSA
  roof: number;             // L/180
  afterPartitions: number;  // L/480 both
  cantilever: number;       // Special cantilever limits
}

export interface ConcreteProperties {
  EcFormula: string;        // Modulus of elasticity formula
  EcCoefficient: number;    // Coefficient in Ec = coef × √f'c (4700 ACI, 4500 CSA)
  minFc: number;            // Minimum f'c in MPa
  maxFc: number;            // Maximum f'c in MPa
  modulusRupture: string;   // Rupture modulus formula
}

export interface CoverRequirements {
  interior: number;         // Interior exposure (mm)
  exterior: number;         // Exterior exposure (mm)
  earth: number;            // Cast against earth (mm)
  aggressive: number;       // Aggressive environment (mm)
  slabInterior: number;     // Interior slab cover (mm)
}

export interface StabilityFactors {
  overturning: number;      // FOS for overturning
  sliding: number;          // FOS for sliding
  bearing: number;          // FOS for bearing capacity
}

export interface ParkingAccessibility {
  standard: string;         // Standard name (ADA 2010, CSA B651)
  accessibleStallWidth: number;  // mm
  accessibleAisleWidth: number;  // mm
  vanStallWidth?: number;   // mm (for van-accessible)
  vanAisleWidth?: number;   // mm
}

// ============================================================================
// MAIN BUILDING CODE CONFIG (EXTENDED)
// ============================================================================

export interface BuildingCodeConfig {
  id: BuildingCodeId;
  name: string;
  fullName: string;
  version: string;
  country: string;
  flag: string;
  releaseDate?: string;
  officialSource?: string;
  
  // Core parameters
  loadFactors: LoadFactors;
  resistanceFactors: ResistanceFactors;
  stressBlock: StressBlockParams;
  reinforcement: ReinforcementLimits;
  shear: ShearDesign;
  stirrupSpacing: StirrupSpacing;
  deflection: DeflectionLimits;
  concrete: ConcreteProperties;
  cover: CoverRequirements;
  stability: StabilityFactors;
  parking: ParkingAccessibility;
  
  // NEW: Extended configuration
  loadCombinations: LoadCombination[];
  codeReferences: CodeReferences;
  designWarnings: DesignWarningThresholds;
  developmentLength: DevelopmentLengthFactors;
  
  notes?: string[];
}

// ============================================================================
// USER CUSTOM CODE CONFIGURATION
// ============================================================================

export interface CustomCodeConfig {
  baseCode: 'ACI' | 'CSA';
  name: string;
  overrides: Partial<{
    loadFactors: Partial<LoadFactors>;
    resistanceFactors: Partial<ResistanceFactors>;
    reinforcement: Partial<ReinforcementLimits>;
    stability: Partial<StabilityFactors>;
  }>;
}

// ============================================================================
// EARTHWORK PRICING
// ============================================================================

export interface EarthworkPricing {
  excavation: number;       // per m³
  fill: number;             // per m³
  compaction: number;       // per m³
  disposal: number;         // per m³
  surveyingPerHectare: number;
  currency: string;         // USD, CAD, etc.
}

export const DEFAULT_EARTHWORK_PRICING: Record<string, EarthworkPricing> = {
  USD: {
    excavation: 45,
    fill: 55,
    compaction: 15,
    disposal: 25,
    surveyingPerHectare: 500,
    currency: 'USD',
  },
  CAD: {
    excavation: 60,
    fill: 75,
    compaction: 20,
    disposal: 35,
    surveyingPerHectare: 650,
    currency: 'CAD',
  },
};

// ============================================================================
// DESIGN CHECK RESULT TYPE
// ============================================================================

export interface DesignCheckResult {
  passed: boolean;
  warnings: DesignWarning[];
  utilizationRatio?: number;
  codeReference?: string;
}
