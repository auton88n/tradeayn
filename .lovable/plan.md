
# Fix Column Results Display and M-N Interaction Diagram Issues

## Summary

Two related issues need to be fixed in the Column calculator results display:
1. **Dimensions showing "0 × 0 mm"** - The inputs aren't being correctly passed or read in the results panel
2. **M-N Interaction Diagram not visible** - A YAxis dataKey mismatch is preventing proper chart rendering

---

## Issue 1: Column Dimensions Display Bug

### Root Cause
In `ColumnResultsSection.tsx`, the code tries to read dimensions from `inputs.columnWidth` but the values may not be present when the panel renders. The issue is a data synchronization problem between:
- The calculation result's `inputs` object
- The workspace's `currentInputs` state

When `DetailedResultsPanel` renders, it receives `inputs` from `currentInputs` state, but this might be empty or stale if the calculator's `onInputChange` prop wasn't called before the calculation completed.

### Solution
Update `ColumnResultsSection.tsx` to also check the calculation outputs for dimension values. The `calculateColumn()` function receives these values but doesn't return them in outputs. We have two options:

**Option A (Quick fix):** In `ColumnResultsSection.tsx`, add additional fallback checks to extract dimensions from any available source including the `outputs` object's derived values like `grossArea`.

**Option B (Proper fix):** Ensure the Column calculator syncs its inputs to the workspace before calculation completes. This is already done via `onInputChange`, but we should also include dimensions in the outputs from `calculateColumn()`.

**Recommended: Option B** - Add `width` and `depth` to the calculation outputs so they're always available.

### Files to Modify
| File | Change |
|------|--------|
| `src/lib/engineeringCalculations.ts` | Add `width` and `depth` to column calculation return object |
| `src/components/engineering/results/ColumnResultsSection.tsx` | Simplify dimension extraction since values will be in outputs |

---

## Issue 2: M-N Interaction Diagram Not Rendering

### Root Cause
In `InteractionDiagram.tsx`, there's a mismatch between axis configuration and data:

1. **YAxis Configuration**: Uses `dataKey="P"` (line 153)
2. **Chart Data**: Has property `curveP` (not `P`) from the data transformation (line 105)

For Recharts `ComposedChart` with `type="number"` axes, the YAxis `dataKey` should match the data property being plotted, OR the axes should not specify a dataKey and instead rely on the domain calculations.

### Solution
Remove `dataKey="P"` from the YAxis since it's a number-type axis and the data doesn't have a `P` property (it has `curveP`). The Line component already correctly uses `dataKey="curveP"`.

### Files to Modify
| File | Change |
|------|--------|
| `src/components/engineering/results/InteractionDiagram.tsx` | Remove `dataKey` from YAxis, keep domain calculation |

---

## Implementation Steps

### Step 1: Fix Column Outputs
**File:** `src/lib/engineeringCalculations.ts`

Add the input dimensions to the return object (around line 554-590):
```typescript
return {
  // Add these new properties:
  width: b,      // Column width in mm
  depth: h,      // Column depth in mm
  height: columnHeight,  // Column height in mm
  
  // ... existing properties
  grossArea: Ac,
  // ...
};
```

### Step 2: Fix Interaction Diagram YAxis
**File:** `src/components/engineering/results/InteractionDiagram.tsx`

Update the YAxis to remove the incorrect dataKey:
```typescript
<YAxis
  type="number"
  name="Axial"
  domain={[0, maxP]}
  tickFormatter={(v) => v.toFixed(0)}
  // ... keep other props
/>
```

### Step 3: Simplify ColumnResultsSection
**File:** `src/components/engineering/results/ColumnResultsSection.tsx`

Update dimension extraction to prioritize outputs:
```typescript
const width = Number(outputs.width) || Number(inputs.columnWidth) || Number(inputs.width) || 0;
const depth = Number(outputs.depth) || Number(inputs.columnDepth) || Number(inputs.depth) || 0;
const height = Number(outputs.height) || Number(inputs.columnHeight) || Number(inputs.height) || 0;
```

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Column Dimensions | Shows "0 × 0 mm" | Shows actual values like "400 × 400 mm" |
| M-N Diagram | Not visible / blank chart | Capacity curve displays with dots and applied load star |
| Adequacy Status | Not shown | Green/red status indicator visible |

---

## Testing Checklist
- [ ] Run a Column calculation with default values (400×400 mm)
- [ ] Verify dimensions display correctly in results panel
- [ ] Verify M-N Interaction Diagram shows the capacity envelope curve
- [ ] Verify the applied load point (star marker) appears on the diagram
- [ ] Verify the ADEQUATE/INADEQUATE status message displays below the diagram
- [ ] Test with different column sizes to confirm dynamic updates
