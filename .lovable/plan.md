

# Fix Chat UI Bugs: Auto-Scroll & Message Ordering

## Summary

This plan fixes two critical chat usability issues across all engineering chat components:
1. **Forced auto-scroll** prevents users from reading message history
2. **Message ordering** can sometimes appear reversed due to rapid state updates

---

## Root Cause Analysis

### Bug 1: Auto-Scroll Forces User Down

**Current problematic pattern (found in 5 files):**

```text
EngineeringBottomChat.tsx (line 173):
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);  ← Scrolls on EVERY message change

EngineeringAIChat.tsx (line 135):
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);  ← Same issue

EngineeringAIPanel.tsx (line 87):
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);  ← Same issue

AICalculatorAssistant.tsx (line 122):
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streamingContent]);  ← Same issue
```

**Problem**: Scroll triggers on ANY `messages` array change, not just when NEW messages are added. User scrolls up to read history and gets yanked back to bottom.

### Bug 2: Message Order Appears Wrong

**Current pattern in useEngineeringAIAgent.ts (lines 264-303):**

```text
1. setMessages(prev => [...prev, userMessage]);   ← User message added
2. setIsLoading(true);
3. await supabase.functions.invoke(...)           ← AI call
4. setMessages(prev => [...prev, assistantMessage]); ← AI message added
```

**Problem**: While the logic is correct, React's state batching and rapid updates can cause visual flickering where messages appear to swap positions momentarily.

---

## Solution Design

### Fix 1: Smart Auto-Scroll

Implement "scroll intent detection" - only auto-scroll if user is near the bottom. If user scrolls up to read history, respect their position.

**New logic:**

```text
+---------------------------+
| User scrolls up to read   |
| history                   |
+------------+--------------+
             |
             v
+---------------------------+
| Detect user is > 100px    |
| from bottom               |
+------------+--------------+
             |
             v
+---------------------------+
| Set shouldAutoScroll =    |
| false                     |
+------------+--------------+
             |
             v
+---------------------------+
| New message arrives       |
+------------+--------------+
             |
             v
+---------------------------+
| Check shouldAutoScroll    |
| → If false: DO NOT scroll |
| → If true: scroll to msg  |
+---------------------------+
```

### Fix 2: Guaranteed Message Order

Add a small delay after adding user message to ensure React has committed the state before the AI response arrives. Also use `messages.length` instead of full array to trigger scroll only on additions.

---

## Files to Modify

### 1. EngineeringBottomChat.tsx

**Lines 123-177** - Add smart scroll logic:

```typescript
// Add new state
const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
const scrollAreaRef = useRef<HTMLDivElement>(null);
const prevMessageCountRef = useRef(0);

// Add scroll detection handler
const handleScroll = useCallback(() => {
  const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
  if (!viewport) return;
  
  const { scrollTop, scrollHeight, clientHeight } = viewport;
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
  setShouldAutoScroll(isNearBottom);
}, []);

// Replace existing scroll useEffect
useEffect(() => {
  // Only scroll when NEW messages are added (not on every change)
  if (messages.length > prevMessageCountRef.current && shouldAutoScroll && isExpanded) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  prevMessageCountRef.current = messages.length;
}, [messages.length, shouldAutoScroll, isExpanded]);
```

**Update ScrollArea JSX (line 363):**

```tsx
<ScrollArea 
  ref={scrollAreaRef}
  className="h-[280px]" 
  style={{ contain: 'strict' }}
  onScrollCapture={handleScroll}
>
```

### 2. EngineeringAIChat.tsx

**Lines 130-137** - Same pattern:

```typescript
const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
const prevMessageCountRef = useRef(0);

const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
  const target = e.currentTarget;
  const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
  setShouldAutoScroll(isNearBottom);
}, []);

useEffect(() => {
  const newMessageAdded = messages.length > prevMessageCountRef.current;
  const isStreaming = streamingContent.length > 0;
  
  if ((newMessageAdded || isStreaming) && shouldAutoScroll) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  prevMessageCountRef.current = messages.length;
}, [messages.length, streamingContent, shouldAutoScroll]);
```

### 3. EngineeringAIPanel.tsx

**Lines 76-89** - Same pattern:

```typescript
const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
const prevMessageCountRef = useRef(0);

useEffect(() => {
  if (messages.length > prevMessageCountRef.current && shouldAutoScroll) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  prevMessageCountRef.current = messages.length;
}, [messages.length, shouldAutoScroll]);
```

### 4. AICalculatorAssistant.tsx

**Lines 117-124** - Same pattern:

```typescript
const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
const prevMessageCountRef = useRef(0);

useEffect(() => {
  const newMessageAdded = chatMessages.length > prevMessageCountRef.current;
  const isStreaming = streamingContent.length > 0;
  
  if ((newMessageAdded || isStreaming) && shouldAutoScroll) {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  prevMessageCountRef.current = chatMessages.length;
}, [chatMessages.length, streamingContent, shouldAutoScroll]);
```

### 5. useEngineeringAIAgent.ts

**Lines 248-304** - Add guaranteed order with sequence numbers:

```typescript
// Add sequence counter
const messageSequenceRef = useRef(0);

const sendMessage = useCallback(async (question: string) => {
  if (!question.trim() || isLoading) return;

  // Cancel any ongoing request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  abortControllerRef.current = new AbortController();

  // Increment sequence for ordering
  const userSequence = ++messageSequenceRef.current;

  const userMessage: ChatMessage = {
    role: 'user',
    content: question.trim(),
    timestamp: new Date(),
    id: `user-${userSequence}`,  // Stable unique ID
  };

  // Add user message FIRST
  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);

  // Small delay to ensure React commits user message to DOM
  await new Promise(resolve => setTimeout(resolve, 50));

  // Save user message to database (non-blocking)
  saveMessageToDb(question.trim(), 'user');

  try {
    // ... existing AI call logic ...

    const aiSequence = ++messageSequenceRef.current;
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
      id: `assistant-${aiSequence}`,  // Stable unique ID
      actions: executedActions,
    };

    setMessages(prev => [...prev, assistantMessage]);
    // ...
  }
  // ... error handling ...
}, [/* deps */]);
```

---

## Behavior After Fix

### Auto-Scroll

| Scenario | Before | After |
|----------|--------|-------|
| User scrolls up to read history | Chat yanks back to bottom | Stays where user scrolled |
| User is near bottom (< 100px) | - | New messages auto-scroll |
| User scrolls back to bottom | - | Auto-scroll re-enables |
| New message while scrolled up | Forces scroll down | No forced scroll, badge shows unread |

### Message Ordering

| Scenario | Before | After |
|----------|--------|-------|
| User sends message | Sometimes flickers | Appears immediately, stable |
| AI responds | Sometimes appears first | Always appears AFTER user |
| Rapid messages | Order can swap | Order guaranteed by sequence |

---

## Testing Checklist

After implementation:

**Auto-scroll behavior:**
- Scroll up in chat history → stays in place (no jump)
- Scroll to bottom → new messages auto-scroll
- Send message while scrolled up → user message appears, no forced scroll
- With streaming content → scrolls smoothly during stream if near bottom

**Message ordering:**
- User sends message → appears immediately in correct position
- AI responds → appears AFTER user message
- Send 5 messages rapidly → all in correct chronological order
- Reload page → messages still in correct order from database

---

## Summary

| Component | Change |
|-----------|--------|
| EngineeringBottomChat.tsx | Add `shouldAutoScroll` state + scroll detection + message count tracking |
| EngineeringAIChat.tsx | Same pattern |
| EngineeringAIPanel.tsx | Same pattern |
| AICalculatorAssistant.tsx | Same pattern |
| useEngineeringAIAgent.ts | Add 50ms delay after user message + sequence-based IDs |

