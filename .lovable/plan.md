

# Bring Cards Closer to the Eye

## Summary
This plan reduces the distance of the floating response cards from the central eye in the Hero section, creating a tighter, more cohesive visual grouping.

## Current vs Proposed Positions

### Desktop (large screens)
```text
Current:
  topLeft:     { x: -220, y: -130 }
  middleLeft:  { x: -270, y: 0 }
  bottomLeft:  { x: -220, y: 130 }
  topRight:    { x: 220, y: -130 }
  middleRight: { x: 270, y: 0 }
  bottomRight: { x: 220, y: 130 }

Proposed (approx 30% closer):
  topLeft:     { x: -160, y: -100 }
  middleLeft:  { x: -190, y: 0 }
  bottomLeft:  { x: -160, y: 100 }
  topRight:    { x: 160, y: -100 }
  middleRight: { x: 190, y: 0 }
  bottomRight: { x: 160, y: 100 }
```

### Mobile (small screens)
```text
Current:
  topLeft:     { x: -20, y: -85 }
  middleLeft:  { x: 0, y: -95 }
  bottomLeft:  { x: 20, y: -85 }
  topRight:    { x: -20, y: 85 }
  middleRight: { x: 0, y: 95 }
  bottomRight: { x: 20, y: 85 }

Proposed (slightly closer):
  topLeft:     { x: -15, y: -70 }
  middleLeft:  { x: 0, y: -80 }
  bottomLeft:  { x: 15, y: -70 }
  topRight:    { x: -15, y: 70 }
  middleRight: { x: 0, y: 80 }
  bottomRight: { x: 15, y: 70 }
```

## File to Modify

| File | Changes |
|------|---------|
| `src/components/landing/Hero.tsx` | Update `getCardPositions()` function with reduced offset values |

## Visual Effect
The cards will appear approximately 30% closer to the central eye on desktop, creating a tighter "orbit" around the brain icon while still maintaining clear visual separation.

