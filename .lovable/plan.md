

## Replace Controls with History + New Chat Buttons

### What Changes

Remove the current right-side controls (trash icon, minimize, expand arrow, AYN label) from the bottom bar of the Chart Coach chat. Replace them with two buttons:

1. **History button** -- opens a dropdown/popover showing past conversation sessions the user can click to reload
2. **New Chat button** -- clears current conversation and starts fresh (same as current trash, but clearly labeled)

This applies to **both** the Chart Coach and Engineering Chat for consistency.

### Storage Model Change

Currently there's a single localStorage key storing one flat array of messages. To support history, we need to store **multiple sessions**:

```text
Storage key: ayn-chart-coach-sessions
Value: [
  { id: "uuid", title: "First user message...", messages: [...], updatedAt: timestamp },
  { id: "uuid", title: "Should I take...", messages: [...], updatedAt: timestamp },
]

Storage key: ayn-engineering-chat-sessions-{calculatorType}
Value: same structure
```

- Each session gets a title from the first user message (truncated to 40 chars)
- Sessions are sorted by most recent
- Max 20 stored sessions (oldest auto-pruned)
- "New Chat" saves the current session (if it has messages) then starts a new empty one
- "History" shows a small popover with session titles to switch between

### UI Changes

**Bottom bar (Row 2) -- right side controls replaced:**

Before: `[trash] [minimize] [expand] [Brain AYN]`

After: `[History icon + "History"] [+ "New Chat"] [minimize] [Brain AYN]`

- **History**: Clock icon, opens a popover above the bar listing past sessions (title + relative time). Clicking one loads it. Current session highlighted.
- **New Chat**: Plus icon, saves current session to history and starts blank.
- Keep minimize button (users need it)
- Keep the AYN branding

### Technical Details

**Files to modify:**

| File | Changes |
|------|---------|
| `src/hooks/useChartCoach.ts` | Change storage from flat array to multi-session model. Add `sessions`, `activeSessionId`, `switchSession()`, `newChat()`. Export session list for the UI. |
| `src/components/dashboard/ChartCoachChat.tsx` | Replace right-side controls with History popover + New Chat button. Import `Popover` from radix. Remove standalone `Trash2` button. |
| `src/components/engineering/EngineeringAIChat.tsx` | Same pattern: multi-session localStorage keyed by calculator type, History popover + New Chat in the controls area. |

**History popover design:**
- Small popover (max 300px tall, scrollable) anchored to the History button
- Each item shows: truncated title (first message) + relative time ("2h ago", "Yesterday")
- Active session has amber highlight
- Empty state: "No previous chats"
- Clicking a session switches to it, popover closes

**Hook API changes (useChartCoach):**

```text
return {
  messages,          // current session messages
  isLoading,
  sendMessage,
  clearChat,         // renamed internally to newChat behavior
  sessions,          // array of { id, title, updatedAt }
  activeSessionId,
  switchSession,     // (id) => void
  newChat,           // () => void -- saves current, starts fresh
}
```

