/**
 * Regional Grading Standards
 * USA: EPA 2022 CGP, OSHA 29 CFR 1926 Subpart P, IBC 2024, ASTM D698/D1557
 * Canada: CSA A23.1:24, Provincial OHS, NBCC 2025, CCME Guidelines
 * 
 * Verified January 2026
 */

export type GradingRegion = 'USA' | 'CANADA';
export type SoilType = 'STABLE_ROCK' | 'TYPE_A' | 'TYPE_B' | 'TYPE_C';

export interface StormWaterRequirements {
  permitTriggerArea: number;
  permitTriggerAreaUnit: 'acres' | 'hectares';
  permitAuthority: string;
  permitName: string;
  swpppRequired: boolean;
  codeReference: string;
}

export interface ExcavationSlope {
  angle: number;
  ratio: string;
}

export interface ExcavationRequirements {
  maxUnprotectedDepth: number;
  maxUnprotectedDepthUnit: 'feet' | 'meters';
  slopesByType: Record<SoilType, ExcavationSlope>;
  codeReference: string;
}

export interface DrainageSlope {
  percent: number;
  distance: number;
  unit: 'feet' | 'meters';
}

export interface DrainageRequirements {
  foundationSlope: DrainageSlope;
  imperviousSurfaceSlope: DrainageSlope;
  minSiteSlope: number;
  maxFillSlope: { percent: number; ratio: string };
  codeReference: string;
}

export interface CompactionRequirement {
  application: string;
  requirement: string;
  standard: string;
}

export interface CompactionRequirements {
  items: CompactionRequirement[];
  codeReference: string;
  frostProtectionNote?: string;
}

export interface GradingStandards {
  region: GradingRegion;
  flag: string;
  displayName: string;
  standardsSummary: string;
  stormWater: StormWaterRequirements;
  excavation: ExcavationRequirements;
  drainage: DrainageRequirements;
  compaction: CompactionRequirements;
  codeDisplayText: string;
  disclaimer: string;
}

export interface ValidationResult {
  valid: boolean;
  severity: 'pass' | 'warning' | 'error';
  message: string;
  codeReference?: string;
  suggestion?: string;
}

export interface PermitCheckResult {
  required: boolean;
  disturbedArea: number;
  threshold: number;
  unit: string;
  permitName: string;
  authority: string;
  swpppRequired: boolean;
  codeReference: string;
}

const GRADING_STANDARDS: Record<GradingRegion, GradingStandards> = {
  USA: {
    region: 'USA',
    flag: '🇺🇸',
    displayName: 'United States',
    standardsSummary: 'EPA/OSHA/IBC',
    stormWater: {
      permitTriggerArea: 1,
      permitTriggerAreaUnit: 'acres',
      permitAuthority: 'EPA',
      permitName: 'NPDES CGP',
      swpppRequired: true,
      codeReference: 'EPA 2022 CGP (Modified April 2025, expires Feb 2027)',
    },
    excavation: {
      maxUnprotectedDepth: 5,
      maxUnprotectedDepthUnit: 'feet',
      slopesByType: {
        STABLE_ROCK: { angle: 90, ratio: 'Vertical' },
        TYPE_A: { angle: 53, ratio: '3/4:1' },
        TYPE_B: { angle: 45, ratio: '1:1' },
        TYPE_C: { angle: 34, ratio: '1.5:1' },
      },
      codeReference: 'OSHA 29 CFR 1926 Subpart P',
    },
    drainage: {
      foundationSlope: { percent: 5, distance: 10, unit: 'feet' },
      imperviousSurfaceSlope: { percent: 2, distance: 10, unit: 'feet' },
      minSiteSlope: 1,
      maxFillSlope: { percent: 50, ratio: '2:1' },
      codeReference: 'IBC 2024 Section 1804.4',
    },
    compaction: {
      items: [
        { application: 'Structural fill', requirement: '95% Standard Proctor', standard: 'ASTM D698' },
        { application: 'Under pavements', requirement: '95-98% Modified Proctor', standard: 'ASTM D1557' },
        { application: 'Utility trenches', requirement: '90-95%', standard: 'ASTM D698' },
      ],
      codeReference: 'ASTM D698-12(R2021), D1557-12(R2021)',
    },
    codeDisplayText: 'Using EPA 2022 CGP, OSHA 29 CFR 1926, IBC 2024, ASTM D698/D1557',
    disclaimer: 'Verify local municipal requirements with building department.',
  },
  CANADA: {
    region: 'CANADA',
    flag: '🇨🇦',
    displayName: 'Canada',
    standardsSummary: 'CSA/CCME/Provincial',
    stormWater: {
      permitTriggerArea: 0.4,
      permitTriggerAreaUnit: 'hectares',
      permitAuthority: 'Provincial/Municipal',
      permitName: 'ECA/Erosion Control Permit',
      swpppRequired: true,
      codeReference: 'Provincial Environmental Protection Acts, CCME Guidelines (March 2025)',
    },
    excavation: {
      maxUnprotectedDepth: 1.5,
      maxUnprotectedDepthUnit: 'meters',
      slopesByType: {
        STABLE_ROCK: { angle: 90, ratio: 'Vertical' },
        TYPE_A: { angle: 53, ratio: '3/4:1' },
        TYPE_B: { angle: 45, ratio: '1:1' },
        TYPE_C: { angle: 34, ratio: '1.5:1' },
      },
      codeReference: 'Provincial OHS Regulations',
    },
    drainage: {
      foundationSlope: { percent: 5, distance: 1.8, unit: 'meters' },
      imperviousSurfaceSlope: { percent: 2, distance: 3, unit: 'meters' },
      minSiteSlope: 1,
      maxFillSlope: { percent: 33, ratio: '3:1' },
      codeReference: 'NBCC 2025 Section 9.14',
    },
    compaction: {
      items: [
        { application: 'Structural fill', requirement: '95% Standard Proctor', standard: 'CSA A23.1:24' },
        { application: 'Under pavements', requirement: '95-98% Modified Proctor', standard: 'CSA A23.1:24' },
        { application: 'Utility trenches', requirement: '90-95%', standard: 'CSA A23.1:24' },
      ],
      codeReference: 'CSA A23.1:24, ASTM D698',
      frostProtectionNote: 'Ensure adequate frost protection depth per local frost penetration data.',
    },
    codeDisplayText: 'Using CSA A23.1:24, Provincial OHS, NBCC 2025, CCME Guidelines',
    disclaimer: 'Verify provincial/municipal requirements with local authority.',
  },
};

/**
 * Get grading standards for a region
 */
export function getGradingStandards(region: GradingRegion): GradingStandards {
  return GRADING_STANDARDS[region];
}

/**
 * Validate a slope against drainage requirements
 */
export function validateSlope(
  slope: number,
  type: 'foundation' | 'impervious' | 'fill',
  standards: GradingStandards
): ValidationResult {
  const drainage = standards.drainage;

  if (type === 'foundation') {
    if (slope < drainage.foundationSlope.percent) {
      return {
        valid: false,
        severity: 'error',
        message: `Foundation slope ${slope}% is below minimum ${drainage.foundationSlope.percent}%`,
        codeReference: drainage.codeReference,
        suggestion: `Increase slope to at least ${drainage.foundationSlope.percent}% for ${drainage.foundationSlope.distance} ${drainage.foundationSlope.unit}`,
      };
    }
    return {
      valid: true,
      severity: 'pass',
      message: `Foundation slope ${slope}% meets minimum ${drainage.foundationSlope.percent}%`,
      codeReference: drainage.codeReference,
    };
  }

  if (type === 'impervious') {
    if (slope < drainage.imperviousSurfaceSlope.percent) {
      return {
        valid: false,
        severity: 'warning',
        message: `Impervious surface slope ${slope}% is below recommended ${drainage.imperviousSurfaceSlope.percent}%`,
        codeReference: drainage.codeReference,
        suggestion: `Consider increasing to ${drainage.imperviousSurfaceSlope.percent}% for proper drainage`,
      };
    }
    return {
      valid: true,
      severity: 'pass',
      message: `Impervious slope ${slope}% meets requirement`,
      codeReference: drainage.codeReference,
    };
  }

  if (type === 'fill') {
    if (slope > drainage.maxFillSlope.percent) {
      return {
        valid: false,
        severity: 'error',
        message: `Fill slope ${slope}% exceeds maximum ${drainage.maxFillSlope.percent}% (${drainage.maxFillSlope.ratio})`,
        codeReference: drainage.codeReference,
        suggestion: 'Consider retaining wall or terracing to reduce slope',
      };
    }
    if (slope > drainage.maxFillSlope.percent * 0.9) {
      return {
        valid: true,
        severity: 'warning',
        message: `Fill slope ${slope}% approaching limit of ${drainage.maxFillSlope.percent}%`,
        codeReference: drainage.codeReference,
        suggestion: 'Monitor for stability concerns',
      };
    }
    return {
      valid: true,
      severity: 'pass',
      message: `Fill slope ${slope}% within limit`,
      codeReference: drainage.codeReference,
    };
  }

  return {
    valid: true,
    severity: 'pass',
    message: 'Validation passed',
  };
}

/**
 * Check if permit is required based on disturbed area
 */
export function checkPermitRequirements(
  disturbedAreaAcres: number,
  standards: GradingStandards
): PermitCheckResult {
  const stormWater = standards.stormWater;
  
  // Convert to appropriate units
  let areaInStandardUnit = disturbedAreaAcres;
  if (stormWater.permitTriggerAreaUnit === 'hectares') {
    areaInStandardUnit = disturbedAreaAcres * 0.404686; // acres to hectares
  }

  const required = areaInStandardUnit >= stormWater.permitTriggerArea;

  return {
    required,
    disturbedArea: Number(areaInStandardUnit.toFixed(2)),
    threshold: stormWater.permitTriggerArea,
    unit: stormWater.permitTriggerAreaUnit,
    permitName: stormWater.permitName,
    authority: stormWater.permitAuthority,
    swpppRequired: stormWater.swpppRequired && required,
    codeReference: stormWater.codeReference,
  };
}

/**
 * Get excavation slope requirements for a soil type
 */
export function getExcavationSlope(
  soilType: SoilType,
  standards: GradingStandards
): ExcavationSlope {
  return standards.excavation.slopesByType[soilType];
}

/**
 * Check if excavation depth requires protection
 */
export function checkExcavationProtection(
  depthFeet: number,
  standards: GradingStandards
): ValidationResult {
  const excavation = standards.excavation;
  
  let depthInStandardUnit = depthFeet;
  if (excavation.maxUnprotectedDepthUnit === 'meters') {
    depthInStandardUnit = depthFeet * 0.3048; // feet to meters
  }

  if (depthInStandardUnit > excavation.maxUnprotectedDepth) {
    return {
      valid: false,
      severity: 'warning',
      message: `Excavation depth exceeds ${excavation.maxUnprotectedDepth} ${excavation.maxUnprotectedDepthUnit} - protective system required`,
      codeReference: excavation.codeReference,
      suggestion: 'Install shoring, shielding, or slope/bench excavation walls',
    };
  }

  return {
    valid: true,
    severity: 'pass',
    message: `Excavation depth within unprotected limit of ${excavation.maxUnprotectedDepth} ${excavation.maxUnprotectedDepthUnit}`,
    codeReference: excavation.codeReference,
  };
}

/**
 * Get compaction requirements for a specific application
 */
export function getCompactionRequirement(
  application: string,
  standards: GradingStandards
): CompactionRequirement | null {
  const item = standards.compaction.items.find(
    (i) => i.application.toLowerCase() === application.toLowerCase()
  );
  return item || null;
}

/**
 * Get all available regions
 */
export function getAvailableRegions(): Array<{ id: GradingRegion; name: string; flag: string; standards: string }> {
  return Object.values(GRADING_STANDARDS).map((s) => ({
    id: s.region,
    name: s.displayName,
    flag: s.flag,
    standards: s.standardsSummary,
  }));
}

export { GRADING_STANDARDS };
