

# Fix: Message Send Animation Lag + Response Bubble Entrance

## Issue 1: Flying Bubble Animation Lag

**Root cause**: The `UserMessageBubble` uses `useLayoutEffect` to measure its own dimensions via `getBoundingClientRect()` on every render, causing a forced synchronous layout recalculation. Additionally, `onSendMessage` (which triggers the edge function call) fires before the animation starts, competing for main thread time.

**Fix in `UserMessageBubble.tsx`**:
- Remove the `useLayoutEffect` + `getBoundingClientRect()` measurement entirely -- this forces a synchronous layout pass that blocks the animation
- Instead, estimate centering with a fixed offset (e.g., 150px width / 20px height) or use `transform: translate(-50%, -50%)` with `left/top` set to the target coordinates -- zero layout cost
- Reduce flying duration from 0.4s to 0.3s for snappier feel
- Remove the `rotate` property from the animation (saves a composite calculation)

**Fix in `useBubbleAnimation.ts`**:
- Reduce the flying-to-absorbing timeout from 400ms to 300ms to match the shorter flight duration

**Fix in `CenterStageLayout.tsx`**:
- In `handleSendWithAnimation`, reduce the inner setTimeout (line 476) from 400ms to 300ms to match

## Issue 2: Response Bubble Appears Abruptly

**Current state**: The `ResponseCard` wrapper at line 768-789 already has `AnimatePresence` with `initial={{ opacity: 0, y: 10 }}` -- so the card itself fades in. However, transcript messages in `ChatHistoryCollapsible` and `TranscriptSidebar` have no entrance animation.

**Fix in `TranscriptMessage.tsx`**:
- Wrap the outer `<div>` in a `motion.div` with `initial={{ opacity: 0, y: 6 }}` and `animate={{ opacity: 1, y: 0 }}` with a 200ms duration
- Add a prop `animate` (default `true`) -- set to `false` when loading from history so only new live messages get the entrance animation

**Fix in `ChatHistoryCollapsible.tsx`**:
- Track previous message count with a ref, and pass `animate={false}` to messages that existed before the latest render (i.e., only animate the last N new messages)

## Files to Change

| File | Change |
|------|--------|
| `UserMessageBubble.tsx` | Remove useLayoutEffect measurement; use CSS centering; reduce duration to 0.3s; drop rotate |
| `useBubbleAnimation.ts` | Reduce flying timeout from 400ms to 300ms |
| `CenterStageLayout.tsx` | Reduce inner setTimeout from 400ms to 300ms |
| `TranscriptMessage.tsx` | Add optional entrance animation (fade+slide, 200ms) |
| `ChatHistoryCollapsible.tsx` | Track message count to only animate new messages |

## Technical Details

### UserMessageBubble centering approach
```text
Before: useLayoutEffect -> getBoundingClientRect() -> setState(dimensions) -> re-render -> animate
After:  CSS left: startPos.x, top: startPos.y, transform: translate(-50%, -50%) -> animate directly
```
This eliminates one full render cycle and a forced layout pass.

### TranscriptMessage animation guard
A new optional `shouldAnimate` prop (default `true`) controls whether the entrance animation plays. When loading history, all messages get `shouldAnimate={false}` to avoid a cascade of animations on bulk render.

