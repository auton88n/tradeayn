

# Simple NBCC 2020/2025 Notice - 15 Minute Fix

## What's Already Correct ✅
- `getCodeInfoText()` in `designValidation.ts` already shows "CSA A23.3-24 / NBCC 2020"
- All 5 calculator info boxes already use this dynamic text

## What Needs Fixing

Only **2 small changes** needed:

### 1. Update `src/lib/buildingCodes/csa-a23-3-24.ts`

Change "NBC 2025" references to "NBCC 2020":

| Line | Current | New |
|------|---------|-----|
| 2 | `CSA A23.3-24 / NBC 2025` | `CSA A23.3-24 / NBCC 2020` |
| 9 | `CSA A23.3-24 and NBC 2025 standards` | `CSA A23.3-24 with NBCC 2020` |
| 44 | `version: 'CSA A23.3-24 / NBC 2025'` | `version: 'CSA A23.3-24 / NBCC 2020'` |
| 51 | Comment: `// LOAD FACTORS (NBC 2025)` | `// LOAD FACTORS (NBCC 2020)` |
| 64 | Comment: `// LOAD COMBINATIONS (NBC 2025...)` | `// LOAD COMBINATIONS (NBCC 2020...)` |
| 138 | `loadCombinations: 'NBC 2025 Division B Part 4'` | `loadCombinations: 'NBCC 2020 Division B Part 4'` |
| 337-339 | sources array includes 'NBC 2025' | Replace with 'NBCC 2020' |

Also add one note to the notes array:
```typescript
notes: [
  'Using NBCC 2020 (currently adopted across Canada). NBCC 2025 published late 2025; verify adoption status with local building department.',
  // ... existing notes
]
```

### 2. Update `src/lib/designValidation.ts`

Update `getCodeReferences()` and `getCodeInfoText()`:

**Line 182** - Change:
```typescript
loadFactors: 'NBCC 2020 Division B Part 4',  // was NBC 2025
```

**Line 211-212** - Add NBCC 2025 note:
```typescript
return {
  name: 'CSA A23.3-24 / NBCC 2020',
  factors: '1.25D + 1.5L',
  phi: 'φc = 0.65, φs = 0.85',
  note: 'Using NBCC 2020. NBCC 2025 available - verify adoption with local building dept.',
};
```

## Result
- Calculator info boxes will show: "Using NBCC 2020. NBCC 2025 available - verify adoption with local building dept."
- Legally safe (NBCC 2020 is currently adopted everywhere in Canada)
- Honest about NBCC 2025 existence
- No UI component changes needed

## Files to Modify
| File | Changes |
|------|---------|
| `src/lib/buildingCodes/csa-a23-3-24.ts` | Replace "NBC 2025" with "NBCC 2020" (~8 places), add note |
| `src/lib/designValidation.ts` | Update note text in `getCodeInfoText()`, fix reference in `getCodeReferences()` |

## Effort
~15 minutes total

