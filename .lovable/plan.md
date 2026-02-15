

## Unified Text Formatting + Chat History Persistence

Two changes: make the trading coach and engineering chat format text the same way as the main AYN chat, and keep your messages when you close/reopen these chats.

---

### Part 1: Consistent Text Formatting

Right now, the main AYN chat uses the `MessageFormatter` component which supports rich markdown (tables, code blocks with copy buttons, RTL Arabic text, styled lists, image rendering, etc.). The trading coach and engineering chat only use basic `ReactMarkdown` which gives plain, unstyled output.

**Trading Coach (`ChartCoachChat.tsx`)**:
- Replace the basic `ReactMarkdown` in the `MessageBubble` component with `MessageFormatter`
- Remove the direct `ReactMarkdown` import since `MessageFormatter` handles it internally

**Engineering Chat (`EngineeringAIChat.tsx`)**:
- Replace the basic `ReactMarkdown` + `remarkGfm` in the assistant `MessageBubble` with `MessageFormatter`
- Also replace the streaming content `ReactMarkdown` with `MessageFormatter` (streaming content is accumulated text, so it works fine)
- Keep the structured data cards (formula, calculation, code reference) as they are -- those are unique to engineering

---

### Part 2: Chat History Persistence

Currently both chats store messages in `useState` which is lost on close/reopen. The fix is to persist messages to `localStorage` so they survive across sessions.

**Trading Coach (`useChartCoach.ts`)**:
- On mount, load messages from `localStorage` key `ayn-chart-coach-history`
- On every message change, save to `localStorage`
- `clearChat` also clears `localStorage`
- Cap stored history at 50 messages (already the `MAX_MESSAGES` limit)

**Engineering Chat (`EngineeringAIChat.tsx`)**:
- On mount, load messages from `localStorage` key `ayn-engineering-chat-{calculatorType}`
- On every message change, save to `localStorage`
- `clearConversation` also clears `localStorage`
- Messages are keyed by calculator type so beam, column, foundation etc. each keep their own history

Both chats will show previous messages immediately when opened, so users can continue where they left off.

---

### Technical Details

**Files to modify:**

| File | Changes |
|------|---------|
| `src/components/dashboard/ChartCoachChat.tsx` | Import `MessageFormatter`, replace `ReactMarkdown` in `MessageBubble` |
| `src/hooks/useChartCoach.ts` | Add `localStorage` persistence for messages |
| `src/components/engineering/EngineeringAIChat.tsx` | Import `MessageFormatter`, replace `ReactMarkdown` in message rendering + streaming, add `localStorage` persistence |

**localStorage schema:**

```text
ayn-chart-coach-history:
  JSON array of { role, content } (no timestamp -- reconstructed on load)

ayn-engineering-chat-{calculatorType}:
  JSON array of { role, content, structuredData? } (keyed per calculator)
```

**MessageFormatter usage (replacing ReactMarkdown):**

```text
// Before (ChartCoachChat MessageBubble):
<ReactMarkdown>{msg.content}</ReactMarkdown>

// After:
<MessageFormatter content={msg.content} />
```

```text
// Before (EngineeringAIChat assistant bubble):
<ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>

// After:
<MessageFormatter content={message.content} />
```

**localStorage persistence (useChartCoach.ts):**

```text
const STORAGE_KEY = 'ayn-chart-coach-history';

// Initialize from storage
const [messages, setMessages] = useState<CoachMessage[]>(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
});

// Persist on change
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}, [messages]);

// Clear also clears storage
const clearChat = useCallback(() => {
  setMessages([]);
  localStorage.removeItem(STORAGE_KEY);
}, []);
```

Same pattern for engineering chat, but keyed per calculator type.

