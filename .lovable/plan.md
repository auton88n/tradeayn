

# Stop All Eye Animations When History Toggles

## Problem
The eye still animates (fades out, moves) when the history panel opens/closes, causing a visible "jump." The user wants the eye to stay completely still -- the history card will simply cover it naturally.

## Solution
Remove ALL `transcriptOpen`-related logic from the eye's `motion.div`. The eye stays at its current position/opacity/scale regardless of history state. The history panel renders on top and covers the eye visually.

## Changes (CenterStageLayout.tsx only)

### 1. Remove `transcriptOpen` from animate block (lines 742-753)
- Remove the `opacity: transcriptOpen ? 0 : 1` line -- eye always stays at opacity 1
- Remove `!transcriptOpen &&` guards from `scale`, `marginBottom`, and `y` -- these should only depend on `hasVisibleResponses` / `isTransitioningToChat`
- Remove the separate `opacity` transition config since opacity won't animate

### 2. Remove `transcriptOpen` from pointerEvents (line 740)
- Remove `style={{ pointerEvents: transcriptOpen ? 'none' : 'auto' }}` -- the history card covers the eye so clicks won't reach it anyway

The eye will simply sit in place. When history opens, the card renders over it. When history closes, the eye is already there -- no fade, no jump, no animation.

