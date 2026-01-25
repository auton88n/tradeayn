/**
 * Geotechnical Safety Factors
 * 
 * These are standard engineering practice values, not code-mandated.
 * Always verify with a licensed geotechnical engineer for specific projects.
 * 
 * Note: Geotechnical factors are generally consistent across ACI and CSA
 * as they derive from established soil mechanics principles.
 */

export interface GeotechnicalConfig {
  foundationBearing: {
    soil: { min: number; typical: number; conservative: number };
    rock: { min: number; typical: number };
  };
  retainingWall: {
    overturning: { soil: number; rock: number };
    sliding: { typical: number; conservative: number };
    bearing: { soil: number; highConsequence: number };
  };
  slopeStability: {
    temporary: number;
    permanent: number;
    critical: number;
  };
}

export const GEOTECHNICAL_SAFETY_FACTORS: GeotechnicalConfig = {
  // Foundation Bearing Capacity Safety Factors
  foundationBearing: {
    soil: {
      min: 2.0,           // Absolute minimum for normal structures
      typical: 2.5,       // Common practice
      conservative: 3.0,  // High-consequence structures
    },
    rock: {
      min: 1.5,           // Can be lower on competent rock
      typical: 2.0,       // Standard practice
    },
  },
  
  // Retaining Wall Stability Safety Factors
  retainingWall: {
    overturning: {
      soil: 2.0,          // Minimum for soil-founded walls
      rock: 1.5,          // Can be reduced on rock
    },
    sliding: {
      typical: 1.5,       // Standard practice
      conservative: 2.0,  // High-consequence or uncertain conditions
    },
    bearing: {
      soil: 2.5,          // Typical soil-founded walls
      highConsequence: 3.0, // Critical structures
    },
  },
  
  // Slope Stability Safety Factors
  slopeStability: {
    temporary: 1.25,      // Short-term excavations
    permanent: 1.5,       // Long-term slopes
    critical: 2.0,        // Critical infrastructure
  },
};

/**
 * Get foundation bearing FOS based on structure importance
 */
export function getFoundationBearingFOS(
  foundationType: 'soil' | 'rock',
  importance: 'normal' | 'important' | 'critical' = 'normal'
): number {
  if (foundationType === 'rock') {
    return importance === 'critical' 
      ? GEOTECHNICAL_SAFETY_FACTORS.foundationBearing.rock.typical 
      : GEOTECHNICAL_SAFETY_FACTORS.foundationBearing.rock.min;
  }
  
  switch (importance) {
    case 'critical':
      return GEOTECHNICAL_SAFETY_FACTORS.foundationBearing.soil.conservative;
    case 'important':
      return GEOTECHNICAL_SAFETY_FACTORS.foundationBearing.soil.typical;
    default:
      return GEOTECHNICAL_SAFETY_FACTORS.foundationBearing.soil.min;
  }
}

/**
 * Get retaining wall stability FOS
 */
export function getRetainingWallFOS(
  checkType: 'overturning' | 'sliding' | 'bearing',
  foundationType: 'soil' | 'rock' = 'soil',
  conservative: boolean = false
): number {
  switch (checkType) {
    case 'overturning':
      return foundationType === 'rock'
        ? GEOTECHNICAL_SAFETY_FACTORS.retainingWall.overturning.rock
        : GEOTECHNICAL_SAFETY_FACTORS.retainingWall.overturning.soil;
    case 'sliding':
      return conservative
        ? GEOTECHNICAL_SAFETY_FACTORS.retainingWall.sliding.conservative
        : GEOTECHNICAL_SAFETY_FACTORS.retainingWall.sliding.typical;
    case 'bearing':
      return conservative
        ? GEOTECHNICAL_SAFETY_FACTORS.retainingWall.bearing.highConsequence
        : GEOTECHNICAL_SAFETY_FACTORS.retainingWall.bearing.soil;
  }
}

/**
 * Allowable bearing pressure from ultimate capacity
 */
export function getAllowableBearingPressure(
  ultimateCapacity: number,
  fos: number = 2.5
): number {
  return ultimateCapacity / fos;
}

/**
 * Earth pressure coefficients (Rankine theory)
 */
export function getEarthPressureCoefficients(
  phi: number,  // Friction angle in degrees
  beta: number = 0  // Backfill slope angle in degrees
): { Ka: number; Kp: number; K0: number } {
  const phiRad = (phi * Math.PI) / 180;
  const betaRad = (beta * Math.PI) / 180;
  
  // Active pressure coefficient (Rankine with sloped backfill)
  const Ka = beta === 0
    ? Math.pow(Math.tan(Math.PI / 4 - phiRad / 2), 2)
    : Math.cos(betaRad) * (
        (Math.cos(betaRad) - Math.sqrt(Math.pow(Math.cos(betaRad), 2) - Math.pow(Math.cos(phiRad), 2))) /
        (Math.cos(betaRad) + Math.sqrt(Math.pow(Math.cos(betaRad), 2) - Math.pow(Math.cos(phiRad), 2)))
      );
  
  // Passive pressure coefficient
  const Kp = Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
  
  // At-rest pressure coefficient (Jaky's formula)
  const K0 = 1 - Math.sin(phiRad);
  
  return { Ka, Kp, K0 };
}

/**
 * Typical soil properties for preliminary design
 */
export const TYPICAL_SOIL_PROPERTIES = {
  looseSand: {
    phi: 28,              // degrees
    gamma: 16,            // kN/m³
    allowableBearing: 100, // kPa
  },
  mediumSand: {
    phi: 32,
    gamma: 18,
    allowableBearing: 200,
  },
  denseSand: {
    phi: 36,
    gamma: 20,
    allowableBearing: 300,
  },
  softClay: {
    phi: 0,
    cohesion: 25,         // kPa
    gamma: 16,
    allowableBearing: 75,
  },
  stiffClay: {
    phi: 0,
    cohesion: 75,
    gamma: 19,
    allowableBearing: 150,
  },
  hardClay: {
    phi: 0,
    cohesion: 150,
    gamma: 20,
    allowableBearing: 300,
  },
  gravel: {
    phi: 38,
    gamma: 21,
    allowableBearing: 400,
  },
};
