

## Fix Chart Pattern Detection - Enhanced Vision & Prediction

### Overview

Rewrite the Gemini Vision prompt (Step 1) and prediction prompt (Step 3) in the `analyze-trading-chart` edge function to use a systematic pattern checklist approach with the trading knowledge base. Add a `WAIT` signal for low-confidence setups.

### Changes

**1. `supabase/functions/analyze-trading-chart/index.ts` -- Rewrite `analyzeChartImage()` (Step 1)**

Replace the current generic prompt (lines 26-49) with a structured checklist prompt that:
- Places `getCompactKnowledge()` at the TOP as primary reference
- Adds explicit pattern priority order: Chart patterns first, then candlestick patterns, then volume, then S/R and trend
- Adds visual identification rules for each category (bull flag = sharp rally + tight consolidation, engulfing = large candle covers prior, etc.)
- Adds volume spike detection rules (2x+ average = spike, note WHERE spikes occur)
- Adds confidence calibration: HIGH (70-90, textbook + volume confirms), MEDIUM (50-70, present but imperfect), LOW (30-50, questionable)
- Changes JSON response: `patterns` becomes array of objects with `name`, `type`, `confidence`, `score`, `reasoning`, `location`
- Adds `trendReasoning`, `currentPrice`, and structured `volume` object
- Increases `max_tokens` from 2000 to 3000

**2. `supabase/functions/analyze-trading-chart/index.ts` -- Rewrite `generatePrediction()` (Step 3)**

Replace the current prediction prompt (lines 129-160) with one that:
- Injects `getFullKnowledgeBase()` for pattern significance context
- Uses weighted scoring: 60% technical (from HIGH confidence pattern scores), 40% news sentiment
- Enforces: confidence < 50% forces `WAIT` signal
- Generates `actionablePlan` with conditional breakout/breakdown scenarios and specific price levels
- Adds `riskManagement` field
- Increases `max_tokens` to 2500
- Adds `WAIT` as valid signal option alongside BULLISH/BEARISH/NEUTRAL

**3. `supabase/functions/analyze-trading-chart/index.ts` -- Update Result Builder (Step 5, lines 277-309)**

Map the new richer Step 1 response to the frontend format:
- Extract pattern names from pattern objects array for `technical.patterns` (keeps frontend compatible)
- Map `technicalSummary` + `trendReasoning` to `keyObservations`
- Map structured `volume` object to `indicators.volume` as a descriptive string
- Pass through `actionablePlan` in prediction reasoning

**4. `src/types/chartAnalyzer.types.ts` -- Add WAIT signal**

Change line 6:
```typescript
export type PredictionSignal = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'WAIT';
```

**5. `src/components/dashboard/ChartAnalyzerResults.tsx` -- Add WAIT signal styling**

Add to `signalConfig` (line 14):
```typescript
WAIT: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'WAIT' },
```

**6. `src/components/dashboard/ChartHistoryStats.tsx` -- Handle WAIT in stats**

Add WAIT to the signal distribution counting logic so it appears in the performance insights bar.

### What stays the same

- Pipeline flow (Step 1 -> 2 -> 3 -> 4 -> 5) unchanged
- `tradingKnowledge.ts` unchanged (we just use its exports more effectively)
- News fetching (Step 2) unchanged
- Database storage (Step 4) unchanged
- `ChartAnalysisResult` response shape stays compatible -- patterns remain `string[]` in the frontend type (extracted from the richer objects on the backend)
- AYN chat integration unchanged

### Expected outcome

A chart with a clear bull flag will produce:
- Patterns detected with reasoning: "bull_flag (HIGH, 75) - Sharp rally formed flagpole, tight downward consolidation with decreasing volume"
- Volume analysis confirming patterns
- Signal: BULLISH or WAIT (conditional on breakout) instead of generic NEUTRAL
- Confidence: 70%+ for clear patterns instead of 40%
- Actionable plan with specific entry/SL/TP levels

