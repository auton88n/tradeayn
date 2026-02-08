

# Fix: History Card Fitting, Reply Button, and Flying Bubble Targeting

## Problems (from screenshot)

1. **History card content overflows** -- The card has `max-h-[50vh]` but the inner content area lacks a proper height constraint, causing text to clip or extend beyond the card boundary. The `min-h-[200px]` on the history container also fights with the available space.

2. **No "Reply" button at the bottom of the history card** -- The history view has no footer/action bar. The normal response card has a Copy/Feedback bar, but history mode skips it entirely.

3. **Flying bubble doesn't target the eye center** -- When the eye is shrunk (because the response card or history is visible), `getEyePosition()` reads the shrunken bounding rect. The bubble should always fly to the visual center of the eye, which requires reading the eye position before the response card appears (or targeting the eye element specifically).

## Changes

### 1. Fix History Card Fitting
**File: `src/components/eye/ResponseCard.tsx`**

- Change the history container (line 368) from `max-h-[50vh] sm:max-h-[60vh] min-h-[200px]` to `flex-1 min-h-0` so it fills the available card space without overflowing.
- Add `max-h-[50vh] sm:max-h-[60vh]` to the outer card `motion.div` (line 298) in history mode so the entire card is height-constrained, not just the inner scroll area.
- Ensure `overflow-hidden` on the card and `overflow-y-auto` on the scroll container work together properly.

### 2. Add Reply Button to History Card Footer
**File: `src/components/eye/ResponseCard.tsx`**

- Add a footer bar below the history scroll area (after line 427, inside the `transcriptOpen` branch).
- The footer will contain a "Reply" button styled consistently with the existing action bar (Copy/Feedback bar in normal mode).
- Clicking "Reply" will call `onHistoryClose?.()` to close history and focus the input -- this matches the existing reply-quoting pattern.
- Structure:
  ```text
  <div className="flex-shrink-0 px-3 py-2 border-t border-border/40">
    <button onClick={onHistoryClose}>
      <CornerDownLeft /> Reply
    </button>
  </div>
  ```

### 3. Fix Flying Bubble to Target Eye Center
**File: `src/components/dashboard/CenterStageLayout.tsx`**

- In `getEyePosition()` (line 369), the eye ref already points to the motion container that gets scaled down. When the eye is at `scale: 0.5`, `getBoundingClientRect()` returns the shrunken rect, so the center is correct for the visual position. However, during the send flow the eye hasn't shrunk yet at the moment `getEyePosition` is called (it's called in the animation delay).
- The issue is that when history is open, the eye is already shrunk and offset (`y: -20`). After closing history (`onTranscriptToggle`), the eye starts transitioning back to full size, so the position read is mid-transition.
- Fix: Capture the eye's natural center (viewport center) as the target when the eye is in shrunken state, by computing the center from the `eyeStageRef` (the stable parent) instead of the shrunken `eyeRef`.
- Update `getEyePosition` to prefer `eyeStageRef` center when the eye is currently shrunk (i.e., when `hasVisibleResponses || transcriptOpen`), so the bubble always flies to the visual center of the stage where the eye lives.

## Summary
- **1 file modified**: `src/components/eye/ResponseCard.tsx` -- fix card height constraints + add Reply footer
- **1 file modified**: `src/components/dashboard/CenterStageLayout.tsx` -- fix eye position targeting for flying bubble

