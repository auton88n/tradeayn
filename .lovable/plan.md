

# Add Client-Side Rate Limiter for AI Messages

## Problem

There is no client-side throttle on message sending. A user (or bot) can spam the send button and trigger hundreds of edge function calls in seconds, running up AI costs before server-side rate limiting kicks in.

## Solution

Two changes:

### 1. New file: `src/lib/rateLimiter.ts`

A simple sliding-window rate limiter class with three shared instances:
- **chatRateLimiter**: 5 messages per 10 seconds
- **engineeringRateLimiter**: 3 calculations per 15 seconds
- **fileUploadRateLimiter**: 3 uploads per 30 seconds

The class exposes:
- `canProceed()` -- checks the window, returns true/false, and records the timestamp if allowed
- `getTimeUntilNext()` -- returns milliseconds until the next request would be allowed
- `reset()` -- clears all timestamps

### 2. Update: `src/hooks/useMessages.ts`

Import `chatRateLimiter` and add a check at the very top of `sendMessage` (line ~199, before `setIsTyping(true)`), so rate-limited requests never even show the typing indicator:

```typescript
if (!chatRateLimiter.canProceed()) {
  const waitTime = Math.ceil(chatRateLimiter.getTimeUntilNext() / 1000);
  toast({
    title: 'Slow down',
    description: `Please wait ${waitTime} seconds before sending another message.`,
    variant: 'destructive',
  });
  return;
}
```

This is purely a UX safeguard -- server-side rate limiting (already in place via `check_api_rate_limit`) remains the security boundary.

## Files changed

| File | Change |
|------|--------|
| `src/lib/rateLimiter.ts` | New file -- `RateLimiter` class + 3 shared instances |
| `src/hooks/useMessages.ts` | Import `chatRateLimiter`, add early-return check before line 200 |

