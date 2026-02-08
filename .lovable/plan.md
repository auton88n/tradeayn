
# Fix Retaining Wall Calculator Code-Specific Resistance Factors

## Problem

The `calculateRetainingWall()` function in `src/lib/engineeringCalculations.ts` fetches `codeParams` via `getCodeParameters(buildingCode)` but ignores them for reinforcement design -- hardcoding ACI resistance factors (`0.87`) and minimum rho (`0.0018`), and using unfactored moments for structural design.

## Changes (single file: `src/lib/engineeringCalculations.ts`)

### Fix 1: Add code-specific resistance factors (after line 903, before reinforcement section)

Insert:

```typescript
const phiFlex = codeParams.resistanceFactors.flexure;
const phiSteel = codeParams.resistanceFactors.steel;
const effectivePhi = buildingCode === 'CSA' ? phiFlex * phiSteel : 0.87;
```

### Fix 2: Factor the structural moments for stem, heel, and toe (lines 904, 918, 925)

Replace the 3 unfactored moment lines with factored versions for reinforcement design:

| Line | Current | Fixed |
|------|---------|-------|
| 904 | `Mu_stem = Pa_soil * H / 3 + Pa_surcharge * H / 2` | `Mu_stem = codeParams.loadFactors.live * (Pa_soil * H / 3 + Pa_surcharge * H / 2)` |
| 918 | `Mu_heel = 0.5 * Math.abs(heelLoad) * heel * heel` | `Mu_heel = codeParams.loadFactors.live * 0.5 * Math.abs(heelLoad) * heel * heel` |
| 925 | `Mu_toe = 0.5 * toeLoad * toe * toe` | `Mu_toe = codeParams.loadFactors.live * 0.5 * toeLoad * toe * toe` |

Earth pressure is treated as a live load per ACI/CSA for structural member design. The factored moments are used for reinforcement sizing only; stability analysis remains at service level.

### Fix 3: Replace hardcoded `0.87` with `effectivePhi` (lines 906, 921, 928)

| Line | Current | Fixed |
|------|---------|-------|
| 906 | `(0.87 * fy * 0.9 * dStem)` | `(effectivePhi * fy * 0.9 * dStem)` |
| 921 | `(0.87 * fy * 0.9 * dHeel)` | `(effectivePhi * fy * 0.9 * dHeel)` |
| 928 | `(0.87 * fy * 0.9 * dToe)` | `(effectivePhi * fy * 0.9 * dToe)` |

### Fix 4: Replace hardcoded `0.0018` with `codeParams.minRho` (lines 921, 928)

| Line | Current | Fixed |
|------|---------|-------|
| 921 | `0.0018 * 1000 * D * 1000` | `codeParams.minRho * 1000 * D * 1000` |
| 928 | `0.0018 * 1000 * D * 1000` | `codeParams.minRho * 1000 * D * 1000` |

### Fix 5: Update output metadata (line 1002)

Replace:
```typescript
designCode: 'Rankine Theory / ACI 318',
```

With:
```typescript
designCode: `Rankine Theory / ${codeParams.name}`,
buildingCode: codeParams.name,
loadFactorsUsed: `${codeParams.loadFactors.dead}D + ${codeParams.loadFactors.live}L`,
```

## What is NOT changed

- Stability analysis (overturning, sliding, bearing) -- correctly uses service loads
- Earth pressure coefficients (Ka, Kp)
- Weight calculations
- FOS thresholds (2.0, 1.5, 3.0)
- Distribution steel calculation (line 912)
