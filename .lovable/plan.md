

## Phase 1 Enhancements: Timeframe, Asset Type Detection, and DB Storage

Building on the approved Phase 1 plan for the AYN Chart Analyzer, here are the 3 additions you requested.

### 1. Add Timeframe to Prediction

The Gemini Vision prompt will explicitly ask for the chart's **timeframe** (1m, 5m, 15m, 1H, 4H, Daily, Weekly, Monthly). This gets returned in both the `technical` and `prediction` sections of the response, so users know the context of the signal.

The prediction reasoning will reference the timeframe: e.g., "On the 4H timeframe, the ascending triangle suggests..."

### 2. Add Asset Type Detection

Gemini Vision will also detect the **asset type** from the chart screenshot:
- **Stock** (e.g., AAPL, TSLA)
- **Crypto** (e.g., BTC/USDT, ETH/USD)
- **Forex** (e.g., EUR/USD)
- **Commodity** (e.g., Gold, Oil)
- **Index** (e.g., S&P 500, NASDAQ)

This affects how news is searched (e.g., "AAPL stock news" vs "BTC crypto news") and which trading knowledge context gets injected into the prompt.

### 3. Store Results in DB

Create a new `chart_analyses` table to persist every analysis result, even if we don't display history yet. This gives us data for Phase 3 (historical tracking).

### Technical Details

**Database Migration -- new table `chart_analyses`:**
```sql
CREATE TABLE public.chart_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT,
  image_url TEXT,
  ticker TEXT,
  asset_type TEXT,  -- 'stock', 'crypto', 'forex', 'commodity', 'index'
  timeframe TEXT,   -- '1m', '5m', '15m', '1H', '4H', 'Daily', 'Weekly', 'Monthly'
  technical_analysis JSONB DEFAULT '{}'::jsonb,
  news_data JSONB DEFAULT '[]'::jsonb,
  sentiment_score DECIMAL(4,3),
  prediction_signal TEXT,  -- 'BULLISH', 'BEARISH', 'NEUTRAL'
  confidence INTEGER,
  prediction_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chart_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.chart_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert"
  ON public.chart_analyses FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_chart_analyses_user ON public.chart_analyses(user_id);
CREATE INDEX idx_chart_analyses_ticker ON public.chart_analyses(ticker);
```

**Edge Function (`supabase/functions/analyze-trading-chart/index.ts`):**

The unified edge function pipeline becomes:

```text
Step 1: Gemini Vision --> extract ticker, timeframe, assetType, trend, patterns, levels
Step 2: Firecrawl searchWeb("{ticker} {assetType} news") --> 5-10 headlines
Step 3: Gemini --> sentiment scores + combined prediction with timeframe context
Step 4: INSERT result into chart_analyses table
Step 5: Return full JSON to frontend
```

The Gemini Vision prompt will include:
```text
Analyze this trading chart and return JSON with:
- ticker: the asset symbol (e.g., "AAPL", "BTC/USDT")
- assetType: one of "stock", "crypto", "forex", "commodity", "index"
- timeframe: detected chart timeframe (e.g., "4H", "Daily", "1m")
- trend: "bullish", "bearish", or "sideways"
- patterns: array of detected patterns
- support: array of support levels
- resistance: array of resistance levels
- indicators: any visible indicators (RSI, MACD, MA, etc.)
```

**Response JSON shape (updated):**
```text
{
  ticker: "AAPL",
  assetType: "stock",
  timeframe: "4H",
  technical: {
    trend: "bullish",
    patterns: ["ascending triangle", "golden cross"],
    support: [182.50, 178.00],
    resistance: [195.00, 200.00],
    indicators: { rsi: 62, macd: "bullish crossover" }
  },
  news: [...],
  prediction: {
    signal: "BULLISH",
    confidence: 78,
    timeframe: "4H",
    assetType: "stock",
    reasoning: "On the 4H timeframe, AAPL shows...",
    entry_zone: "188-190",
    stop_loss: "182",
    take_profit: "198-200",
    risk_reward: "1:2.5"
  },
  analysisId: "uuid-from-db",
  disclaimer: "For educational purposes only..."
}
```

**Frontend components** (same as Phase 1 plan):
- `src/components/dashboard/ChartAnalyzer.tsx` -- upload + results
- `src/hooks/useChartAnalyzer.ts` -- manages the flow
- Updated to display timeframe badge and asset type icon

**Config updates:**
- `supabase/config.toml` -- add `[functions.analyze-trading-chart]`
- `src/constants/apiEndpoints.ts` -- add `ANALYZE_TRADING_CHART`

**Files to create/modify:**
1. DB migration: `chart_analyses` table
2. `supabase/functions/analyze-trading-chart/index.ts` -- full pipeline
3. `src/components/dashboard/ChartAnalyzer.tsx` -- UI component
4. `src/components/dashboard/ChartAnalyzerResults.tsx` -- results display
5. `src/hooks/useChartAnalyzer.ts` -- custom hook
6. `src/constants/apiEndpoints.ts` -- add endpoint
7. `supabase/config.toml` -- add function config
8. `src/types/dashboard.types.ts` -- add types
