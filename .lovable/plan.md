

## Issues Found & Fix Plan

### Problem 1: Build Error — `admin-notifications/index.ts` uses `npm:resend@2.0.0`
Line 2 of `supabase/functions/admin-notifications/index.ts` imports `import { Resend } from "npm:resend@2.0.0"`. This Deno `npm:` specifier is failing because there's no `deno.json` with the right config. Fix: switch to an `esm.sh` import like the rest of the codebase uses.

### Problem 2: AI Chat Giving Inaccurate / Fabricated Data
The conversation shows the AI saying timestamps like "2024-05-22" and making up prices. Two root causes:

1. **Timestamp injection missing**: The scanner injects live data but never tells the AI what the current date/time actually is. The AI falls back to training data dates.
2. **AI claims it has no live connection**: When the scanner returns no results or isn't triggered, the anti-fabrication guard tells the AI it has no data — but then the AI tells the user "I don't have a live connection to the API", which contradicts the product. The guard language needs to tell the AI to prompt the user to say "find best token" instead of admitting architectural limitations.
3. **Knowledge base IS connected** — `tradingKnowledgeBase.ts` (765 lines, 12 sections) is imported via `getContextualKnowledge()` and injected at line 228 of `systemPrompts.ts`. This part works correctly.

### Problem 3: Solscan API Integration Requested
User wants to add `https://pro-api.solscan.io/pro-api-docs/v2.0/reference/v2-account-detail` — this is a Solana blockchain explorer API for on-chain wallet analysis. Will need a `SOLSCAN_API_KEY` secret and integration into the trading coach flow.

---

### Implementation Steps

**Step 1: Fix admin-notifications build error**
- Replace `import { Resend } from "npm:resend@2.0.0"` with `import { Resend } from "https://esm.sh/resend@2.0.0"` in `supabase/functions/admin-notifications/index.ts` line 2.

**Step 2: Fix AI timestamp and anti-fabrication issues in `index.ts`**
- Inject current UTC timestamp into the system prompt so the AI always knows the real date/time (around line 879 where `systemPrompt` is built).
- Rewrite the anti-fabrication guard (lines 871-876) to stop the AI from saying "I don't have a live connection" — instead instruct it to say "Say 'find best token' and I'll scan live Pionex data for you."
- Add timestamp to scan results context (line 851) so the AI uses real timestamps.

**Step 3: Add Solscan API integration**
- Request user to provide their Solscan Pro API key (stored as `SOLSCAN_API_KEY` secret).
- Add a Solana wallet lookup function in `index.ts` that calls `https://pro-api.solscan.io/v2.0/account/detail` when the user provides a Solana address.
- Add Solana address detection regex to the trading-coach flow (detects base58 addresses starting with common patterns).
- Inject wallet data (SOL balance, token holdings, recent activity) into the system prompt for the AI to analyze.

### Technical Details

**Solscan API integration pattern:**
```text
User message contains Solana address (32-44 char base58)
  → Detect in trading-coach flow
  → GET https://pro-api.solscan.io/v2.0/account/detail?address={addr}
  → Headers: { token: SOLSCAN_API_KEY }
  → Inject wallet summary into systemPrompt
  → AI analyzes holdings and activity
```

**Timestamp fix pattern:**
```text
systemPrompt += `\nCURRENT TIMESTAMP: ${new Date().toISOString()} UTC`
```

**Anti-fabrication rewrite:**
Instead of "You do NOT have live market data right now", say:
"You can access live market data. If the user asks about specific coins, use the LIVE MARKET DATA sections injected above. If no live data is present for their coin, tell them: 'Say find best token and I'll scan the market live for you.' NEVER say you don't have API access or a live connection."

