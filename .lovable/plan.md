
# Post-Processing Validation Layer — Implementation Plan

## What Is Being Built

A programmatic interceptor that catches any AI-fabricated numbers or tickers **after** the AI generates its response, before the response is sent to the user. This is a belt-and-suspenders add-on to the existing prompt engineering fix.

The architecture is simple:
```text
AI Response (may contain fabricated data)
        ↓
  validator.ts: extract $amounts, %, tickers
        ↓
  compare against accountPerformance (real DB data)
        ↓
  if violation → replace with verified fallback
        ↓
  User receives only verified data
```

---

## Code Audit Findings

### Key Facts Confirmed by Reading the Code

**Response flow (lines 1509–1625 of `index.ts`):**
- The LLM is called at line 1511 via `callWithFallback()`
- Non-streaming response text lands in `responseContent` at line 1532
- After that, the EXECUTE_TRADE parser runs (lines 1535–1586)
- Then the safety net (lines 1588–1609)
- Then the final `return` at line 1614
- **The validation layer must be inserted between line 1586 and 1611** — after any trade execution rewrites `responseContent`, before the final return.

**`isPerformanceQuery` = `intent === 'trading-coach'`** (line 798) — not keyword-gated. This means `accountPerformance` is always fetched for trading-coach intent. The validator only runs on non-streaming trading-coach calls (streaming skips the whole non-streaming block).

**`accountPerformance` structure (lines 832–836):**
```typescript
{
  account: accountRes.data,        // ayn_account_state row (single)
  openPositions: openRes.data,     // ayn_paper_trades[] OPEN/PARTIAL_CLOSE
  recentTrades: recentRes.data,    // ayn_paper_trades[] last 5 closed
}
```
The `account` field is null when there is no row in `ayn_account_state`. The validator must handle `null` account gracefully.

**`ayn_activity_log` schema (confirmed from `aynLogger.ts`):** Uses `action_type`, `summary`, `details`, `triggered_by`. The plan's proposed `activity_type` field does NOT exist — logging must use `action_type`.

**Streaming responses (lines 1519–1528):** Return before reaching the validation block. The validator only covers non-streaming responses. This is acceptable — streaming is used for conversational replies where the user sees text token-by-token. The wantsAutonomousTrading path already forces `effectiveStream = false` (line 1510), meaning the highest-risk queries (performance + trade execution) always go through non-streaming and thus through the validator.

---

## What Changes

### File 1: `supabase/functions/ayn-unified/validator.ts` (NEW FILE)

A self-contained module that exports one function: `validateTradingResponse()`.

**Design decisions vs the plan:**

The plan's `validatePerformanceResponse` extracts dollar amounts and checks them against an allowed set. This is the right approach, but needs tuning for real-world use:

1. **Dollar amount tolerance**: The plan uses ±$0.02. This is too strict for larger balances. A balance of $10,000 might be formatted as "$10K" or "$10,000" with comma. The regex handles comma-stripped values, so ±$0.50 tolerance is more robust.

2. **Ticker validation when totalTrades = 0**: The plan checks `allowedTickers.has(ticker)` but `allowedTickers` is empty when there are no trades. The guard condition `if (!allowedTickers.has(ticker) && injectedContext.totalTrades > 0)` in the plan correctly prevents false positives for zero-trade state.

3. **Common-word exclusions**: Words like "USD", "API", "N/A", "KYC", "AML", "SMC", "RSI", "SMA", "EMA", "OB" all match the ticker regex but are not trade tickers. The exclusion set needs to be comprehensive.

4. **The plan's `validatePercentageClaims` has a high false-positive rate**: Win rate discussions (e.g., "65% confidence threshold", "0.05% fee") would all flag as violations. This function is excluded from the implementation — percentage validation is too noisy to be reliable.

**Final `validator.ts` structure:**

```typescript
export interface ValidationContext {
  accountBalance: number;
  startingBalance: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  openPositions: Array<{ ticker: string; entryPrice: number; pnl: number }>;
  recentTrades: Array<{ ticker: string; entryPrice: number; exitPrice: number; pnl: number }>;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedResponse?: string;
  violations: string[];
}

export function validateTradingResponse(
  aiResponse: string,
  ctx: ValidationContext
): ValidationResult
```

**What it checks:**
1. **Dollar amounts** — regex extracts all `$X`, `$X,XXX`, `$X.XX` patterns. Checks each against: account balance, starting balance, P&L (absolute), each position's entry price and P&L, each recent trade's entry, exit, and P&L. Tolerance: ±$0.50.
2. **"Recent trade" patterns when 0 trades** — regex list of fabrication-indicator phrases (`recent trade`, `last trade`, `entered at $`, `shorted at $`, `closed position`, etc.) that prove the AI invented a trade.
3. **Ticker mentions when 0 trades** — only when `totalTrades === 0` and `openPositions.length === 0` does the ticker check run. It looks for `BTC`, `ETH`, `SOL`, etc. appearing in trade-context sentences (e.g., "I bought SOL", "opened BTC position"). An extensive exclusion set prevents words like "API", "USD", "RSI" from triggering.

**When violations found, the replacement response is generated from `ctx` values, not from hardcoded strings.**

---

### File 2: `supabase/functions/ayn-unified/index.ts`

**One targeted insertion block** after line 1586 (end of EXECUTE_TRADE parsing), before line 1588 (safety net check). This is the optimal location because:
- `responseContent` has already been rewritten by trade execution logic (accurate)
- We're still before the final return
- Only non-streaming responses reach this code

```typescript
// ── 🛡️ VALIDATION LAYER: Intercept fabricated performance data ──────────────
if (intent === 'trading-coach' && !effectiveStream && accountPerformance !== null) {
  // Build validation context from the same data that was injected into the prompt
  const validationCtx = {
    accountBalance:   Number(accountPerformance.account?.current_balance  ?? 10000),
    startingBalance:  Number(accountPerformance.account?.starting_balance ?? 10000),
    totalTrades:      Number(accountPerformance.account?.total_trades      ?? 0),
    winningTrades:    Number(accountPerformance.account?.winning_trades    ?? 0),
    losingTrades:     Number(accountPerformance.account?.losing_trades     ?? 0),
    winRate:          Number(accountPerformance.account?.win_rate           ?? 0),
    openPositions: (accountPerformance.openPositions ?? []).map((p: any) => ({
      ticker:     p.ticker,
      entryPrice: Number(p.entry_price),
      pnl:        Number(p.unrealized_pnl_percent ?? 0),
    })),
    recentTrades: (accountPerformance.recentTrades ?? []).map((t: any) => ({
      ticker:     t.ticker,
      entryPrice: Number(t.entry_price),
      exitPrice:  Number(t.exit_price ?? t.entry_price),
      pnl:        Number(t.pnl_percent ?? 0),
    })),
  };

  const validation = validateTradingResponse(responseContent, validationCtx);

  if (!validation.isValid) {
    console.error('[VALIDATOR] 🚨 Fabrication intercepted:', validation.violations);
    responseContent = validation.sanitizedResponse!;

    // Log to activity log for monitoring (non-blocking)
    supabase.from('ayn_activity_log').insert({
      action_type:  'fabrication_blocked',
      summary:      `Fabrication intercepted: ${validation.violations.slice(0, 2).join('; ')}`,
      triggered_by: 'system',
      details: {
        violations:          validation.violations,
        user_message_preview: lastMessage.substring(0, 150),
      },
    }).catch((e: any) => console.error('[VALIDATOR] Log failed:', e));
  }
}
```

**Import added at top of `index.ts` (line 10):**
```typescript
import { validateTradingResponse } from './validator.ts';
```

---

## What the Validator Does NOT Check

To avoid false positives that would block legitimate responses:
- **Percentages** — too many legitimate percentages exist in trading discussions (confidence %, fee %, RSI levels). Excluded.
- **General price discussions** — if the user asks "what's Bitcoin's price?" and AYN responds "$67,000", the validator does NOT flag this because the user asked about market prices, not AYN's account performance. The validator only triggers for `intent === 'trading-coach'` AND when `accountPerformance !== null`.
- **Future/hypothetical prices** — "If BTC hits $80,000..." is not a fabricated account figure.
- **Ticker mentions in educational context** — The ticker check only triggers for zero-trade state. Once trades exist, tickers are allowed because AYN legitimately discusses many coins.

---

## File Change Summary

| File | Type | Change |
|---|---|---|
| `supabase/functions/ayn-unified/validator.ts` | NEW | Full validation module (~120 lines) with dollar extraction, fabrication-phrase detection, and sanitized fallback generation |
| `supabase/functions/ayn-unified/index.ts` | EDIT | (1) Add import of `validateTradingResponse`; (2) Insert ~30-line validation block after line 1586 |

**No database migrations. No new edge functions. No frontend changes.**

---

## Edge Cases Handled

| Scenario | Behavior |
|---|---|
| AI says "$10,000" when balance IS $10,000 | ✅ Allowed (matches DB) |
| AI says "$10,245" when balance is $10,000 | ❌ Blocked → sanitized |
| AI mentions "SOL trade" when 0 trades | ❌ Blocked → sanitized |
| AI says "65% confidence threshold" (not a trade %) | ✅ Allowed (% check is excluded) |
| Trade was just executed, AI confirms it | ✅ Allowed (EXECUTE_TRADE runs before validator, so accountPerformance reflects the updated responseContent with confirmation appended) |
| Streaming response | ✅ Skipped (validator only runs on non-streaming) |
| `accountPerformance` is null (fetch failed) | ✅ Skipped (guard: `accountPerformance !== null`) |

---

## Monitoring

Fabrication events are logged to `ayn_activity_log` with `action_type = 'fabrication_blocked'`. These are visible in the existing AYN Activity Log in the admin panel (the component already reads all `action_type` values and shows them in the feed). The admin will see these events naturally alongside other AYN actions.
