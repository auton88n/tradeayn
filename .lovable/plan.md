
## Paper Trading System -- Implementation Plan

### What We're Building

A complete paper trading infrastructure that automatically logs every trade signal AYN generates, monitors positions via Pionex price data, and displays live performance on a dedicated page. This makes AYN accountable -- users can see win rate, P&L, and trade history in real time.

---

### Phase 1: Database Schema (Migration)

Create 5 tables + 1 trigger:

**`ayn_account_state`** -- Single-row table tracking AYN's paper account
- starting_balance (default $10,000), current_balance, total_pnl_dollars/percent
- win/loss counts, win_rate, largest_win/loss, max_drawdown
- RLS: public SELECT, service-role-only writes

**`ayn_paper_trades`** -- Every trade AYN takes
- ticker, timeframe, signal (BUY/SELL)
- entry_price, entry_time, position_size_percent/dollars, shares_or_coins
- stop_loss_price, take_profit_1/2_price, take_profit_1/2_percent
- exit_price, exit_time, exit_reason, partial_exits (JSONB)
- pnl_dollars, pnl_percent, status (OPEN/CLOSED_WIN/CLOSED_LOSS/STOPPED_OUT/PARTIAL_CLOSE)
- confidence_score, setup_type, reasoning, chart_image_url, market_context (JSONB)
- Indexes on status, ticker, entry_time, signal
- RLS: public SELECT, service-role-only writes

**`ayn_daily_snapshots`** -- Daily equity curve data
- snapshot_date (unique), balance, daily_pnl, open_positions, wins/losses today
- RLS: public SELECT, service-role-only writes

**`ayn_weekly_summaries`** -- Weekly performance reports
- week_start/end, starting/ending balance, weekly_pnl
- best/worst trade ticker + pnl, best/worst setup_type, AI commentary
- RLS: public SELECT, service-role-only writes

**`ayn_setup_performance`** -- Track which setups work best
- setup_type (unique), total/winning/losing trades, win_rate, avg_win/loss, profit_factor
- RLS: public SELECT, service-role-only writes

**Trigger: `update_account_state`** -- Fires on `ayn_paper_trades` UPDATE when status changes from OPEN to closed. Auto-updates account balance, win/loss counts, and win_rate.

No `ayn_price_monitors` table -- monitoring will be handled inline by the monitor function querying open trades directly.

---

### Phase 2: Edge Functions

**NEW: `supabase/functions/ayn-open-trade/index.ts`**

Called automatically after chart analysis generates a BUY or SELL signal with confidence >= 60%.

Logic:
1. Validate signal is not WAIT and confidence >= 60
2. Check open positions count (max 3 concurrent)
3. Get current account balance from `ayn_account_state`
4. Calculate position size: 3% risk for confidence >= 80, 2% for >= 65, 1.5% otherwise
5. Calculate shares/coins from risk dollars / stop distance
6. Insert into `ayn_paper_trades` with status OPEN
7. Return trade record

Uses service role client for writes. CORS headers included.

Config: `[functions.ayn-open-trade] verify_jwt = false`

**NEW: `supabase/functions/ayn-monitor-trades/index.ts`**

Runs via cron every 5 minutes. Checks all OPEN trades against live Pionex prices.

Logic:
1. Query all OPEN/PARTIAL_CLOSE trades from `ayn_paper_trades`
2. For each trade, fetch current price from Pionex API (reuse HMAC signing pattern from analyze-trading-chart)
3. Check stop loss hit -> close trade as STOPPED_OUT with calculated P&L
4. Check TP1 hit -> partial close (50%), move stop to breakeven, update partial_exits JSONB
5. Check TP2 hit -> full close as CLOSED_WIN
6. The `update_account_state` trigger handles account balance updates automatically

Config: `[functions.ayn-monitor-trades] verify_jwt = false`

**UPDATE: `supabase/functions/analyze-trading-chart/index.ts`**

After building the result object (line 1016), before returning:
- If signal is BUY or SELL and confidence >= 60, invoke `ayn-open-trade` with the trade parameters
- Fire-and-forget (don't block the response on trade opening)
- Log success/failure but don't fail the analysis if trade opening fails
- Remove the disclaimer "TESTING MODE" text from line 1013

---

### Phase 3: Frontend

**NEW: `src/pages/Performance.tsx`**

Full performance dashboard page:
- Account stats grid (4 cards): Balance + P&L%, Total P&L $, Win Rate (W/L), Total Trades
- Equity curve chart using Recharts (from daily snapshots)
- Open Positions section with live unrealized P&L
- Recent Closed Trades table (last 20)
- Setup Performance breakdown (which setups have best win rate)

**NEW: `src/components/trading/OpenPositions.tsx`**

Displays all OPEN/PARTIAL_CLOSE trades:
- Ticker, signal, entry price, current price (from last monitor update stored in trade record or fetched client-side)
- Unrealized P&L (color-coded)
- Stop/TP1/TP2 levels
- Partial exits display
- Auto-refresh every 30 seconds via polling

**NEW: `src/components/trading/TradeHistoryTable.tsx`**

Table of closed trades:
- Ticker, signal, entry/exit prices, P&L%, setup type, duration
- Color-coded rows (green for wins, red for losses)

**NEW: `src/components/trading/PerformanceChart.tsx`**

Recharts line chart showing account balance over time from `ayn_daily_snapshots`.

**UPDATE: `src/App.tsx`**

Add route: `/performance` -> lazy-loaded `Performance` page

**UPDATE: `src/components/dashboard/ChartAnalyzerResults.tsx`**

- Add "Track This Position" link/badge that shows when a trade was auto-opened
- Link to `/performance` page

---

### Phase 4: Cron Job

Set up via SQL (using the insert tool, not migration):

```text
SELECT cron.schedule(
  'ayn-monitor-trades-every-5min',
  '*/5 * * * *',
  -- HTTP POST to ayn-monitor-trades edge function
);
```

This requires `pg_cron` and `pg_net` extensions enabled.

---

### Technical Notes

- All trade writes use service role client (edge functions only) -- no user can insert/modify trades
- Public read access allows any visitor to see AYN's performance (transparency)
- The trigger pattern for `update_account_state` keeps account stats consistent without manual calculation
- Position size calculation respects the $10,000 starting balance and conviction-based sizing from the active trader prompt
- No new API keys needed -- Pionex credentials already configured
- Edge functions `ayn-open-trade`, `ayn-monitor-trades`, and `analyze-trading-chart` need deployment
- Config.toml needs entries for both new functions
