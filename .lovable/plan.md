
# Rebuild Command Center as a Natural Chat Interface

## Problem
The current Command Center feels robotic and fragmented:
1. **3 separate tabs** (Discuss, Command, Directives) force you to switch modes manually
2. **Every message triggers ALL agents** to give opinions sequentially (7-10 agents respond every time) -- this is the "discussion" mode that feels noisy
3. **Commands require rigid `@agent` syntax** -- unnatural
4. **No conversational memory** -- each message starts fresh, no back-and-forth
5. You want it to feel like chatting with AYN in the dashboard: you say something, AYN understands, and either executes immediately or asks for clarification

## Solution
Replace the 3-tab layout with a **single chat interface** powered by AYN as the orchestrator. AYN reads your message, decides what to do, and only brings in specific agents when needed -- not everyone every time.

### How it will work

```text
You: "Sales, go prospect 10 Canadian engineering firms"
AYN: "On it. Routing to Sales Hunter..."
     [Sales executes and returns results inline]

You: "What did security find last scan?"  
AYN: "Pulling Security Guard's last report..."
     [Shows security results]

You: "I want everyone's opinion on expanding to the US"
AYN: [Only THEN triggers multi-agent discussion]

You: "Focus only on Canada from now on"
AYN: "Directive saved. All agents will prioritize Canada."
```

### Technical Changes

**1. Frontend: `src/components/admin/workforce/CommandCenterPanel.tsx`**
- Remove the 3-tab layout (Discuss / Command / Directives)
- Replace with a single chat UI (same style as AdminAIAssistant)
- Chat-style message list with markdown support
- Keep directives as a collapsible sidebar/section, not a separate tab
- Show agent responses inline in the chat (with their emoji/name)
- Quick action buttons: "Add Directive", "Show Directives"

**2. Backend: `supabase/functions/admin-command-center/index.ts`**
- Add a new `chat` mode that replaces both `discuss` and `command`
- AYN (the orchestrator) receives the message first via a single LLM call
- AYN's system prompt includes instructions to:
  - Detect if the message is a **direct command** (route to specific agent, execute, return result)
  - Detect if it's a **question** (answer directly or pull data from a specific agent)
  - Detect if it's a **directive** (save it automatically, no need for a separate tab)
  - Detect if it's a **discussion request** ("what does everyone think?") -- only then trigger multi-agent
- Use tool calling to let AYN decide the action: `route_to_agent`, `save_directive`, `start_discussion`, `answer_directly`
- Return AYN's response + any agent results as a single chat message
- Maintain conversation history (send last N messages for context)

**3. Key UX improvements**
- Single input box -- no mode switching
- AYN responds first, fast, like a human chief of staff
- Agents only appear when relevant (not 10 opinions every time)
- Directives can be added naturally: "From now on, focus on Canada" -- AYN detects and saves it
- Past conversation context maintained so you can have back-and-forth
- Markdown rendering for rich responses (tables, lists, etc.)

### What stays the same
- Directives table and management (just accessible from within the chat or a small panel)
- Agent routing logic (the `AGENT_ROUTES` map)
- Activity logging to `ayn_activity_log`
- Past discussion history (viewable but not the primary UI)
