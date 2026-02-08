
# Fix: Close History Card on Message Send

## Problem
When the user sends a message while the history card is open, the history card stays visible. It should close automatically so the normal response card flow takes over -- just like how it works when history is closed (eye reacts, response card appears with the AI reply).

## Change

### File: `src/components/dashboard/CenterStageLayout.tsx` (line 449)

Add `onTranscriptToggle?.()` at the start of the `if (transcriptOpen)` block. This closes the history panel immediately when the user sends a message, so the response flows through the normal ResponseCard emission path.

Then **remove the early `return`** on line 461, so the code falls through to the normal flying bubble + response card animation path (since the history is now closed).

The updated block becomes:

```text
if (transcriptOpen) {
  onTranscriptToggle?.();   // Close history card
  // Fall through to normal send flow below (flying bubble, response card, etc.)
}
```

The eye reactions (`triggerBlink`, `triggerAbsorption`, `playSound`, etc.) that were added in the previous fix are no longer needed in this block since the normal flow already handles them.

## Result
- User sends message while history is open
- History card closes instantly
- Eye reacts normally (blink, absorb, pulse, sound)
- Flying bubble animation plays
- Response card appears with AI reply
- Identical behavior to sending without history open

## Summary
- **1 file modified**: `src/components/dashboard/CenterStageLayout.tsx`
- Replace the history-mode send block with a simple close + fall-through to the normal send path
