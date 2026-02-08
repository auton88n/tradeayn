
# Fix: Eye Behind History Card + Taller Panel

## Problem
The eye sits at `z-40` which places it visually on top of the history card. The history card also isn't tall enough to fully cover the eye.

## Changes (2 files)

### 1. CenterStageLayout.tsx -- Lower eye z-index
On line 736, change `z-40` to `z-10` on the eye container. This ensures the history card (which is in a later DOM element with default stacking) renders on top of the eye naturally.

### 2. ChatInput.tsx -- Make history panel taller
On line 466, increase the max height of the messages area from `max-h-[340px]` to `max-h-[440px]`. This gives the history card enough height to fully cover the eye behind it.
