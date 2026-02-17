

## Fix: Paper Trades Not Recording to Performance Dashboard

### The Problem

When AYN generates a trading signal in the chat (like the SOL/USD BUY you showed), the chat text says "I'm in. The trade is live in my paper account" -- but the trade is never actually recorded in the database. That's why the Performance tab shows $10,000, 0 trades, and no open positions.

The connection between the analysis and the paper trading system exists in code but is failing silently.

### Root Cause

The `analyze-trading-chart` edge function tries to call `ayn-open-trade` as a "fire-and-forget" HTTP request after generating the analysis. This call is:
- Not awaited (so failures are invisible)
- Dependent on correctly parsing entry/stop prices from the AI's free-text response
- Possibly failing due to the function not being deployed or URL issues

There are zero logs from `ayn-open-trade`, meaning it has never been reached.

### Fix Plan

**1. Deploy the `ayn-open-trade` edge function**

Ensure the function is actually deployed and reachable.

**2. Make the paper trade call more reliable in `analyze-trading-chart`**

In `supabase/functions/analyze-trading-chart/index.ts` (around line 1035):
- Change from fire-and-forget to properly awaited with error logging
- Add more robust price parsing with fallback extraction
- Log the exact payload being sent so failures are traceable

**3. Add a manual "Record Trade" fallback (optional but recommended)**

Since the AI sometimes generates trade signals with prices embedded in markdown text rather than structured fields, add a fallback: after the analysis response is returned to the client, the frontend can parse the structured `tradingSignal` from the response and call `ayn-open-trade` directly if the server-side fire-and-forget failed.

In `src/components/dashboard/ChartUnifiedChat.tsx`:
- After receiving an analysis response that contains a BUY/SELL signal with confidence >= 60, call the `ayn-open-trade` edge function from the client as a backup
- Show a small toast confirming the trade was recorded

### Technical Details

**Edge function change** (`analyze-trading-chart/index.ts`, ~line 1035):
```
// Before: fire-and-forget (failures invisible)
fetch(tradeUrl, { ... }).then(...).catch(...)

// After: await with proper logging
try {
  const tradeRes = await fetch(tradeUrl, { ... });
  const tradeResult = await tradeRes.text();
  console.log('[chart-analyzer] Paper trade result:', tradeResult);
} catch (e) {
  console.error('[chart-analyzer] Paper trade call FAILED:', e);
}
```

**Frontend backup** (`ChartUnifiedChat.tsx`):
- Extract `tradingSignal` from the analysis response JSON
- If signal is actionable (BUY/SELL, confidence >= 60), call `ayn-open-trade` via `supabase.functions.invoke()`
- Toast on success: "Trade recorded in paper account"

