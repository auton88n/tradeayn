## ✅ COMPLETED: Save to Portfolio Dialog Data Fix

### Summary
Fixed the Save to Portfolio dialog not receiving calculator data by adding `onInputChange` prop synchronization to all calculators.

### Files Modified
- `src/components/engineering/BeamCalculator.tsx` - Added `onInputChange` prop + useEffect sync
- `src/components/engineering/FoundationCalculator.tsx` - Added `onInputChange` prop + useEffect sync
- `src/components/engineering/SlabCalculator.tsx` - Added `onInputChange` prop + useEffect sync
- `src/components/engineering/RetainingWallCalculator.tsx` - Added `onInputChange` prop + useEffect sync

### Technical Changes
1. Added `onInputChange?: (inputs: Record<string, any>) => void` to props interface
2. Destructured `onInputChange` from props
3. Added `useEffect` that syncs parsed form data to parent on mount and on every change

### Result
- Dialog now shows actual input values (span, loads, dimensions)
- Portfolio saves complete calculation data
- Pattern matches existing ColumnCalculator implementation
