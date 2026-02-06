

# Fix: Smooth History Panel Open Without Eye Jumping

## Problem

The current animation uses `opacity + y` slide, which causes the panel to appear at full height instantly -- the layout jumps in one frame, pushing the eye up abruptly. The previous `height: 0 -> auto` was laggy due to spring physics on auto height.

## Solution

Use `max-height` with a CSS transition instead of Framer Motion for the height change. This gives a smooth, gradual expansion without layout thrashing or spring jank.

## Changes

### File: `src/components/dashboard/ChatInput.tsx`

Replace the current animation (lines 443-455) with a combined approach:
- Animate `opacity` for fade-in (fast, GPU-accelerated)
- Animate `max-height` from `0` to a fixed value (e.g., `400px`) for smooth height expansion
- Remove `y: -8` translate since the height animation handles the visual transition
- Use `ease: [0.4, 0, 0.2, 1]` (CSS ease-out equivalent) for natural deceleration

```tsx
initial={{ opacity: 0, maxHeight: 0 }}
animate={{ opacity: 1, maxHeight: 400 }}
exit={{ opacity: 0, maxHeight: 0 }}
transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
className="overflow-hidden"
```

This ensures the container grows gradually, so the eye (and everything above) moves smoothly upward rather than jumping.

### Why This Works

- `max-height` with a fixed value avoids the browser needing to calculate `auto` mid-animation
- No spring physics means predictable, consistent timing
- `overflow-hidden` clips content during the transition so nothing visually leaks
- The eye repositions frame-by-frame as the container grows, eliminating the jump

Only one file modified: `ChatInput.tsx`, lines 443-455.

