

## Add Debug Logging to Pionex API Calls

### Goal
Add detailed debug logging to both edge functions so we can see exactly what the Pionex API returns, what prices get extracted, and whether the symbol mapping is correct. This will pinpoint whether the issue is in the API response, the price extraction, or the symbol mapping.

### Changes

**1. `supabase/functions/analyze-trading-chart/index.ts` -- `fetchPionexData()` function**

Add debug logs after each API call:

- After klines fetch (line ~251): Log the raw klines response JSON
- After ticker fetch (line ~267): Log the raw ticker response JSON
- After price extraction (line ~287): Log the extracted `currentPrice` and the raw candle it came from
- After symbol mapping (line ~207): Log the `cleanTicker` and mapped `symbol`

Specific insertions:
- After `const klinesData = await klinesRes.json();` add:
  `console.log('[DEBUG chart-analyzer] Raw klines response:', JSON.stringify(klinesData).slice(0, 500));`
- After `const tickerData = await tickerRes.json();` add:
  `console.log('[DEBUG chart-analyzer] Raw ticker response:', JSON.stringify(tickerData).slice(0, 500));`
- After `const currentPrice = ...` add:
  `console.log('[DEBUG chart-analyzer] Symbol:', symbol, 'Price extracted:', currentPrice, 'From candle:', JSON.stringify(latestCandle));`
- After `const symbol = ...` add:
  `console.log('[DEBUG chart-analyzer] Ticker mapping:', ticker, '->', cleanTicker, '->', symbol);`

**2. `supabase/functions/ayn-unified/index.ts` -- Pionex block in trading-coach**

Add debug logs:

- After ticker response (line ~804): Log raw ticker response
- After price extraction (line ~807): Log extracted price and raw ticker object
- After klines response (line ~824): Log raw klines response
- After symbol creation (line ~777): Log symbol mapping

Specific insertions:
- After `const tickerData = await tickerRes.json();` add:
  `console.log('[DEBUG ayn-unified] Raw ticker response for', symbol, ':', JSON.stringify(tickerData).slice(0, 500));`
- After `const price = parseFloat(...)` add:
  `console.log('[DEBUG ayn-unified] Price extracted:', price, 'from fields close:', t.close, 'last:', t.last, 'open:', t.open);`
- After `const klinesData = await klinesRes.json();` add:
  `console.log('[DEBUG ayn-unified] Raw klines response for', symbol, ':', JSON.stringify(klinesData).slice(0, 500));`
- After `const symbol = ...` add:
  `console.log('[DEBUG ayn-unified] Ticker mapping:', ticker, '->', symbol);`

### After Deployment

Once deployed, analyze a SOL chart (or ask the coach about SOL). Then check the edge function logs which will show:

1. The exact URL/path being signed and called
2. The complete raw JSON from Pionex (first 500 chars to avoid log overflow)
3. The exact price value extracted and which field it came from (`close` vs `last`)
4. Whether the symbol mapping is correct (e.g., `SOL` -> `SOL_USDT`)

This will reveal if Pionex is returning unexpected data, if the wrong field is being read, or if the symbol is being mapped incorrectly.

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/analyze-trading-chart/index.ts` | Add 4 debug `console.log` statements in `fetchPionexData()` |
| `supabase/functions/ayn-unified/index.ts` | Add 4 debug `console.log` statements in the Pionex fetch block |

