

# Improve Chat History Message Bubbles

## Problem

The AYN reply messages in the chat history (TranscriptMessage component) look gray and boxy -- they use a flat `bg-muted` background with hard edges, making them feel heavy and lifeless instead of like natural chat messages.

## Changes to `src/components/transcript/TranscriptMessage.tsx`

### Soften the AYN message bubble (line 91-96)
- Replace the flat `bg-muted` with a softer, slightly translucent `bg-muted/50` for AYN messages
- The user messages (`bg-primary`) are fine as-is

### Improve bubble shape (lines 91-96)
- Increase border radius from `rounded-2xl` to `rounded-[20px]` for a smoother, more modern bubble shape
- Add a very subtle shadow on AYN bubbles: `shadow-sm` for slight depth instead of flat

### Lighten the text density (lines 98-103)
- Add slightly more padding inside the bubble for breathing room (compact mode unchanged)
- Normal mode: from `px-4 py-2` to `px-4 py-2.5`

### Overall feel
The messages will look more like iMessage/WhatsApp bubbles -- softer backgrounds, rounder corners, and a touch of depth.

## Technical Details

### File: `src/components/transcript/TranscriptMessage.tsx`

| Line Range | What Changes |
|------------|-------------|
| 91-96 | AYN bubble: `bg-muted` becomes `bg-muted/50 shadow-sm`; keep user bubble as-is |
| 93 | Normal padding: `px-4 py-2` becomes `px-4 py-2.5` |
| 91 | Rounding: `rounded-2xl` becomes `rounded-[20px]` |

