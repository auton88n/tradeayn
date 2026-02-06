

# Fix Boxy AYN Bubbles in Chat History Panel

## Problem

When opening the chat history (to reply to a message), the AYN reply bubbles still appear as noticeable gray boxes. The `bg-muted/50` background is too strong in the compact inline history panel, especially in dark mode, making messages look heavy and boxy rather than like natural chat messages.

## Changes to `src/components/transcript/TranscriptMessage.tsx`

### Make AYN bubble background much subtler (line 96)
- Change `bg-muted/50` to `bg-muted/30` so the bubble blends more naturally instead of appearing as a solid gray block
- Remove `shadow-sm` -- in the compact history panel, shadows make bubbles look like cards/boxes rather than chat messages

### Result
AYN messages will have a very faint background tint -- just enough to distinguish them from user messages -- without the heavy "gray box" appearance. This matches how modern chat apps (iMessage, WhatsApp) style received messages in dark mode.

## Technical Details

### File: `src/components/transcript/TranscriptMessage.tsx` (line 96)

| Before | After |
|--------|-------|
| `bg-muted/50 text-foreground rounded-bl-sm shadow-sm` | `bg-muted/30 text-foreground rounded-bl-sm` |

Single line change -- removes the shadow and reduces background opacity from 50% to 30%.
