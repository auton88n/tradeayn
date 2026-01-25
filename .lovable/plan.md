

# Minor Enhancements Plan
## Complete Code Verification & Missing Specialty Factors

---

## Summary

This plan adds the final missing elements identified from the verified reference document to make the building code configurations fully complete and verified.

---

## Enhancements to Implement

### 1. Enhanced ACI Beam Minimum Reinforcement Formula

**Current:** Simplified ratio `minFlexural: 0.0018`  
**Needed:** Full formula implementation in calculator already exists, but needs to be more explicit in the code config

The `getMinReinforcement()` function in `calculator.ts` already implements the full formula:
```text
max(0.25√f'c/fy, 1.4/fy)
```

**Action:** Add documentation and a formula string to the reinforcement config for clarity.

---

### 2. Add Missing Specialty Resistance Factors

**ACI 318-25 Missing Factors:**
| Factor | Value | Purpose |
|--------|-------|---------|
| `anchorageSteel` | 0.75 | Anchors (steel failure) |
| `plainConcrete` | 0.60 | Plain concrete members |

**CSA A23.3-24 Missing Factors:**
| Factor | Value | Purpose |
|--------|-------|---------|
| `concretePrecast` | 0.70 | CSA-certified precast |
| `prestressing` | 0.90 | Prestressing steel (φp) |

---

### 3. Update Column Max Reinforcement Clarity

**Current ACI:** `maxColumn: 0.08` (code maximum)
**Current CSA:** `maxColumn: 0.04` (practical limit)

**Action:** Add note clarifying that ACI allows 0.08 but practical limit is 0.04 (already in notes, ensure consistency).

---

### 4. Add Reinforcement Formula Strings for Display

Add explicit formula strings that can be displayed in the UI and used by the AI for explanations:

**ACI Beams:**
```text
As,min = max(0.25√f'c/fy × bw × d, 1.4/fy × bw × d)
```

**CSA Beams:**
```text
As,min = (0.2√f'c × bt × h)/fy
```

---

### 5. Add Verification Status Tracking

Add a `verification` object to track which parameters have been verified:

```text
verification: {
  status: 'verified',
  date: '2025-01-25',
  parameters: [
    'loadFactors',
    'resistanceFactors',
    'stressBlock',
    'reinforcement',
    'stirrupSpacing',
    'punchingShear',
  ]
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/buildingCodes/types.ts` | Extend `ResistanceFactors` interface with specialty factors; Add `VerificationStatus` interface |
| `src/lib/buildingCodes/aci-318-25.ts` | Add `anchorageSteel: 0.75`, `plainConcrete: 0.60`; Add reinforcement formula strings; Add verification status |
| `src/lib/buildingCodes/csa-a23-3-24.ts` | Add `concretePrecast: 0.70`, `prestressing: 0.90`; Add reinforcement formula strings; Add verification status |

---

## Technical Details

### Type Extensions

```text
// types.ts additions

export interface ResistanceFactors {
  // Existing fields...
  flexure: number;
  shear: number;
  compressionTied: number;
  compressionSpiral: number;
  bearing: number;
  anchorage: number;
  steel: number;
  
  // NEW specialty factors
  anchorageSteel?: number;    // ACI: 0.75 (anchors steel failure)
  plainConcrete?: number;     // ACI: 0.60 (plain concrete)
  concretePrecast?: number;   // CSA: 0.70 (CSA-certified precast)
  prestressing?: number;      // CSA: 0.90 (prestressing steel φp)
}

export interface ReinforcementLimits {
  // Existing fields...
  minFlexural: number;
  minColumn: number;
  maxColumn: number;
  tempShrinkage: number;
  
  // NEW formula strings for display
  minFlexuralFormula?: string;  // "max(0.25√f'c/fy, 1.4/fy) × bw × d"
  minSlabFormula?: string;      // "0.0018 × Ag"
}

export interface VerificationStatus {
  status: 'verified' | 'high_confidence' | 'user_configurable';
  date: string;
  verifiedParameters: string[];
  sources?: string[];
}

export interface BuildingCodeConfig {
  // ... existing fields ...
  verification?: VerificationStatus;
}
```

### ACI 318-25 Updates

```text
// aci-318-25.ts additions

resistanceFactors: {
  // Existing...
  flexure: 0.90,
  shear: 0.75,
  compressionTied: 0.65,
  compressionSpiral: 0.75,
  bearing: 0.65,
  anchorage: 0.70,
  steel: 1.0,
  
  // NEW specialty factors
  anchorageSteel: 0.75,     // Anchors (steel failure)
  plainConcrete: 0.60,      // Plain concrete members
},

reinforcement: {
  minFlexural: 0.0018,
  minColumn: 0.01,
  maxColumn: 0.08,          // Code max (practical: 0.04)
  tempShrinkage: 0.0018,
  
  // NEW formula strings
  minFlexuralFormula: 'As,min = max(0.25√f\'c/fy, 1.4/fy) × bw × d',
  minSlabFormula: 'As,min = 0.0018 × Ag',
},

verification: {
  status: 'verified',
  date: '2025-01-25',
  verifiedParameters: [
    'loadFactors',
    'loadCombinations',
    'resistanceFactors',
    'stressBlock',
    'reinforcement',
    'stirrupSpacing',
    'shear',
    'punchingShear',
    'deflection',
    'cover',
  ],
  sources: [
    'ACI 318-25 Official',
    'ASCE 7-22 Official',
    'concrete.org',
  ],
},
```

### CSA A23.3-24 Updates

```text
// csa-a23-3-24.ts additions

resistanceFactors: {
  // Existing...
  flexure: 0.65,
  shear: 0.65,
  compressionTied: 0.65,
  compressionSpiral: 0.75,
  bearing: 0.65,
  anchorage: 0.65,
  steel: 0.85,
  
  // NEW specialty factors
  concretePrecast: 0.70,    // CSA-certified precast
  prestressing: 0.90,       // Prestressing steel (φp)
},

reinforcement: {
  minFlexural: 0.002,
  minColumn: 0.01,
  maxColumn: 0.08,          // Code max (practical: 0.04)
  tempShrinkage: 0.002,
  
  // NEW formula strings
  minFlexuralFormula: 'As,min = (0.2√f\'c × bt × h)/fy',
  minSlabFormula: 'As,min = 0.002 × Ag',
},

verification: {
  status: 'verified',
  date: '2025-01-25',
  verifiedParameters: [
    'loadFactors',
    'loadCombinations',
    'resistanceFactors',
    'stressBlock',
    'reinforcement',
    'stirrupSpacing',
    'shear',
    'punchingShear',
    'deflection',
    'cover',
  ],
  sources: [
    'CSA A23.3-24 Official',
    'NBCC 2020',
    'csagroup.org',
  ],
},
```

---

## Expected Outcome

After implementation:

1. **Complete Resistance Factors:** All specialty φ factors available for advanced calculations (anchors, plain concrete, precast, prestressing)

2. **Formula Display:** UI components and AI can show exact formulas for minimum reinforcement:
   - "Per ACI 318-25, As,min = max(0.25√f'c/fy, 1.4/fy) × bw × d"

3. **Verification Tracking:** Clear indication of which parameters are verified and from what sources

4. **Consistency:** Both codes have same structure for easy comparison

---

## Testing Checklist

- [ ] New resistance factors accessible via `code.resistanceFactors.anchorageSteel`
- [ ] Formula strings display correctly in UI
- [ ] Verification status shows in code info panels
- [ ] AI can cite formulas in responses
- [ ] No TypeScript errors with optional fields

