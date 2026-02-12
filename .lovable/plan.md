
# Fix: Make War Room Agents Actually Talk to Each Other

## The Problem
Currently the `admin-war-room` edge function fires all agent prompts **in parallel** (line 83: `Promise.all`). Each agent only sees the topic -- they never see what other agents said. This means every response is directed at you, not at each other.

## The Fix
Change from parallel to **sequential** generation. Each agent's prompt includes the conversation so far, so they can reference, agree with, disagree with, or build on what previous agents said.

### Edge Function Changes (`supabase/functions/admin-war-room/index.ts`)

**Replace parallel `Promise.all` with a sequential loop:**

1. AYN (system) goes first -- sets the direction on the topic
2. Each subsequent agent receives a conversation history like:
   ```
   [Discussion so far]
   AYN: "Here's how I see it..."
   Chief of Staff: "I agree with AYN but..."
   
   Now it's YOUR turn. Respond to the discussion above.
   You can agree, disagree, challenge, or build on what others said.
   Reference other agents by name when responding to their points.
   ```
3. Each agent's response gets appended to the running thread before the next agent generates

**Updated prompt structure:**
- Include `[Discussion so far]` block with all previous agent messages
- Add instructions like "React to what others said. Agree, disagree, challenge, or build on their points. Reference them by name."
- Keep responses short (2-4 sentences) so the conversation feels snappy

### UI Enhancement (`WarRoomPanel.tsx`)

**Stream messages with delays** for a more natural feel:
- Instead of showing all messages at once, insert them into the DB one by one from the edge function
- The existing real-time Supabase subscription will pick them up and animate them in as they appear
- This creates the effect of watching a live conversation unfold

### Technical Detail

The edge function will:
1. Generate AYN's response first, insert it into `employee_discussions`, return it
2. Generate Agent 2's response (with AYN's message in context), insert it
3. Generate Agent 3's response (with AYN + Agent 2 in context), insert it
4. Continue until all agents have spoken

The frontend already has real-time subscriptions on `employee_discussions`, so messages will appear one by one as they're inserted -- creating a live discussion effect.

### Files to Modify
- `supabase/functions/admin-war-room/index.ts` -- Switch from parallel to sequential generation with conversation context threading
- `src/components/admin/workforce/WarRoomPanel.tsx` -- Minor tweak: set `currentDiscussionId` immediately so real-time subscription catches sequential inserts as they happen

### No New Files or Database Changes Needed
The existing `employee_discussions` table and real-time subscriptions handle everything.
