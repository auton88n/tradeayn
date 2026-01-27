
# Complete AYNN Fix Plan - Critical, High, and Medium Priority Issues

## Executive Summary

This plan addresses 14 identified issues across the AYNN platform, organized by priority. The fixes span engineering calculators, chat functionality, authentication, form validation, and accessibility improvements.

---

## CRITICAL PRIORITY FIXES

### 1. CSA Resistance Factor Bug (Code Safety Issue)

**Problem**: Engineering calculators show identical reinforcement for both ACI and CSA codes, but CSA requires more steel due to lower resistance factors.

**Current State Analysis**:
- Building code configuration exists in `src/lib/buildingCodes/csa-a23-3-24.ts` with correct φc = 0.65
- However, `src/lib/engineeringCalculations.ts` uses hardcoded formulas without building code parameters
- Line 56: `const factoredLoad = 1.4 * deadLoad + 1.6 * liveLoad` - ACI factors only
- Line 73: `const Ast = Mu / (0.87 * fy * 0.9 * d)` - No resistance factor applied

**Files to Modify**:
- `src/lib/engineeringCalculations.ts` (beam, slab, column, foundation, retaining wall functions)
- `src/components/engineering/BeamCalculator.tsx` (pass building code to calculation)
- Similar updates to all 5 calculator components

**Implementation**:
```typescript
// Add buildingCode parameter to all calculate functions
export function calculateBeam(inputs: BeamInputs, buildingCode: 'ACI' | 'CSA' = 'ACI'): BeamOutputs {
  // Use code-specific factors
  const loadFactors = buildingCode === 'CSA' 
    ? { dead: 1.25, live: 1.5 }  // CSA
    : { dead: 1.2, live: 1.6 };  // ACI
    
  const resistanceFactor = buildingCode === 'CSA' ? 0.65 : 0.90;
  
  const factoredLoad = loadFactors.dead * deadLoad + loadFactors.live * liveLoad;
  const Ast = Mu / (resistanceFactor * 0.87 * fy * 0.9 * d);
  // ... rest of calculation
}
```

---

### 2. Form Validation - Accepts Invalid Values

**Problem**: Calculator forms accept negative, zero, and impossibly large values without error messages.

**Current State Analysis**:
- `BeamCalculator.tsx` has minimal validation (lines 75-86)
- Uses `min="0"` HTML attribute but no real enforcement or error display
- No maximum value checks for engineering reality

**Files to Modify**:
- `src/components/engineering/BeamCalculator.tsx`
- `src/components/engineering/ColumnCalculator.tsx`
- `src/components/engineering/SlabCalculator.tsx`
- `src/components/engineering/FoundationCalculator.tsx`
- `src/components/engineering/RetainingWallCalculator.tsx`

**Implementation**:
```typescript
// Add validation state
const [errors, setErrors] = useState<Record<string, string>>({});

// Add validation function
const validateInput = (field: string, value: number): string | null => {
  const rules: Record<string, { min: number; max: number; unit: string }> = {
    span: { min: 0.5, max: 50, unit: 'm' },
    beamWidth: { min: 150, max: 2000, unit: 'mm' },
    deadLoad: { min: 0.1, max: 500, unit: 'kN/m' },
    liveLoad: { min: 0, max: 500, unit: 'kN/m' },
  };
  
  const rule = rules[field];
  if (!rule) return null;
  
  if (value < rule.min) return `Must be at least ${rule.min} ${rule.unit}`;
  if (value > rule.max) return `Cannot exceed ${rule.max} ${rule.unit}`;
  return null;
};

// Display inline errors under each input
{errors.span && <p className="text-red-500 text-xs mt-1">{errors.span}</p>}
```

---

### 3. Chat Messages Not Displaying

**Problem**: Messages don't appear in the chat interface after sending.

**Current State Analysis**:
- `useMessages.ts` correctly adds messages to state (lines 288-291)
- Messages are loaded from database on session change (lines 140-193)
- Streaming works correctly with progressive content updates

**Investigation Required**:
The code appears correct. This may be a rendering issue in:
- `DashboardContainer.tsx` - how messages are passed to display component
- `CenterStageLayout.tsx` - message rendering logic

**Files to Check/Modify**:
- `src/components/dashboard/DashboardContainer.tsx`
- `src/components/dashboard/CenterStageLayout.tsx`
- Verify message state is being passed correctly through component hierarchy

---

### 4. Reset Button Not Working

**Problem**: Reset button doesn't clear calculator form values.

**Current State Analysis**:
- `EngineeringWorkspace.tsx` has `handleReset` (lines 162-166) that clears context state
- But individual calculators like `BeamCalculator.tsx` maintain their own `formData` state (line 53)
- The reset function only clears context, not the local form state

**Files to Modify**:
- `src/components/engineering/workspace/EngineeringWorkspace.tsx`
- All 5 calculator components

**Implementation**:
Option A - Lift state to parent (preferred):
```typescript
// Pass reset callback to calculators
<BeamCalculator 
  {...commonProps} 
  onReset={() => setFormData(defaultFormData)}
/>
```

Option B - Add ref-based reset:
```typescript
// In calculator
useImperativeHandle(ref, () => ({
  reset: () => setFormData(defaultFormData)
}));
```

---

## HIGH PRIORITY FIXES

### 5. Hardcoded "Calculation Method" Messages

**Problem**: Info box shows "Uses ACI 318 / Eurocode 2 methods with load factors: 1.4 DL + 1.6 LL" regardless of selected code.

**Location**: `BeamCalculator.tsx` lines 286-290

**Files to Modify**:
- All 5 calculator components (same pattern)

**Implementation**:
```typescript
// Get building code from context
const session = useEngineeringSessionOptional();
const buildingCode = session?.buildingCode || 'ACI';

// Dynamic info text
const codeInfo = buildingCode === 'CSA' ? {
  name: 'CSA A23.3-24 / NBCC 2020',
  factors: '1.25D + 1.5L',
  phi: 'φc = 0.65'
} : {
  name: 'ACI 318-25 / ASCE 7-22',
  factors: '1.2D + 1.6L',
  phi: 'φ = 0.90'
};

// In JSX
<p className="text-blue-600 dark:text-blue-400">
  Uses {codeInfo.name} with load factors: {codeInfo.factors}, {codeInfo.phi}.
  Results are for reference only.
</p>
```

---

### 6. Automatic Recalculation on Code Change

**Files to Modify**:
- `src/components/engineering/workspace/EngineeringWorkspace.tsx`

**Implementation**:
```typescript
// Watch for building code changes
useEffect(() => {
  if (session?.buildingCode && calculationResult) {
    // Show notification
    toast.info(`Design code changed to ${session.buildingCode === 'CSA' ? 'CSA A23.3-24' : 'ACI 318-25'}. Recalculating...`);
    
    // Trigger recalculation with current inputs
    if (selectedCalculator && currentInputs) {
      handleCalculationComplete(/* recalculate with new code */);
    }
  }
}, [session?.buildingCode]);
```

---

### 7. Code-Specific Info Panel

**Files to Modify**:
- `src/components/engineering/BuildingCodeSelector.tsx` - add expandable info

**Implementation**:
Add a collapsible panel below the dropdown showing:
- Load combinations (1.2D + 1.6L vs 1.25D + 1.5L)
- Resistance factors (φ = 0.90 vs φc = 0.65)
- Code section references

---

### 8. Design Validation Warnings

**Files to Create**:
- `src/lib/designValidation.ts`

**Files to Modify**:
- `src/components/engineering/CalculationResults.tsx`

**Implementation**:
```typescript
interface DesignWarning {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  codeRef?: string;
  action?: string;
}

export function validateBeamDesign(inputs, outputs, code): DesignWarning[] {
  const warnings: DesignWarning[] = [];
  
  // Check minimum reinforcement
  const minRho = code === 'CSA' ? 0.002 : 0.0018;
  const actualRho = outputs.requiredAs / (inputs.beamWidth * outputs.effectiveDepth);
  
  if (actualRho < minRho) {
    warnings.push({
      severity: 'critical',
      title: 'Brittle Failure Risk',
      message: `ρ = ${actualRho.toFixed(4)} < ρmin = ${minRho}`,
      codeRef: code === 'CSA' ? 'Clause 10.5' : 'Section 7.6.1.1',
      action: 'Increase steel to minimum required'
    });
  }
  
  // ... 5 more validation checks
  return warnings;
}
```

---

### 9. Code Section Citations in Results

**Files to Modify**:
- `src/components/engineering/CalculationResults.tsx`

**Implementation**:
Add a "Code References" section to results display:
```tsx
<div className="mt-4 p-3 bg-muted rounded-lg">
  <h4 className="text-sm font-semibold mb-2">Code References</h4>
  <ul className="text-xs text-muted-foreground space-y-1">
    <li>Load Factors: {code === 'CSA' ? 'NBCC 2020 Part 4' : 'ASCE 7-22 Section 2.3.2'}</li>
    <li>Resistance Factors: {code === 'CSA' ? 'CSA A23.3-24 Clause 8.4' : 'ACI 318-25 Table 21.2.1'}</li>
    <li>Minimum Reinforcement: {code === 'CSA' ? 'Clause 10.5' : 'Section 7.6.1.1'}</li>
  </ul>
</div>
```

---

## MEDIUM PRIORITY FIXES

### 10. Login Error Messages

**Current State**: Error handling exists in `AuthModal.tsx` (lines 232-241) - toast notifications ARE being shown.

**Verification Needed**: The code shows proper error handling. May need to test if toasts are visible or if there's a timing issue.

---

### 11. Broken Service Pages

**Current State**: All service routes ARE defined in `App.tsx` (lines 74-87).

**Analysis**: Routes exist for:
- `/services/ai-employee`
- `/services/content-creator-sites`
- `/services/ai-agents`
- `/services/automation`
- `/services/ticketing`
- `/services/civil-engineering`

There is NO `/services` index page - this is expected (individual service pages only).

---

### 12. Accessibility - DialogDescription

**Current State**: Many dialogs already have `DialogDescription` (found in 25 files).

**Files That Need Updating**:
Search showed some dialogs may be missing descriptions. Need to audit and add where missing.

---

### 13. Success Messages

**Files to Modify**:
- Contact forms in landing page
- Application forms in service pages

Add toast notifications after successful form submissions.

---

### 14. Security - Token Storage

**Current State**: Auth tokens in localStorage is the Supabase default behavior.

**Recommendation**: This is a known trade-off. HTTP-only cookies require server-side changes to Supabase configuration. Document as accepted risk for current MVP or plan for future enhancement.

---

## Implementation Order

1. **Sprint 1 (Critical)**:
   - CSA resistance factors in calculations
   - Form validation with error messages
   - Reset button functionality
   - Chat message display investigation

2. **Sprint 2 (High)**:
   - Dynamic calculation method info
   - Auto-recalculation on code change
   - Design validation warnings
   - Code citations in results

3. **Sprint 3 (Medium)**:
   - Accessibility audit
   - Success messages
   - Security improvements documentation

---

## Files Summary

| Priority | Files to Modify |
|----------|----------------|
| Critical | `src/lib/engineeringCalculations.ts`, 5 calculator components, `useMessages.ts`, `EngineeringWorkspace.tsx` |
| High | `BuildingCodeSelector.tsx`, `CalculationResults.tsx`, new `designValidation.ts` |
| Medium | Various dialog components, form handlers |

---

## Technical Notes

- The building code system is well-architected with `BuildingCodeConfig` types
- Resistance factors are correctly defined in code configurations
- The gap is that calculations don't USE the configuration - they have hardcoded ACI values
- Engineering session context properly tracks building code selection
- Fix requires passing `buildingCode` through the component/calculation pipeline
