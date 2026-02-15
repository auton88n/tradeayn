

## Transform Chart Analyzer: Coach Mode to Advisor Mode (Testing)

### Overview

Switch the Chart Analyzer from cautious coach mode to a direct trading advisor that outputs bot-ready signals with exact prices, position sizing, leverage, trailing stops, and a copyable configuration block. Also remove Firecrawl content sanitization restrictions so search results flow through unfiltered.

### Changes

#### 1. Remove Firecrawl Sanitization Restrictions

**Files:** `supabase/functions/_shared/sanitizeFirecrawl.ts`, `supabase/functions/analyze-trading-chart/index.ts`

- In `sanitizeFirecrawl.ts`: gut the `sanitizeForPrompt` function so it only truncates (no keyword redaction, no `[EXTERNAL SOURCE]` wrapper)
- In `index.ts`: remove `FIRECRAWL_CONTENT_GUARD` usage from the prediction prompt (line 398) so news content passes through cleanly
- Keep `sanitizeScrapedContent` (HTML stripping) intact since that's basic hygiene, not a restriction

#### 2. Update Prediction Prompt to Advisor Mode

**File:** `supabase/functions/analyze-trading-chart/index.ts` (lines 378-502)

Replace the coaching-style prompt with a direct advisor prompt:
- Remove hedging language ("educational insights", "IF you decide to enter")
- Add: "You are a direct trading advisor. Generate CLEAR, ACTIONABLE signals with exact parameters. Be DECISIVE."
- Add `tradingSignal` object to the JSON schema with: action, entry (price + orderType), stopLoss (price + percentage), two takeProfits (price + percentage + closePercent), riskReward ratio, botConfig (positionSize, leverage, trailingStop), and invalidation (price + condition)
- Remove confidence hard-cap language (keep cap at 95 instead of 90)
- Change signal names: BULLISH becomes BUY, BEARISH becomes SELL, keep WAIT

#### 3. Update Trading Knowledge Base Rules

**File:** `supabase/functions/analyze-trading-chart/tradingKnowledge.ts` (lines 1997-2006)

Replace the CRITICAL ANALYSIS RULES section with advisor-mode rules:
- "Provide CLEAR trading signals: BUY, SELL, or WAIT"
- "Include EXACT entry prices, stop loss, take profit levels"
- "Include bot configuration parameters"
- "Be DIRECT and ACTIONABLE"
- Keep pattern limit (max 3) and context adjustment formula

#### 4. Add TradingSignal Type

**File:** `src/types/chartAnalyzer.types.ts`

Add new interface:

```text
TradingSignal {
  action: "BUY" | "SELL" | "WAIT"
  reasoning: string
  entry: { price: number, orderType: "LIMIT" | "MARKET", timeInForce: "GTC" }
  stopLoss: { price: number, percentage: number }
  takeProfits: [
    { level: 1, price: number, percentage: number, closePercent: 50 },
    { level: 2, price: number, percentage: number, closePercent: 50 }
  ]
  riskReward: number
  botConfig: {
    positionSize: number
    leverage: number
    trailingStop: { enabled: boolean, activateAt: "TP1"|"TP2", trailPercent: number }
  }
  invalidation: { price: number, condition: string }
}
```

Add `tradingSignal?: TradingSignal` to `ChartPrediction` interface. Update `PredictionSignal` to include `'BUY' | 'SELL'`.

#### 5. Update Signal Config and Results UI

**File:** `src/components/dashboard/ChartAnalyzerResults.tsx`

- Add BUY/SELL to `signalConfig` (BUY = green, SELL = red)
- Add new "Bot Configuration" collapsible section after Trade Setup with:
  - Large colored BUY/SELL/WAIT badge
  - Entry price + order type row
  - Stop loss with risk percentage
  - TP1 and TP2 with close percentages
  - Bot parameters: position size, leverage, R:R
  - Trailing stop info
  - "Copy Bot Config" button that copies a formatted text block to clipboard
  - Invalidation warning in red
- Replace the existing disclaimer with a red "TESTING MODE - HIGH RISK" banner

#### 6. Add Copy Function

**File:** `src/components/dashboard/ChartAnalyzerResults.tsx`

Add a `copyBotConfig` function that formats all signal data into a clean text block:

```text
SIGNAL: BUY
ENTRY: 0.0426 (LIMIT)
STOP: 0.0420 (-1.4%)
TP1: 0.0445 (+4.5%) - Close 50%
TP2: 0.0470 (+10.3%) - Close 50%
BOT CONFIG:
Position: 2%
Leverage: 2x
R:R: 1:3.2
Trailing: 1.5% after TP1
INVALIDATION: Below 0.0415 - bearish structure confirmed
```

Uses `navigator.clipboard.writeText()` with a toast confirmation.

#### 7. Update Edge Function Result Builder

**File:** `supabase/functions/analyze-trading-chart/index.ts` (lines 668-709)

Pass `tradingSignal` from prediction response through to the result object so the frontend can render the bot config card.

### Files Summary

| File | Changes |
|------|---------|
| `supabase/functions/_shared/sanitizeFirecrawl.ts` | Remove keyword redaction and `[EXTERNAL SOURCE]` wrapper from `sanitizeForPrompt` |
| `supabase/functions/analyze-trading-chart/tradingKnowledge.ts` | Replace CRITICAL ANALYSIS RULES with advisor-mode directives |
| `supabase/functions/analyze-trading-chart/index.ts` | Advisor prompt, add tradingSignal schema, remove FIRECRAWL_CONTENT_GUARD, pass tradingSignal to result |
| `src/types/chartAnalyzer.types.ts` | Add TradingSignal interface, update PredictionSignal type |
| `src/components/dashboard/ChartAnalyzerResults.tsx` | Add Bot Configuration card, copy function, BUY/SELL signals, testing mode disclaimer |

### Reversibility

All changes are in clearly identifiable sections. To revert back to coach mode later: restore the original CRITICAL ANALYSIS RULES, restore sanitizeForPrompt redaction, restore the coaching prompt language, and swap the disclaimer back.

