

## Fix: Coach Chat API Sync Bug

### The Problem

The chat API IS working, but there's a sync bug causing confusing behavior:

1. **Stale messages on load**: The `useChartCoach` hook loads old messages from localStorage on mount. But the sync mechanism (`prevCoachLenRef` starts at 0) treats ALL those old messages as "new" and dumps them into the chat thread. This causes old conversations to appear unexpectedly.

2. **Dual state conflict**: Both `ChartUnifiedChat` and `useChartCoach` maintain separate `messages` arrays. The sync effect tries to bridge them but is fragile -- it can miss messages or create duplicates.

### The Fix

**In `src/components/dashboard/ChartUnifiedChat.tsx`:**

1. **Initialize `prevCoachLenRef` to the coach's current message count** so old localStorage messages are skipped on mount:

```typescript
const prevCoachLenRef = useRef(coach.messages.length);
```

2. **Start a fresh coach session on mount** so the unified chat always starts clean (no leftover localStorage messages bleeding in):

```typescript
useEffect(() => {
  coach.newChat();
}, []);
```

This way the unified chat owns the conversation display, and the coach hook is just the API transport layer. Old sessions remain accessible via the coach's session management but don't pollute the current chat view.

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/ChartUnifiedChat.tsx` | Fix `prevCoachLenRef` initialization; call `coach.newChat()` on mount to start fresh |

