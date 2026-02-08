

# Unify Building Code Parameters: Single Source of Truth

## Overview

Replace the local `getCodeParameters()` function in `engineeringCalculations.ts` with a new `getCodeDesignParameters()` wrapper exported from `src/lib/buildingCodes/calculator.ts`, so all calculators pull from the comprehensive code configs.

## Changes

### File 1: `src/lib/buildingCodes/calculator.ts`

Add a new exported function at the end of the file that maps the comprehensive `BuildingCodeConfig` to the simplified shape used by the calculators:

```typescript
export function getCodeDesignParameters(codeId: BuildingCodeId) {
  const config = getBuildingCode(codeId);
  return {
    loadFactors: { dead: config.loadFactors.dead, live: config.loadFactors.live },
    resistanceFactors: {
      flexure: config.resistanceFactors.flexure,
      shear: config.resistanceFactors.shear,
      steel: config.resistanceFactors.steel,
    },
    minRho: config.reinforcement.minFlexural,
    name: config.name,
  };
}
```

Property mapping notes (from the comprehensive configs):
- `resistanceFactors.flexure` -- exists directly (0.90 ACI, 0.65 CSA)
- `resistanceFactors.steel` -- exists directly (1.0 ACI, 0.85 CSA)
- `reinforcement.minFlexural` -- the correct property name (not `minRatio`)

### File 2: `src/lib/buildingCodes/index.ts`

Add `getCodeDesignParameters` to the exports from `./calculator`:

```typescript
export {
  // ... existing exports ...
  getCodeDesignParameters,
} from './calculator';
```

### File 3: `src/lib/engineeringCalculations.ts`

1. **Remove** the local `CodeParameters` interface (lines 9-14) and `getCodeParameters()` function (lines 16-32)
2. **Update** the import on line 6 to:
   ```typescript
   import type { BuildingCodeId } from '@/lib/buildingCodes';
   import { getCodeDesignParameters } from '@/lib/buildingCodes';
   ```
3. **Replace** all occurrences of `getCodeParameters(buildingCode)` with `getCodeDesignParameters(buildingCode)` -- there are 5 calls (one per calculator function)

## What does NOT change

- The comprehensive config files (`aci-318-25.ts`, `csa-a23-3-24.ts`)
- No existing exports removed from `buildingCodes/index.ts`
- No calculator logic changes -- only the parameter source changes
- The returned values are identical (same numbers), so no calculator output changes

