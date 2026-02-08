
# Add Disclaimer Field to All Calculators

## Overview

Add a legal disclaimer string to every calculator's return object and display it as an amber warning banner in the results panel.

## Part 1: Add `disclaimer` field to 5 return objects in `src/lib/engineeringCalculations.ts`

Add this field to each function's return object:

```typescript
disclaimer: 'Preliminary estimate for initial sizing only. All structural designs must be reviewed and verified by a licensed Professional Engineer (P.Eng / PE) using approved design software before construction or permit submission.',
```

**Locations:**
- `calculateBeam()` return (around line 160)
- `calculateSlab()` return (around line 414)
- `calculateColumn()` return (around line 577)
- `calculateFoundation()` return (around line 815)
- `calculateRetainingWall()` return (around line 989)

## Part 2: Display disclaimer banner in `DetailedResultsPanel.tsx`

Since all five calculators render through the single `DetailedResultsPanel` component, the banner only needs to be added once -- replacing the existing plain-text disclaimer at line 180.

**Current (line 179-182):**
```tsx
{/* Disclaimer */}
<p className="text-xs text-muted-foreground mt-4 text-center">
  Results require verification by a licensed Professional Engineer (PE/P.Eng)
</p>
```

**Replaced with:**
```tsx
{/* Disclaimer */}
{outputs.disclaimer && (
  <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3 mt-4">
    <p className="text-amber-200/80 text-xs flex items-start gap-2">
      <span className="text-amber-400 mt-0.5">⚠️</span>
      {outputs.disclaimer}
    </p>
  </div>
)}
```

This upgrades the existing subtle text into a visible amber warning banner with a warning icon, positioned at the bottom of the results section (same location, better visibility).

## Files Modified

- `src/lib/engineeringCalculations.ts` -- add `disclaimer` field to 5 return objects
- `src/components/engineering/results/DetailedResultsPanel.tsx` -- replace plain text disclaimer with amber banner
