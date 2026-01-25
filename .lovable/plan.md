
# AI Streaming Optimization & Input Lock Implementation Plan

## Overview
This plan implements two related features:
1. **AI Streaming**: Show AI responses token-by-token as they arrive (reduces perceived latency from 3-5s to <500ms)
2. **Input Lock**: Disable message input while AI is responding (prevents duplicate sends)

---

## Current State Analysis

### Backend (`ayn-unified`)
| Capability | Status |
|------------|--------|
| Streaming support | ✅ Already implemented (lines 1116-1125) |
| SSE format | ✅ Returns `text/event-stream` when `stream: true` |
| Non-streaming fallback | ✅ Returns JSON when `stream: false` |

### Frontend (`useMessages.ts`)
| Current State | Issue |
|---------------|-------|
| `stream: false` (line 312) | Waits for full response before showing |
| `setIsTyping(false)` immediately | Not synchronized with streaming end |
| No SSE parsing | Cannot handle token-by-token updates |

### Input (`ChatInput.tsx`)
| Current State | Issue |
|---------------|-------|
| `isDisabled` prop exists (line 149) | Not connected to `isTyping` state |
| Only checks `isDisabled || isUploading` (line 279) | Doesn't prevent sends while AI responds |

---

## Implementation Details

### Phase 1: Connect Input Lock to `isTyping` State

**File: `src/components/dashboard/CenterStageLayout.tsx`**

Pass `isTyping` to `ChatInput` to disable input while AI is responding:

```typescript
// Line ~757: Add isTyping to ChatInput props
<ChatInput
  ref={inputRef}
  onSend={handleSendWithAnimation}
  isDisabled={isDisabled || isTyping || maintenanceConfig?.enabled}  // ADD isTyping here
  // ... rest of props
/>
```

**Result:** User cannot send messages while `isTyping` is true (AI responding).

---

### Phase 2: Enable Streaming in Frontend

**File: `src/hooks/useMessages.ts`**

#### 2a. Change to streaming mode (line 312)
```typescript
body: JSON.stringify({
  messages: conversationMessages,
  intent: detectedIntent,
  context,
  stream: true  // Change from false to true
})
```

#### 2b. Add SSE parsing function
Add helper to parse Server-Sent Events:

```typescript
// Parse SSE stream and call onChunk for each token
const parseSSEStream = async (
  response: Response,
  onChunk: (content: string) => void,
  onComplete: () => void
): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete lines
    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        } catch {
          // Ignore parse errors for partial chunks
        }
      }
    }
  }

  onComplete();
  return fullContent;
};
```

#### 2c. Update `sendMessage` function to handle streaming

Replace the current fetch + JSON parsing (lines 300-320) with streaming logic:

```typescript
// After the POST request setup...
const webhookResponse = await fetchWithRetry(/* ... stream: true ... */);

// For streaming responses, parse SSE
if (webhookResponse.headers.get('content-type')?.includes('text/event-stream')) {
  // Create placeholder message that will be updated
  const aynMessageId = (Date.now() + 1).toString();
  const aynMessage: Message = {
    id: aynMessageId,
    content: '',
    sender: 'ayn',
    timestamp: new Date(),
    isTyping: true,
  };
  
  setMessages(prev => [...prev, aynMessage]);

  // Parse stream and update message content progressively
  const fullContent = await parseSSEStream(
    webhookResponse,
    (chunk) => {
      setMessages(prev => prev.map(msg => 
        msg.id === aynMessageId 
          ? { ...msg, content: msg.content + chunk }
          : msg
      ));
    },
    () => {
      // Mark message as complete
      setMessages(prev => prev.map(msg =>
        msg.id === aynMessageId
          ? { ...msg, isTyping: false, status: 'sent' }
          : msg
      ));
      setIsTyping(false);
    }
  );

  // Detect emotion from complete response
  const { analyzeResponseEmotion } = await import('@/lib/emotionMapping');
  setLastSuggestedEmotion(analyzeResponseEmotion(fullContent));
} else {
  // Fallback to non-streaming (for document/image intents)
  // ... existing JSON parsing logic ...
}
```

---

### Phase 3: Handle Special Cases

#### 3a. Document Generation (Keep non-streaming)
Documents and images should NOT stream since they return JSON with URLs:

```typescript
// Detect if intent requires non-streaming
const requiresNonStreaming = ['document', 'image'].includes(detectedIntent);

body: JSON.stringify({
  messages: conversationMessages,
  intent: detectedIntent,
  context,
  stream: !requiresNonStreaming  // Don't stream for documents/images
})
```

#### 3b. Error Handling for Streaming
Add abort controller cleanup and error handling:

```typescript
// If stream fails mid-way, show friendly message
try {
  const fullContent = await parseSSEStream(/* ... */);
} catch (streamError) {
  setMessages(prev => prev.map(msg =>
    msg.id === aynMessageId
      ? { ...msg, content: msg.content || "Hmm, something went wrong. Try again?", isTyping: false }
      : msg
  ));
  setIsTyping(false);
}
```

---

## Files to Modify

| File | Changes | Risk |
|------|---------|------|
| `src/hooks/useMessages.ts` | Add SSE parser, enable streaming, update message progressively | Medium |
| `src/components/dashboard/CenterStageLayout.tsx` | Pass `isTyping` to ChatInput's `isDisabled` | Low |

---

## What This Does NOT Change

| Area | Status |
|------|--------|
| Eye animations | Untouched - `isTyping` still triggers thinking state |
| Emotion detection | Works on complete response (unchanged) |
| Document generation | Stays non-streaming (returns JSON with URL) |
| Image generation | Stays non-streaming (returns JSON with URL) |
| Backend edge function | No changes needed - already supports streaming |
| Message persistence | Unchanged - saves to DB after complete |

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Time to first token | 2-4 seconds | <500ms |
| Perceived response time | Wait for full response | See text appear immediately |
| Double-send prevention | Not prevented | ✅ Input locked during response |
| Eye "thinking" state | Shows until done | Shows until streaming completes |

---

## Visual Behavior

### Before (Current)
```
User sends message → [2-4s blank wait] → Full response appears
```

### After (With Streaming)
```
User sends message → [200ms] → First words appear → 
  [words stream in] → Response complete
```

### Input Lock Flow
```
User types → Sends message → 
  [Input disabled + thinking state] → 
  AI responds (streaming) → 
  [Response complete] → Input re-enabled
```

---

## Testing Checklist

1. **Send a chat message** → See response stream in word-by-word
2. **Try to send while AI responds** → Input should be disabled
3. **Generate a PDF** → Should still work (non-streaming fallback)
4. **Generate an image** → Should still work (non-streaming fallback)
5. **Network error mid-stream** → Should show friendly error message
6. **Eye animations** → Should show "thinking" during stream, emotion after

---

## Technical Notes

### Why This Is Safe
1. **Backend already supports streaming** - No edge function changes needed
2. **Input lock uses existing `isDisabled` prop** - Well-tested pattern
3. **Fallback to non-streaming** - Documents/images work as before
4. **Progressive updates** - Uses React's batched state updates for performance

### Performance Considerations
- SSE parsing happens in a tight loop but yields on each `reader.read()`
- Message updates are batched by React's scheduler
- No additional API calls required
