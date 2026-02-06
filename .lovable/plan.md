
# Improve Response Card Visual Design

## Problem

The AYN response card currently has a heavy, boxy appearance with:
- A thick visible border (`border border-border`) that creates a harsh frame
- A flat, utilitarian header bar with a visible bottom border
- No visual depth or softness -- looks like a system dialog rather than a chat bubble
- The speech bubble pointer arrow also has visible borders making it look mechanical

## Changes

### ResponseCard.tsx -- Soften the card design

**Outer card container (lines 301-313):**
- Replace `border border-border` with a much softer `border border-border/40` (reduce border opacity)
- Upgrade `shadow-sm` to `shadow-md shadow-black/5` for subtle depth that replaces the border as the visual boundary
- Add a slight backdrop blur for a glass-like feel on mobile

**Speech bubble pointer (line 330):**
- Match the softer border: `border-border/40` instead of `border-border`

**Header bar (line 334):**
- Remove the harsh `border-b border-border` bottom separator
- Replace with a subtle background tint: `bg-muted/30` so AYN label area is gently distinguished without a hard line

**Content area (lines 355-361):**
- Add slightly more generous padding: `[&>div]:px-4 [&>div]:py-3` instead of `px-3 py-2.5`

**Action bar (line 409):**
- Soften the top border: `border-t border-border/40` instead of `border-border`
- Reduce button visual weight: smaller icon sizes (16 instead of 18 for feedback buttons)

## Technical Details

### File: src/components/eye/ResponseCard.tsx

| Line Range | Change |
|------------|--------|
| 301-313 | Softer border (`border-border/40`), better shadow (`shadow-md shadow-black/5`) |
| 330 | Pointer arrow border opacity reduced |
| 334 | Header: remove `border-b`, add `bg-muted/30` |
| 359 | Content padding from `px-3 py-2.5` to `px-4 py-3` |
| 409 | Action bar border softened to `border-border/40` |
| 440, 452 | Feedback icon size from 18 to 16 |
| 458 | Expand icon size from 18 to 16 |

### Expected Result

- The card will feel lighter and more modern -- like a floating chat bubble rather than a bordered box
- Softer borders and subtle shadows create depth without heaviness
- More breathing room in the content area for readability
- Overall cleaner, more polished look matching modern chat interfaces
