

## Complete Trading Knowledge Base Enhancement -- Research + Psychology + Coach Mode

### Overview

Major upgrade to transform the chart analyzer from a pattern detector into a professional trading coach. Adds research-backed success rates, context-based reliability adjustments, trading psychology warnings, indicator limitations, and discipline reminders. Includes all 6 user additions (source attribution, 90% cap, 3-pattern limit, conditional psychology, test spec, rollback plan).

---

### Phase 1: Knowledge Base (`tradingKnowledge.ts`)

**1.1 Extend Interfaces (lines 11-28)**

Add optional fields to `Pattern`:
- `successRate?: { overall, stocks?, crypto?, daily?, intraday?, source, note }`
- `failureMode?: string`
- `invalidation?: string`
- `contextMultipliers?: { at_support?, at_resistance?, with_volume?, in_trend? }`
- `psychology?: { what_happened?, why_it_works?, why_it_fails?, trader_mistakes? }`

Add optional fields to `Indicator`:
- `limitations?: { lag, false_signals, best_use, dangerous? }`
- `reliability?: Record<string, string>`

**1.2 Add Research Data to 10 Key Patterns**

Update these existing patterns with `successRate` (including `source: 'Bulkowski'` and `note`), `failureMode`, `invalidation`, `contextMultipliers`, and `psychology`:

| Pattern | Base Rate | Crypto | Key Context |
|---------|-----------|--------|-------------|
| bull_flag | 68% | 58% | +10% volume, -15% at resistance |
| bear_flag | 67% | 57% | Similar adjustments |
| ascending_triangle | 72% | 64% | +8% in trend |
| head_and_shoulders | 83% | 71% | Best pattern overall |
| double_top | 65% | 56% | 35% failure rate |
| cup_and_handle | 65% | 45% | Much worse in crypto |
| bullish_engulfing | 63% | 58% | +20% at support, -25% at resistance |
| bearish_engulfing | 63% | 58% | Mirror of bullish |
| hammer | 60% | 54% | +18% at support |
| morning_star | 78% | 65% | Strong reversal |

Full psychology objects added for bull_flag, bullish_engulfing, and head_and_shoulders (the most commonly detected patterns).

**1.3 Add Indicator Limitations**

Update RSI, MACD, and moving_averages with `limitations` and `reliability` fields showing lag warnings and success rates for different use cases.

**1.4 Add CONTEXT_RULES Constant (new, after RISK_MANAGEMENT)**

Exported object with:
- `timeframe_multipliers`: 1m=0.75, 5m=0.85, 15m=0.95, 1H=1.0, 4H=1.15, Daily=1.25, Weekly=1.35
- `asset_multipliers`: stocks=1.0, crypto=0.85
- `volume_thresholds`: normal, increased, spike, climax descriptions
- `trend_context`: continuation (+15% in trend) vs reversal (+20% at extremes) adjustments
- `support_resistance_context`: +20% at correct level, -15% at wrong level, confluence bonuses

**1.5 Add calculatePatternReliability() Function (new)**

Takes pattern + context (timeframe, asset, volumeRatio, atSupport, atResistance, inTrend). Returns `{ adjustedReliability, adjustedScore, breakdown[] }`. Caps at **90%** (per user addition 2).

**1.6 Add TRADING_PSYCHOLOGY Constant (new)**

Complete psychology module:
- `cognitive_biases`: confirmation_bias, recency_bias, loss_aversion, fomo, gamblers_fallacy (each with definition, example, danger, solution)
- `emotional_states`: fear, greed, revenge_trading (symptoms, cause, solution)
- `market_psychology`: market_cycle_emotions, why_retail_loses
- `common_mistakes`: overtrading, not_using_stops, averaging_down
- `professional_mindset`: core_beliefs, rules_to_live_by

**1.7 Update getFullKnowledgeBase() (lines 1320-1377)**

Add sections for:
- Pattern reliability rules with context formula
- Indicator limitation warnings
- Psychology and behavioral finance summary
- Updated critical rules (probabilities not certainties, failure modes, psychology context)

**1.8 Update getCandlestickKnowledge() and getChartPatternKnowledge()**

Include success rates and failure modes in the formatted output when available.

---

### Phase 2: Edge Function Prompts (`index.ts`)

**2.1 Update Step 1 Vision Prompt (lines 26-117)**

Changes:
- Add strict confidence-score enforcement rules (score < 70 = never HIGH, score >= 70 = HIGH, volume confirms = +10)
- Add **3-pattern maximum** rule (user addition 3): "Report only the 3 highest-confidence patterns"
- Add `currentRatio` field to volume JSON output schema
- Keep prompt compact (no psychology here -- that goes in Step 3 only)

**2.2 Update Step 3 Prediction Prompt (lines 147-300)**

Before the AI call:
- Calculate context-adjusted scores using `calculatePatternReliability()` for each detected pattern
- Pass adjusted patterns + psychology context to prompt

Prompt additions:
- Request `patternBreakdown[]` with baseScore, adjustments, finalScore, historicalSuccess, failureMode, invalidation
- Request `psychologyWarnings` with marketStage, crowdPosition, emotionalDrivers, commonMistakes, contrarian_insight
- Request `disciplineReminders` with positionSizing, stopLoss, emotionalCheck, invalidation
- **Conditional psychology** (user addition 4): "Include psychologyWarnings ONLY when: price moved 30%+ in timeframe, volume 2x+ average, or price at market extremes (near S/R). Skip for normal price action."
- Consistency rules: entry_zone must match entryTiming prices
- Cap confidence at 90%
- Increase max_tokens from 2500 to 3500

**2.3 Update Step 5 Result Builder (lines 311-365)**

Pass through new fields:
- `patternBreakdown` array
- `psychologyWarnings` object
- `disciplineReminders` object
- Enhanced disclaimer with success rate percentage

---

### Phase 3: Type Updates (`chartAnalyzer.types.ts`)

Add new interfaces:

```text
PatternBreakdown {
  name: string
  baseScore: number
  adjustments: string[]
  finalScore: number
  historicalSuccess: string
  failureMode: string
  invalidation: string
}

PsychologyWarnings {
  marketStage: string
  crowdPosition: string
  emotionalDrivers: string[]
  commonMistakes: string[]
  contrarian_insight?: string
}

DisciplineReminders {
  positionSizing: string
  stopLoss: string
  emotionalCheck: string
  invalidation: string
}
```

Add to `ChartPrediction`:
- `patternBreakdown?: PatternBreakdown[]`
- `psychologyWarnings?: PsychologyWarnings`
- `disciplineReminders?: DisciplineReminders`

---

### Phase 4: Frontend UI (`ChartAnalyzerResults.tsx`)

**4.1 Psychology Warnings Card** (after Entry Timing, before Trade Setup)
- Blue-tinted card with brain icon
- Market stage + crowd position labels
- Emotional driver badges
- Common mistakes list
- Contrarian insight callout
- Only renders when `prediction.psychologyWarnings` exists (conditional from prompt)

**4.2 Enhanced Pattern Breakdown** (after Trade Setup, in Technical Analysis)
- When `prediction.patternBreakdown` exists, render detailed cards showing:
  - Base score -> adjustments -> final score with color coding
  - Historical success rate (green), source attribution: "Bulkowski, 10K+ patterns"
  - Failure mode (red)
  - Invalidation level (orange)
- Falls back to existing PatternCard display when breakdown not available

**4.3 Discipline Reminders Card** (before disclaimer)
- Gray card with target icon
- Position sizing, stop loss, emotional check, invalidation as bullet points
- Only renders when `prediction.disciplineReminders` exists

---

### User Additions Incorporated

| Addition | Where |
|----------|-------|
| 1. Source attribution | `successRate.source` + `successRate.note` in Pattern, displayed in UI as "Bulkowski, 10K+ patterns" |
| 2. 90% confidence cap | `calculatePatternReliability()` caps at 90, prediction prompt caps confidence at 90 |
| 3. Max 3 patterns | Vision prompt rule: "Maximum 3 patterns, report highest confidence only" |
| 4. Conditional psychology | Prediction prompt: only include when price extreme, volume extreme, or at S/R |
| 5. Test case | Verify with USELESS/USD 15m after deployment |
| 6. Rollback | All new fields are optional (?) in types. Frontend uses conditional rendering. KB changes are additive. Safe partial rollback. |

---

### Files Summary

| File | Type of Change |
|------|---------------|
| `supabase/functions/analyze-trading-chart/tradingKnowledge.ts` | Extend interfaces, add research data to 10 patterns, add indicator limitations, add CONTEXT_RULES + calculatePatternReliability() + TRADING_PSYCHOLOGY, update knowledge retrieval functions |
| `supabase/functions/analyze-trading-chart/index.ts` | Update vision prompt (confidence rules, 3-pattern limit), update prediction prompt (psychology, breakdown, discipline, conditional triggers, 90% cap), expand news filtering, pass through new fields |
| `src/types/chartAnalyzer.types.ts` | Add PatternBreakdown, PsychologyWarnings, DisciplineReminders interfaces |
| `src/components/dashboard/ChartAnalyzerResults.tsx` | Add Psychology card, enhanced pattern breakdown, discipline reminders card |

### Deployment

After all changes, redeploy the `analyze-trading-chart` edge function and test with a chart upload.

