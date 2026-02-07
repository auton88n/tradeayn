

# Fix History Panel Clipping Issues

## Problem

Two things are cut off in the chat history panel:
1. The scroll-to-bottom chevron arrow at the bottom
2. The bottom of the message list

The root cause is the animated `maxHeight: 400` on the outer container combined with `overflow-hidden`. The inner scroll area uses `max-h-[50vh]` which can exceed 400px, and the scroll-to-bottom button positioned at `bottom-2` gets clipped by the outer overflow-hidden container.

## Changes

### File: `src/components/dashboard/ChatInput.tsx`

**1. Increase the animated maxHeight from 400 to 500** (line 448)

The 400px limit is too tight -- it clips the messages and the floating scroll button. Increasing to 500px gives enough room.

```
maxHeight: 400  -->  maxHeight: 500
```

**2. Reduce inner scroll area max-height to stay within bounds** (line 476)

Change `max-h-[50vh]` to `max-h-[340px]` so the messages area plus the header (roughly 50px) plus the scroll button (40px) all fit within the 500px animated container.

```
max-h-[50vh]  -->  max-h-[340px]
```

**3. Add padding-bottom to the relative container** (line 475)

Add `pb-3` to the relative container so the absolute-positioned scroll-to-bottom button at `bottom-2` has space and doesn't get clipped.

```
<div className="relative">  -->  <div className="relative pb-3">
```

These three changes together ensure the scroll-to-bottom arrow and the last message are fully visible within the history panel.

