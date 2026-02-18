
# Live Price WebSocket + Candlestick Charts for Open Positions

## What Gets Built

Three interconnected pieces:

1. **`useLivePrices` hook** — connects to Pionex WebSocket, delivers live prices per ticker to the UI
2. **`LivePositionChart` component** — a `lightweight-charts` candlestick chart with entry/stop/TP level lines, loaded with 100 historical candles + live updates
3. **`get-klines` edge function** — signed Pionex REST endpoint that returns historical kline data for a ticker/interval

Open positions in `PerformanceDashboard` will show live current prices and recalculated P&L. Each position card gets an expandable candlestick chart.

---

## Verified Pionex WebSocket Details

From the `ayn-monitor-trades` edge function (lines 41–68), the confirmed API pattern:
- **Base URL:** `https://api.pionex.com`
- **Ticker symbol format:** `BTC_USDT` (stored exactly this way in `ayn_paper_trades.ticker`)
- **Auth:** `PIONEX_API_KEY` + `PIONEX_API_SECRET` — secrets already configured in Supabase

For the **public WebSocket** (no auth needed):
- **URL:** `wss://ws.pionex.com/wsPub`
- **Subscribe:** `{ "op": "SUBSCRIBE", "topic": "TRADE", "symbol": "BTC_USDT" }`
- **Message:** `{ "topic": "TRADE", "symbol": "BTC_USDT", "data": [{ "price": "193.45", "size": "0.01", "side": "BUY", "timestamp": 1566691672311 }] }`

For **historical klines** (needs auth — edge function):
- `GET /api/v1/market/klines?symbol=BTC_USDT&interval=1MIN&limit=100&timestamp=...`
- Intervals: `1MIN`, `5MIN`, `15MIN`, `1HOUR`

---

## Files to Change

### New: `src/hooks/useLivePrices.ts`

A WebSocket hook with:
- Connects to `wss://ws.pionex.com/wsPub` when `tickers.length > 0`
- Subscribes to `TRADE` topic for each ticker  
- Parses incoming `data[0].price` (latest trade) into `Record<symbol, { price, timestamp }>`
- Auto-reconnect with exponential backoff (up to 5 attempts, max 30s delay)
- Properly unsubscribes and closes on unmount and when `tickers` changes
- Uses `JSON.stringify(tickers)` as the effect dependency to avoid infinite loop on array identity change

```typescript
export function useLivePrices(tickers: string[]): {
  prices: Record<string, { price: number; timestamp: number }>;
  connected: boolean;
}
```

### New: `supabase/functions/get-klines/index.ts`

Edge function that:
- Accepts `{ symbol, interval, limit }` in the request body
- Reuses the exact same HMAC-SHA256 signing pattern from `ayn-monitor-trades` (lines 17–24)
- Calls `GET /api/v1/market/klines?symbol=...&interval=...&limit=...&timestamp=...`
- Maps Pionex kline format `[timestamp, open, high, low, close, volume]` to `{ time, open, high, low, close }`
- Returns `{ klines: [...] }` with CORS headers
- Interval mapping: `'1m' → '1MIN'`, `'5m' → '5MIN'`, `'15m' → '15MIN'`, `'1h' → '1HOUR'`
- Added to `supabase/config.toml` with `verify_jwt = false`

### New: `src/components/trading/LivePositionChart.tsx`

A component that:
- Uses `lightweight-charts` library (to be installed as new dependency)
- Renders a dark-themed candlestick chart (background `hsl(var(--card))` to match the app theme)
- On mount: calls `get-klines` edge function to load 100 historical candles
- Subscribes to its own targeted WebSocket for live kline-level updates  
  - **Note:** Pionex `wsPub` provides `TRADE` topic (individual trades), not kline snapshots. So the chart builds/updates current-candle from trades:
    - Track current 1-minute candle open/high/low/close from incoming trade prices
    - On each trade tick, call `candleSeries.update(currentCandle)` to animate the live candle
- Adds price lines for:
  - Entry (blue dashed, labeled "Entry $X")  
  - Stop loss (red solid, labeled "Stop $X")
  - TP1 (green solid, labeled "TP1 $X")
  - TP2 if present (green dashed, labeled "TP2 $X")
- Timeframe tab selector: `1m | 5m | 15m | 1h` — switching tab re-fetches historical and resubscribes
- Handles window resize with `ResizeObserver`
- Clean teardown on unmount (removes chart, closes WebSocket)
- Only mounts when the position card is "expanded" (lazy — saves resources)

```typescript
interface LivePositionChartProps {
  ticker: string;
  entryPrice: number;
  stopLoss: number;
  tp1: number | null;
  tp2?: number | null;
  signal: string;
}
```

### Edit: `src/components/trading/PerformanceDashboard.tsx`

**Changes:**

1. Import `useLivePrices` hook
2. Derive `openTickers = useMemo(() => openTrades.map(t => t.ticker), [openTrades])`
3. Call `const { prices: livePrices, connected: pricesConnected } = useLivePrices(openTickers)`
4. Update the realtime indicator row (lines 428–436):
   - Show amber pulse + "Live prices" when `pricesConnected && openTrades.length > 0`
   - Keep green pulse + "Realtime" for DB changes (`isLive`)
5. Update `OpenPositionCard` to accept and display `livePrice?: number`:
   - Show live current price row: `$193.45 ● LIVE`
   - Recalculate unrealized P&L from live price when available
   - Show "LIVE" amber badge next to the P&L when live price is active
6. Pass `livePrice={livePrices[trade.ticker]?.price}` to each `OpenPositionCard`
7. Add expandable chart section inside each `OpenPositionCard`:
   - A "Chart" collapse button toggles `showChart` local state
   - When expanded, renders `<LivePositionChart>` with the trade's levels

**Updated `OpenPositionCard` signature:**
```typescript
function OpenPositionCard({ trade, onClose, livePrice }: {
  trade: PaperTrade;
  onClose: (id: string) => Promise<void>;
  livePrice?: number;
})
```

**Live P&L calculation:**
```typescript
const currentPrice = livePrice ?? entryPrice;
const isLiveActive = !!livePrice;

const liveGrossPnl = isBuy
  ? (currentPrice - entryPrice) * shares
  : (entryPrice - currentPrice) * shares;

const livePnlPercent = positionSizeDollars > 0
  ? (liveGrossPnl / positionSizeDollars) * 100 : 0;
```

**Note:** P&L from DB (`trade.pnl_dollars`) only updates when cron runs (every 5 min). Live P&L from the WebSocket price will update instantly, making the position card feel truly real-time.

### New entry in `supabase/config.toml`

```toml
[functions.get-klines]
verify_jwt = false
```

---

## New Dependency

`lightweight-charts` (by TradingView) — a production-grade, MIT-licensed chart library built exactly for this use case. It's tiny (~40KB gzipped), uses Canvas (not SVG, so no performance issues with live updates), and has first-class TypeScript support.

---

## Visual Layout After Changes

```text
┌─ Open Positions ─────────────────────────────────────────┐
│                                                           │
│  TAO_USDT  BUY  Order Block            [Chart ▼] [Close] │
│  ● LIVE  +2.34%  $23.45  →  Current: $193.45 ● LIVE     │
│  Entry $189.20  Stop $185.00  TP1 $195.00  Size 10%      │
│                                                           │
│  ┌─ 1min Candlestick ──────────────────────────────────┐ │
│  │  [1m] [5m] [15m] [1h]                               │ │
│  │                                                     │ │
│  │   ┌─┐  TP2 ─────────────────────── green dashed    │ │
│  │   │ │  TP1 ─────────────────────── green solid     │ │
│  │  ┌┘ └┐ Entry ─────────────────── blue dashed       │ │
│  │  │   └┐                                            │ │
│  │  │    └── Stop ───────────────── red solid         │ │
│  │  └─────────────────────────────────────────────────┘ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  BTC_USDT  SELL  ...                  [Chart ▼] [Close]  │
└───────────────────────────────────────────────────────────┘
```

---

## What Is NOT Included (Keeping Scope Focused)

- Live P&L timeline chart (Chart 2) — complex, requires storing P&L history in memory per session; can be added later
- Order book depth chart (Chart 4) — advanced, not critical for paper trading
- Multi-timeframe view is included as tab selector inside `LivePositionChart`

---

## File Change Summary

| File | Type | Change |
|---|---|---|
| `src/hooks/useLivePrices.ts` | NEW | WebSocket hook → real-time prices |
| `src/components/trading/LivePositionChart.tsx` | NEW | Candlestick chart component with level lines |
| `supabase/functions/get-klines/index.ts` | NEW | Signed Pionex klines REST proxy |
| `supabase/config.toml` | EDIT | Add `[functions.get-klines]` entry |
| `src/components/trading/PerformanceDashboard.tsx` | EDIT | Wire live prices, update cards with live P&L + chart toggle |
| `package.json` | EDIT | Add `lightweight-charts` dependency |

No database changes. No new secrets needed (PIONEX_API_KEY + PIONEX_API_SECRET already configured).
