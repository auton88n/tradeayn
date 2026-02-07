
# Move Eye Inside the History Card

## Problem

When the history panel is open, the eye floats above the card header. The user wants it positioned within the history card, near the top.

## Change

### File: `src/components/dashboard/CenterStageLayout.tsx` (line 738)

Adjust the `y` value when transcript/responses are open from `-10` to `10`, so the eye sits inside the card rather than above it. Keep the idle `y` at `-30`.

**Current:**
```tsx
y: (hasVisibleResponses || transcriptOpen) ? -10 : -30,
```

**Updated:**
```tsx
y: (hasVisibleResponses || transcriptOpen) ? 10 : -30,
```

This pushes the eye down by 20px when the history card is visible, placing it within the card's top area instead of floating above it.

One line changed in one file.
