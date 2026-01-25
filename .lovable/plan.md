

# Engineering Tools Enhancement Plan
## Complete Building Code Integration with AI System Prompt

---

## Summary

This plan adds all missing technical details from the comprehensive building code system prompt you shared into the engineering tools. The goal is to make the AI assistant fully code-aware with proper citations, step-by-step calculation guidance, and complete load combinations.

---

## What's Missing (Gap Analysis)

### 1. Load Combinations (Currently Missing)
**Current:** Only basic `1.2D + 1.6L` stored  
**Needed:** Full set including uplift, seismic overturning, and companion loads:
- ACI: 6 combinations (1.4D, 1.2D+1.6L+0.5S, 0.9D+1.0W, etc.)
- CSA: 7 combinations (1.4D, 1.25D+1.5L, 0.9D+1.4W, etc.)

### 2. Code Section References (Currently Missing)
**Current:** No citation system  
**Needed:** Specific clause references for AI to cite:
- ACI: "Table 21.2.1", "Section 22.5.5.1", "Chapter 25"
- CSA: "Clause 8.4", "Chapter 11", "Clause 10"

### 3. Size Effect Factor (Partially Implemented)
**Current:** Formula stored as string only  
**Needed:** Actual calculation function:
```typescript
λs = √(2/(1+0.004d)) ≤ 1.0
```

### 4. Development Length Formulas (Missing)
**Current:** Not implemented  
**Needed:** 
- Tension: `ld = (fy × ψt × ψe × ψs × ψg × db)/(25λ√f'c)`
- Compression: `ldc = (fy × ψr × db)/(50λ√f'c)`
- Lap splice: 1.3 × ld

### 5. CSA MCFT Shear Details (Partially Implemented)
**Current:** Basic β = 0.18 hardcoded  
**Needed:** 
- β calculation with/without stirrups
- dv (shear depth) proper calculation
- Full MCFT integration

### 6. Safety Warnings/Thresholds (Missing)
**Current:** No warning system  
**Needed:** Specific thresholds for:
- ρ < ρmin → "BRITTLE FAILURE RISK"
- ρ > ρmax → "OVER-REINFORCED"
- Bar spacing < 25mm → "CONGESTION"
- Cover < minimum → "DURABILITY ISSUE"

### 7. AI Response Guidelines (Missing from Edge Function)
**Current:** Generic engineering prompt  
**Needed:** Structured response format requiring:
- Code citations with specific sections
- Step-by-step calculations with real numbers
- Dynamic load factor application
- Professional review reminder

---

## Implementation Plan

### Phase 1: Extend Type Definitions
**File:** `src/lib/buildingCodes/types.ts`

Add new interfaces:
```text
interface LoadCombinations {
  combinations: Array<{
    id: string;           // "LC1", "LC2"
    formula: string;      // "1.2D + 1.6L + 0.5S"
    purpose: string;      // "gravity", "wind_uplift", "seismic"
  }>;
}

interface CodeReferences {
  loadCombinations: string;    // "ASCE 7-22 Section 2.3.2"
  phiFactors: string;          // "Table 21.2.1"
  minReinforcement: string;    // "Sections 9.6.1.2, 7.6.1.1"
  shearDesign: string;         // "Chapter 22, Table 22.5.5.1"
  stirrupSpacing: string;      // "Table 9.7.6.2.2"
  punchingShear: string;       // "Table 22.6.5.2"
  deflection: string;          // "Table 24.2.2"
  cover: string;               // "Table 20.5.1.3.1"
  developmentLength: string;   // "Chapter 25"
}

interface DesignWarnings {
  brittleFailure: { threshold: string; message: string };
  overReinforced: { threshold: string; message: string };
  congestion: { minSpacing: number; message: string };
  coverInadequate: { message: string };
  shearFailure: { message: string };
  deflectionExceeded: { message: string };
}
```

### Phase 2: Update ACI 318-25 Configuration
**File:** `src/lib/buildingCodes/aci-318-25.ts`

Add full load combinations:
```text
loadCombinations: [
  { id: 'LC1', formula: '1.4D', purpose: 'dead_only' },
  { id: 'LC2', formula: '1.2D + 1.6L + 0.5(Lr or S)', purpose: 'gravity' },
  { id: 'LC3', formula: '1.2D + 1.0W + 0.5L + 0.5(Lr or S)', purpose: 'wind' },
  { id: 'LC4', formula: '1.2D + 1.0E + 0.5L + 0.2S', purpose: 'seismic' },
  { id: 'LC5', formula: '0.9D + 1.0W', purpose: 'wind_uplift' },
  { id: 'LC6', formula: '0.9D + 1.0E', purpose: 'seismic_overturning' },
]
```

Add code references:
```text
codeReferences: {
  loadCombinations: 'ASCE 7-22 Section 2.3.2',
  phiFactors: 'Table 21.2.1',
  minReinforcement: 'Sections 9.6.1.2, 7.6.1.1',
  shearDesign: 'Chapter 22, Table 22.5.5.1',
  // ... etc
}
```

Add design warnings:
```text
warnings: {
  brittleFailure: { 
    threshold: 'ρ < ρmin', 
    message: 'BRITTLE FAILURE RISK - Increase reinforcement to at least ρmin' 
  },
  // ... etc
}
```

### Phase 3: Update CSA A23.3-24 Configuration
**File:** `src/lib/buildingCodes/csa-a23-3-24.ts`

Same structure as ACI but with CSA-specific:
- Load combinations per NBCC 2020
- Code references with "Clause" format
- Different safety thresholds

### Phase 4: Add New Calculator Functions
**File:** `src/lib/buildingCodes/calculator.ts`

New functions:

1. **Size Effect Factor:**
```typescript
function getSizeEffectFactor(code: BuildingCodeConfig, d: number): number {
  if (code.id === 'ACI') {
    const lambdaS = Math.sqrt(2 / (1 + 0.004 * d));
    return Math.min(lambdaS, 1.0);
  }
  return 1.0; // CSA integrates in MCFT
}
```

2. **Development Length:**
```typescript
function getDevelopmentLength(
  code: BuildingCodeConfig,
  barDiameter: number,
  fy: number,
  fck: number,
  coverCondition: 'adequate' | 'minimal',
  coated: boolean
): { tension: number; compression: number; lapSplice: number }
```

3. **CSA Shear Depth:**
```typescript
function getShearDepth(code: BuildingCodeConfig, d: number, h: number): number {
  if (code.id === 'CSA') {
    return Math.max(0.9 * d, 0.72 * h);
  }
  return d;
}
```

4. **Design Warnings Checker:**
```typescript
function checkDesignWarnings(
  code: BuildingCodeConfig,
  actualRho: number,
  minRho: number,
  maxRho: number,
  barSpacing: number,
  actualCover: number,
  requiredCover: number
): DesignWarning[]
```

### Phase 5: Enhance Edge Function System Prompt
**File:** `supabase/functions/engineering-ai-chat/index.ts`

Replace the static `ENGINEERING_KNOWLEDGE` with a dynamic function that builds the comprehensive prompt based on the active building code.

Key additions:
1. **Active code header** with version and source
2. **Full load combinations table** for selected code
3. **Code section references** for citations
4. **Response guidelines** requiring:
   - Step-by-step calculations with real numbers
   - Code citations ("Per ACI 318-25 Table 21.2.1...")
   - Design warnings when thresholds exceeded
   - Professional review reminder
5. **Example interactions** showing proper format

### Phase 6: Update AI Context
**File:** `src/contexts/EngineeringSessionContext.tsx`

Expand `AIContext` interface to include:
```text
buildingCode: {
  id: BuildingCodeId;
  name: string;
  fullName: string;
  version: string;
  loadCombinations: LoadCombination[];
  resistanceFactors: ResistanceFactors;
  codeReferences: CodeReferences;
  warnings: DesignWarnings;
}
```

---

## Technical Details

### Updated Type Definition Structure

```text
// types.ts additions
export interface LoadCombination {
  id: string;
  formula: string;
  purpose: 'dead_only' | 'gravity' | 'wind' | 'seismic' | 'wind_uplift' | 'seismic_overturning';
}

export interface CodeReferences {
  loadCombinations: string;
  phiFactors: string;
  stressBlock: string;
  minReinforcement: string;
  shearDesign: string;
  stirrupSpacing: string;
  punchingShear: string;
  deflection: string;
  cover: string;
  developmentLength: string;
}

export interface DesignWarning {
  id: string;
  condition: string;
  message: string;
  severity: 'warning' | 'critical';
}

// Extend BuildingCodeConfig
export interface BuildingCodeConfig {
  // ... existing fields ...
  loadCombinations: LoadCombination[];
  codeReferences: CodeReferences;
  designWarnings: DesignWarning[];
}
```

### Edge Function Prompt Generation

The edge function will receive the building code ID and dynamically build the system prompt with all technical details specific to that code.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/buildingCodes/types.ts` | Add new interfaces for load combinations, references, warnings |
| `src/lib/buildingCodes/aci-318-25.ts` | Add full load combinations, code references, design warnings |
| `src/lib/buildingCodes/csa-a23-3-24.ts` | Add CSA-specific combinations, references, warnings |
| `src/lib/buildingCodes/calculator.ts` | Add size effect, development length, shear depth, warning checker functions |
| `src/lib/buildingCodes/index.ts` | Export new functions and types |
| `src/contexts/EngineeringSessionContext.tsx` | Expand AIContext with full code details |
| `supabase/functions/engineering-ai-chat/index.ts` | Dynamic prompt generation with full code knowledge |

---

## Expected Outcome

After implementation:

1. **AI will cite specific code sections**: "Per ACI 318-25 Table 21.2.1, φ = 0.90 for flexure..."

2. **AI will show step-by-step calculations**:
   ```
   Factored moment:
   Mu = 1.2D + 1.6L
   Mu = 1.2(20 kNm) + 1.6(30 kNm) = 72 kNm
   
   Required nominal moment (per Table 21.2.1):
   φMn ≥ Mu
   0.90 × Mn ≥ 72
   Mn ≥ 80 kNm
   ```

3. **AI will warn about failures**:
   "⚠️ DESIGN FAILS shear check - Vu (150 kN) > φVc (120 kN) - Must provide stirrups"

4. **AI will compare codes when asked**:
   "CSA uses φc = 0.65 (vs ACI φ = 0.90), requiring ~38% more steel!"

5. **AI will remind about professional review**:
   "Professional engineer review required for final design."

---

## Testing Checklist

- [ ] Load combinations display correctly for both ACI and CSA
- [ ] Code references appear in AI responses
- [ ] Size effect factor calculated correctly for deep members
- [ ] Development length calculations match handbook values
- [ ] Design warnings trigger at correct thresholds
- [ ] AI cites specific code sections in responses
- [ ] Code comparison works when user asks

