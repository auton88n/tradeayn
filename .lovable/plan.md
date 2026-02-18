
# Fix: Klines Are Returned Newest-First, Must Be Sorted Oldest-First

## The Problem (Confirmed by Live Test)

Calling `get-klines` right now returns this:
```json
{ "time": 1771430400 },  ← newest
{ "time": 1771426800 },
{ "time": 1771423200 },
{ "time": 1771419600 },
{ "time": 1771416000 }   ← oldest
```

Pionex returns klines in **descending order** (most recent first). `lightweight-charts` requires data in **ascending order** (oldest first). When `setData()` is called with descending data, it throws:

```
Assertion failed: data must be asc ordered by time, index=1, time=1771426800, prev time=1771430400
```

This is caught by the `try/catch` silently (non-fatal), so the chart renders with zero candles. That's exactly what the screenshot shows — the chart frame is there, the price lines are there, but no candles.

## The Fix

**One line** in `get-klines/index.ts` — sort the klines ascending before returning:

```typescript
// Before (Pionex order = newest first = descending):
const klines = rawKlines.map((k) => ({ ... }));

// After (sort ascending = oldest first = what lightweight-charts needs):
const klines = rawKlines
  .map((k) => ({
    time: Math.floor(k.time / 1000),
    open: parseFloat(k.open),
    high: parseFloat(k.high),
    low: parseFloat(k.low),
    close: parseFloat(k.close),
  }))
  .sort((a, b) => a.time - b.time);  // ← the fix
```

Then redeploy `get-klines`.

## Why This Is the Only Change Needed

- The klines edge function already returns valid OHLCV data (confirmed live — 100 candles, correct prices around $187-194 for TAO_USDT)
- The WebSocket is already working (live price shows $187.30 with the amber pulse)
- `setData` will succeed with sorted data and candles will fill the chart
- `fitContent()` will then zoom to show all 100 candles
- Live WebSocket updates will continue appending new candles on top

## File to Change

### `supabase/functions/get-klines/index.ts`

Change lines 81–87 (the `.map()` call) to add `.sort((a, b) => a.time - b.time)` at the end:

```typescript
const klines = rawKlines
  .map((k) => ({
    time: Math.floor(k.time / 1000),
    open: parseFloat(k.open),
    high: parseFloat(k.high),
    low: parseFloat(k.low),
    close: parseFloat(k.close),
  }))
  .sort((a, b) => a.time - b.time);
```

Then redeploy the edge function.

## What You'll See After

- Chart fills with 100 historical candlesticks (1h view = ~4 days of data)
- Live candle updates in real-time from the WebSocket
- Entry ($193), Stop ($183.35), TP1 ($212.30), TP2 ($231.60) lines visible across the candles
- Switching timeframes (1m/5m/15m/1h) will reload candles correctly
