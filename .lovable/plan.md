

# Fix Full-Width Chat and Eye Overlap Issues

## Problems Identified

1. **History panel not full width**: The footer container applies `md:right-[20rem]` when `transcriptOpen` is true (line 815 of CenterStageLayout.tsx). This was originally designed for a separate transcript sidebar panel, but now the history lives *inside* the ChatInput card. This right-offset creates a large empty gap on the right side.

2. **Eye overlapping the history panel**: The eye shrinks to scale 0.5 but remains visible, overlapping with the top of the history panel. When history is open, the eye should either hide or shrink further to avoid visual clutter.

---

## Changes

### 1. CenterStageLayout.tsx -- Remove right offset when history is open

The footer's `transcriptOpen && "md:right-[20rem]"` class should be removed or conditioned differently. Since the transcript/history now lives inside the ChatInput card (not as a separate sidebar), this offset is no longer needed.

**Line ~815**: Remove the `transcriptOpen` right offset from the footer:

```
Before:  transcriptOpen && "md:right-[20rem]"
After:   (remove this line entirely)
```

This lets the footer (and ChatInput) stretch to the full right edge of the viewport.

### 2. CenterStageLayout.tsx -- Hide the eye when history is open

When `transcriptOpen` is true, hide the eye completely so it doesn't overlap with the history panel. Use `opacity: 0` and `pointer-events: none` to hide it cleanly.

**Line ~720-746**: Add opacity animation to the eye container:

```
animate={{
  scale: (hasVisibleResponses || transcriptOpen) ? 0.5 : 1,
  opacity: transcriptOpen ? 0 : 1,
  marginBottom: (hasVisibleResponses || transcriptOpen) ? -20 : 0,
}}
```

And add `pointer-events-none` when transcript is open to prevent interaction with the invisible eye.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/CenterStageLayout.tsx` | Remove `transcriptOpen && "md:right-[20rem]"` from footer; add `opacity: 0` to eye when `transcriptOpen` is true |

