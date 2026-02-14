

# Make Command Center Feel Like a Real Team Chat

## Problems Identified

1. **Agent commands fail silently**: When you say "Sales, prospect 5 Canadian firms," AYN routes to Sales Hunter with `mode: prospect` but the Sales function expects a `url` parameter, not a natural language command. Result: `{"error": "URL is required"}` -- raw JSON shown to you.

2. **Raw JSON instead of conversation**: Agent results are displayed as expandable JSON blocks, not as human messages. This kills the "team" feeling.

3. **No agent intelligence in routing**: AYN passes a generic `command` string but doesn't translate your intent into the correct parameters each agent needs (e.g., Sales needs `search_query` for finding leads, not `url`).

4. **Agents can't talk back naturally**: There's no step where the agent's raw result gets turned into a human-readable message.

## Solution

### 1. Smart Command Translation (Backend)

**File: `supabase/functions/admin-command-center/index.ts`**

Replace the dumb `executeAgentCommand` with an intelligent two-step process:

- **Step A**: Before calling the agent function, use AYN to translate the natural language command into the correct parameters for that specific agent. For example:
  - "prospect 5 Canadian firms" becomes `{ mode: 'search_leads', search_query: 'engineering firms Halifax Canada' }` then iterates through results with `{ mode: 'prospect', url: '...' }`
  - "what did security find?" becomes `{ mode: 'scan' }` (already works)

- **Step B**: After the agent returns raw JSON, make a quick LLM call to have that agent summarize their result in natural language (1-3 sentences, in character). This replaces raw JSON with a human message.

### 2. Agent Results as Chat Messages (Frontend)

**File: `src/components/admin/workforce/CommandCenterPanel.tsx`**

- Replace the `ToolResultCard` JSON accordion with **chat-style agent messages**
- Agent results appear as messages from that agent (with their emoji, name, colored accent)
- Raw JSON hidden behind an optional small "technical details" toggle (not prominent)
- Error results shown as the agent speaking: "I need a company URL to prospect. Can you give me one?" instead of `{"error": "URL is required"}`

### 3. Agent-Specific Command Routing

Update the `route_to_agent` tool to include smarter parameter mapping:

```text
Sales commands:
  "prospect [company]" -> search_leads first, then prospect each
  "draft email for [lead]" -> draft_email with lead_id
  "pipeline status" -> pipeline_status
  "find [query]" -> search_leads

Security commands:
  "scan" / "check" -> scan mode
  
Investigator commands:
  "investigate [topic]" -> investigate mode
```

AYN's tool call will include a `parameters` object that maps directly to what the agent function expects, instead of just passing a raw string.

### 4. Natural Language Result Interpretation

After every agent execution, add a quick LLM call:

```text
System: "You are [Sales Hunter]. Summarize this result for the founder in 1-3 sentences. 
         Be direct, stay in character. If there's an error, explain what you need."
User: [raw JSON result]
Result: "Found 5 engineering firms in Halifax. Top pick is McInnes Cooper - they have 
         a solid web presence and likely need our tools. Want me to draft outreach?"
```

This makes every agent response feel like a real team member talking.

## Technical Details

### Backend Changes (`supabase/functions/admin-command-center/index.ts`)

1. **Update `route_to_agent` tool definition** to include an optional `parameters` field so AYN can pass structured params:
   ```
   parameters: {
     agent: "sales",
     command: "prospect 5 Canadian firms",
     agent_params: { mode: "search_leads", search_query: "engineering firms Canada Halifax" }
   }
   ```

2. **Update `executeAgentCommand`** to:
   - Accept optional `agent_params` that override the default mode
   - If no `agent_params`, use a quick LLM call to translate command to params
   - After getting raw result, make a second LLM call to generate a natural language summary
   - Return both `result` (raw) and `message` (natural language) fields

3. **Update AYN system prompt** to instruct it to include `agent_params` when possible, mapping user intent to the correct agent function parameters

### Frontend Changes (`src/components/admin/workforce/CommandCenterPanel.tsx`)

1. **Update `ToolResultCard`** for `agent_result` type:
   - Show agent message as a chat bubble (like AYN's messages but with agent's color/emoji)
   - Display `result.message` (natural language) as the primary content
   - Keep raw JSON in a small collapsible "Details" section
   - For errors, show the agent's natural language explanation

2. **Update error display**: Instead of red error boxes, show the agent speaking about what went wrong

### Example Flow After Changes

```text
You: "Sales, find me 5 engineering firms in Halifax to offer free trials"

AYN: "On it. Sending Sales Hunter to search Halifax."

Sales Hunter: "Found 5 engineering firms in Halifax:
1. Smith Engineering - structural focus, 12 employees
2. Atlantic Design Group - civil engineering, 8 employees  
3. ...
Want me to start prospecting and drafting outreach emails?"

You: "Yes, draft emails for the top 3"

AYN: "Sales Hunter is drafting now..."

Sales Hunter: "Done. Drafted personalized outreach for Smith Engineering, 
Atlantic Design, and Maritime Structural. Each email highlights our free 
trial and Nova Scotia roots. Ready to send on your approval."
```

