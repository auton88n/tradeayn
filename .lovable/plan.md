

# Plan: Replace Telegram Group Chat with Admin Panel War Room + Make AYN More Human

## What's Changing

### 1. Remove Telegram Group Chat Feature
- Remove the group chat routing block from `ayn-telegram-webhook/index.ts` (lines 211-228) that intercepts `TELEGRAM_GROUP_CHAT_ID` messages
- Delete `supabase/functions/_shared/groupChat.ts` entirely
- The group Telegram bots stay registered in the database (they're still used for deliberation broadcasts), but they no longer respond to user messages in the group

### 2. Add "War Room" Panel to Admin Dashboard
Create a new admin panel section where you can watch your AI agents discuss topics in real-time, right inside the admin UI.

- **New component**: `src/components/admin/workforce/WarRoomPanel.tsx`
  - A chat-like UI showing agent discussions with their names, emojis, and timestamps
  - You can type a topic/question and trigger a multi-agent discussion from the panel
  - Each agent's message appears with their identity (Sales Hunter, Security Guard, etc.)
  - Messages are stored in a new `agent_discussions` or reuse the existing `employee_discussions` table
  - Real-time updates via Supabase subscription so messages appear live

- **New edge function**: `supabase/functions/admin-war-room/index.ts`
  - Authenticated endpoint (admin only)
  - Takes a topic/message, selects relevant agents (same keyword logic from groupChat.ts), generates their responses via LLM, and inserts them into the database
  - Returns the discussion thread

- **Sidebar update**: Add "War Room" tab to `AdminSidebar.tsx` under the AI Tools section

### 3. Call Individual Agents from Admin AI Assistant
Enhance `AdminAIAssistant.tsx` and the `admin-ai-assistant` edge function so you can summon specific agents:
- Type things like "ask Sales about the pipeline" or "@security check threats"
- The assistant routes to the specific agent's personality, gets their response, and shows it in the chat with their identity
- This makes the AI Assistant the central control hub for your entire workforce

### 4. Make AYN's Telegram Responses More Human
Update the system prompt in `ayn-telegram-webhook/index.ts` to make AYN feel like a real person:

**Current behavior**: Short, robotic responses to casual messages like "hi"

**New behavior**: Add instructions to the `HOW YOU TALK` section:
- For casual greetings ("hi", "hey", "good morning"), respond warmly with a real paragraph -- share what's happening with the company, mention recent activity, give a status update naturally
- Vary response length based on context: casual chat gets longer, warmer responses; urgent requests stay concise
- Add personality traits: occasional humor, references to shared history, proactive updates
- Example: Instead of "Hey! What can I help with?" respond with something like "Hey! Good to see you. Been keeping busy -- we got 3 new applications this morning, Sales has been working on that tech lead from yesterday, and Security flagged a couple of suspicious login attempts but nothing serious. The team's in good shape. What's on your mind?"

### 5. Verify Existing Panels Work
- **AYN Logs** (`AYNActivityLog.tsx`): Already has real-time subscription and filtering -- no changes needed, just verify it loads
- **AYN Workforce** (`WorkforceDashboard.tsx`): Already shows employee cards, health, tasks, activity feed, and collaboration graph -- no changes needed
- **AYN Mind** (`AYNMindDashboard.tsx`): Already shows observations, ideas, thoughts, trends, moods, sales leads -- no changes needed

---

## Technical Details

### Files to Delete
- `supabase/functions/_shared/groupChat.ts`

### Files to Modify
- `supabase/functions/ayn-telegram-webhook/index.ts` -- Remove group chat routing (lines 211-228), remove import of `handleGroupConversation`
- `supabase/functions/ayn-telegram-webhook/index.ts` -- Update `HOW YOU TALK` section in system prompt for more human/conversational tone with longer greeting responses
- `src/components/admin/AdminSidebar.tsx` -- Add "War Room" tab
- `src/components/admin/AdminAIAssistant.tsx` -- Add agent-summoning capability (detect @agent or "ask [agent]" patterns)

### Files to Create
- `src/components/admin/workforce/WarRoomPanel.tsx` -- In-panel multi-agent discussion UI
- `supabase/functions/admin-war-room/index.ts` -- Edge function to trigger and return agent discussions

### Database
- Reuse existing `employee_discussions` table for storing war room conversations, or add a lightweight `war_room_messages` table if the schema doesn't fit

### Edge Function Deployment
- Redeploy `ayn-telegram-webhook` (group chat removal + prompt update)
- Deploy new `admin-war-room` function

