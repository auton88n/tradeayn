
# Fix: Pionex Messages Arrive as Blob, Not String

## Root Cause (Confirmed from Console Logs)

```
SyntaxError: Unexpected token 'o', "[object Blob]" is not valid JSON
```

The `ws-relay` edge function IS working — Supabase logs confirm:
- "Pionex connected, flushing 1 pending messages" ✅
- Messages are flowing through

But Pionex sends WebSocket messages as **binary frames** (not text frames). The browser receives them as `Blob` objects. When the code does `JSON.parse(event.data as string)`, JavaScript coerces the Blob to the string `"[object Blob]"` — which is not valid JSON.

## The Fix

In both `useLivePrices.ts` and `LivePositionChart.tsx`, change the `onmessage` handler to convert Blob → text before parsing:

```typescript
ws.onmessage = async (event) => {
  try {
    const text = event.data instanceof Blob
      ? await event.data.text()
      : (event.data as string);
    const msg = JSON.parse(text);
    // ... rest of handler unchanged
  } catch (e) { ... }
};
```

`Blob.text()` returns a Promise that resolves to the UTF-8 string content. Since `onmessage` is already an async function in practice, making it `async` is safe.

## Files to Change

### 1. `src/hooks/useLivePrices.ts`

Change `ws.onmessage` from synchronous to async and add Blob conversion at the top:

```typescript
ws.onmessage = async (event) => {
  try {
    const text = event.data instanceof Blob
      ? await event.data.text()
      : (event.data as string);
    const msg = JSON.parse(text);

    if (msg.op === 'PING') {
      ws.send(JSON.stringify({ op: 'PONG', timestamp: msg.timestamp }));
      return;
    }

    if (msg.topic === 'TRADE' && msg.symbol && Array.isArray(msg.data) && msg.data.length > 0) {
      const latestTrade = msg.data[0];
      const price = parseFloat(latestTrade.price);
      if (!isNaN(price)) {
        setPrices(prev => ({
          ...prev,
          [msg.symbol]: { price, timestamp: latestTrade.timestamp ?? Date.now() },
        }));
      }
    }
  } catch (e) {
    console.error('[useLivePrices] parse error', e);
  }
};
```

### 2. `src/components/trading/LivePositionChart.tsx`

Same change in the `connectWs` callback's `ws.onmessage`:

```typescript
ws.onmessage = async (event) => {
  try {
    const text = event.data instanceof Blob
      ? await event.data.text()
      : (event.data as string);
    const msg = JSON.parse(text);

    if (msg.op === 'PING') {
      ws.send(JSON.stringify({ op: 'PONG', timestamp: msg.timestamp }));
      return;
    }

    if (msg.topic === 'TRADE' && msg.symbol === ticker && Array.isArray(msg.data) && msg.data.length > 0) {
      // ... existing candle logic unchanged
    }
  } catch (e) {
    console.error('[LivePositionChart] WS parse error:', e);
  }
};
```

## Why This Works

- Blob frames from Pionex become proper UTF-8 strings via `blob.text()`
- JSON parsing then works correctly
- PING/PONG heartbeat responds correctly
- TRADE messages are parsed and prices update in real-time
- No edge function changes needed — the relay itself is working fine

## File Change Summary

| File | Change |
|---|---|
| `src/hooks/useLivePrices.ts` | `onmessage` → `async`, add `Blob.text()` conversion before `JSON.parse` |
| `src/components/trading/LivePositionChart.tsx` | Same Blob fix in `connectWs` `onmessage` |

No edge function changes. No new secrets. No DB changes.
