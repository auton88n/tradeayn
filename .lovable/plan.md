

# Fix History Panel Lag -- Final Performance Pass

## What You'll Notice

- Opening the history panel: instant, no stutter
- Old messages: appear immediately, no fade-in animations
- Eye scaling: smooth single curve, no bounce/jerk
- Typing and sending: snappy, like a normal chat app
- The three-dot typing indicator and streaming text are already working from the previous change

## Changes

### 1. Stop old messages from animating (ChatInput.tsx)

Currently every `TranscriptMessage` plays a fade+slide animation when the panel opens. For 10+ messages, that's 10 simultaneous Framer Motion calculations.

Fix: Pass `shouldAnimate={false}` to all messages except truly new ones (messages that arrive while the panel is already open). Use a ref to track which messages existed when the panel opened.

### 2. Replace maxHeight animation with transform-based approach (ChatInput.tsx)

The history panel currently animates `maxHeight: 0 -> 500`. This triggers layout recalculation on every single frame (the browser reflows everything below it).

Fix: Switch to `opacity` + `scaleY` with `transform-origin: bottom`. These are GPU-composited properties -- zero layout cost. Keep `overflow-hidden` for clipping.

### 3. Remove expensive backdrop-blur (ChatInput.tsx)

The main container uses `backdrop-blur-xl` which forces GPU recompositing on every overlapping animation frame. Since the background is already 95% opaque (`bg-background/95`), the blur is barely visible.

Fix: Remove `backdrop-blur-xl` entirely, or reduce to `backdrop-blur-sm`.

### 4. Replace transition-all with specific properties (ChatInput.tsx)

The outer wrapper and main container both use `transition-all duration-300`, which animates every CSS property on every change (padding, borders, shadows, height, everything).

Fix: Only transition the specific properties that actually change:
- Outer div: `transition-[padding]`
- Main container: `transition-[border-color,box-shadow]`

### 5. Stagger eye transition (CenterStageLayout.tsx)

The eye scales from 1 to 0.5 at the same time the panel expands -- both compete for GPU time.

Fix: Add a 50ms delay to the eye's tween transition so the panel opens first, then the eye adjusts.

## Files to Change

| File | Change |
|------|--------|
| ChatInput.tsx | shouldAnimate=false for old messages; scaleY panel transition; remove backdrop-blur-xl; specific CSS transitions |
| CenterStageLayout.tsx | Add 50ms delay to eye transition when transcriptOpen changes |

## Technical Detail

```text
Before (opening history panel):
  Frame 1-18:
    maxHeight 0->500px       (layout recalc every frame)
    + eye scale 1->0.5       (compositor)
    + 10x message fade+slide (10 Framer Motion instances)
    + backdrop-blur-xl       (GPU recomposite)
    + transition-all          (animating ~8 properties)
  Result: ~15-20ms per frame, drops to 30-40fps

After:
  Frame 1-5:
    scaleY 0->1 + opacity    (compositor only)
    messages appear instantly (no animation)
    no backdrop-blur
  Frame 5-12:
    eye scale 1->0.5         (compositor, starts 50ms later)
  Result: ~3-4ms per frame, solid 60fps
```

