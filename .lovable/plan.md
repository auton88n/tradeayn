

# Graceful AYN Response Handling

## Overview
Ensure AYN always responds warmly, even during technical difficulties. Instead of showing error messages that make AYN seem broken, we'll provide friendly, natural responses that maintain trust.

## Philosophy
- Never show "connection error" or "broken" language
- AYN should feel like a thoughtful friend who occasionally needs a moment
- Retry silently when possible before showing any message
- Use warm, conversational language

---

## Technical Changes

### File: `src/hooks/useMessages.ts`

**Change 1: Add Silent Retry Logic (before the fetch call)**

Wrap the API call with automatic retry (2 attempts) before showing any message to the user:

```typescript
// Silent retry helper - try twice before giving up
const fetchWithRetry = async (url: string, options: RequestInit, retries = 2): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 429) return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
    }
  }
  throw new Error('Request failed after retries');
};
```

**Change 2: Validate Empty Responses with Friendly Fallback (lines 308-311)**

Replace the "i'm processing your request..." fallback with proper validation:

```typescript
const responseContent = webhookData?.content || webhookData?.response || webhookData?.output || '';

// If response is empty, use a warm fallback instead of showing an error
const response = responseContent.trim() 
  ? responseContent 
  : "Let me think about that differently... Could you try asking again? Sometimes a fresh start helps me give you a better answer! 💭";
```

**Change 3: Add Request Timeout with Friendly Message (around line 257)**

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

const webhookResponse = await fetchWithRetry(`${SUPABASE_URL}/functions/v1/ayn-unified`, {
  method: 'POST',
  signal: controller.signal,
  headers: {...},
  body: JSON.stringify({...})
});

clearTimeout(timeoutId);
```

**Change 4: Warm Error Messages (lines 484-501)**

Replace cold error messages with friendly, AYN-like responses:

```typescript
} catch (error) {
  setIsTyping(false);

  const isTimeout = error instanceof Error && error.name === 'AbortError';
  
  // Friendly messages that don't blame the system
  const friendlyResponses = isTimeout ? [
    "I'm taking a bit longer to think this through. Want to try asking in a simpler way? I'd love to help! ✨",
    "That's a deep question! Let me catch up - could you try sending it again? 💫"
  ] : [
    "I got a little distracted there! Could you send that again? I'm all ears now 👂",
    "Let's try that again - I want to make sure I give you my best answer! 🌟",
    "Hmm, let me reset my thoughts. Could you ask me one more time? 💭"
  ];
  
  const randomMessage = friendlyResponses[Math.floor(Math.random() * friendlyResponses.length)];
  
  const errorMessage: Message = {
    id: (Date.now() + 1).toString(),
    content: randomMessage,
    sender: 'ayn',
    timestamp: new Date(),
    status: 'sent' // Use 'sent' not 'error' - looks normal to user
  };

  setMessages(prev => [...prev, errorMessage]);
  
  // No toast notification - keep it seamless
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/useMessages.ts` | Add silent retry (2 attempts) before showing anything |
| `src/hooks/useMessages.ts` | Add 30s timeout with AbortController |
| `src/hooks/useMessages.ts` | Replace empty response fallback with warm message |
| `src/hooks/useMessages.ts` | Replace error messages with friendly, randomized responses |
| `src/hooks/useMessages.ts` | Remove error toasts - keep experience seamless |

---

## Result
- AYN silently retries once before showing any message
- Empty responses get a friendly "let's try again" message
- Timeouts feel like AYN is thinking hard, not broken
- No error toasts or "connection error" language
- Users feel like they're talking to a friendly AI, not a broken system

