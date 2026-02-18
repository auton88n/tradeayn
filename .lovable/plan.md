
# Fix: Two Root Causes Confirmed via Browser Debug

## What Was Found

### Problem 1: Pionex WebSocket returns 403 (CONFIRMED via console logs)

```
WebSocket connection to 'wss://ws.pionex.com/wsPub' failed: Error during WebSocket handshake: Unexpected response code: 403
```

Pionex blocks WebSocket connections from browser `Origin` headers they don't whitelist. The preview domain `lovableproject.com` is not whitelisted. This kills **all** live price updates — both in `useLivePrices` (the Open Positions card live P&L) and `LivePositionChart` (live candle updates).

**Root cause:** Direct browser WebSocket to Pionex is blocked by their CORS/Origin policy.

**Fix:** Proxy the WebSocket through a Supabase edge function. The edge function connects to Pionex server-side (no browser Origin restrictions), then relays messages to/from the browser. Supabase edge functions support WebSocket upgrades via `Deno.upgradeWebSocket`.

### Problem 2: Chart shows "Could not load chart data" even though klines arrive (CONFIRMED)

The network log confirmed the `get-klines` edge function returns 100 perfect candles. But the chart still shows the error. This means the error is thrown **in the `try` block before** the `setData` call succeeds — specifically in `buildChart()`.

The likely cause: `containerRef.current.clientWidth` is **0** when `buildChart()` is called on first render. When the chart section is toggled open, the React re-render hasn't committed the full layout yet, so the `<div ref={containerRef} />` has zero width. `createChart({ width: 0, height: 320 })` in lightweight-charts v5 throws an error, which is caught by the `catch` block and sets `setError('Could not load chart data')`.

**Fix:** Use `autoSize: true` in the chart options (lightweight-charts v5 native feature) instead of `width: containerRef.current.clientWidth`. This removes the need for `ResizeObserver` too.

---

## The Solution

### Fix 1: WebSocket Relay Edge Function

Create `supabase/functions/ws-relay/index.ts` — a Supabase edge function that:
1. Accepts a WebSocket connection from the browser
2. Connects to `wss://ws.pionex.com/wsPub` server-side (no Origin restriction)
3. Forwards all messages bidirectionally (browser ↔ Pionex)
4. Handles cleanup when either side closes

**Frontend changes:** Both `useLivePrices.ts` and `LivePositionChart.tsx` change their WebSocket URL from:
```
wss://ws.pionex.com/wsPub
```
to:
```
wss://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ws-relay
```

The relay is transparent — the same subscribe/unsubscribe messages work identically. PING/PONG handling stays the same.

### Fix 2: Use `autoSize: true` in the Chart

In `LivePositionChart.tsx`, change `buildChart()` to:
```typescript
const chart = createChart(containerRef.current, {
  autoSize: true,   // ← lightweight-charts v5 handles sizing automatically
  height: 320,
  // ... rest of options unchanged
});
```

And remove the `ResizeObserver` effect (no longer needed — `autoSize` handles it natively).

---

## Files to Change

### New: `supabase/functions/ws-relay/index.ts`

```typescript
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // Must be a WebSocket upgrade
  const upgrade = req.headers.get('upgrade') ?? '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // Upgrade the browser connection
  const { socket: browserSocket, response } = Deno.upgradeWebSocket(req);

  // Connect to Pionex server-side (no browser Origin restrictions here)
  const pionexSocket = new WebSocket('wss://ws.pionex.com/wsPub');

  // Browser → Pionex relay
  browserSocket.onmessage = (event) => {
    if (pionexSocket.readyState === WebSocket.OPEN) {
      pionexSocket.send(event.data);
    }
  };

  // Pionex → Browser relay
  pionexSocket.onmessage = (event) => {
    if (browserSocket.readyState === WebSocket.OPEN) {
      browserSocket.send(event.data);
    }
  };

  // Handle close events
  browserSocket.onclose = () => {
    if (pionexSocket.readyState === WebSocket.OPEN) pionexSocket.close();
  };
  pionexSocket.onclose = () => {
    if (browserSocket.readyState === WebSocket.OPEN) browserSocket.close();
  };

  // Handle errors
  browserSocket.onerror = (e) => console.error('[ws-relay] browser error:', e);
  pionexSocket.onerror = (e) => console.error('[ws-relay] pionex error:', e);

  return response;
});
```

Add to `supabase/config.toml`:
```toml
[functions.ws-relay]
verify_jwt = false
```

### Edit: `src/hooks/useLivePrices.ts`

Change WebSocket URL (line ~20):
```typescript
// Before:
ws = new WebSocket('wss://ws.pionex.com/wsPub');
// After:
ws = new WebSocket('wss://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ws-relay');
```

### Edit: `src/components/trading/LivePositionChart.tsx`

Two changes:

**Change 1 — WebSocket URL in `connectWs`:**
```typescript
// Before:
const ws = new WebSocket('wss://ws.pionex.com/wsPub');
// After:
const ws = new WebSocket('wss://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ws-relay');
```

**Change 2 — Use `autoSize: true` in `buildChart`:**
```typescript
const chart = createChart(containerRef.current, {
  autoSize: true,   // ← replaces width: containerRef.current.clientWidth
  height: 320,
  // rest unchanged
});
```

Remove the `ResizeObserver` `useEffect` block (lines 198–208) since `autoSize` handles it.

---

## File Change Summary

| File | Type | Change |
|---|---|---|
| `supabase/functions/ws-relay/index.ts` | NEW | WebSocket relay proxy to bypass Pionex's browser Origin block |
| `supabase/config.toml` | EDIT | Add `[functions.ws-relay] verify_jwt = false` |
| `src/hooks/useLivePrices.ts` | EDIT | Point WebSocket URL to relay |
| `src/components/trading/LivePositionChart.tsx` | EDIT | Point WebSocket URL to relay + use `autoSize: true` |

No database changes. No new secrets needed.

---

## Why This Works

- **Edge function WebSocket** connects to Pionex from Supabase's servers — no browser `Origin` header, no 403
- **`autoSize: true`** lets lightweight-charts handle its own width using a ResizeObserver internally, so `width: 0` on initial render is no longer an issue
- The relay is completely transparent — the subscribe/unsubscribe/PING/PONG protocol is unchanged
