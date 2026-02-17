

## Live Trade Tracking + AI Decision Memory

Two enhancements to the Performance tab: (1) real-time updates when trades open/close from chat, and (2) a new "AI Decision Log" section showing why AYN picked each trade.

### Part 1: Real-Time Updates via Supabase Realtime

Currently the Performance dashboard polls every 30 seconds. When AYN opens a trade from chat, it won't show up for up to 30 seconds. We'll add Supabase Realtime subscriptions so trades appear instantly.

**Database change (SQL):**
- Add `ayn_paper_trades` and `ayn_account_state` to the Supabase realtime publication so the frontend can subscribe to INSERT/UPDATE events.

**`src/components/trading/PerformanceDashboard.tsx`:**
- Add a Supabase realtime subscription on `ayn_paper_trades` (INSERT and UPDATE events). On any change, call `loadData()` to refresh all data immediately.
- Add a second subscription on `ayn_account_state` for UPDATE events (balance changes when trades close).
- Keep the 30-second polling as a fallback, but realtime will handle instant updates.
- Add a small pulsing green dot indicator next to "Open Positions" header to show the dashboard is live-connected.

### Part 2: AI Decision Log (Reasoning Memory)

The `ayn_paper_trades` table already has `reasoning` (text), `market_context` (jsonb), `setup_type`, and `confidence_score` columns. The `ayn-open-trade` function already stores these when provided. The `EXECUTE_TRADE` JSON from ayn-unified already passes `reasoning` and `setupType`.

We need to:

**A. Enrich the EXECUTE_TRADE data** -- `supabase/functions/ayn-unified/index.ts`
- When auto-executing, also pass `marketContext` from the scan results (signals, score, volume data) to `ayn-open-trade`. Currently only `ticker`, `signal`, `entryPrice`, etc. are sent. Add the scan opportunity data as `marketContext` so it gets persisted.

**B. Add "AI Decision Log" card to Performance dashboard** -- `src/components/trading/PerformanceDashboard.tsx`
- New expandable card section titled "AI Decision Log" below Recent Trades
- Shows each trade (open and closed) with:
  - Ticker, signal, confidence score as a badge
  - The `reasoning` text (why AYN picked this trade)
  - The `market_context` JSON rendered as signal tags (e.g., "Volume surge +340%", "Strong momentum +4.2%")
  - Setup type
  - Entry time
  - Outcome (if closed): win/loss, P&L
- Each row is expandable (Collapsible) to show the full reasoning and market context
- This lets you analyze HOW AYN thinks and find patterns in its decision-making

### Part 3: Enrich EXECUTE_TRADE with scan context

**`supabase/functions/ayn-unified/systemPrompts.ts`:**
- Update the EXECUTE_TRADE JSON format instruction to include `reasoning` and `marketContext` fields:
  ```
  EXECUTE_TRADE: {"ticker":"BTC_USDT","signal":"BUY","entryPrice":51200,
    "stopLoss":50800,"takeProfit1":52100,"takeProfit2":53000,
    "confidence":75,"setupType":"Volume Breakout",
    "reasoning":"Strong momentum with volume surge at key support level...",
    "marketContext":{"score":82,"signals":["Volume surge +340%","Strong momentum +4.2%"],"volume24h":45000000}}
  ```

### Technical Details

**SQL to run:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE ayn_paper_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE ayn_account_state;
```

**Files to modify:**
1. `src/components/trading/PerformanceDashboard.tsx` -- Add realtime subscriptions + AI Decision Log card
2. `supabase/functions/ayn-unified/index.ts` -- Pass scan data as `marketContext` when auto-executing trade
3. `supabase/functions/ayn-unified/systemPrompts.ts` -- Add `reasoning` and `marketContext` to EXECUTE_TRADE format

**No new tables or edge functions needed.** All the columns already exist in `ayn_paper_trades`.

### Result
- Trade opens from chat --> appears on Performance tab within 1-2 seconds (realtime)
- Trade gets stopped out or hits TP --> updates instantly
- Every trade shows WHY AYN picked it (reasoning, signals, confidence)
- You can scroll through the Decision Log to see patterns in AYN's thinking and find areas to improve the scoring/strategy

