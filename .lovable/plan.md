

## Enable Autonomous Trading via Chat (No Chart Upload)

When a user says "find the best token and trade it" or "do paper testing," AYN will scan live Pionex market data, pick the best opportunity, and execute a paper trade -- all within the existing chat flow.

### Architecture

The implementation stays within `ayn-unified` rather than creating a separate `scan-market` edge function. This avoids deployment complexity and cross-function invocation latency. The Pionex signing pattern already exists in `ayn-unified` (line 846) and can be reused directly.

### Changes

**1. `supabase/functions/ayn-unified/index.ts`** -- Add market scanner and auto-execution

Around line 660 (after the performance keyword detection), add:

- **Autonomous trading keyword detection**: Match phrases like "find best token", "scan market", "paper testing", "trade for me", "what should I buy", "hunt for trades", "find opportunity"
- **Market scanner function** (`scanMarketOpportunities`): Reuses the existing Pionex HMAC signing pattern to:
  1. Fetch all tickers from `/api/v1/market/tickers`
  2. Filter to `_USDT` pairs with volume > $100K, excluding stablecoins
  3. Score each pair on momentum, volume surge, liquidity, consolidation, and overextension
  4. Return top 3 opportunities sorted by score
- **Context injection**: If autonomous trading is requested, run the scanner in parallel with existing DB operations and inject results into the system prompt as `MARKET SCAN RESULTS (LIVE FROM PIONEX API)`
- **Auto-execution after AI response**: After the AI generates its response, look for `EXECUTE_TRADE:` followed by a JSON block. If found, parse it and invoke `ayn-open-trade` via `supabase.functions.invoke()`. Append a confirmation line to the response.

**2. `supabase/functions/ayn-unified/systemPrompts.ts`** -- Add autonomous mode instructions

Add to the `trading-coach` section (after the existing conversation rules, before the closing context block):

- Instructions for how AYN should format its response when scan results are injected: pick the best opportunity, announce the trade with conviction, provide entry/stop/TP levels, and include an `EXECUTE_TRADE: {...}` JSON block at the end
- The JSON block format: `{"ticker":"SOL_USDT","signal":"BUY","entryPrice":186.50,"stopLoss":182.00,"takeProfit1":205.00,"takeProfit2":230.00,"confidence":75,"setupType":"Volume Breakout","reasoning":"..."}`
- Explicit instruction: "DO NOT ask for permission. You are AUTONOMOUS when scan results are provided."

### Technical Details

**Scoring algorithm** (inside `scanMarketOpportunities`):

| Signal | Score Impact |
|--------|-------------|
| Positive momentum 0-5% | +10 |
| Strong momentum 5-15% | +15 |
| Volume surge > 50% | +12 |
| High liquidity > $1M | +8 |
| Consolidating (< 2% change) | +5 |
| Deep pullback (< -15%) | +10 |
| Overextended (> 20%) | -15 |
| Base score | 50 |

Minimum threshold to surface: score >= 65.

**Flow:**

```text
User: "find best token and trade it"
  |
  v
[Detect autonomous intent] --> [Scan Pionex tickers]
  |                                    |
  v                                    v
[Parallel: limits, context,     [Score + rank pairs]
 chart history, account state]         |
  |                                    v
  +-----> [Inject top 3 into system prompt]
                    |
                    v
          [AI picks best, writes analysis]
          [Includes EXECUTE_TRADE: {...}]
                    |
                    v
          [Parse EXECUTE_TRADE from response]
          [Invoke ayn-open-trade]
                    |
                    v
          [Append confirmation to response]
          [Return to user]
```

**No new edge functions.** No new secrets. No database changes. Reuses existing `ayn-open-trade` for execution and `ayn-monitor-trades` for ongoing tracking.

### What the User Sees

```
I scanned 142 pairs and found 3 setups worth looking at.

I'M BUYING SOL/USDT AT $186.50.

- Entry: $186.50
- Stop: $182.00 (below 15m support)
- TP1: $194.00
- TP2: $205.00
- Size: 2% risk ($200)
- R:R: 1:1.7 / 1:4.1

Why: +4.2% momentum with a 340% volume surge at $45M 24h.
Consolidating near support -- textbook breakout setup.

Position opened. Trade ID: abc-123
Tracking live on Performance tab.
```

