
# Fix: Eliminate History Panel Open/Close Delay

## Problem
The `scaleY` animation causes a visible two-step effect: the card container appears first (borders, background), then the text content pops in. This looks laggy and broken.

## Solution
Replace the `scaleY` animation with a simple, instant `opacity` fade. No height or scale animation at all -- the panel just appears and disappears cleanly. This eliminates the "card first, then text" staggered look.

## Changes (ChatInput.tsx only)

### Remove scaleY, use opacity only
In the history panel's `motion.div` (around line 436-448):
- Remove `scaleY: 0` from `initial` and `exit`
- Remove `scaleY: 1` from `animate`
- Keep only `opacity: 0 -> 1 -> 0` with a fast 0.1s duration
- Remove `origin-bottom` and `will-change-transform` classes since there's no scale transform
- Add `will-change-opacity` if needed

The panel will simply fade in/out instantly with no geometric distortion, so the card and text appear together at the same time.
