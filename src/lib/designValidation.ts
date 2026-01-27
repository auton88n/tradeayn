/**
 * Design Validation Module
 * Implements automated safety checks with warnings per ACI/CSA codes
 */

import type { BuildingCodeId } from '@/lib/buildingCodes';

export type DesignWarningSeverity = 'critical' | 'warning' | 'info';

export interface DesignWarning {
  id: string;
  severity: DesignWarningSeverity;
  title: string;
  message: string;
  codeRef?: string;
  action?: string;
}

interface BeamValidationInputs {
  beamWidth: number;      // mm
  effectiveDepth: number; // mm
  span: number;           // m
  cover: number;          // mm
}

interface BeamValidationOutputs {
  requiredAs: number;     // mm²
  providedAs: number;     // mm²
  barDiameter: number;    // mm
  numberOfBars: number;
  maxShear: number;       // kN
  stirrupSpacing: number; // mm
}

// Get code-specific parameters
const getCodeParams = (code: BuildingCodeId) => ({
  ACI: {
    minRho: 0.0018,
    maxRho: 0.025,
    phiFlexure: 0.90,
    phiShear: 0.75,
    deflectionLimit: 360,
    minSpacing: 25,
    minCoverRef: 'ACI 318-25 Table 20.5.1.3.1',
    minReinfRef: 'ACI 318-25 Section 7.6.1.1',
    maxReinfRef: 'ACI 318-25 Section 9.3.3.1',
    shearRef: 'ACI 318-25 Chapter 22',
    deflRef: 'ACI 318-25 Table 24.2.2',
  },
  CSA: {
    minRho: 0.002,
    maxRho: 0.025,
    phiFlexure: 0.65,
    phiShear: 0.65,
    deflectionLimit: 240,
    minSpacing: 25,
    minCoverRef: 'CSA A23.3-24 Clause 7.9',
    minReinfRef: 'CSA A23.3-24 Clause 10.5',
    maxReinfRef: 'CSA A23.3-24 Clause 10.5',
    shearRef: 'CSA A23.3-24 Chapter 11',
    deflRef: 'CSA A23.3-24 Clause 9',
  },
})[code];

/**
 * Validate beam design and return warnings
 */
export function validateBeamDesign(
  inputs: BeamValidationInputs,
  outputs: BeamValidationOutputs,
  code: BuildingCodeId
): DesignWarning[] {
  const warnings: DesignWarning[] = [];
  const params = getCodeParams(code);
  
  const { beamWidth, effectiveDepth, span, cover } = inputs;
  const { requiredAs, providedAs, barDiameter, numberOfBars, maxShear, stirrupSpacing } = outputs;
  
  // Calculate reinforcement ratio
  const actualRho = providedAs / (beamWidth * effectiveDepth);
  
  // 1. Minimum Reinforcement Check (Brittle Failure)
  if (actualRho < params.minRho) {
    warnings.push({
      id: 'brittle_failure',
      severity: 'critical',
      title: '⚠️ BRITTLE FAILURE RISK',
      message: `ρ = ${(actualRho * 100).toFixed(3)}% < ρmin = ${(params.minRho * 100).toFixed(2)}%`,
      codeRef: params.minReinfRef,
      action: 'Increase steel to minimum required for ductile behavior',
    });
  }
  
  // 2. Maximum Reinforcement Check (Over-Reinforced)
  if (actualRho > params.maxRho) {
    warnings.push({
      id: 'over_reinforced',
      severity: 'critical',
      title: '⚠️ OVER-REINFORCED SECTION',
      message: `ρ = ${(actualRho * 100).toFixed(3)}% > ρmax = ${(params.maxRho * 100).toFixed(2)}%`,
      codeRef: params.maxReinfRef,
      action: 'Reduce steel area or increase section depth for ductile behavior',
    });
  }
  
  // 3. Bar Spacing Check (Congestion)
  const clearSpacing = (beamWidth - 2 * cover - 2 * 8 - numberOfBars * barDiameter) / (numberOfBars - 1);
  if (clearSpacing < params.minSpacing) {
    warnings.push({
      id: 'congestion',
      severity: 'warning',
      title: '⚠️ REINFORCEMENT CONGESTION',
      message: `Bar spacing = ${clearSpacing.toFixed(0)}mm < ${params.minSpacing}mm minimum`,
      codeRef: code === 'ACI' ? 'ACI 318-25 Section 25.2.1' : 'CSA A23.3-24 Clause 6.6.5',
      action: 'Use larger diameter bars or increase section width',
    });
  }
  
  // 4. Cover Check
  const requiredCover = code === 'CSA' ? 30 : 40; // Interior beam
  if (cover < requiredCover) {
    warnings.push({
      id: 'cover_inadequate',
      severity: 'warning',
      title: '⚠️ INADEQUATE COVER',
      message: `Cover = ${cover}mm < ${requiredCover}mm required`,
      codeRef: params.minCoverRef,
      action: 'Increase cover for durability and fire protection',
    });
  }
  
  // 5. Stirrup Spacing Check
  const maxStirrupSpacing = Math.min(effectiveDepth / 2, 300);
  if (stirrupSpacing > maxStirrupSpacing) {
    warnings.push({
      id: 'stirrup_spacing',
      severity: 'warning',
      title: '⚠️ STIRRUP SPACING EXCEEDED',
      message: `Spacing = ${stirrupSpacing}mm > max = ${maxStirrupSpacing}mm`,
      codeRef: params.shearRef,
      action: 'Reduce stirrup spacing to meet code requirements',
    });
  }
  
  // 6. Deflection Warning (heuristic)
  const spanToDepthRatio = (span * 1000) / effectiveDepth;
  const typicalMaxRatio = code === 'ACI' ? 20 : 16; // Simply supported
  if (spanToDepthRatio > typicalMaxRatio * 1.2) {
    warnings.push({
      id: 'deflection_warning',
      severity: 'info',
      title: '💡 DEFLECTION CHECK RECOMMENDED',
      message: `Span/depth = ${spanToDepthRatio.toFixed(1)} may require detailed deflection check`,
      codeRef: params.deflRef,
      action: 'Verify deflection limits L/' + params.deflectionLimit,
    });
  }
  
  // Info: Design is adequate
  if (warnings.length === 0) {
    warnings.push({
      id: 'design_ok',
      severity: 'info',
      title: '✓ Design Adequate',
      message: `All checks passed per ${code === 'ACI' ? 'ACI 318-25' : 'CSA A23.3-24'}`,
    });
  }
  
  return warnings;
}

/**
 * Get code references for display
 */
export function getCodeReferences(code: BuildingCodeId): {
  loadFactors: string;
  resistanceFactors: string;
  minReinforcement: string;
  shear: string;
} {
  if (code === 'CSA') {
    return {
      loadFactors: 'NBC 2025 Division B Part 4',
      resistanceFactors: 'CSA A23.3-24 Clause 8.4',
      minReinforcement: 'CSA A23.3-24 Clause 10.5',
      shear: 'CSA A23.3-24 Chapter 11 (MCFT)',
    };
  }
  return {
    loadFactors: 'ASCE 7-22 Section 2.3.2',
    resistanceFactors: 'ACI 318-25 Table 21.2.1',
    minReinforcement: 'ACI 318-25 Section 7.6.1.1',
    shear: 'ACI 318-25 Table 22.5.5.1',
  };
}

/**
 * Get code info text for calculator info boxes
 */
export function getCodeInfoText(code: BuildingCodeId): {
  name: string;
  factors: string;
  phi: string;
  note: string;
} {
  if (code === 'CSA') {
    return {
      name: 'CSA A23.3-24 / NBCC 2020',
      factors: '1.25D + 1.5L',
      phi: 'φc = 0.65, φs = 0.85',
      note: 'CSA is more conservative than ACI - expect 30-40% more reinforcement',
    };
  }
  return {
    name: 'ACI 318-25 / ASCE 7-22',
    factors: '1.2D + 1.6L',
    phi: 'φ = 0.90',
    note: 'Standard US practice per latest ACI and ASCE codes',
  };
}
