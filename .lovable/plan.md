

# Fix: Further Optimize Eye Transition + Move Thinking Label Up

## Remaining Lag Issue

The current fix delays message *rendering* by 250ms, but `chatSession.loadChat(chat)` (which parses all messages from the database result) still runs **synchronously before** `setIsTransitioningToChat(true)`. This blocks the main thread and delays the animation start.

**Fix**: Flip the order -- trigger the animation flag FIRST, then defer the entire load+render into the timeout.

## Thinking/Emotion Label Position

The "Thinking" emotion label at the bottom of the eye uses `absolute -bottom-8`, which places it too far below the eye, especially when scaled to 0.5x. Moving it to `-bottom-6` brings it closer and keeps it visually contained.

---

## Changes

### 1. DashboardContainer.tsx -- Defer loadChat into timeout

Move `chatSession.loadChat(chat)` inside the setTimeout so the animation flag fires instantly without any blocking work:

```
const handleLoadChat = useCallback((chat: ChatHistory) => {
  setIsTransitioningToChat(true);
  if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
  transitionTimerRef.current = setTimeout(() => {
    const loadedMessages = chatSession.loadChat(chat);
    messagesHook.setMessagesFromHistory(loadedMessages);
    setIsTransitioningToChat(false);
  }, 280);
}, [chatSession, messagesHook]);
```

This ensures zero main-thread work happens between the click and the animation start.

### 2. EmotionalEye.tsx -- Move emotion label up

Change the emotion label positioning from `-bottom-8` to `-bottom-6` (line 583):

```
// Before
className="absolute -bottom-8 left-1/2 ..."

// After
className="absolute -bottom-6 left-1/2 ..."
```

### 3. CenterStageLayout.tsx -- Add padding for small-state label

Add bottom padding to the eye container when in the small state so the label does not overlap content below:

```
className={cn(
  "relative overflow-visible z-40",
  (hasVisibleResponses || transcriptOpen || isTransitioningToChat) && "pb-4"
)}
```

## Files to Change

| File | Change |
|------|--------|
| DashboardContainer.tsx | Move `loadChat()` call inside the setTimeout |
| EmotionalEye.tsx | Change `-bottom-8` to `-bottom-6` on emotion label |
| CenterStageLayout.tsx | Add conditional `pb-4` to eye container in small state |

