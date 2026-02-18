
# Phase 3: Advanced Metrics & Adaptive Risk Management — Implementation Plan

## What I Confirmed by Reading the Code

### Current Database State (confirmed with live query)
`ayn_account_state` currently has 14 columns: `id`, `starting_balance`, `current_balance`, `total_pnl_dollars`, `total_pnl_percent`, `total_trades`, `winning_trades`, `losing_trades`, `win_rate`, `largest_win_percent`, `largest_loss_percent`, `max_drawdown_percent`, `updated_at`, `created_at`.

**Missing entirely:** `sharpe_ratio`, `sortino_ratio`, `profit_factor`, `expectancy`, `avg_trade_duration_hours`, streak tracking, `recovery_factor`, `avg_win_size`, `avg_loss_size`.

`ayn_paper_trades` has 27 columns. The `position_sizing_reasoning` column does **not** exist — must be added via migration.

`ayn_circuit_breakers` has `id`, `breaker_type`, `is_tripped`, `tripped_at`, `reason`, `threshold_value`, `current_value`, `auto_reset`, `created_at`, `updated_at`. It does **not** have a `reset_at` column — the CONSECUTIVE_LOSSES circuit breaker insert in the plan must not use that column.

Two circuit breaker rows exist: `KILL_SWITCH` (auto_reset=false) and `DAILY_LOSS_LIMIT` (auto_reset=true, threshold=-5%).

### Current `scanMarketOpportunities()` (confirmed, lines 526–617 of ayn-unified)
Currently uses only: 24h price change (open→close), USDT volume (`amount` field), and a simple consolidation/overextension check. Score threshold is 65. **No technical indicators whatsoever.** The plan to add RSI, MAs, Bollinger Bands, and MACD is the correct upgrade path.

### Current `ayn-open-trade` position sizing (confirmed, lines 99–101)
Exactly as described: 3 hardcoded tiers (confidence≥80→3%, <65→1.5%, else 2%). No adaptive logic. `supabase` client is not a module-level variable — it is scoped inside `Deno.serve()`, so the `calculateAdaptiveRisk` helper function must either receive it as a parameter or be inlined. The plan's code passes `supabase` as a free variable which won't compile — this must be fixed.

### AIDecisionLog (confirmed)
Currently shows: reasoning text, market_context signals array, entry/exit price, score. Position sizing reasoning is NOT displayed. Adding it requires only a small UI change to `AIDecisionLog.tsx` and reading from the new `position_sizing_reasoning` column.

### `ayn_circuit_breakers` upsert approach for CONSECUTIVE_LOSSES
The plan uses `supabase.from('ayn_circuit_breakers').insert({...})` for CONSECUTIVE_LOSSES. However the table has a unique constraint on `breaker_type`. Must use `upsert` with `onConflict: 'breaker_type'` to avoid insert errors if the row already exists. Also, the plan references a `reset_at` column that does not exist — this will be excluded.

---

## Scope Adjustments (Pragmatic)

The requested plan has 4 features. Three are straightforward. One (Feature 3: Enhanced Market Scanner) is high-risk for a different reason: the `scanMarketOpportunities` function runs inside `ayn-unified/index.ts` (1,601 lines), which already has complex bundling requirements per the architecture memory. Adding 200+ lines of technical indicator math inline would risk hitting the 60s deployment timeout. The scanner upgrade is therefore architected as a **separate internal helper function file** (`ayn-unified/marketScanner.ts`) imported by the main index, keeping the bundle modular.

---

## Implementation Plan — All 4 Features

### Step 1: Database Migrations (2 migrations)

**Migration 1: Add advanced metrics columns to `ayn_account_state`**
```sql
ALTER TABLE ayn_account_state
  ADD COLUMN IF NOT EXISTS sharpe_ratio DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sortino_ratio DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_factor DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expectancy DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_trade_duration_hours DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_win_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_loss_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_win_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_loss_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_drawdown_duration_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovery_factor DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_win_size DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_loss_size DECIMAL DEFAULT 0;
```

**Migration 2: Add position sizing reasoning column to `ayn_paper_trades`**
```sql
ALTER TABLE ayn_paper_trades
  ADD COLUMN IF NOT EXISTS position_sizing_reasoning TEXT[] DEFAULT '{}';
```

No `reset_at` column is needed on `ayn_circuit_breakers` — the consecutive loss breaker will store its cooldown context in the existing `reason` text field.

---

### Step 2: New Edge Function — `ayn-calculate-metrics`

**File: `supabase/functions/ayn-calculate-metrics/index.ts`**

This is a standalone, lightweight function that:
1. Fetches all closed trades from `ayn_paper_trades` ordered by `exit_time ASC`
2. Computes all 13 advanced metrics using pure math (no external imports needed — all helper functions inlined)
3. Updates `ayn_account_state` with the computed values
4. Returns the full metrics payload for debugging

**Key implementation details:**
- Uses `Deno.serve()` (not `serve` from deno std) to match the deployment standard
- The `await supabase` issue from the plan's `calculateAllMetrics` function is fixed: the function accepts `startingBalance` as a parameter rather than re-querying inside the metric calculation loop
- `calculateStreaks` iterates trades in chronological order (already sorted by `exit_time ASC`) — produces both `currentWin`/`currentLoss` (the trailing streak) and `longestWin`/`longestLoss`
- `calculateDrawdownDuration` walks the cumulative P&L curve tracking when balance fell below the prior peak and when it recovered
- Expectancy formula: `(winRate × avgWin) - ((1 - winRate) × avgLoss)` — expressed in dollars, not percent
- Sharpe and Sortino use `pnl_percent` returns (trade-level, not daily returns, which is the practical approach for a trade-by-trade system)
- Add entry to `supabase/config.toml`: `[functions.ayn-calculate-metrics] verify_jwt = false`

**Cron schedule (runs 10 min after daily snapshot at 00:10 UTC):**
```sql
SELECT cron.schedule(
  'ayn-calculate-metrics-daily',
  '10 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ayn-calculate-metrics',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw"}'::jsonb,
    body:='{"trigger":"cron"}'::jsonb
  ) AS request_id;
  $$
);
```
(Same anon key approach as the existing daily-snapshot cron — idempotent compute with no risk from unauthorized calls.)

---

### Step 3: Update `ayn-open-trade` — Adaptive Position Sizing (Feature 2) + Streak Breaker (Feature 3)

**File: `supabase/functions/ayn-open-trade/index.ts`**

The entire function is refactored. The `calculateAdaptiveRisk` helper is defined **above** `Deno.serve()` and accepts `supabase` as its first parameter (not a free variable). Inside `Deno.serve()`, the existing hardcoded 3-tier sizing block is replaced with a call to `calculateAdaptiveRisk(supabase, confidence, marketContext)`.

**The 7 factors implemented exactly as specified:**
1. Confidence tier (4 tiers: ≥85%→3%, ≥75%→2.5%, ≥65%→2%, else→1.5%)
2. Recent 10-trade win rate (≥70%→+20%, ≤30%→-30%)
3. Current streak (win≥5→+10%, loss≥3→-40%)
4. Account drawdown (>20%→-50% recovery mode, >15%→-40%, >10%→-20%, account up 30%+→+15%)
5. Market volatility from `marketContext?.volatility` field (high→-25%, extreme→-50%)
6. Session liquidity by UTC hour (NY/London 13-20h→+5%, Asian/after-hours <8 or >21h→-15%)
7. Profit factor from account state (≥2.5→+10%, <1.0→-30%)

**Caps: `Math.max(0.5, Math.min(baseRisk, 3.0))`**

The `position_sizing_reasoning` array is stored in the new column on the trade row.

**Feature 3: CONSECUTIVE_LOSSES circuit breaker (added before opening trade)**

After the existing `breakers` check and before the duplicate check:
```typescript
// Check consecutive loss streak
const { data: acctState } = await supabase
  .from('ayn_account_state')
  .select('current_loss_streak')
  .eq('id', '00000000-0000-0000-0000-000000000001')
  .single();

if ((acctState?.current_loss_streak ?? 0) >= 3) {
  // Upsert CONSECUTIVE_LOSSES breaker
  await supabase
    .from('ayn_circuit_breakers')
    .upsert({
      breaker_type: 'CONSECUTIVE_LOSSES',
      is_tripped: true,
      tripped_at: new Date().toISOString(),
      reason: `${acctState.current_loss_streak} consecutive losses — 4-hour cooldown`,
      threshold_value: 3,
      current_value: acctState.current_loss_streak,
      auto_reset: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'breaker_type' });

  return new Response(JSON.stringify({
    opened: false,
    reason: `Trading paused: ${acctState.current_loss_streak} consecutive losses. Manual reset required.`,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
```
Note: `auto_reset: false` — this breaker requires manual reset via the kill switch UI, same as KILL_SWITCH. This is intentional: a 4-hour automatic timer cannot be reliably enforced from the database without pg_cron complexity. The dashboard will show the circuit breaker as tripped, and the user resets it via "Resume Trading".

**Storing reasoning on trade insert:**
```typescript
position_sizing_reasoning: adaptiveRisk.reasoning, // TEXT[]
```

---

### Step 4: Update `ayn-unified` — Enhanced Market Scanner (Feature 4)

**New file: `supabase/functions/ayn-unified/marketScanner.ts`**

Contains all the technical indicator functions extracted into a module, keeping `index.ts` clean:
- `fetchKlines(symbol, interval, limit, apiKey, apiSecret)` — fetches OHLCV klines from Pionex via HMAC-signed GET to `/api/v1/market/klines`
- `calculateRSI(closes, period=14)` — standard RSI formula
- `calculateEMA(values, period)` — exponential moving average
- `calculateMACD(closes)` — EMA12 - EMA26, signal = EMA9 of MACD
- `calculateBollingerBands(closes, period=20, multiplier=2)` — SMA ± (stdDev × multiplier)
- `calculateTrendStrength(closes)` — % of last 20 candles above their 20-period MA
- `analyzeKlines(klines, tickerClose)` — runs all indicators, returns structured signal object
- `calculateEnhancedScore(ticker, signals)` — the new scoring rubric (RSI zones, MA alignment, volume surge, BB position, MACD, trend strength)
- `generateSignalSummary(signals)` — produces the human-readable signal array stored in trade's `market_context`

**Interval note:** Pionex maps `1h` to `60M` in their API. The kline fetch will use `interval=60M` (confirmed by the existing `ayn-unified/index.ts` interval mapping note in architecture memory: `'1H' is mapped to '60M'`). The plan uses `'1h'` — this must be corrected to `'60M'`.

**In `ayn-unified/index.ts` `scanMarketOpportunities()` function (lines 526–617):**

The existing simple 50-line ticker loop is replaced with an enhanced version that:
1. Still fetches all Pionex tickers (unchanged — same endpoint, same filtering logic)
2. For each ticker scoring ≥55 on the basic momentum check, fetches 100 klines on 60M interval
3. Runs `analyzeKlines()` and `calculateEnhancedScore()` from `marketScanner.ts`
4. Raises the final threshold to 70 (was 65) to compensate for the richer scoring
5. Returns the same `{ opportunities, scannedPairs }` shape — no downstream changes needed

**Performance consideration:** Fetching klines for every ticker would be slow (500+ pairs × 1 API call = sequential bottleneck). The strategy: first run the existing basic score, keep only tickers with basic score ≥55 (narrows to ~30-50 candidates), then fetch klines for those. This limits kline API calls to 30-50 per scan, not 500+.

---

### Step 5: Update `PerformanceDashboard.tsx` — Advanced Metrics UI (Feature 1)

**File: `src/components/trading/PerformanceDashboard.tsx`**

**Changes:**

1. **Update `AccountState` interface** to include all 13 new columns (optional fields with `?` to not break before migration deploys):
```typescript
sharpe_ratio?: number;
sortino_ratio?: number;
profit_factor?: number;
expectancy?: number;
avg_trade_duration_hours?: number;
longest_win_streak?: number;
longest_loss_streak?: number;
current_win_streak?: number;
current_loss_streak?: number;
max_drawdown_duration_days?: number;
recovery_factor?: number;
avg_win_size?: number;
avg_loss_size?: number;
```

2. **Add `MetricCard` sub-component** (after `StatsCard`):
A compact card with: label, large value, color-coded status badge (excellent=green, good=blue, neutral=gray, poor=red, warning=yellow), and tooltip text. Implemented as a small functional component — no external dependencies needed.

3. **Add "Advanced Metrics" section** after the basic `Stats Grid` and before the equity curve. Renders a `grid grid-cols-2 gap-3` (matching existing stats grid style) with 8 metric cards:
- Sharpe Ratio — status: ≥2 excellent, ≥1 good, ≥0 neutral, else poor
- Sortino Ratio — status: ≥2 excellent, ≥1 good, else neutral
- Profit Factor — status: ≥2.5 excellent, ≥1.5 good, ≥1.0 neutral, else poor
- Expectancy ($) — status: >0 good, else poor
- Avg Trade Duration — neutral (informational)
- Win Streak (current / longest) — status: current≥3 excellent, else neutral
- Loss Streak (current / longest) — status: current≥3 warning, else neutral
- Recovery Factor — status: ≥3 excellent, ≥1.5 good, else neutral

The section only renders when `account` is non-null AND at least one advanced metric exists (`account.sharpe_ratio !== undefined`). Shows a placeholder until `ayn-calculate-metrics` runs for the first time: "Advanced metrics calculate daily. Run 'do paper testing' to generate trades."

4. **Add losing streak warning banner** (Feature 3 UI):
After the kill switch banner, add:
```typescript
{(account?.current_loss_streak ?? 0) >= 2 && (
  <div className="flex items-center gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3">
    <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
    <div>
      <p className="text-sm font-semibold text-yellow-400">Losing Streak Warning</p>
      <p className="text-xs text-muted-foreground">
        {account.current_loss_streak} consecutive losses. 
        {account.current_loss_streak >= 3 
          ? ' Trading automatically paused.' 
          : ' One more loss triggers automatic pause.'}
      </p>
    </div>
  </div>
)}
```

5. **Update `AIDecisionLog.tsx`** — add position sizing reasoning display:
In `DecisionRow`, after the existing `signals` badges block, add:
```typescript
{trade.position_sizing_reasoning && trade.position_sizing_reasoning.length > 0 && (
  <div>
    <span className="text-muted-foreground font-medium">Position Sizing:</span>
    <div className="flex flex-wrap gap-1 mt-0.5">
      {trade.position_sizing_reasoning.map((r, i) => (
        <Badge key={i} variant="outline" className="text-[10px] font-normal text-blue-400 border-blue-500/30">{r}</Badge>
      ))}
    </div>
  </div>
)}
```
The `PaperTrade` interface in `AIDecisionLog.tsx` needs `position_sizing_reasoning?: string[]` added.

---

## File Change Summary

| File | Type | What Changes |
|---|---|---|
| Migration 1 | SQL | Add 13 columns to `ayn_account_state` |
| Migration 2 | SQL | Add `position_sizing_reasoning TEXT[]` to `ayn_paper_trades` |
| `supabase/functions/ayn-calculate-metrics/index.ts` | NEW | Full metrics calculator edge function |
| `supabase/config.toml` | EDIT | Add `[functions.ayn-calculate-metrics] verify_jwt = false` |
| `supabase/functions/ayn-open-trade/index.ts` | EDIT | Adaptive sizing + consecutive loss breaker |
| `supabase/functions/ayn-unified/marketScanner.ts` | NEW | Technical indicator functions (RSI, MACD, BB, EMA) |
| `supabase/functions/ayn-unified/index.ts` | EDIT | Replace `scanMarketOpportunities()` with enhanced version |
| `src/components/trading/PerformanceDashboard.tsx` | EDIT | MetricCard, advanced metrics grid, loss streak banner |
| `src/components/trading/AIDecisionLog.tsx` | EDIT | Position sizing reasoning display |
| Cron SQL (insert tool) | SQL | Schedule `ayn-calculate-metrics` at 00:10 UTC |

## Deploy Order

1. **Migrations first** (schema changes before code that uses them)
2. **`ayn-calculate-metrics`** (new function + cron — foundation for adaptive sizing)
3. **`ayn-open-trade`** (uses `current_loss_streak` + writes `position_sizing_reasoning`)
4. **`ayn-unified` + `marketScanner.ts`** (enhanced scanner, independent of other changes)
5. **Frontend** (`PerformanceDashboard.tsx` + `AIDecisionLog.tsx` — reads new columns gracefully via optional fields)
