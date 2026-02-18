
## Week 1 Essential Features — Implementation Plan

### What We Have Confirmed

- `ayn_daily_snapshots`: table exists, `UNIQUE(snapshot_date)`, has all required columns (`balance`, `daily_pnl_dollars`, `daily_pnl_percent`, `open_positions`, `trades_closed_today`, `wins_today`, `losses_today`). **Zero rows — never populated.**
- `ayn_setup_performance`: table exists, `UNIQUE(setup_type)`, has all required columns including `profit_factor`. **Zero rows — no trigger writing to it.**
- `ayn_circuit_breakers` / `ayn_error_log`: **Tables do not exist at all.**
- Trigger `trigger_update_ayn_account_state` on `ayn_paper_trades` EXISTS and fires AFTER UPDATE.
- **No daily snapshot cron job exists.** Only `ayn-monitor-trades-every-5min` is trading-related.
- No `ayn-daily-snapshot`, `ayn-close-trade`, or `kill-switch` edge functions exist.
- `ayn_setup_performance` has no trigger — nothing populates it.
- Current Performance tab renders correctly (hooks are properly ordered after last fix).

---

### What Will Be Built

#### Feature 1: Daily Snapshot Edge Function + Cron

**New file:** `supabase/functions/ayn-daily-snapshot/index.ts`

Logic:
1. Fetch `ayn_account_state` (current_balance, total_trades)
2. Fetch open positions count
3. Fetch yesterday's last snapshot to calculate daily P&L delta
4. Fetch all trades closed today (exit_time >= today midnight)
5. Upsert into `ayn_daily_snapshots` with `ON CONFLICT (snapshot_date) DO UPDATE` — so re-running it same day updates rather than errors
6. Return summary JSON

**Cron job** (added via SQL insert tool, not migration):
```
jobname: 'ayn-daily-snapshot'
schedule: '0 0 * * *'  (midnight UTC)
url: https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-daily-snapshot
```

Also: **Run it immediately on first deploy** to seed today's snapshot so the equity curve has at least one data point.

---

#### Feature 2: Setup Performance Trigger (Database Migration)

**New DB trigger function** `update_setup_performance()` that fires AFTER UPDATE on `ayn_paper_trades` when status changes from OPEN/PARTIAL_CLOSE to CLOSED_WIN/CLOSED_LOSS/STOPPED_OUT.

Logic uses atomic SQL:
- `INSERT ... ON CONFLICT (setup_type) DO NOTHING` to ensure row exists (handles `NULL` setup_type by coalescing to `'UNKNOWN'`)
- `UPDATE ayn_setup_performance SET total_trades = total_trades + 1, winning_trades = winning_trades + (CASE...), losing_trades = ...` — all increments are atomic, no off-by-one bug
- `win_rate` calculated as `(winning_trades + new_win)::DECIMAL / (total_trades + 1) * 100` — values captured into local variables BEFORE the SET clause runs to avoid the same trigger bug as `update_ayn_account_state`
- `avg_win_percent` updated with running average formula
- `profit_factor` recalculated as `SUM(wins) / ABS(SUM(losses))` using a subquery on the table itself (most reliable approach to avoid accumulation drift)

**Also fixes `update_ayn_account_state` trigger bug:** The win_rate calculation currently uses `winning_trades` and `total_trades` in the CASE expression BEFORE they're incremented. Fix: capture into local DECLARE variables first, then compute.

---

#### Feature 3: Manual Trade Close — Edge Function + UI Button

**New file:** `supabase/functions/ayn-close-trade/index.ts`

Logic:
1. Accept `{ tradeId, reason? }` in request body
2. Fetch trade — validate exists and is OPEN or PARTIAL_CLOSE
3. Attempt to get current price via same `getCurrentPrice()` helper used in `ayn-monitor-trades`
4. If price unavailable → use `entry_price` (breakeven close)
5. Calculate P&L: for BUY = `(exitPrice - entryPrice) * shares`, for SELL = `(entryPrice - exitPrice) * shares`
6. Account for any partial exits already booked in `pnl_dollars`
7. Update trade: `exit_price`, `exit_time`, `exit_reason: 'MANUAL_CLOSE'`, `pnl_dollars`, `pnl_percent`, `status: CLOSED_WIN or CLOSED_LOSS`
8. The existing `trigger_update_ayn_account_state` fires automatically and updates account balance

**UI change in `PerformanceDashboard.tsx`:**
- Add "Close" button to each `OpenPositionCard`
- Button calls `supabase.functions.invoke('ayn-close-trade', { body: { tradeId: trade.id } })`
- Shows loading state, then reloads data
- Styled: small, destructive variant, right-aligned inside the card

---

#### Feature 4: Error Log Table (Database Migration)

**New table:** `ayn_error_log`

```sql
CREATE TABLE ayn_error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,           -- e.g. 'PRICE_FETCH_FAILED', 'TRADE_INSERT_FAILED'
  component TEXT NOT NULL,            -- e.g. 'ayn-monitor-trades', 'ayn-open-trade'
  operation TEXT,                     -- e.g. 'getCurrentPrice', 'insertTrade'
  error_message TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'ERROR',      -- 'ERROR', 'WARN', 'CRITICAL'
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ayn_error_log_component ON ayn_error_log(component, created_at DESC);
CREATE INDEX idx_ayn_error_log_unresolved ON ayn_error_log(resolved) WHERE resolved = FALSE;

ALTER TABLE ayn_error_log ENABLE ROW LEVEL SECURITY;
-- Service role writes (edge functions use service role key, bypass RLS automatically)
-- Admin read
CREATE POLICY "Admin read error log" ON ayn_error_log 
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');
```

**Update `ayn-monitor-trades`:** When `getCurrentPrice()` fails (returns null), log a row to `ayn_error_log` with `component: 'ayn-monitor-trades'`, `error_type: 'PRICE_FETCH_FAILED'`, `context: { ticker, tradeId }`. This creates an audit trail and makes stuck trades visible.

---

#### Feature 5: Kill Switch + Circuit Breakers

**New table:** `ayn_circuit_breakers`

```sql
CREATE TABLE ayn_circuit_breakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breaker_type TEXT NOT NULL UNIQUE,  -- 'KILL_SWITCH', 'DAILY_LOSS_LIMIT'
  is_tripped BOOLEAN DEFAULT FALSE,
  tripped_at TIMESTAMPTZ,
  reason TEXT,
  threshold_value DECIMAL,
  current_value DECIMAL,
  auto_reset BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ayn_circuit_breakers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read circuit breakers" ON ayn_circuit_breakers FOR SELECT USING (true);
```

Seed two rows:
- `KILL_SWITCH` (manual override, auto_reset = FALSE, threshold_value = NULL)
- `DAILY_LOSS_LIMIT` (auto_reset = TRUE, threshold_value = -5 meaning -5% daily loss)

**New file:** `supabase/functions/ayn-kill-switch/index.ts`

Actions it handles:
- `{ action: 'trip', reason: '...' }` — sets `KILL_SWITCH.is_tripped = true`, sets `tripped_at`, logs to `ayn_activity_log`
- `{ action: 'reset' }` — sets `is_tripped = false`, clears `tripped_at`
- `{ action: 'status' }` — returns current state of all circuit breakers

**Update `ayn-open-trade`:** Before inserting any new trade, check `ayn_circuit_breakers` for any tripped breaker. If `KILL_SWITCH.is_tripped = true`, return `{ opened: false, reason: 'Kill switch active' }` immediately.

**UI change in `PerformanceDashboard.tsx`:**
- Add "Emergency Stop" button at top of page, styled prominently in red
- If kill switch is already active, show a green "Resume Trading" button instead
- Calls `ayn-kill-switch` function via `supabase.functions.invoke`
- Reads circuit breaker status from `ayn_circuit_breakers` table (already public read RLS)

---

### File Summary

| File | Type | Action |
|------|------|--------|
| `supabase/functions/ayn-daily-snapshot/index.ts` | Edge function | Create |
| `supabase/functions/ayn-close-trade/index.ts` | Edge function | Create |
| `supabase/functions/ayn-kill-switch/index.ts` | Edge function | Create |
| `supabase/functions/ayn-monitor-trades/index.ts` | Edge function | Update (add error logging) |
| `supabase/functions/ayn-open-trade/index.ts` | Edge function | Update (add circuit breaker check) |
| `src/components/trading/PerformanceDashboard.tsx` | React component | Update (Close button, Kill Switch button, circuit breaker state) |
| DB migration | SQL | Create `ayn_error_log`, `ayn_circuit_breakers` tables + seed rows |
| DB migration | SQL | Create `update_setup_performance()` trigger function + trigger |
| DB migration | SQL | Fix `update_ayn_account_state()` win_rate calculation bug |
| SQL insert | cron.schedule | Add `ayn-daily-snapshot` midnight cron job |
| SQL insert | cron.schedule seed | Trigger first snapshot manually after deploy |

---

### Implementation Order

1. DB migrations first (tables + triggers) — no code depends on them yet
2. Seed circuit breakers rows
3. Deploy `ayn-daily-snapshot` + add cron + immediately call it once to seed today's data point
4. Deploy `ayn-close-trade`
5. Deploy `ayn-kill-switch`
6. Update `ayn-open-trade` (circuit breaker check)
7. Update `ayn-monitor-trades` (error logging)
8. Update `PerformanceDashboard.tsx` (Close button + Kill Switch UI)

No new RLS policy issues — all new tables follow existing pattern (service role writes via edge functions, public or admin read for display).
