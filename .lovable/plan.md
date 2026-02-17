

## Upgrade to Gemini 3 + Live Pionex in Coach + Smart Stale Chart Handling

### 1. Upgrade Chart Analyzer to Gemini 3

Both AI calls in `analyze-trading-chart` still use `google/gemini-2.5-flash`. Upgrade to `google/gemini-3-flash-preview`.

- **Line 144** (vision call): `google/gemini-2.5-flash` -> `google/gemini-3-flash-preview`
- **Line 674** (prediction call): `google/gemini-2.5-flash` -> `google/gemini-3-flash-preview`

### 2. Smart Stale Chart Detection (AI Asks the User)

When Pionex live price differs >5% from the chart-detected price, instead of silently overriding, the AI will acknowledge the discrepancy and **use the live price by default** -- but phrase it so the user knows what happened and can say "just analyze the image as-is" if they want.

In the prediction prompt (around line 525), add an explicit block:

```text
If chart's currentPrice and Pionex currentPrice differ by more than 5%:

WARNING TO AI: The uploaded chart appears OUTDATED.
- Chart shows: ~{chartPrice}
- Live price: {pionexPrice} ({diffPercent}% difference)

DEFAULT BEHAVIOR: Use the LIVE Pionex price for all entry/SL/TP calculations.
Tell the user: "Your chart appears outdated (shows ~X, live price is Y).
I've based my analysis on the current live price. If you want me to
analyze purely based on the chart image, just let me know."
```

This way:
- By default, the AI uses the correct live price
- The user sees a clear note about the discrepancy
- If the user says "just analyze the image" in a follow-up, the coach will respect that

### 3. Add Live Pionex Data to Coach Chat (`ayn-unified`)

Currently, follow-up questions in the coach chat have NO live market data. Add a `fetchPionexData()` function to `ayn-unified` (same HMAC signing logic) and call it in the `trading-coach` intent block (line 703) in parallel with Firecrawl tasks.

The live data gets injected into the system prompt so the AI can answer "What's the price now?" or "Is the setup still valid?" with real numbers.

### 4. Pass Ticker Context from Frontend

Update `useChartCoach.ts` to send `ticker`, `assetType`, and `timeframe` explicitly in the request body context, so the backend knows what to fetch without parsing the fileContext string.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/analyze-trading-chart/index.ts` | Upgrade model to `google/gemini-3-flash-preview` (lines 144, 674). Add explicit stale chart warning block in prediction prompt when Pionex price differs >5% from chart price. |
| `supabase/functions/ayn-unified/index.ts` | Add `fetchPionexData()` function with HMAC-SHA256 signing. In the `trading-coach` block (line 703), fetch live Pionex data in parallel with Firecrawl tasks and inject into system prompt. |
| `src/hooks/useChartCoach.ts` | Pass `ticker`, `assetType`, `timeframe` from the analysis result in the context body. |

### How It Works After the Fix

```text
User uploads chart (old or new)
  -> analyze-trading-chart (Gemini 3 Flash)
     -> Vision detects ticker + price levels
     -> Pionex fetches LIVE price
     -> If chart price differs >5%:
        AI tells user: "Your chart shows ~65,000 but live price is 68,520.
        I've used the live price. Say 'analyze the image only' if you prefer."
     -> All entry/SL/TP based on live price by default

User asks follow-up question
  -> ayn-unified (trading-coach intent)
     -> Fetches fresh Pionex data for the ticker
     -> AI sees current price, 24h change, volume, recent candles
     -> Gives accurate, real-time answers

User says "just analyze the chart image"
  -> Coach understands from conversation context
  -> Uses only chart-visible levels, ignores live data
```

