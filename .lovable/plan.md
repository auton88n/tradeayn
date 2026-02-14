

# Persistent Memory + Context-Aware Command Center

## Root Cause Analysis

The AI employees feel robotic because of three architectural gaps:

1. **No persistent memory**: Chat history lives only in browser state -- refresh and it's gone. The `admin_ai_conversations` table exists but the Command Center never reads from or writes to it.

2. **Agent results are invisible to AYN**: When Sales Hunter finds leads, that data is returned to the UI but never included in the conversation history sent back to AYN. So AYN literally cannot remember what any agent said or found.

3. **No session continuity**: You can't go back and see past conversations. Every visit starts blank.

## Solution

### 1. Persist Every Message to Database

**File: `src/components/admin/workforce/CommandCenterPanel.tsx`**

- On component mount, load the last 50 messages from `admin_ai_conversations` for the current admin
- After each user message and assistant response, save them to the database
- Include `tool_results` in the `context` JSONB column so agent findings are preserved
- Add a "conversation history" indicator showing past messages are loaded

### 2. Include Agent Results in Conversation Context

**File: `supabase/functions/admin-command-center/index.ts`**

- Change how history is built: instead of just `{ role, content }`, include a summary of tool results
- When an agent returns data (leads, scan results, etc.), append a condensed version to the assistant message in history
- Example: if Sales found 5 leads, the history entry becomes:
  ```
  role: "assistant"
  content: "Routing to Sales Hunter... [Sales Hunter found: Oickle's Property Management, Halifax Seed, ...]"
  ```
- This way AYN knows what happened in previous messages and can reference it

### 3. Load Past Conversations on Mount

**File: `src/components/admin/workforce/CommandCenterPanel.tsx`**

- On mount, query `admin_ai_conversations` for the current user's recent messages (last 50)
- Reconstruct `ChatMessage[]` from database rows including any saved tool results from the `context` column
- Show a subtle divider: "--- Previous conversation ---" between loaded history and new messages
- The trash button clears the UI but keeps the database records (or optionally archives them)

### 4. Richer History for AYN's Context Window

**File: `supabase/functions/admin-command-center/index.ts`**

- When building the `messages` array for the LLM call, enrich assistant messages with agent output summaries
- Cap at last 20 messages (instead of 10) to give AYN more memory
- For messages with tool results, format them as: `"[AYN] On it. [Sales Hunter] Found 5 leads: Company A, Company B..."`

## Technical Details

### Database Usage (existing table `admin_ai_conversations`)

Columns already available:
- `id` (uuid)
- `admin_id` (uuid) -- links to the logged-in admin
- `message` (text) -- the message content
- `role` (text) -- "user" or "assistant"
- `context` (jsonb) -- store tool_results, agent data here
- `actions_taken` (jsonb) -- store what tools were called
- `created_at` (timestamptz)

### Frontend Changes (`CommandCenterPanel.tsx`)

1. **On mount**: Load recent messages from `admin_ai_conversations` where `admin_id` = current user, ordered by `created_at`, limit 50
2. **After user sends**: Insert a row with `role: 'user'`, `message: text`
3. **After assistant responds**: Insert a row with `role: 'assistant'`, `message: data.message`, `context: { tool_results: data.tool_results }`, `actions_taken: { tools_called: [...] }`
4. **Build history for backend**: Include enriched content -- for assistant messages with tool_results in context, append agent summaries to the content string

### Backend Changes (`admin-command-center/index.ts`)

1. **Enrich history processing**: When receiving history entries, check if they have context with tool_results
2. **Build richer messages**: For each history entry with agent results, append a brief summary so AYN has full context
3. **Increase history window**: Change from `slice(-10)` to `slice(-20)` for better memory
4. **Add a `recall_context` tool** (optional): Let AYN explicitly query past agent results from the activity log when it needs to reference older data

### Expected Result

```
You: "Sales, find 5 leads in Halifax"
AYN: "On it."
Sales Hunter: "Found 5 high-intent leads: Oickle's Property Management, Halifax Seed..."

You: "Draft emails for the top 2"
AYN: "Got it -- drafting for Oickle's and Halifax Seed."  <-- AYN now remembers!
Sales Hunter: "Done. Two personalized emails ready..."

[Next day, you come back]
[Previous conversation loads automatically]

You: "What did Sales find yesterday?"
AYN: "Sales Hunter found 5 leads in Halifax yesterday. The top picks were Oickle's and Halifax Seed. We drafted emails for both -- want me to check if they were sent?"
```

