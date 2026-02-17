

## Fix: Market Scanner Using Wrong Field Names + AI Fabricating Prices

### Root Cause

Two bugs causing AYN to show fake prices like "SOL at $174.20":

1. **Scanner returns 0 results**: The code reads `t.priceChangePercent` from Pionex, but that field doesn't exist. Pionex tickers only return `open`, `close`, `high`, `low`, `volume`, `amount`, `count`. So price change is always 0, max score is 63 (below the 65 threshold), and no opportunities are ever found.

2. **AI fabricates when scanner fails**: When the scanner returns nothing, the system prompt says "no setups found" but the AI ignores it and invents a SOL trade with made-up prices anyway.

### Fix 1: Calculate price change from open/close (line 570)

Replace `parseFloat(t.priceChangePercent || '0') * 100` with actual calculation:

```
const open = parseFloat(t.open || '0');
const price = parseFloat(t.close || t.last || '0');
const priceChange = open > 0 ? ((price - open) / open) * 100 : 0;
```

This matches how the existing Pionex integration already calculates change on line 994.

### Fix 2: Use `amount` for USD volume instead of `volume`

Pionex `volume` is in base currency (e.g., 1.537 BTC), not USD. The `amount` field is the quote currency volume (e.g., 12032.56 USDT). The $100K volume filter should use `amount`.

### Fix 3: Strengthen anti-fabrication when scanner returns no results

Update the "no opportunities" message to be more forceful:

```
MARKET SCAN RESULTS: Scanned X pairs. NO opportunities scored above threshold.
You MUST tell the user: "I scanned X pairs -- no high-conviction setups right now. I won't force a trade."
DO NOT fabricate or invent any trade. DO NOT make up prices. Just report the scan result.
```

### Fix 4: Add debug logging

Log a sample ticker's raw fields so we can verify the data format in production.

### Files to Modify

- `supabase/functions/ayn-unified/index.ts` (lines 567-600, 876-878)
  - Fix price change calculation from `open`/`close`
  - Use `amount` field for USD volume
  - Strengthen no-results prompt
  - Add debug logging for first ticker

### Expected Result

After fix, the scanner will properly score 353 tickers using real price changes and USD volumes, surface genuine opportunities with correct prices, and refuse to fabricate when nothing qualifies.

