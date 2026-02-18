
# Fix 1: Stop Fabrication + Fix 2: Fee/Slippage Modeling

## Root Cause Analysis (Confirmed)

### Fabrication
The anti-fabrication rule in `systemPrompts.ts` (lines 320–327) is buried halfway through a 403-line file, after dozens of other instructions. The model follows the most recent and most emphatic instructions — burying the prohibition weakens it. The actual rule text also lacks **concrete negative examples** and **self-check language** that forces the model to validate before responding.

The performance data injection at line 881 of `index.ts` already says "DO NOT FABRICATE" — but it is injected as a context section *appended to* the system prompt, not as the *first thing the model reads*. When context is long, instructions near the end of a system prompt receive less attention.

Additionally, the `performanceContext` fallback (lines 892–902) correctly fills in `$10,000 / 0 trades` when `accountPerformance?.account` is null — but it does NOT include an explicit "if total_trades = 0, respond with this exact phrase" instruction. The AI sees the data but is not forced into a specific response shape for the zero-trade case.

### Fees/Slippage
`ayn-monitor-trades/index.ts` computes P&L at three close events (STOP_HIT lines 120–133, TP1_HIT lines 148–169, TP2_HIT lines 182–196) with raw `(price - entry) * shares` math. Zero deductions for fees or slippage. Same issue in `ayn-close-trade/index.ts`. The `fees_paid` and `slippage_cost` columns do not exist (confirmed via live query → empty result).

---

## What Changes

### File 1: `supabase/functions/ayn-unified/systemPrompts.ts`

**Change location:** The `PAPER TRADING ACCOUNT RULES` block (lines 320–327).

**What to change:** Replace the current soft 7-line block with a substantially stronger version that:
1. Uses all-caps section header `PAPER TRADING ACCOUNT — ABSOLUTE RULES (HIGHEST PRIORITY)`
2. Leads with a **hard prohibition** before any positive instruction
3. Includes **concrete bad-response examples** with `← FABRICATION. NEVER.` markers
4. Provides **exact scripted responses** for the zero-trade and has-trades cases
5. Adds a **self-check step**: "Before answering any performance question, verify: does my answer contain any number, trade, or ticker not present in the injected context block?"

The new block (replaces lines 320–327):

```
PAPER TRADING ACCOUNT — ABSOLUTE RULES (HIGHEST PRIORITY):
THESE RULES OVERRIDE EVERYTHING ELSE.

You have a REAL paper trading account. The database state is ALWAYS injected into your context above (look for "REAL PAPER TRADING DATA"). That injected block is your only source of truth.

ABSOLUTE PROHIBITIONS — NEVER DO THESE:
✗ NEVER invent a trade ticker (SOL, BTC, USDC, etc.) unless it appears in the injected data
✗ NEVER invent a balance, P&L figure, or win rate
✗ NEVER invent an entry price, exit price, or trade outcome
✗ NEVER say "my recent trade was..." unless a trade appears in the injected context

BAD EXAMPLE (0 trades) — NEVER RESPOND LIKE THIS:
"Current balance: $10,245. Recent trade: SOL short at $188.40 → exit $181.20, +$385 profit."
← THIS IS FABRICATION. The database shows 0 trades. You are lying.

GOOD EXAMPLE (0 trades):
"My paper trading account is live with $10,000. No trades executed yet — I'm waiting for a setup that clears my 65%+ confidence threshold. I don't force trades."

GOOD EXAMPLE (has trades — use exact numbers from injected data):
"Balance: $[exact_injected_number]. [exact_trade_count] trades. Win rate: [exact_injected_number]%. [list exactly what's in the context]"

SELF-CHECK: Before answering any question about your account/trades/balance, ask yourself: "Is every number and ticker I'm about to say present in the REAL PAPER TRADING DATA block?" If any number is invented → delete it. Report only database facts.
```

### File 2: `supabase/functions/ayn-unified/index.ts`

**Change 1 (lines 881–902): Make the injected performance context more commanding**

The current `performanceContext` injection opens with `\n\nREAL PAPER TRADING DATA (FROM DATABASE — USE THIS, DO NOT FABRICATE):`. This is good but the zero-trade fallback block (lines 892–902) ends with just `NOTE: Account just launched. No trades executed yet.` — no scripted response.

Change the zero-trade fallback to:
```
REAL PAPER TRADING DATA — INJECTED FROM DATABASE:
Balance: $10,000.00 | Starting: $10,000.00 | P&L: $0.00 (0.00%)
Total Trades: 0 | Win Rate: N/A
Open Positions: NONE
Closed Trades: NONE
STATUS: Account launched. Zero trades executed.

MANDATORY RESPONSE FOR THIS STATE:
Your answer MUST follow this format: "My paper trading account is live with $10,000. No trades yet — I'm being selective and waiting for a 65%+ confidence setup. [Add relevant context if user asked something specific]"
DO NOT DEVIATE. DO NOT ADD FICTIONAL TRADES. DO NOT ADD FICTIONAL PRICES.
```

**Change 2: Move performance context BEFORE `chartSection` in the system prompt assembly (line 938)**

Currently: `systemPrompt = buildSystemPrompt(...) + chartSection + performanceContext + scanContext + INJECTION_GUARD`

The model reads instructions in order. `chartSection` (recent chart analyses) can be several lines long, pushing `performanceContext` further down. Change the order so performanceContext comes immediately after `buildSystemPrompt()`:

```typescript
let systemPrompt = buildSystemPrompt(intent, language, context, lastMessage, userContext) + performanceContext + chartSection + scanContext + INJECTION_GUARD;
```

This ensures the database facts are the first context the model sees after the system rules, reducing the chance of the rules being "forgotten" by the time the model generates a response.

---

### Database Migration: Add `fees_paid` and `slippage_cost` columns

```sql
ALTER TABLE ayn_paper_trades
  ADD COLUMN IF NOT EXISTS fees_paid DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slippage_cost DECIMAL(10,4) DEFAULT 0;
```

---

### File 3: `supabase/functions/ayn-monitor-trades/index.ts`

The fee/slippage calculation is added as a helper function and called at all three close events. Fee model:
- **Entry fee**: `position_size_dollars × 0.0005` (0.05% of position value at entry)
- **Exit fee**: `shares × exitPrice × 0.0005` (0.05% of position value at exit)
- **Slippage**: `position_size_dollars × 0.0005` (0.05% flat on position — simulates market order slippage)
- **Total deduction**: ~0.15% of position value per round-trip

A `calculateCosts(positionSizeDollars, shares, exitPrice)` helper function is added above `Deno.serve()`:

```typescript
function calculateCosts(positionSizeDollars: number, shares: number, exitPrice: number) {
  const entryFee    = positionSizeDollars * 0.0005;
  const exitFee     = shares * exitPrice * 0.0005;
  const slippage    = positionSizeDollars * 0.0005;
  return { entryFee, exitFee, slippage, total: entryFee + exitFee + slippage };
}
```

**Three close events updated:**

**STOP_HIT block (lines 119–133):**
```typescript
const grossPnl = isBuy ? (stopLoss - entryPrice) * shares : (entryPrice - stopLoss) * shares;
const costs = calculateCosts(Number(trade.position_size_dollars), shares, stopLoss);
const netPnlDollars = grossPnl - costs.total;
const netPnlPercent = (netPnlDollars / Number(trade.position_size_dollars)) * 100;

await supabase.from('ayn_paper_trades').update({
  exit_price: currentPrice,
  exit_time: new Date().toISOString(),
  exit_reason: 'STOP_HIT',
  pnl_dollars: Math.round(netPnlDollars * 100) / 100,
  pnl_percent: Math.round(netPnlPercent * 100) / 100,
  fees_paid: Math.round(costs.total * 100) / 100,
  slippage_cost: Math.round(costs.slippage * 100) / 100,
  status: 'STOPPED_OUT',
  updated_at: new Date().toISOString(),
}).eq('id', trade.id);
```

**TP1_HIT block (lines 146–169):** Fee deduction applied proportionally to the 50% partial close (costs calculated on `sharesClosing * tp1` position value).

**TP2_HIT block (lines 178–200):** Fee deduction applied to remaining shares at tp2 price; `fees_paid` accumulates from prior partial close.

---

### File 4: `supabase/functions/ayn-close-trade/index.ts`

Same `calculateCosts` helper is added and the P&L calculation at line ~76 is updated to deduct fees:

```typescript
const costs = calculateCosts(Number(trade.position_size_dollars), shares, currentPrice);
const closePnl = (isBuy ? (currentPrice - entryPrice) : (entryPrice - currentPrice)) * shares;
const totalPnlDollars = Math.round((prevPnl + closePnl - costs.total) * 100) / 100;
// ... fees_paid and slippage_cost added to the update payload
```

---

### File 5: `src/components/trading/AIDecisionLog.tsx`

**Interface update** — add the two new optional columns:
```typescript
interface PaperTrade {
  // ... existing fields
  fees_paid?: number;
  slippage_cost?: number;
}
```

**UI update** — in the expanded `CollapsibleContent` section, after the entry/exit price line, add a cost breakdown when the trade is closed and has fee data:

```tsx
{isClosed && (trade.fees_paid != null || trade.slippage_cost != null) && (
  <div className="flex gap-3 text-muted-foreground pt-1 border-t border-border/20 mt-1">
    {trade.fees_paid != null && trade.fees_paid > 0 && (
      <span className="text-red-400/70">Fees: -${Number(trade.fees_paid).toFixed(2)}</span>
    )}
    {trade.slippage_cost != null && trade.slippage_cost > 0 && (
      <span className="text-red-400/70">Slip: -${Number(trade.slippage_cost).toFixed(2)}</span>
    )}
    <span className="text-muted-foreground/60 text-[10px]">net after costs</span>
  </div>
)}
```

This is intentionally minimal — the P&L shown in the header (`.pnl_percent`) already reflects the net number, so the breakdown is informational only.

---

## Files Changed Summary

| File | Type | Change |
|---|---|---|
| Migration SQL | NEW | Add `fees_paid`, `slippage_cost` columns to `ayn_paper_trades` |
| `supabase/functions/ayn-unified/systemPrompts.ts` | EDIT | Strengthen PAPER TRADING ACCOUNT RULES block with hard prohibitions, bad examples, scripted responses, self-check |
| `supabase/functions/ayn-unified/index.ts` | EDIT | (1) Beef up zero-trade fallback context with mandatory response script; (2) Swap order: `performanceContext` before `chartSection` in system prompt assembly |
| `supabase/functions/ayn-monitor-trades/index.ts` | EDIT | Add `calculateCosts()` helper; deduct fees + slippage at STOP_HIT, TP1_HIT, TP2_HIT |
| `supabase/functions/ayn-close-trade/index.ts` | EDIT | Add `calculateCosts()` helper; deduct fees + slippage in manual close |
| `src/components/trading/AIDecisionLog.tsx` | EDIT | Add `fees_paid`/`slippage_cost` to interface; render cost breakdown in expanded row |

## Deploy Order

1. **Migration** (schema before code)
2. **`ayn-unified`** (both files — fabrication fix is the critical path, deploy first)
3. **`ayn-monitor-trades`** + **`ayn-close-trade`** (fee modeling, can deploy together)
4. **Frontend** (`AIDecisionLog.tsx` — reads new columns via optional fields, safe immediately)

## What This Does NOT Fix

The fabrication fix strengthens the prompt considerably but cannot guarantee zero hallucination — large language models can always override instructions. The most reliable long-term solution would be a **post-processing validation layer** (intercept the AI response, check any dollar figure against the injected data, redact mismatches before sending to the user). This is out of scope for this change but worth noting for Phase 4.
