export type DesignType = 'beam' | 'column' | 'slab' | 'foundation' | 'retaining_wall';

interface CodeComparison {
  usa_phi: number;
  canada_phi: number;
  steelRatioMin: number;
  typicalRange: string;
  reason: string;
  practicalNote: string;
}

const COMPARISONS: Record<DesignType, CodeComparison> = {
  beam: {
    usa_phi: 0.90,
    canada_phi: 0.65,
    steelRatioMin: 1.38,
    typicalRange: "45-56%",
    reason: "Lower φc factor in CSA for concrete flexure",
    practicalNote: "Canadian beams typically have larger sections or more steel"
  },
  column: {
    usa_phi: 0.65,
    canada_phi: 0.65,
    steelRatioMin: 1.0,
    typicalRange: "Similar",
    reason: "Both codes use φ = 0.65 for compression-controlled sections",
    practicalNote: "Column designs are comparable between codes"
  },
  slab: {
    usa_phi: 0.90,
    canada_phi: 0.65,
    steelRatioMin: 1.38,
    typicalRange: "38-50%",
    reason: "Flexure-controlled, same as beams",
    practicalNote: "Canadian slabs may be thicker or have more reinforcement"
  },
  foundation: {
    usa_phi: 0.65,
    canada_phi: 0.65,
    steelRatioMin: 1.0,
    typicalRange: "10-20% larger",
    reason: "Similar φ but CSA has stricter frost protection requirements",
    practicalNote: "Canadian foundations deeper for frost, often larger footing area"
  },
  retaining_wall: {
    usa_phi: 0.90,
    canada_phi: 0.65,
    steelRatioMin: 1.38,
    typicalRange: "40-55%",
    reason: "Flexure in stem design uses different φ factors",
    practicalNote: "Canadian walls need more reinforcement in stem"
  }
};

export function compareUSAvsCanada(designType: DesignType): CodeComparison {
  return COMPARISONS[designType];
}

export function getSteelIncreaseFactor(designType: DesignType): number {
  return COMPARISONS[designType].steelRatioMin;
}

export function explainCodeDifference(designType: DesignType): string {
  const comp = COMPARISONS[designType];
  return `For ${designType} design:
USA (ACI 318-25): φ = ${comp.usa_phi}
Canada (CSA A23.3-24): φc = ${comp.canada_phi}

Steel requirement: CSA needs ${((comp.steelRatioMin - 1) * 100).toFixed(0)}% more minimum
Typical in practice: ${comp.typicalRange} more steel

Reason: ${comp.reason}
${comp.practicalNote}`;
}

export function getAllComparisons(): Record<DesignType, CodeComparison> {
  return COMPARISONS;
}
