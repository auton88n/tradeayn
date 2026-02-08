

# Fix Column Calculator Code-Specific Resistance Factors

## Problem

The `calculateColumn()` function uses Eurocode 2 material partial safety factors (gamma_c=1.5, gamma_s=1.15) regardless of the selected building code. The `codeParams` is fetched (line 465) but never used for capacity calculations.

## Changes (single file: `src/lib/engineeringCalculations.ts`)

### Fix 1: Replace EC2 material factors with code-specific approach (lines 470-473)

Remove the hardcoded gamma factors and compute `fcd`/`fyd` based on building code:

- **CSA**: Resistance factors applied directly to material strengths (phi_c x 0.85 x f'c and phi_s x fy)
- **ACI**: Use nominal strengths (0.85 x f'c and fy); phi applied to capacity later

### Fix 2: Replace capacity formula (line 547)

Update `NRd` to use code-specific capacity equations:

- **CSA**: `Pr = fcd x (Ag - As) + fyd x As` (factors already in fcd/fyd)
- **ACI**: `phi_Pn_max = 0.80 x 0.65 x [0.85f'c(Ag-Ast) + fy x Ast]` (phi and 0.80 reduction for tied columns)

### Fix 3: Update slenderness check (line 486)

Replace the EC2 slenderness formula `20 x sqrt(fck) / sqrt(N/Ac)` with the ACI/CSA threshold of `kLu/r > 22` for braced frames.

### Fix 4: Update minimum reinforcement (line 520)

Change `AsMin` from 0.2% (EC2 value) to 1% (both ACI 318 Section 10.6.1.1 and CSA A23.3 Cl. 10.9.1 require 1% minimum).

### Fix 5: Update `generateInteractionCurve()` (lines 603-700)

Add `buildingCode` parameter so the function can compute code-specific:

- **P0** (pure compression): CSA uses factored values directly; ACI applies 0.80 x 0.65 reduction
- **Concrete compression force** (`Cc`): uses the appropriate `fcd` (already passed in)
- **Pure bending point** (`M0`): consistent with the passed `fcd`/`fyd`

### Fix 6: Update adequacy check (line 550)

Change minimum reinforcement ratio check from 0.2% to 1% to match the updated `AsMin`.

### Fix 7: Add metadata to return object

Add `buildingCode: codeParams.name` to the return object.

## Technical Details

### Lines to modify

| Area | Lines | Description |
|------|-------|-------------|
| Material factors | 470-473 | Replace gammaC/gammaS with code-specific fcd/fyd |
| Slenderness | 486-487 | Replace EC2 formula with kLu/r > 22 |
| AsMin | 520 | Change 0.002 to 0.01 |
| NRd capacity | 547 | Code-specific capacity equation |
| Adequacy check | 550 | Change 0.2 threshold to 1.0 |
| Interaction curve call | 553 | Pass buildingCode to generateInteractionCurve |
| Return object | 559-598 | Add buildingCode field |
| generateInteractionCurve | 603-610, 623, 666, 692-693 | Add buildingCode param, update P0 and Cc |

### Impact

- CSA designs will produce more conservative results (lower capacity) due to resistance factors applied to material strengths
- ACI designs will show the 0.80 x phi reduction for tied columns per ACI 318
- Both codes now correctly use 1% minimum reinforcement ratio
- Slenderness classification uses the standard 22 threshold instead of the EC2 variable formula

