
# Fix M-N Interaction Diagram Display in Column Calculator

## Problem Analysis

The M-N Interaction Diagram is not displaying in the Column calculator results even though:
1. The `generateInteractionCurve` function exists and generates curve data
2. The `InteractionDiagram` component is properly imported
3. The conditional render checks `interactionCurve && interactionCurve.length > 0`

## Root Cause

After code analysis, I identified two issues:

### Issue 1: Recharts Data Binding Problem
The `ComposedChart` component is rendering but the chart appears empty because:
- The `Line` component uses `data={chartData}` with its own data array
- The `XAxis` and `YAxis` don't have `data` bound, so they default to empty domains
- The `Scatter` component uses a different data array (`appliedLoadData`)

When using independent data sources in Recharts, the axes need to be explicitly configured with calculated domains, which they are (`domain={[0, maxM]}`), but the issue is that the chart needs a base data array OR all components need to properly work with `type="number"` axes.

### Issue 2: Data Not Being Rendered to Axes
The Line component with `type="monotone"` and separate data array may not properly bind to the number-based axes without a reference dataset at the chart level.

---

## Solution

### Fix 1: Add Base Data Array to ComposedChart

Add a `data` prop directly to `ComposedChart` with all chart points (both curve and applied load) to ensure axes properly recognize the data ranges:

**File**: `src/components/engineering/results/InteractionDiagram.tsx`

```typescript
// Combine all data for chart reference
const allData = useMemo(() => {
  const curveData = chartData.map(point => ({
    M: point.M,
    curveP: point.P,
    type: point.type,
  }));
  // Add applied point separately so we can style it differently
  return curveData;
}, [chartData]);
```

Then update the ComposedChart:
```tsx
<ComposedChart
  data={allData}
  margin={{ top: 20, right: 30, bottom: 25, left: 15 }}
>
```

### Fix 2: Update Line and Scatter Rendering

Update the Line component to use the chart's data instead of a separate data array:
```tsx
<Line
  type="monotone"
  dataKey="curveP"
  stroke="hsl(var(--primary))"
  strokeWidth={2}
  dot={...}
  name="Capacity Envelope"
  isAnimationActive={false}
/>
```

For the applied load point, use a separate Scatter with its data array (which works correctly with number axes).

### Fix 3: Ensure interactionCurve is Always Returned

Add a fallback in `ColumnResultsSection` to always show the diagram (potentially with a "no data" message if curve is empty), and add debug logging in development to verify data flow.

---

## Implementation Plan

### Step 1: Update InteractionDiagram.tsx

| Change | Description |
|--------|-------------|
| Add `data` prop to `ComposedChart` | Bind the chart data directly to the ComposedChart component |
| Remove separate `data` array from `Line` | Let it use the parent chart's data |
| Keep `Scatter` with its own data | Applied load point renders separately |
| Fix axis tick formatting | Ensure proper number formatting |

### Step 2: Add Fallback Rendering

If `interactionCurve` is undefined or empty, show a placeholder message or debug indicator to help diagnose future issues.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/engineering/results/InteractionDiagram.tsx` | Fix Recharts data binding, add data to ComposedChart |
| `src/components/engineering/results/ColumnResultsSection.tsx` | Add fallback for empty interaction curve (optional debug) |

---

## Expected Result

| Before | After |
|--------|-------|
| M-N diagram not visible | Capacity envelope curve displays correctly |
| No load point plotted | Applied load star marker visible |
| No adequacy indication | Green/red status showing ADEQUATE/INADEQUATE |
