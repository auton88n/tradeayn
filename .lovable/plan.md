
# Fix Foundation Calculator Code-Specific Resistance Factors

## Overview

The `calculateFoundation()` function in `src/lib/engineeringCalculations.ts` already fetches `codeParams` via `getCodeParameters(buildingCode)` but never uses them. All four issues are in lines 714-798 of that single file.

Note: The component (`FoundationCalculator.tsx`) already calls `calculateFoundation()` client-side and passes `buildingCode` -- no component changes needed.

## Changes (single file: `src/lib/engineeringCalculations.ts`)

### Fix 1: Replace hardcoded 1.4 load factor (line 745)

**Current:**
```typescript
const Pu = columnLoad * 1.4;
```

**Fixed:**
```typescript
const avgFactor = (codeParams.loadFactors.dead + codeParams.loadFactors.live) / 2;
const Pu = columnLoad * avgFactor;
```

This produces 1.4 for ACI (average of 1.2 + 1.6) and 1.375 for CSA (average of 1.25 + 1.5). Not ideal without separate D/L inputs, but responds to code selection and matches user's request.

### Fix 2: Code-aware punching shear (lines 749, 752-754)

**Current:**
```typescript
const Vc_punch = 0.33 * Math.sqrt(fck) * b0 * d_trial / 1000;
// ...
if (Pu > Vc_punch * 0.75) {
  depth = Math.ceil((Pu * 1000) / (0.33 * Math.sqrt(fck) * b0 * 0.75) / 25) * 25;
}
```

**Fixed:**
```typescript
const punchingCoeff = buildingCode === 'CSA'
  ? 0.38 * codeParams.resistanceFactors.flexure    // 0.38 * 0.65 = 0.247
  : 0.33 * codeParams.resistanceFactors.shear;      // 0.33 * 0.75 = 0.2475
const Vc_punch = punchingCoeff * Math.sqrt(fck) * b0 * d_trial / 1000;
// ...
if (Pu > Vc_punch) {
  depth = Math.ceil((Pu * 1000) / (punchingCoeff * Math.sqrt(fck) * b0) / 25) * 25;
}
```

The resistance factor is now baked into `punchingCoeff`, so the separate `* 0.75` is removed.

### Fix 3: Code-specific flexural reinforcement (line 765)

**Current:**
```typescript
const Ast = Mu * 1e6 / (0.87 * fy * 0.9 * d);
```

**Fixed (add effectivePhi before this line, then use it):**
```typescript
const phiFlex = codeParams.resistanceFactors.flexure;
const phiSteel = codeParams.resistanceFactors.steel;
const effectivePhi = buildingCode === 'CSA' ? phiFlex * phiSteel : 0.87;
const Ast = Mu * 1e6 / (effectivePhi * fy * 0.9 * d);
```

### Fix 4: Code-specific minimum reinforcement (line 767)

**Current:**
```typescript
const AstMin = 0.0012 * width * 1000 * d;
```

**Fixed:**
```typescript
const AstMin = codeParams.minRho * 0.6 * width * 1000 * d;
```

Foundation minimum is typically 60% of the slab minimum ratio per code practice. This gives 0.00108 for ACI and 0.0012 for CSA.

### Fix 5: Add metadata to return object (after line 797)

Add these fields to the return object:
```typescript
designCode: codeParams.name,
buildingCode: codeParams.name,
loadFactorsUsed: `${codeParams.loadFactors.dead}D + ${codeParams.loadFactors.live}L`,
```

## What is NOT changed

- Foundation sizing logic (iterative sizing with eccentricity -- correct)
- Bearing capacity safety factor (1.5 divisor)
- Bar diameter selection and spacing logic
- Material volume/weight calculations
- The edge function file (cleanup is a separate task)
- The component file (already uses client-side calculation)
