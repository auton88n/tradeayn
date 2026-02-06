

# Move the Eye Up Slightly

## Problem

The eye sits too low in the center stage area, especially when the chat panel is open. It needs to be shifted up a bit for better visual balance.

## Change

### File: `src/components/dashboard/CenterStageLayout.tsx` (line 737)

Add a negative `marginTop` to the eye container's animate block to shift it upward:

**Current (line 735-738):**
```tsx
animate={{
  scale: (hasVisibleResponses || transcriptOpen) ? (isMobile ? 0.55 : 0.5) : 1,
  marginBottom: (hasVisibleResponses || transcriptOpen) ? -20 : 0,
}}
```

**Updated:**
```tsx
animate={{
  scale: (hasVisibleResponses || transcriptOpen) ? (isMobile ? 0.55 : 0.5) : 1,
  marginBottom: (hasVisibleResponses || transcriptOpen) ? -20 : 0,
  y: (hasVisibleResponses || transcriptOpen) ? -10 : -30,
}}
```

This shifts the eye up by 30px in its default/idle position and 10px when the response panel is open, creating a more balanced visual layout without affecting any other elements.

One file modified: `CenterStageLayout.tsx`, lines 735-738.

