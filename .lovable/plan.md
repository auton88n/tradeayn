
# Fix the Command Center Orchestration Layer

## The Real Problem (Not Fake Agents)

Your 9 AI agents are fully built and functional. The problem is the **middle layer** -- the Command Center orchestrator -- that sits between you and them. It:
- Sometimes sends wrong parameters to agents, causing silent failures
- Swallows errors instead of showing you what went wrong
- Shows empty responses when the natural-language summary LLM call fails
- Has no "working..." feedback so it looks like nothing is happening

## What We'll Fix

### 1. Reliable Agent Execution Feedback (Backend)

**File: `supabase/functions/admin-command-center/index.ts`**

- When `generateAgentMessage` returns empty (LLM call failed), fall back to a simple summary built from the raw result instead of showing nothing
- Add explicit error messages that explain what happened in plain language: "Sales Hunter needs a company URL to prospect. Try: 'prospect https://example.com'" instead of silence
- Log every execution attempt so you can see what's happening

### 2. Real-Time Execution Status (Frontend)

**File: `src/components/admin/workforce/CommandCenterPanel.tsx`**

- Add a "thinking..." indicator that shows which agent is being called: "Routing to Sales Hunter..." with a spinner
- When agent results come back empty or with errors, show a clear message from the agent explaining what they need
- Make the "Technical details" toggle more visible so you can inspect raw results when needed
- Add a status indicator per agent response: green checkmark (success), red X (failed), yellow warning (partial)

### 3. Smarter Fallback Messages

When the natural-language summary LLM call fails (returns empty), instead of showing nothing:
- Build a simple summary from the raw JSON: "Sales Hunter: Found 5 leads" or "Security Guard: All clear, no threats"
- This ensures you ALWAYS see something from every agent call

### 4. Better Error Recovery

- If an agent function returns an error, show it as the agent talking: "Hey, I need a URL to prospect. Can you share the company website?"
- Never show raw JSON errors -- always convert to conversational text

## Technical Details

### Backend (`admin-command-center/index.ts`)

1. Update `generateAgentMessage` to have a **fallback summary builder**:
   - If LLM call fails, parse the raw result and build a simple human-readable summary
   - For errors: extract the error message and wrap it in the agent's voice
   - For success: count items found, summarize key data points

2. Update `executeAgentCommand` to always return a non-empty `message` field

3. Add parameter validation hints in error responses so AYN can self-correct

### Frontend (`CommandCenterPanel.tsx`)

1. Add a "working" state that shows agent name + spinner while waiting
2. Update agent result rendering:
   - Always show the agent's message (never blank)
   - Color-code: green border for success, red for errors, amber for warnings
   - Make "Technical details" toggle slightly more prominent
3. Add a retry button on failed agent calls
