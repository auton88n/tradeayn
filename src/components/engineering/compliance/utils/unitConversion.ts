// Unit conversion utilities for compliance checker

export const convert = {
  // Length
  ftToM: (ft: number) => ft * 0.3048,
  mToFt: (m: number) => m / 0.3048,
  inToMm: (inches: number) => inches * 25.4,
  mmToIn: (mm: number) => mm / 25.4,
  
  // Area
  sqftToM2: (sqft: number) => sqft * 0.092903,
  m2ToSqft: (m2: number) => m2 / 0.092903,
  
  // Pressure
  psfToKpa: (psf: number) => psf * 0.04788,
  kpaToPsf: (kpa: number) => kpa / 0.04788,
  psiToMpa: (psi: number) => psi * 0.006895,
  mpaToSi: (mpa: number) => mpa / 0.006895,
};

/** Convert a user value to the code's unit system for comparison */
export function normalizeToCodeUnit(
  userValue: number,
  userUnit: 'imperial' | 'metric',
  codeUnit: string
): number {
  // If user is metric and code is imperial-based, or vice versa
  switch (codeUnit) {
    case 'sqft':
      return userUnit === 'metric' ? convert.m2ToSqft(userValue) : userValue;
    case 'm2':
      return userUnit === 'imperial' ? convert.sqftToM2(userValue) : userValue;
    case 'ft':
      return userUnit === 'metric' ? convert.mToFt(userValue) : userValue;
    case 'm':
      return userUnit === 'imperial' ? convert.ftToM(userValue) : userValue;
    case 'inches':
      return userUnit === 'metric' ? convert.mmToIn(userValue) : userValue;
    case 'mm':
      return userUnit === 'imperial' ? convert.inToMm(userValue) : userValue;
    case 'psf':
      return userUnit === 'metric' ? convert.kpaToPsf(userValue) : userValue;
    case 'kPa':
      return userUnit === 'metric' ? userValue : convert.psfToKpa(userValue);
    case 'psi':
      return userUnit === 'metric' ? convert.mpaToSi(userValue) : userValue;
    case 'MPa':
      return userUnit === 'imperial' ? convert.psiToMpa(userValue) : userValue;
    default:
      return userValue; // percent, boolean, degF, degC, etc. — no conversion
  }
}

/** Format a value with its unit for display */
export function formatWithUnit(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100;
  switch (unit) {
    case 'sqft': return `${rounded} sq ft`;
    case 'm2': return `${rounded} m²`;
    case 'ft': return `${rounded} ft`;
    case 'm': return `${rounded} m`;
    case 'inches': return `${rounded} in`;
    case 'mm': return `${rounded} mm`;
    case 'percent': return `${rounded}%`;
    case 'boolean': return value ? 'Yes' : 'No';
    case 'degF': return `${rounded}°F`;
    case 'degC': return `${rounded}°C`;
    default: return `${rounded} ${unit}`;
  }
}
