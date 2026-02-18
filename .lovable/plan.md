
# Fix: Live Prices Not Showing — Three Root Causes

## The Problems Diagnosed

### Problem 1: Klines API returns objects, not arrays (CRITICAL — chart shows nothing)

The `get-klines` edge function destructures klines as arrays:
```typescript
const rawKlines: Array<[number, string, string, string, string, string]> = data?.data?.klines ?? [];
const klines = rawKlines.map(([ts, o, h, l, c]) => ({ ... }));
```

But the Pionex API actually returns **objects** like:
```json
{ "time": 1691649240000, "open": "1851.27", "close": "1851.32", "high": "1851.32", "low": "1851.27", "volume": "0.542" }
```

So `rawKlines.map(([ts, o, h, l, c]) => ...)` produces empty/broken results. The `klines: []` response confirmed this.

**Fix:** Change the mapping to use object properties instead of array destructuring.

### Problem 2: Wrong interval format (CRITICAL — API returns no data)

Current mapping in `get-klines`:
```
'1m' → '1MIN'   ❌  (Pionex uses '1M')
'5m' → '5MIN'   ❌  (Pionex uses '5M')
'15m' → '15MIN' ❌  (Pionex uses '15M')
'1h' → '1HOUR'  ❌  (Pionex uses '60M')
```

The Pionex docs confirm valid intervals are: `1M, 5M, 15M, 30M, 60M, 4H, 8H, 12H, 1D`.

**Fix:** Update `INTERVAL_MAP` in the edge function.

### Problem 3: No PING/PONG heartbeat (CRITICAL — WebSocket dies after ~45 seconds)

From the Pionex docs:
> "Our server sends PING heartbeat every 15 seconds. Client sends PONG after receiving PING. If server does not receive PONG after 3 PINGs, it closes the connection."

Neither `useLivePrices` nor `LivePositionChart`'s `connectWs` handle the PING. So after 45 seconds (3 missed PINGs), Pionex closes the connection silently. The reconnect logic then kicks in but immediately fails again — no live prices ever appear in practice.

**Fix:** Add PING/PONG handling to both `useLivePrices` and `LivePositionChart`'s WebSocket `onmessage`:
```typescript
// In onmessage handler, before parsing trade data:
if (msg.op === 'PING') {
  ws.send(JSON.stringify({ op: 'PONG', timestamp: msg.timestamp }));
  return;
}
```

---

## Files to Fix

### Fix 1 + 2: `supabase/functions/get-klines/index.ts`

Two changes:

**Interval map** (line 7–12):
```typescript
const INTERVAL_MAP: Record<string, string> = {
  '1m': '1M',
  '5m': '5M',
  '15m': '15M',
  '1h': '60M',
};
```

**Kline mapping** (lines 67–77): Pionex returns objects, not tuples:
```typescript
interface PionexKline {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

const rawKlines: PionexKline[] = data?.data?.klines ?? [];

const klines = rawKlines.map((k) => ({
  time: Math.floor(k.time / 1000), // ms → seconds for lightweight-charts
  open: parseFloat(k.open),
  high: parseFloat(k.high),
  low: parseFloat(k.low),
  close: parseFloat(k.close),
}));
```

### Fix 3: `src/hooks/useLivePrices.ts`

Add PING/PONG handling inside `ws.onmessage`:
```typescript
ws.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data as string);
    
    // Respond to server heartbeat to keep connection alive
    if (msg.op === 'PING') {
      ws.send(JSON.stringify({ op: 'PONG', timestamp: msg.timestamp }));
      return;
    }
    
    if (msg.topic === 'TRADE' && msg.symbol && Array.isArray(msg.data) && msg.data.length > 0) {
      // ... existing price handling
    }
  } catch (e) { ... }
};
```

### Fix 4: `src/components/trading/LivePositionChart.tsx`

Same PING/PONG fix in `connectWs`'s `ws.onmessage` handler (line 123):
```typescript
ws.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data as string);
    
    // Keep connection alive
    if (msg.op === 'PING') {
      ws.send(JSON.stringify({ op: 'PONG', timestamp: msg.timestamp }));
      return;
    }
    
    if (msg.topic === 'TRADE' && msg.symbol === ticker && ...) {
      // ... existing candle building logic
    }
  } catch (e) { ... }
};
```

---

## Summary

| File | Fix |
|---|---|
| `supabase/functions/get-klines/index.ts` | Fix interval names (`1M` not `1MIN`) + fix kline parsing (objects not arrays) |
| `src/hooks/useLivePrices.ts` | Add PING→PONG heartbeat reply to keep WebSocket alive |
| `src/components/trading/LivePositionChart.tsx` | Add PING→PONG heartbeat reply to keep WebSocket alive |

After these three fixes: the chart will load historical candles, the WebSocket will stay connected indefinitely, and live prices will appear in the `OpenPositionCard` with the amber LIVE badge.
