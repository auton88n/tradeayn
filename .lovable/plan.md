

## Root Cause Analysis

Three issues found from network logs and code inspection:

### Issue 1: Intent stuck at "chat" — Pionex/Firecrawl never called
The network response shows `intent: "chat"` even though `mode: "trading-coach"` is sent. This means the entire `if (intent === 'trading-coach')` block (lines 900-1142 in `index.ts`) is **skipped** — no Pionex price fetch, no Firecrawl search, no live data injection. The AI then fabricates prices from its training data.

**Why**: The edge function likely has a stale deployment. The `mode` check on line 761 exists in local code but may not be live. Additionally, the frontend only sends `mode` but not `intent`, so `forcedIntent` is `undefined`.

**Fix**: Send `intent: 'trading-coach'` explicitly from the frontend alongside `mode`, so `forcedIntent` takes priority on line 761. This is belt-and-suspenders — works regardless of deployment state.

### Issue 2: FIRECRAWL_API_KEY is missing
The secrets list has 42 keys but **no `FIRECRAWL_API_KEY`**. The `firecrawlHelper.ts` falls back to raw fetch (no search capability) or returns errors.

**Fix**: Connect the Firecrawl connector.

### Issue 3: Stale error messages pollute context
The user's chat history still contains old "I couldn't process that" messages from before fixes. These get sent to the backend and waste context tokens.

**Fix**: Not a code issue — user just needs to start a "New Chat".

---

## Implementation Steps

### Step 1: `src/hooks/useChartCoach.ts` — Force intent
Add `intent: 'trading-coach'` to the request body so the backend uses it via `forcedIntent` (line 761), bypassing any `mode`/`detectIntent` issues:

```typescript
body: {
  message: trimmed,
  messages: conversationMessages,
  intent: 'trading-coach',   // <-- ADD THIS
  mode: 'trading-coach',
  stream: false,
  ...
}
```

### Step 2: `supabase/functions/ayn-unified/index.ts` — Add debug log
Add a console.log after intent detection to confirm the value in deployment logs. This also forces a fresh edge function deployment:

```typescript
console.log(`[ayn-unified] Intent resolved: ${intent}, forcedIntent=${forcedIntent}, mode=${mode}`);
```

### Step 3: Connect Firecrawl
Use the Firecrawl connector to inject `FIRECRAWL_API_KEY` into the project so web search and URL scraping work for the trading coach.

