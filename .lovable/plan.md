
# Friendly Error Handling Plan
## Replace Technical Errors with AYN-style Handling Messages

---

## Summary

Replace all technical error messages in the Engineering AI components with friendly, personality-driven "handling messages" that maintain AYN's helpful persona even when things go wrong.

---

## Current Issues

| Location | Current Behavior |
|----------|-----------------|
| `useEngineeringAI.ts` | Shows toast: "AI Error" with raw error message |
| `useEngineeringAI.ts` | Chat shows: "I apologize, but I encountered an error..." |
| `useEngineeringAIAgent.ts` | Shows: "sorry, i encountered an error. please try again." |
| Various calculators | Use `toast.error()` with raw error text |

---

## Solution: Friendly Handling Messages

Create randomized, personality-driven responses that make errors feel like natural conversation pauses:

```text
HANDLING_MESSAGES = [
  "hmm, let me think about that differently...",
  "one sec, gathering my thoughts...",
  "i got a little distracted! could you try that again?",
  "let me take another look at this...",
  "oops, my brain glitched! try once more?",
  "still processing... want to try again?",
  "that was tricky! let's give it another shot.",
]
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/errorMessages.ts` | Add `HANDLING_MESSAGES` array and `getHandlingMessage()` function |
| `src/hooks/useEngineeringAI.ts` | Remove error toast, use friendly handling message in chat |
| `src/hooks/useEngineeringAIAgent.ts` | Use `getHandlingMessage()` instead of static error text |
| `src/components/engineering/EngineeringAIPanel.tsx` | Ensure error states use friendly messages (if any) |

---

## Implementation Details

### 1. Add Handling Messages to Error Library

```text
// src/lib/errorMessages.ts

// Friendly handling messages that maintain AYN's personality
export const HANDLING_MESSAGES = [
  "hmm, let me think about that differently...",
  "one sec, gathering my thoughts...",
  "i got a little distracted! could you try that again?",
  "let me take another look at this...",
  "oops, my brain glitched! try once more?",
  "still processing... want to try again?",
  "that was tricky! let's give it another shot.",
  "my circuits got tangled there. mind trying again?",
];

/**
 * Get a random friendly handling message for errors
 * Maintains AYN's helpful, casual personality
 */
export const getHandlingMessage = (): string => {
  const index = Math.floor(Math.random() * HANDLING_MESSAGES.length);
  return HANDLING_MESSAGES[index];
};
```

### 2. Update useEngineeringAI.ts

**Before:**
```text
toast({
  title: "AI Error",
  description: errorMessage,
  variant: "destructive"
});

const errorAssistantMessage: Message = {
  role: 'assistant',
  content: "I apologize, but I encountered an error...",
```

**After:**
```text
// Remove toast entirely - let the chat handle it naturally

const errorAssistantMessage: Message = {
  role: 'assistant',
  content: getHandlingMessage(),
```

### 3. Update useEngineeringAIAgent.ts

**Before (lines 307-320):**
```text
} catch (err) {
  if (import.meta.env.DEV) {
    console.error('AI agent error:', err);
  }
  
  const errorContent = err instanceof Error && err.message.includes('rate limit')
    ? 'rate limit reached. please wait a moment and try again.'
    : 'sorry, i encountered an error. please try again.';
```

**After:**
```text
} catch (err) {
  if (import.meta.env.DEV) {
    console.error('AI agent error:', err);
  }
  
  // Use friendly handling message that maintains personality
  const errorContent = err instanceof Error && err.message.includes('rate limit')
    ? 'whoa, too fast! give me a moment to catch up...'
    : getHandlingMessage();
```

---

## Key Changes Summary

1. **No Error Toasts**: Remove destructive toast notifications from AI chat flows - errors are handled inline as chat messages

2. **Randomized Messages**: Each error shows a different friendly message, making the experience feel more natural

3. **Rate Limit Special Case**: Keep a specific friendly message for rate limits since users need to know to wait

4. **Console Logging Preserved**: Dev-mode console.error statements remain for debugging

---

## Expected User Experience

**Before:**
- Red error toast appears: "AI Error: Network timeout"
- Chat shows: "I apologize, but I encountered an error..."

**After:**
- No toast interruption
- Chat shows (randomly): "hmm, let me think about that differently..."
- User naturally retries, feels like a conversation pause

---

## Testing Checklist

- [ ] AI errors show randomized handling messages (no "error" word visible)
- [ ] No destructive toasts appear during AI chat
- [ ] Rate limit shows specific "too fast" message
- [ ] Console logs still appear in dev mode for debugging
- [ ] Messages feel natural and match AYN's lowercase, casual style
