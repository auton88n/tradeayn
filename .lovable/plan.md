
# Fix: Validator Over-Triggering + Response Speed

## Two Root Causes Diagnosed

### Problem 1: Validator Incorrectly Blocks Legitimate Trade Responses

**What is happening (confirmed by reading the code):**

When the user says "create new trade based on best token to invest":
1. `wantsAutonomousTrading = true` — market scanner runs
2. AI generates a response with `EXECUTE_TRADE: {...}` block
3. The EXECUTE_TRADE parser fires `ayn-open-trade`, gets confirmation, and rewrites `responseContent` to include:  
   `"✅ Position opened successfully. Trade ID: abc12345\nTracking live on Performance tab."`  
   It also includes the trade announcement: **"I'M BUYING IO_USDT AT $0.11"**
4. **The validator then runs** — it sees `$0.11` in the response, checks it against `allowedDollars` (which was built from the account state fetched at the START of the request, before the trade was opened). The new trade's entry price is NOT in `allowedDollars` yet because the account hasn't been re-fetched.
5. **Violation detected → AI response wiped → user sees boring account summary**

This explains exactly what the screenshot shows: a legitimate trade execution (IO_USDT entry $0.11 → exit $0.11) becoming a flat sanitized dump.

**The fix:** The validator must be skipped when `wantsAutonomousTrading = true`. In autonomous mode, the AI's job is to execute a NEW trade — it will necessarily include market prices that aren't in the old account snapshot. Validating a trade execution response with stale pre-trade data is guaranteed to produce false positives.

The guard condition changes from:
```typescript
if (intent === 'trading-coach' && !effectiveStream && accountPerformance !== null) {
```
to:
```typescript
if (intent === 'trading-coach' && !effectiveStream && accountPerformance !== null && !wantsAutonomousTrading) {
```

One line change. This is the critical fix.

### Problem 2: Slow Responses

Three contributing factors:

**A) Market scanner is slow** — `scanMarketOpportunities()` fetches klines for up to 15-20 pairs in parallel from Pionex. Each kline fetch is a separate HTTP call. The total wall time can be 8-15 seconds before the LLM even gets called.

**B) The LLM call itself** — `callWithFallback` does a blocking `await supabase.from('llm_usage_logs').insert(...)` and `await supabase.from('llm_failures').insert(...)` synchronously. This adds 50-150ms of database latency inside every LLM call. These logs are not needed synchronously — they should be fire-and-forget.

**C) System prompt is massive** — The assembled system prompt (`buildSystemPrompt() + performanceContext + chartSection + scanContext + INJECTION_GUARD`) can easily exceed 8,000-12,000 tokens. Larger context = slower model response.

**Fixes for speed:**

1. **Make DB logging in `callWithFallback` non-blocking** — Wrap both `llm_usage_logs` and `llm_failures` inserts in `.then()` / fire-and-forget. This saves 100-200ms per call.

2. **Reduce market scanner scope** — Currently `scanMarketOpportunities()` scans every pair it can find. Cap the list of pairs to scan to the 10 most liquid (BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX, LINK, DOT). This reduces kline fetches from ~20 to 10, cutting scanner time roughly in half.

3. **Trim the conversation history sent to the LLM** — Currently history is capped at 10 messages × 500 chars each. Reduce to **8 messages × 400 chars** for trading-coach intent. Less context = faster response.

---

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/ayn-unified/index.ts` | (1) Add `&& !wantsAutonomousTrading` to validator guard; (2) Make `llm_usage_logs` and `llm_failures` inserts non-blocking; (3) Trim history to 8 messages for trading-coach |
| `supabase/functions/ayn-unified/marketScanner.ts` | Cap the pairs list to the top 10 liquid coins to reduce HTTP calls |

---

## What This Does NOT Change

- The validator logic itself is correct — it stays as-is for genuine performance queries
- The prompt engineering fixes stay
- The fee/slippage modeling stays
- No database migrations needed

---

## Expected Result

**Before fix:** User says "create new trade" → validator wipes the legitimate trade confirmation → user sees boring account summary → looks like AYN isn't listening

**After fix:** User says "create new trade" → market scanner runs → AI picks best setup → EXECUTE_TRADE fires → user sees "I'M BUYING [TICKER]" with confirmation — validator correctly skipped

**Speed improvement:** ~200-400ms saved from non-blocking DB logs + ~30-50% faster for autonomous trading queries from reduced scanner scope

---

## Technical Details

### Change 1: validator guard (`index.ts` ~line 1590)
```typescript
// BEFORE
if (intent === 'trading-coach' && !effectiveStream && accountPerformance !== null) {

// AFTER
if (intent === 'trading-coach' && !effectiveStream && accountPerformance !== null && !wantsAutonomousTrading) {
```

### Change 2: non-blocking logs in `callWithFallback` (~line 314)
```typescript
// BEFORE
await supabase.from('llm_usage_logs').insert({ ... });

// AFTER (fire-and-forget)
supabase.from('llm_usage_logs').insert({ ... }).then(({ error }) => {
  if (error) console.error('Failed to log usage:', error);
});
```

### Change 3: reduced scanner pair list (`marketScanner.ts`)
Cap the `TOP_PAIRS` array to the 10 highest-liquidity coins instead of 15-20.

### Change 4: tighter history slice for trading-coach
```typescript
// Reduce from last 10 to last 8 messages for trading-coach
const MAX_HISTORY = intent === 'trading-coach' ? 8 : 10;
```
