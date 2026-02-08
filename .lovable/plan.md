

# ChatGPT-Style Chat Mode + Smooth Eye Transition

## Overview

When the history panel is open, switch to a fast, ChatGPT-like chat experience: no flying bubble, instant message delivery, typing dots while waiting, and streaming text for responses. Also fix the eye's jerky spring animation.

## Changes

### 1. Skip flying bubble when history is open (CenterStageLayout.tsx)

In `handleSendWithAnimation`, add an early branch when `transcriptOpen` is true:
- Call `onSendMessage(content, file)` immediately
- Set `setIsResponding(true)` and defer `orchestrateEmotionChange('thinking')` via `requestAnimationFrame`
- Call `onRemoveFile()`, `clearResponseBubbles()`, `clearSuggestions()`
- Skip `startMessageAnimation()`, skip the absorption timeout entirely
- This removes all animation overhead from the send path

### 2. Fix eye transition (CenterStageLayout.tsx)

Replace the eye container's spring animation config:
- Change from `type: 'spring', duration: 0.35, bounce: 0.05` to `type: 'tween', duration: 0.3, ease: [0.4, 0, 0.2, 1]`
- Remove the conflicting `transition-transform duration-300` CSS class (Framer Motion handles the transform)
- Remove `will-change: transform` from the inline style (Framer Motion adds this automatically during animation)

### 3. Add typing indicator in history panel (ChatInput.tsx)

- Accept a new `isTyping` prop
- When `isTyping` is true and `transcriptOpen` is true, render a typing indicator at the bottom of the message list
- The indicator uses a CSS-only three-dot bounce animation (no Framer Motion)
- Styled like an AYN message bubble with the Brain icon and "AYN" label
- Auto-removed when the real response message arrives

### 4. Stream AYN responses in history (TranscriptMessage.tsx)

- Add an `isStreaming` prop (default `false`)
- When `isStreaming` is true, render content with `StreamingMarkdown` instead of `MessageFormatter`
- This gives the word-by-word text reveal effect

### 5. Wire isStreaming to the last AYN message (ChatInput.tsx)

- In the history message list, detect the last AYN message
- If `isTyping` is false and that message just arrived (not loaded from history), pass `isStreaming={true}`
- Use a ref to track which message IDs have already been rendered, so only truly new messages stream

### 6. Pass isTyping from CenterStageLayout to ChatInput

- Thread the `isTyping` value (already available from `useMessages`) down to `ChatInput` as a new prop

## Files to Change

| File | Change |
|------|--------|
| CenterStageLayout.tsx | Skip animation when `transcriptOpen`; fix eye tween transition; pass `isTyping` to ChatInput |
| ChatInput.tsx | Accept `isTyping` prop; render CSS typing dots; pass `isStreaming` to last AYN TranscriptMessage |
| TranscriptMessage.tsx | Accept `isStreaming` prop; conditionally use `StreamingMarkdown` |

## Technical Details

### Send path comparison

```text
History CLOSED (current behavior):
  blur input -> delay 0-60ms -> measure positions -> startMessageAnimation()
  -> 300ms timeout -> batch state updates -> rAF emotion change
  Total: ~360-420ms before AI call starts (but message sends immediately)

History OPEN (new behavior):
  onSendMessage() immediately
  setIsResponding(true)
  rAF -> orchestrateEmotionChange('thinking')
  Total: ~1ms, single render cycle
```

### Eye transition comparison

```text
Before: spring with bounce -> oscillates, fights CSS transition-transform
After:  tween with cubic-bezier -> single smooth curve, no CSS conflict
```

### Typing indicator (CSS-only)

Three dots with staggered `animation-delay` using `@keyframes bounce`:
- Dot 1: 0ms delay
- Dot 2: 150ms delay
- Dot 3: 300ms delay
- Each dot: `translateY(0) -> translateY(-4px) -> translateY(0)` over 600ms, infinite

No React state changes, no Framer Motion, no DOM churn.

