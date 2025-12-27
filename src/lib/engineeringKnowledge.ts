// Comprehensive Engineering Knowledge Base
// Based on ACI 318-19, Eurocode 2, and Saudi Building Code (SBC 304-2018)

export const ENGINEERING_KNOWLEDGE = {
  concrete: {
    grades: {
      C25: { fck: 25, fcd: 16.67, fctm: 2.56, Ecm: 31000 },
      C30: { fck: 30, fcd: 20.00, fctm: 2.90, Ecm: 33000 },
      C35: { fck: 35, fcd: 23.33, fctm: 3.21, Ecm: 34000 },
      C40: { fck: 40, fcd: 26.67, fctm: 3.51, Ecm: 35000 }
    },
    formulas: {
      flexuralDesign: {
        name: "Flexural Design (Ultimate Moment)",
        expression: "Mu = 0.87 × fy × As × (d - 0.42×xu)",
        description: "Calculates ultimate moment capacity of a reinforced concrete section"
      },
      shearStrength: {
        name: "Shear Strength (Concrete Contribution)",
        expression: "Vc = 0.17 × √fck × bw × d",
        description: "Shear capacity provided by concrete alone"
      },
      minimumReinforcement: {
        name: "Minimum Reinforcement",
        expression: "As,min = max(0.26 × (fctm/fyk) × bt × d, 0.0013 × bt × d)",
        description: "Minimum steel area to prevent brittle failure"
      },
      maximumReinforcement: {
        name: "Maximum Reinforcement",
        expression: "As,max = 0.04 × Ac",
        description: "Maximum steel area for ductility"
      },
      neutralAxisDepth: {
        name: "Neutral Axis Depth",
        expression: "xu = 0.87 × fy × As / (0.36 × fck × b)",
        description: "Depth of neutral axis from compression face"
      },
      leverArm: {
        name: "Lever Arm",
        expression: "z = d × (1 - 0.416 × xu/d)",
        description: "Internal lever arm for moment calculation"
      },
      requiredSteelArea: {
        name: "Required Steel Area",
        expression: "As = Mu / (0.87 × fy × z)",
        description: "Steel area required to resist design moment"
      },
      deflectionCheck: {
        name: "Deflection Limit",
        expression: "δmax = L/250 (total), L/500 (after partitions)",
        description: "Maximum allowable deflection limits"
      }
    },
    limits: {
      minCover: { 
        XC1: 25, // Dry or permanently wet
        XC2: 30, // Wet, rarely dry
        XC3: 35, // Moderate humidity
        XC4: 40, // Cyclic wet and dry
        XS1: 40  // Exposed to airborne salt
      },
      minBeamWidth: 200,
      minColumnSize: 200,
      maxReinforcementRatio: 0.04,
      minReinforcementRatio: 0.0013,
      maxSpanDepthRatio: { 
        simply_supported: 20, 
        continuous: 26, 
        cantilever: 8 
      },
      maxCrackWidth: 0.3 // mm for normal exposure
    }
  },
  
  steel: {
    grades: {
      Fy420: { fy: 420, Es: 200000, εy: 0.0021 },
      Fy500: { fy: 500, Es: 200000, εy: 0.0025 }
    },
    barSizes: {
      8: { diameter: 8, area: 50.3, weight: 0.395 },
      10: { diameter: 10, area: 78.5, weight: 0.617 },
      12: { diameter: 12, area: 113, weight: 0.888 },
      16: { diameter: 16, area: 201, weight: 1.58 },
      20: { diameter: 20, area: 314, weight: 2.47 },
      25: { diameter: 25, area: 491, weight: 3.85 },
      32: { diameter: 32, area: 804, weight: 6.31 }
    }
  },
  
  soil: {
    bearingCapacities: {
      rock: { min: 1000, max: 4000, description: "Hard rock" },
      gravel: { min: 300, max: 600, description: "Dense gravel" },
      sand_dense: { min: 200, max: 400, description: "Dense sand" },
      sand_medium: { min: 100, max: 250, description: "Medium dense sand" },
      sand_loose: { min: 50, max: 100, description: "Loose sand" },
      clay_stiff: { min: 150, max: 300, description: "Stiff clay" },
      clay_medium: { min: 75, max: 150, description: "Medium clay" },
      clay_soft: { min: 25, max: 75, description: "Soft clay" }
    },
    formulas: {
      ultimateBearing: {
        name: "Terzaghi Bearing Capacity",
        expression: "qu = c×Nc + γ×D×Nq + 0.5×γ×B×Nγ",
        description: "Ultimate bearing capacity of shallow foundations"
      },
      allowableBearing: {
        name: "Allowable Bearing Pressure",
        expression: "qa = qu / FS (FS = 2.5 to 3.0)",
        description: "Safe bearing pressure with factor of safety"
      }
    }
  },
  
  loads: {
    residential: { 
      liveLoad: 2.0, // kN/m²
      deadLoadSlab: 25, // kN/m³ (concrete self-weight)
      finishes: 1.5, // kN/m²
      partitions: 1.0 // kN/m²
    },
    commercial: { 
      liveLoad: 4.0, 
      deadLoadSlab: 25,
      finishes: 1.5,
      partitions: 1.5
    },
    parking: {
      liveLoad: 5.0,
      deadLoadSlab: 25
    },
    loadFactors: { 
      dead: 1.4, 
      live: 1.6,
      wind: 1.6,
      earthquake: 1.0
    },
    loadCombinations: {
      strength1: "1.4D",
      strength2: "1.2D + 1.6L",
      strength3: "1.2D + 1.0L + 1.6W",
      strength4: "1.2D + 1.0L + 1.0E"
    }
  },
  
  retainingWall: {
    formulas: {
      activePressure: {
        name: "Rankine Active Pressure Coefficient",
        expression: "Ka = (1 - sinφ) / (1 + sinφ)",
        description: "Lateral earth pressure coefficient for active condition"
      },
      passivePressure: {
        name: "Rankine Passive Pressure Coefficient",
        expression: "Kp = (1 + sinφ) / (1 - sinφ)",
        description: "Lateral earth pressure coefficient for passive condition"
      },
      overturningMoment: {
        name: "Overturning Moment",
        expression: "Mo = (1/6) × Ka × γ × H³",
        description: "Moment causing wall to overturn"
      },
      slidingForce: {
        name: "Sliding Force",
        expression: "Pa = 0.5 × Ka × γ × H²",
        description: "Horizontal force causing wall to slide"
      },
      stabilityFactors: {
        overturning: "FS ≥ 2.0",
        sliding: "FS ≥ 1.5",
        bearing: "FS ≥ 3.0"
      }
    }
  },
  
  grading: {
    formulas: {
      cutVolume: {
        name: "Cut Volume",
        expression: "Vc = Σ(Ai × (EG - FGL)i) for EG > FGL",
        description: "Volume of soil to be excavated"
      },
      fillVolume: {
        name: "Fill Volume",
        expression: "Vf = Σ(Ai × (FGL - EG)i) for FGL > EG",
        description: "Volume of soil to be filled"
      },
      slopeGradient: {
        name: "Slope Gradient",
        expression: "S = ΔH / L × 100%",
        description: "Slope expressed as percentage"
      }
    },
    limits: {
      maxSlopeParking: 5, // %
      maxSlopeDriveway: 15, // %
      maxSlopeWalkway: 8, // %
      minDrainageSlope: 0.5 // %
    }
  },
  
  saudiBuildingCode: {
    version: "SBC 304-2018",
    requirements: {
      concreteGradeMin: 25, // MPa
      coverForExposure: "SBC Table 7.7.1",
      seismicZones: { 
        Riyadh: "Zone 2A", 
        Jeddah: "Zone 3", 
        Dammam: "Zone 1",
        Makkah: "Zone 3",
        Madinah: "Zone 2B"
      },
      fireRating: {
        residential: 1, // hours
        commercial: 2,
        industrial: 3
      }
    },
    loadRequirements: {
      windSpeed: { 
        Riyadh: 40, // m/s
        Jeddah: 45,
        coastal: 50
      }
    }
  }
};

// Helper functions for engineering calculations
export const engineeringHelpers = {
  // Calculate required steel area for flexure
  calculateRequiredAs: (Mu: number, fy: number, d: number, fck: number, b: number): number => {
    // Simplified rectangular stress block method
    const z = d * 0.9; // Approximate lever arm
    const As = (Mu * 1e6) / (0.87 * fy * z);
    return Math.round(As);
  },
  
  // Select optimal bar configuration
  selectBars: (requiredAs: number): { count: number; diameter: number; providedAs: number } => {
    const barSizes = [12, 16, 20, 25, 32];
    const barAreas: Record<number, number> = { 12: 113, 16: 201, 20: 314, 25: 491, 32: 804 };
    
    let bestConfig = { count: 0, diameter: 0, providedAs: 0 };
    let minExcess = Infinity;
    
    for (const dia of barSizes) {
      const area = barAreas[dia];
      const count = Math.ceil(requiredAs / area);
      if (count >= 2 && count <= 8) {
        const provided = count * area;
        const excess = provided - requiredAs;
        if (excess >= 0 && excess < minExcess) {
          minExcess = excess;
          bestConfig = { count, diameter: dia, providedAs: provided };
        }
      }
    }
    
    return bestConfig;
  },
  
  // Calculate shear reinforcement spacing
  calculateStirrupSpacing: (Vu: number, Vc: number, fy: number, d: number, stirrupDia: number): number => {
    const Vs = Math.max(0, Vu / 0.75 - Vc);
    const Asv = 2 * Math.PI * stirrupDia * stirrupDia / 4; // 2-legged stirrup
    
    if (Vs <= 0) {
      return Math.min(d / 2, 300);
    }
    
    const spacing = (0.87 * fy * Asv * d) / (Vs * 1000);
    return Math.min(Math.floor(spacing / 25) * 25, d / 2, 300);
  },
  
  // Calculate foundation size
  calculateFoundationSize: (load: number, bearingCapacity: number, minSize: number = 1.0): number => {
    const requiredArea = (load * 1000) / bearingCapacity;
    const size = Math.sqrt(requiredArea);
    return Math.max(Math.ceil(size * 4) / 4, minSize); // Round to nearest 0.25m
  }
};

// Type definitions for AI responses
export interface AIEngineeringResponse {
  answer: string;
  formula?: {
    name: string;
    expression: string;
    variables?: Record<string, { value: number; unit: string }>;
  };
  calculation?: {
    steps: string[];
    result: number;
    unit: string;
  };
  codeReference?: {
    standard: string;
    section: string;
    requirement: string;
  };
  alternatives?: Array<{
    description: string;
    costImpact: number;
    pros: string[];
    cons: string[];
  }>;
  warning?: string;
  quickReplies?: string[];
}

export type CalculatorType = 'beam' | 'column' | 'foundation' | 'slab' | 'retaining_wall' | 'grading';
