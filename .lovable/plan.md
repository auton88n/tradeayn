

# Lazy Load All Remaining Three.js 3D Components

## Problem

While `EngineeringWorkspace.tsx` already lazy-loads its 3D visualizations, three other files directly import 3D components, pulling the ~300KB Three.js bundle into their parent chunks and slowing initial load.

## Files That Need Changes

### 1. `src/components/engineering/CalculationResults.tsx` (lines 22-27)

Currently has 6 direct imports of 3D components. Replace all with `lazy()` imports and wrap their JSX usage in `<Suspense>` with a skeleton fallback.

```
// Before (direct imports)
import { BeamVisualization3D } from './BeamVisualization3D';
import { FoundationVisualization3D } from './FoundationVisualization3D';
import ColumnVisualization3D from './ColumnVisualization3D';
import SlabVisualization3D from './SlabVisualization3D';
import RetainingWallVisualization3D from './RetainingWallVisualization3D';
import { ParkingVisualization3D } from './ParkingVisualization3D';

// After (lazy imports)
const BeamVisualization3D = lazy(() => import('./BeamVisualization3D').then(m => ({ default: m.BeamVisualization3D })));
const FoundationVisualization3D = lazy(() => import('./FoundationVisualization3D').then(m => ({ default: m.FoundationVisualization3D })));
const ColumnVisualization3D = lazy(() => import('./ColumnVisualization3D'));
const SlabVisualization3D = lazy(() => import('./SlabVisualization3D'));
const RetainingWallVisualization3D = lazy(() => import('./RetainingWallVisualization3D'));
const ParkingVisualization3D = lazy(() => import('./ParkingVisualization3D').then(m => ({ default: m.ParkingVisualization3D })));
```

Add `lazy, Suspense` to the React import. Wrap each 3D component usage in `<Suspense>` with a placeholder fallback:
```tsx
<Suspense fallback={<div className="h-[300px] bg-muted rounded-lg animate-pulse" />}>
  <BeamVisualization3D ... />
</Suspense>
```

### 2. `src/components/engineering/ColumnCalculator.tsx` (line 10)

Replace the direct import with lazy:
```
// Before
import ColumnVisualization3D from './ColumnVisualization3D';

// After
const ColumnVisualization3D = lazy(() => import('./ColumnVisualization3D'));
```

Add `lazy, Suspense` to React import. Wrap usage in `<Suspense>`.

### 3. `src/components/engineering/ParkingDesigner.tsx` (line 23)

Replace the direct import with lazy:
```
// Before
import { ParkingVisualization3D } from './ParkingVisualization3D';

// After
const ParkingVisualization3D = lazy(() => import('./ParkingVisualization3D').then(m => ({ default: m.ParkingVisualization3D })));
```

Add `lazy, Suspense` to React import. Wrap usage in `<Suspense>`.

### 4. `src/pages/AIGradingDesigner.tsx` (line 10)

Replace the direct import with lazy:
```
// Before
import { TerrainVisualization3D } from '@/components/engineering/TerrainVisualization3D';

// After
const TerrainVisualization3D = lazy(() => import('@/components/engineering/TerrainVisualization3D').then(m => ({ default: m.TerrainVisualization3D })));
```

Add `lazy, Suspense` to React import. Wrap usage in `<Suspense>`.

## No Changes Needed

- `EmotionalEye` -- does NOT use Three.js (pure CSS/canvas), no change needed
- `EngineeringWorkspace.tsx` -- already uses `lazy()` for all 3D components
- `ParkingCar3D.tsx` -- only imported by ParkingVisualization3D (internal), not a parent-level concern

## Suspense Fallback

All fallbacks will use a consistent skeleton:
```tsx
<div className="h-[300px] bg-muted rounded-lg animate-pulse" />
```

This matches the typical 3D visualization container height and prevents layout shift.

## Impact

After this change, the Three.js vendor chunk (`vendor-3d`) will only load when a user actually opens an engineering calculator or visualization -- not on initial page load. This saves ~300KB on first load, especially beneficial for mobile users on slower networks.

