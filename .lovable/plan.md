
# Fix 3D Visualization Labels Appearing Mirrored/Reversed

## Problem

The dimension labels in the foundation (and other) 3D visualizations show mirrored/reversed text like:
- "m 0e.S" instead of "2.90 m"
- "mm.08ε" instead of "300 mm"

This happens because the labels are positioned at fixed coordinates in 3D space. When the camera auto-rotates around the model, you view the text from behind, making it appear reversed.

## Solution

Use the `Billboard` component from `@react-three/drei` to wrap each dimension label. This makes labels always face the camera regardless of viewing angle.

---

## Technical Details

The `Billboard` component from drei automatically rotates its children to face the camera. We'll wrap the `Text` component inside a `Billboard` to ensure labels are always readable.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/engineering/FoundationVisualization3D.tsx` | Wrap DimensionLabel content in Billboard |
| `src/components/engineering/ColumnVisualization3D.tsx` | Wrap DimensionLabel content in Billboard |
| `src/components/engineering/RetainingWallVisualization3D.tsx` | Wrap DimensionLabel content in Billboard |

---

### Implementation

**Update the DimensionLabel component in each file:**

```typescript
// Import Billboard from drei
import { OrbitControls, PerspectiveCamera, Text, Billboard } from '@react-three/drei';

// Update DimensionLabel component
const DimensionLabel: React.FC<{
  position: [number, number, number];
  text: string;
}> = ({ position, text }) => (
  <Billboard position={position} follow={true}>
    <Text
      fontSize={0.18}
      color="#22c55e"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.01}
      outlineColor="#000000"
    >
      {text}
    </Text>
  </Billboard>
);
```

Key changes:
1. Import `Billboard` from `@react-three/drei`
2. Wrap the `Text` inside a `Billboard` component
3. Move the `position` prop to the `Billboard` (the parent)
4. Remove the `rotation` prop since Billboard handles orientation automatically

---

## Expected Result

| Before | After |
|--------|-------|
| Text appears mirrored from certain camera angles | Text always faces the camera and reads correctly |
| "m 0e.S" when viewing from behind | "2.90 m" from all angles |
| Labels hard to read during auto-rotation | Labels always readable |
