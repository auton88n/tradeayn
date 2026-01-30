/**
 * Lightweight code reference for AI prompt injection
 * Full details remain in buildingCodes/ for detailed lookups
 */

export const CODE_QUICK_REFERENCE = {
  ACI_318_25: {
    phi: { flexure: 0.90, shear: 0.75, column_tied: 0.65, column_spiral: 0.75 },
    loads: "1.2D + 1.6L (gravity)",
    beta1: "0.85 for f'c ≤ 28 MPa, min 0.65",
    min_steel: 0.0018,
    deflection: { floor: "L/360", roof: "L/180" },
    cover: { interior: 40, earth: 75 },
    source: "ACI 318-25 + ASCE 7-22"
  },
  CSA_A23_3_24: {
    phi: { concrete: 0.65, steel: 0.85, prestressing: 0.90 },
    loads: "1.25D + 1.5L (gravity)",
    alpha1: "0.85 - 0.0015×f'c (min 0.67)",
    beta1: "0.97 - 0.0025×f'c (min 0.67)",
    min_steel: 0.002,
    deflection: { floor: "L/240", roof: "L/180" },
    source: "CSA A23.3-24 + NBCC 2020"
  },
  KEY_DIFFERENCE: {
    steel_ratio: "CSA needs 38-56% MORE steel than ACI",
    reason: "φc=0.65 (CSA) vs φ=0.90 (ACI) for flexure",
    calculation: "0.90 ÷ 0.65 = 1.38 minimum"
  },
  OSHA_EXCAVATION: {
    protection_depth: "≥5 feet (USA), ≥1.5m (Canada)",
    slopes: { stable_rock: 90, type_a: 53, type_b: 45, type_c: 34 }
  },
  EPA_CGP: {
    threshold: "≥1 acre disturbed → NPDES permit required",
    swppp: "Required before earth-disturbing activities"
  }
};

// Generate compact string for AI system prompt
export function getCodeReferenceForPrompt(): string {
  return `
BUILDING CODE QUICK REFERENCE (verified January 2026):

USA (ACI 318-25):
• φ = 0.90 (flexure), 0.75 (shear), 0.65 (tied columns)
• Load: 1.2D + 1.6L (gravity), 1.4D (dead only)
• β₁ = 0.85 for f'c ≤ 28 MPa, min 0.65
• Min steel: 0.0018 × Ag
• Deflection: L/360 (floor), L/180 (roof)

CANADA (CSA A23.3-24):
• φc = 0.65 (concrete), φs = 0.85 (steel)
• Load: 1.25D + 1.5L (gravity)
• α₁ = 0.85 - 0.0015×f'c (min 0.67)
• β₁ = 0.97 - 0.0025×f'c (min 0.67)
• Min steel: 0.002 × Ag (HIGHER than ACI)

KEY DIFFERENCE - STEEL REQUIREMENTS:
• CSA φc=0.65 vs ACI φ=0.90 → CSA needs 38-56% MORE steel
• Example: 6m beam needs 1,407 mm² (ACI) vs 2,199 mm² (CSA)

EXCAVATION (OSHA 1926 Subpart P):
• Protection required: ≥5 feet (USA), ≥1.5m (Canada)
• Soil slopes: Type A=53°, Type B=45°, Type C=34°, Rock=90°

STORMWATER (EPA 2022 CGP):
• Permit threshold: ≥1 acre disturbed
• SWPPP required before earth-disturbing activities`;
}
