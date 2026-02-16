

## Integrate Pionex Market Data into Chart Analysis

### What This Does

When AYN analyzes a chart screenshot, it currently only has the image to work with. By adding Pionex market data, AYN will also get **real price data** (candles, volume, 24h stats) for the detected ticker -- giving it precise numbers to cross-reference against the visual patterns.

### How to Get Your Pionex API Keys

1. Go to [pionex.com](https://pionex.com) and log in
2. Click your profile icon (top right) and go to **API Management**
3. Click **Create API Key**
4. Set permissions to **Read Only** (we only need market data, not trading)
5. Copy the **API Key** and **API Secret** -- you'll paste them into Lovable when prompted

### Technical Changes

#### 1. Store Pionex Credentials as Secrets

Two new secrets will be added:
- `PIONEX_API_KEY`
- `PIONEX_API_SECRET`

#### 2. New Pionex Data Fetcher (inside the edge function)

**File:** `supabase/functions/analyze-trading-chart/index.ts`

Add a `fetchPionexData()` function that:
- Takes the detected ticker + timeframe from Step 1 (vision analysis)
- Maps the ticker to Pionex symbol format (e.g., `BTC` to `BTC_USDT`)
- Calls two Pionex endpoints (public, no auth needed for market data):
  - `GET /api/v1/market/klines` -- last 100 candles matching the chart timeframe
  - `GET /api/v1/market/tickers` -- 24h stats (open, close, high, low, volume)
- Signs requests with HMAC-SHA256 using the API secret (required by Pionex for all endpoints)
- Returns structured OHLCV data + 24h stats

#### 3. Inject Pionex Data into AI Prediction Prompt

**File:** `supabase/functions/analyze-trading-chart/index.ts`

After Step 1 (vision) and Step 2 (news), add a new Step 2.5:
- Call `fetchPionexData(ticker, timeframe)`
- Pass the kline data into the Step 3 prediction prompt as a new section:

```
## Live Market Data (from Pionex API)
Current Price: 0.04532
24h Change: -2.11%
24h High/Low: 0.0489 / 0.0421
24h Volume: 1,234,567 USDT
Last 10 candles (1H): [OHLCV array]
```

This gives the AI exact numbers to validate the visual patterns against real data.

#### 4. Graceful Fallback

If Pionex API fails (ticker not listed, rate limit, network error):
- Log the error
- Continue analysis without market data (same as current behavior)
- No user-facing error -- just less data for the AI

### Timeframe Mapping

| Chart Timeframe | Pionex Interval |
|----------------|-----------------|
| 1m | 1m |
| 5m | 5m |
| 15m | 15m |
| 1H | 1H |
| 4H | 4H |
| Daily | 1D |
| Weekly | 1W |

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/analyze-trading-chart/index.ts` | Add Pionex data fetcher, inject market data into prediction prompt, add Step 2.5 |
| Secrets | Add `PIONEX_API_KEY` and `PIONEX_API_SECRET` |
| `supabase/config.toml` | No change needed (function already exists) |

### What AYN Gets With This

- **Exact current price** instead of estimating from the chart image
- **Real volume data** to validate volume analysis from the screenshot
- **24h high/low** to confirm support/resistance levels
- **Recent candle data** to verify patterns the vision model detected
- **Better confidence scores** because the AI has hard data to cross-check against visual patterns

