

# Fix Slab Calculator Code-Specific Resistance Factors

## Problem

The `calculateSlab()` function in `src/lib/engineeringCalculations.ts` already fetches code-specific parameters via `getCodeParameters(buildingCode)` but then ignores them for reinforcement calculations, hardcoding ACI values instead.

## Changes (single file: `src/lib/engineeringCalculations.ts`)

### Fix 1: Use code-specific resistance factors for all Ast calculations

Add this block once, right after `const d = thickness - cover - barDia / 2;` (after line 232):

```typescript
const phiFlex = codeParams.resistanceFactors.flexure;
const phiSteel = codeParams.resistanceFactors.steel;
const effectivePhi = buildingCode === 'CSA' ? phiFlex * phiSteel : 0.87;
```

Then replace `0.87` with `effectivePhi` in all 6 reinforcement area calculations:

| Line | Current | Fixed |
|------|---------|-------|
| 248 (AstPos, one-way) | `0.87 * fy * 0.9 * d` | `effectivePhi * fy * 0.9 * d` |
| 249 (AstNeg, one-way) | `0.87 * fy * 0.9 * d` | `effectivePhi * fy * 0.9 * d` |
| 311 (AstXPos, two-way) | `0.87 * fy * 0.9 * d` | `effectivePhi * fy * 0.9 * d` |
| 312 (AstXNeg, two-way) | `0.87 * fy * 0.9 * d` | `effectivePhi * fy * 0.9 * d` |
| 313 (AstYPos, two-way) | `0.87 * fy * 0.9 * (d - barDia)` | `effectivePhi * fy * 0.9 * (d - barDia)` |
| 314 (AstYNeg, two-way) | `0.87 * fy * 0.9 * (d - barDia)` | `effectivePhi * fy * 0.9 * (d - barDia)` |

For CSA, `effectivePhi = 0.65 * 0.85 = 0.5525`, which is lower than ACI's 0.87 -- resulting in more reinforcement as expected (~58% more).

### Fix 2: Use code-specific minimum reinforcement ratio

Replace the hardcoded `rhoMin` in both places:

| Line | Current | Fixed |
|------|---------|-------|
| 251 (one-way section) | `const rhoMin = 0.0018;` | `const rhoMin = codeParams.minRho;` |
| 316 (two-way section) | `const rhoMin = 0.0018;` | `const rhoMin = codeParams.minRho;` |

This uses 0.0018 for ACI and 0.002 for CSA, matching the values already defined in `getCodeParameters()`.

### Fix 3: Fix designCode output string

| Line | Current | Fixed |
|------|---------|-------|
| 434 | `designCode: 'ACI 318 / Eurocode 2',` | `designCode: codeParams.name,` |

This will output "ACI 318-25" or "CSA A23.3-24" based on the selected code.

## What is NOT changed

- Load factor logic (already correct, uses `codeParams.loadFactors`)
- Serviceability checks (deflection, crack width)
- Moment distribution coefficients
- Any other calculator function (beam, column, foundation, retaining wall)

