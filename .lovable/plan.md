
# Fix: Eye Transition Lag When Loading Chat from History

## Problem

When clicking a chat in the History panel, the eye's shrink animation is laggy because everything happens synchronously in a single render cycle:
1. `handleLoadChat` calls `chatSession.loadChat()` which parses all messages
2. `setMessagesFromHistory` sets both `isLoadingFromHistory=true` and all messages in one setState
3. The eye detects `hasVisibleResponses || transcriptOpen` changed and tries to animate via Framer Motion spring
4. Simultaneously, the ResponseCard and transcript messages render, causing layout thrashing during the animation

## Solution

### 1. Decouple animation trigger from data rendering (DashboardContainer.tsx)

In `handleLoadChat`, trigger the eye shrink BEFORE loading messages:
- Set a new state flag (e.g., `isTransitioningToChat`) to `true` immediately when a chat is clicked
- This flag feeds into the eye's scale condition, starting the CSS/spring animation instantly
- After a short delay (250ms), load the actual messages via `setMessagesFromHistory`
- This separates the animation frame budget from the message rendering budget

### 2. Optimize the eye container animation (CenterStageLayout.tsx)

Change the eye container (lines 731-758) to use GPU-friendly properties:
- Add `will-change: 'transform'` to the eye motion.div style
- Replace the spring transition with a tighter config: lower `duration` (0.35s) and higher `bounce` (0.05) for snappier feel
- Add `layoutId` or `layout={false}` to prevent Framer Motion layout recalculations

### 3. Add `isTransitioningToChat` to eye scale condition (CenterStageLayout.tsx)

Update line 736:
```
// Before
scale: (hasVisibleResponses || transcriptOpen) ? ... : 1

// After  
scale: (hasVisibleResponses || transcriptOpen || isTransitioningToChat) ? ... : 1
```

This makes the eye start shrinking immediately on click, before messages render.

### 4. Fix small-eye overflow for thinking ring and emotion label

The emotion label at the bottom of EmotionalEye (`-bottom-8`) bleeds outside the container when scaled to 0.5. Add explicit padding/min-height to the eye container wrapper so the label and thinking dots stay contained:
- Add `pb-10` to the eye container div when in small state to give room for the label
- Alternatively, shift the emotion label positioning from `-bottom-8` to `-bottom-6` and ensure the container has `overflow-visible` (already present)

## Files to Change

| File | Change |
|------|--------|
| `DashboardContainer.tsx` | Add `isTransitioningToChat` state; delay `setMessagesFromHistory` by 250ms after setting flag |
| `CenterStageLayout.tsx` | Accept `isTransitioningToChat` prop; add it to eye scale condition; add `will-change: transform` and tighter spring config; add bottom padding for small state |

## Implementation Detail

```text
User clicks history chat
        |
        v
isTransitioningToChat = true  (immediate)
        |
        v
Eye starts shrinking (GPU-accelerated spring, 300ms)
        |
        v  (after 250ms setTimeout)
setMessagesFromHistory(messages)
        |
        v
Messages render below the already-small eye
        |
        v
isTransitioningToChat = false (after history flag resets)
```
