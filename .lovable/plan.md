

## Upgrade AYN Trading Coach to Professional Trade Advisor

### Problem

The trading coach still uses cautious "coach mode" language -- it says "Never say buy or sell definitively" and hedges with "the setup suggests." It also doesn't pass the new `tradingSignal` data (exact entry, stop loss, take profits, bot config) to the chat AI, and the quick action buttons are psychology-focused instead of actionable trading queries. The knowledge base patterns are listed but the AI isn't told to use them to build concrete strategies.

### Changes

#### 1. Rewrite System Prompt to Advisor Mode with Strategy Building

**File:** `supabase/functions/ayn-unified/systemPrompts.ts` (lines 154-226)

Replace the entire `trading-coach` block:

- Remove "Never say buy or sell definitively" and all hedging instructions
- New role: "You are a direct, professional trading advisor. Give CLEAR actionable signals."
- Expand the knowledge base section with strategy-building instructions:
  - "Use pattern knowledge to BUILD COMPLETE STRATEGIES: combine patterns with S/R levels, volume, and timeframe to recommend specific trade plans"
  - "Cross-reference detected patterns against reliability data to determine signal strength"
  - "When multiple patterns align at key levels, increase conviction and say so"
  - "When patterns conflict, be honest and recommend WAIT"
- Add strategy templates the AI should use:
  - Breakout Strategy (triangle/flag patterns at resistance)
  - Reversal Strategy (engulfing/hammer at strong support)
  - Trend Continuation (flag/pennant in established trend)
  - Scalping Setup (short timeframe with volume confirmation)
- Keep security rules (never reveal internals)
- Keep emotional state detection but frame as "professional risk awareness"
- Add: "Be honest about bad setups -- tell users NOT to trade when the setup is weak"
- Add testing mode disclaimer at the end of strategy responses

#### 2. Pass TradingSignal Data to Coach Context

**File:** `src/hooks/useChartCoach.ts` (function `buildFileContext`, lines 71-97)

After the existing context string, append the `tradingSignal` data when available:

- Action (BUY/SELL/WAIT)
- Entry price and order type
- Stop loss price and percentage
- TP1 and TP2 with prices, percentages, close percentages
- Bot config (position size, leverage, trailing stop)
- Invalidation price and condition
- Reasoning from the analyzer

#### 3. Update Quick Actions and UI Labels

**File:** `src/components/dashboard/ChartCoachChat.tsx`

Quick actions with result (lines 25-31):
- "Should I buy or sell?"
- "Build me a strategy"
- "What's my exact entry?"
- "Risk analysis"
- "Set my stop loss"

Quick actions general (lines 33-38):
- "How to build a trading plan?"
- "Explain position sizing"
- "Best entry strategies"
- "Risk management rules"

Placeholders (lines 43-49):
- "Should I buy or sell this?"
- "Build me a trading strategy..."
- "What's my risk here?"
- "Where should I enter?"
- "Help me plan this trade..."

Header label (around line 280): Change "AYN Coach" to "AYN Trade Advisor"

### Technical Details

| File | Change |
|------|--------|
| `supabase/functions/ayn-unified/systemPrompts.ts` | Rewrite trading-coach prompt: advisor mode, strategy building from knowledge base, remove hedging |
| `src/hooks/useChartCoach.ts` | Add tradingSignal (entry, SL, TP1, TP2, bot config, invalidation) to buildFileContext |
| `src/components/dashboard/ChartCoachChat.tsx` | Update quick actions, placeholders, header to "AYN Trade Advisor" |

Edge function `ayn-unified` will need redeployment after the prompt change.

