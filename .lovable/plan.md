
# Fix: Pin Eye at Top While Messages Scroll Below

## Problem

The eye, ResponseCard, and content are all inside the same scrollable `div`. When AYN's response is long, the entire container scrolls and the eye disappears off the top of the viewport.

## Solution

Restructure the eye stage area so the eye is `sticky` at the top of the scrollable container, while the ResponseCard scrolls independently below it.

## Changes

### CenterStageLayout.tsx

**1. Make the eye container `sticky` when responses are visible**

The `eyeStageRef` div (line 713) currently wraps both the eye and the ResponseCard in a single flex column. We need to split this into two parts:

- The eye wrapper gets `sticky top-0 z-40` with a background so messages don't bleed through
- The ResponseCard stays in the normal document flow below the sticky eye

Specifically:

- Move the eye `motion.div` (lines 733-765) OUT of the inner `motion.div` layout wrapper (lines 723-792)
- Wrap it in its own `div` with `sticky top-0 z-40 bg-background` and center alignment
- Keep the ResponseCard `motion.div` (lines 768-790) in the normal flow below, so it scrolls naturally
- The `eyeStageRef` container keeps `flex-1 flex flex-col` but now the eye sticks at the top while the ResponseCard content scrolls underneath

**2. Add proper spacing**

- Add top padding on the ResponseCard area so it doesn't overlap with the sticky eye
- The sticky eye container gets a subtle bottom fade/gradient so the transition looks clean as content scrolls behind it

**3. Keep existing behavior when no responses**

- When there are no visible responses (`!hasVisibleResponses && !transcriptOpen`), the eye stays centered via `justify-center` as it does now
- The sticky behavior only activates when there's content that could push the eye off-screen

## Visual Result

```text
Before (long response):
  +------------------+
  | [eye] (scrolled  |  <-- eye scrolls away
  |  off screen)     |
  | ...long text...  |
  | ...more text...  |  <-- user sees only text
  +------------------+

After (long response):
  +------------------+
  | [eye] (sticky)   |  <-- eye always visible
  |------------------|
  | ...long text...  |
  | ...more text...  |  <-- content scrolls below eye
  | ...more text...  |
  +------------------+
```

## File to Change

| File | Change |
|------|--------|
| CenterStageLayout.tsx | Split eye into sticky container; keep ResponseCard in scroll flow; add bg-background to prevent bleed-through |
