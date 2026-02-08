

# Fix: Eye Visible Above History Card

## Problem
The eye is still showing above the history card because the card doesn't grow tall enough to cover it. The chat input is fixed at the bottom (`z-30`) and the eye is at `z-10`, so stacking is correct -- the card just needs more height.

## Changes

### 1. ChatInput.tsx -- Increase max-height significantly
Change `max-h-[440px]` to `max-h-[60vh]` on the history messages scroll area (line 466). Using a viewport-relative unit ensures the card always grows tall enough to cover the eye regardless of screen size.

### 2. CenterStageLayout.tsx -- Lower eye z-index further
Change `z-10` to `z-0` on the eye container (line 736) to guarantee it sits behind everything, including the chat input's history panel which is inside the `z-30` fixed footer.

These two changes together ensure the history card is tall enough to cover the eye, and the eye's stacking order is definitively below the chat input area.

