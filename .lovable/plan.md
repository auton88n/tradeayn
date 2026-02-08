
# Hide Eye Behind History Panel

## Problem
When the history panel opens, the eye shrinks and repositions awkwardly, making the app feel laggy. The eye serves no purpose while history is open.

## Solution
Instead of scaling/repositioning the eye, simply hide it (opacity 0, pointer-events none) when the history panel is open. When the user closes history, the eye fades back in at full size. No more resize jitter.

## Changes (CenterStageLayout.tsx only)

### 1. Replace scale/position animation with opacity
On the eye's `motion.div` (line ~733-751), change the animate block:
- Remove `scale`, `marginBottom`, and `y` shifts when `transcriptOpen` is true
- Instead, animate `opacity` to 0 and add `pointer-events: none` when history is open
- Keep the existing behavior for `hasVisibleResponses` (response cards still need the eye visible but smaller)

The logic becomes:
- **History open**: eye fades out (opacity 0), no interaction
- **Response card visible (no history)**: eye shrinks as before
- **Idle**: eye at full size, normal position

### 2. Simplify the conditional classes
Remove `transcriptOpen` from the scale/position/padding conditions since the eye will simply be hidden in that state.

This eliminates the jarring shrink animation when toggling history and gives a cleaner, snappier feel.
