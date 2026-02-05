
# Fix: Remove User Message When Limit Exceeded

## The Problem

When a user sends a message and their limit is exceeded:

1. User types "hey" and clicks send
2. "hey" is immediately added to the chat UI (optimistic update)
3. Backend returns 429 (limit exceeded)
4. AYN's "you've exceeded your limit" message appears
5. **Bug**: "hey" remains visible in the chat

This creates orphaned messages in the UI that shouldn't exist.

## Root Cause

In `useMessages.ts`, the user message is added to UI on line 288-291 BEFORE the API call. When the API returns 429, we add AYN's error response but never remove the user's message.

## Solution

When a 429 (limit exceeded) response is received, remove the user message that was optimistically added. We already have the `userMessage.id` in scope, so we can filter it out.

## Technical Changes

### File: `src/hooks/useMessages.ts`

**Current flow (lines 378-420):**
```typescript
if (webhookResponse.status === 429) {
  setIsTyping(false);
  // ... error handling
  const errorMessage: Message = { ... };
  setMessages(prev => [...prev, errorMessage]);  // Adds AYN error
  toast({ ... });
  return;
}
```

**Updated flow:**
```typescript
if (webhookResponse.status === 429) {
  setIsTyping(false);
  // ... error handling
  const errorMessage: Message = { ... };
  
  // Remove user message AND add AYN's error response
  setMessages(prev => [
    ...prev.filter(m => m.id !== userMessage.id),  // Remove orphaned user message
    errorMessage
  ]);
  
  toast({ ... });
  return;
}
```

This same pattern should be applied to:
- 429 error handling (daily/chat limit)
- 403 error handling (premium feature)
- Any other error that blocks the request before AYN responds

## Summary

| Before | After |
|--------|-------|
| User message "hey" stays in chat | User message "hey" is removed |
| AYN error appears after "hey" | Only AYN error appears |
| Confusing chat history | Clean chat state |

## Testing

After implementation:
1. Use up all credits (or test with limit set to 0)
2. Send a message like "hey"
3. Verify only AYN's limit message appears, not "hey"
4. Refresh the page - confirm the message doesn't appear in history either
