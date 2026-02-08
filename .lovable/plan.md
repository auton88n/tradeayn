

# Fix: Eye Behavior During History Mode

## Problem
When the history card is open and the user sends a message, the eye skips several important visual reactions that normally happen during live chat:

- No blink on message send
- No absorption pulse animation
- No "message-absorb" sound effect  
- No absorption visual (the eye just goes straight to "thinking")

This makes the experience feel flat compared to the normal chat flow.

## What Already Works
- Eye gaze tracking (follows mouse) -- works in history mode
- Idle blinking -- works in history mode
- Emotion changes (thinking, calm, happy, etc.) -- works in history mode
- Eye shrink/grow -- works in history mode
- Response emotion and keyword excitement detection -- works in history mode

## Fix

### File: `src/components/dashboard/CenterStageLayout.tsx` (lines 448-456)

Currently, when `transcriptOpen` is true, the send handler skips all eye animation effects:

```text
// Current code (simplified):
if (transcriptOpen) {
  onRemoveFile();
  clearResponseBubbles();
  clearSuggestions();
  setIsResponding(true);
  requestAnimationFrame(() => orchestrateEmotionChange('thinking'));
  return;  // <-- skips blink, absorption, sound
}
```

Add the missing eye reactions so the eye behaves identically to live chat mode -- only the flying bubble animation is skipped (which makes sense since there's no visual bubble to fly):

```text
// Fixed code:
if (transcriptOpen) {
  onRemoveFile();
  clearResponseBubbles();
  clearSuggestions();
  triggerBlink();
  triggerAbsorption();
  playSound?.('message-absorb');
  setIsResponding(true);
  setIsAbsorbPulsing(true);
  setTimeout(() => setIsAbsorbPulsing(false), 300);
  completeAbsorption();
  requestAnimationFrame(() => orchestrateEmotionChange('thinking'));
  return;
}
```

## Summary
- **1 file modified**: `src/components/dashboard/CenterStageLayout.tsx`
- Adds `triggerBlink()`, `triggerAbsorption()`, `playSound()`, absorption pulse, and `completeAbsorption()` to the history-mode send path
- The only thing that remains skipped is the flying bubble animation (intentionally, since it's a visual-only effect for the non-history view)
- Eye will now blink, pulse, play sound, and animate identically whether history is open or closed

