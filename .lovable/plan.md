

# Dynamic Import of Heavy Libraries

## Summary

Convert top-level imports of `react-to-pdf` and `recharts` to dynamic imports so they only load when actually needed. Two libraries mentioned in the request (`html2canvas` and `react-day-picker`) are not imported anywhere in the codebase, so no changes are needed for those.

## Current State

| Library | Files with top-level import | Already dynamic? |
|---------|---------------------------|-------------------|
| `react-to-pdf` | `GradingResults.tsx`, `ParkingDesigner.tsx`, `EngineeringWorkspace.tsx`, `TestReportPDF.tsx` | `CalculationResults.tsx` already does it correctly |
| `recharts` | `ElevationProfile.tsx`, `InteractionDiagram.tsx` | No |
| `html2canvas` | None | N/A |
| `react-day-picker` | None | N/A |

## Changes

### 1. Dynamic import `react-to-pdf` in 4 files

These files all use `generatePDF` inside an async click handler, making dynamic import straightforward. Follow the pattern already established in `CalculationResults.tsx`:

```typescript
// Replace top-level: import generatePDF, { Margin } from 'react-to-pdf';
// With dynamic import inside the handler:
const handleExportPDF = async () => {
  const generatePDF = (await import('react-to-pdf')).default;
  const { Margin } = await import('react-to-pdf');
  // ... rest of existing logic unchanged
};
```

**Files:**
- `src/components/engineering/GradingResults.tsx` -- remove line 11 import, add dynamic import inside `handleExportPDF`
- `src/components/engineering/ParkingDesigner.tsx` -- remove line 31 import, add dynamic import inside the PDF export handler
- `src/components/engineering/workspace/EngineeringWorkspace.tsx` -- remove line 19 import, add dynamic import inside the PDF handler
- `src/components/admin/test-results/TestReportPDF.tsx` -- remove line 5 import, add dynamic import inside `handleGeneratePDF`

### 2. Lazy load recharts components via their parents

`ElevationProfile` and `InteractionDiagram` both use recharts at the top level. Rather than restructuring how recharts is imported within those components, lazy-load the components themselves from their parent files:

**`src/components/engineering/GradingResults.tsx`** -- already imports `ElevationProfile` directly. Replace with:
```typescript
const ElevationProfile = lazy(() => import('./ElevationProfile').then(m => ({ default: m.ElevationProfile })));
```
Wrap its usage in `<Suspense>` with a chart-height skeleton fallback.

**`src/components/engineering/results/ColumnResultsSection.tsx`** -- imports `InteractionDiagram` directly. Replace with:
```typescript
const InteractionDiagram = lazy(() => import('./InteractionDiagram').then(m => ({ default: m.InteractionDiagram })));
```
Wrap its usage in `<Suspense>` with a skeleton fallback.

### 3. No changes needed

- `CalculationResults.tsx` -- already dynamically imports `react-to-pdf`
- `html2canvas` -- not imported anywhere in the codebase
- `react-day-picker` -- not imported anywhere in the codebase
- `GradingPDFReport.tsx` -- has its own SVG-based `ElevationProfileSVG` (no recharts dependency)

## Files Changed

| File | Change |
|------|--------|
| `src/components/engineering/GradingResults.tsx` | Dynamic import `react-to-pdf`; lazy load `ElevationProfile` |
| `src/components/engineering/ParkingDesigner.tsx` | Dynamic import `react-to-pdf` |
| `src/components/engineering/workspace/EngineeringWorkspace.tsx` | Dynamic import `react-to-pdf` |
| `src/components/admin/test-results/TestReportPDF.tsx` | Dynamic import `react-to-pdf` |
| `src/components/engineering/results/ColumnResultsSection.tsx` | Lazy load `InteractionDiagram` |

## Impact

- `react-to-pdf` (~50KB) only loads when a user clicks an export/PDF button
- `recharts` (~200KB) only loads when a user views an elevation profile chart or interaction diagram
- No behavioral changes -- same functionality, just loaded on demand
