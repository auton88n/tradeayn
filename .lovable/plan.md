

# Fix: Eye Moving Up + Reduce History Card Height

## Problem
1. The eye has a default `y: -40` offset, causing it to shift upward visually even when idle. This makes it look like it "jumps" when the history card opens.
2. The history card at `max-h-[60vh]` is too tall.

## Changes

### 1. CenterStageLayout.tsx -- Remove the upward offset
On line 744, the eye's default `y` value is `-40`, which pushes it up unnecessarily. Change it to `0` so the eye stays in its natural position and doesn't appear to move when the history card opens over it.

- Before: `y: (hasVisibleResponses || isTransitioningToChat) ? -20 : -40`
- After: `y: (hasVisibleResponses || isTransitioningToChat) ? -20 : 0`

### 2. ChatInput.tsx -- Reduce history card height
On line 466, reduce the max height from `max-h-[60vh]` to `max-h-[340px]` to make the history card shorter and more compact.

- Before: `max-h-[60vh]`
- After: `max-h-[340px]`

