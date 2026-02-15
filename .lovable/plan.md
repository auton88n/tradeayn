

## Fix Pattern Math + News + Disclaimer

Three targeted fixes to resolve the score calculation mismatch, news filtering note, and disclaimer simplification.

---

### Fix 1: Convert calculatePatternReliability to Pure Additive (CRITICAL)

**File: `supabase/functions/analyze-trading-chart/tradingKnowledge.ts`** (lines 1578-1644)

The current function uses multiplicative math (`finalRate *= 0.95`) but labels adjustments as additive percentages (`-5%`). This causes a mismatch: users see "-5%, -15%, +20%, -20%" and expect `60 - 5 - 15 + 20 - 20 = 40`, but get a different number from multiplication.

**Change to pure additive:**

Replace the entire calculation body (lines 1578-1644) with:

```
const baseRate = parseFloat(pattern.successRate?.overall || '60');
const adjustments: string[] = [];
let finalRate = baseRate;

// 1. Timeframe adjustment (additive)
const tf = CONTEXT_RULES.timeframe_multipliers[context.timeframe] || CONTEXT_RULES.timeframe_multipliers['unknown'];
if (tf.reliability !== 1.0) {
  const change = Math.round((tf.reliability - 1) * 100);
  adjustments.push(`Timeframe ${context.timeframe}: ${change > 0 ? '+' : ''}${change}%`);
  finalRate += change;
}

// 2. Asset type adjustment (additive)
if (context.assetType === 'crypto') {
  const mult = CONTEXT_RULES.asset_multipliers.crypto.patterns;
  if (mult !== 1.0) {
    const change = Math.round((mult - 1) * 100);
    adjustments.push(`Crypto asset: ${change}% (volatile markets)`);
    finalRate += change;
  }
}

// 3. Volume adjustment (additive)
if (context.volumeRatio >= 2.0) {
  adjustments.push('Volume spike (>2x): +15%');
  finalRate += 15;
} else if (context.volumeRatio >= 1.5) {
  adjustments.push('Increased volume (1.5x): +10%');
  finalRate += 10;
} else if (context.volumeRatio < 0.7) {
  adjustments.push('Low volume (<0.7x): -10%');
  finalRate -= 10;
}

// 4. Support/resistance adjustment (additive)
if (pattern.type === 'BULLISH' && context.atSupport) {
  adjustments.push('At support level: +20%');
  finalRate += 20;
} else if (pattern.type === 'BEARISH' && context.atResistance) {
  adjustments.push('At resistance level: +20%');
  finalRate += 20;
} else if (pattern.type === 'BULLISH' && context.atResistance) {
  adjustments.push('At resistance level: -15%');
  finalRate -= 15;
} else if (pattern.type === 'BEARISH' && context.atSupport) {
  adjustments.push('At support level: -15%');
  finalRate -= 15;
}

// 5. Trend context (additive)
const isContinuation = pattern.description.toLowerCase().includes('continuation');
if (isContinuation && context.inTrend) {
  adjustments.push('In trending market: +15%');
  finalRate += 15;
} else if (isContinuation && !context.inTrend) {
  adjustments.push('Sideways market: -20%');
  finalRate -= 20;
}

// Floor at 30%, cap at 90%
const finalScore = Math.max(30, Math.min(Math.round(finalRate), 90));
```

Now `Base: 60, -5, -15, +20, -20 = 40%` is exactly verifiable. The rest of the function (reliability categorization + return) stays the same.

---

### Fix 2: Add "Limited News" Warning

**File: `supabase/functions/analyze-trading-chart/index.ts`** (after line 220)

After filtering, if fewer than 3 articles remain, log a warning note. Then in the sentiment analysis step, pass this information through so the prediction prompt can factor in news reliability.

Add after line 220:
```
const limitedNews = filtered.length < 3;
if (limitedNews) {
  console.log(`[chart-analyzer] Warning: Only ${filtered.length} news items after filtering - sentiment may not be reliable`);
}
```

Also add `limitedNews` flag to the returned object so the prediction prompt can include a note like "News sentiment based on limited data (X articles) - weight accordingly."

No UI change needed -- the existing `overallSentiment` badge on the News section already conveys the score. The prompt will naturally reduce news weight when told data is limited.

---

### Fix 3: Simplify Disclaimer

**File: `supabase/functions/analyze-trading-chart/index.ts`** (line 654)

Replace the current disclaimer string with:
```
"Educational analysis only, not financial advice. Even high-confidence patterns fail 20-40% of the time. Always use stop losses and risk only 1-2% per trade."
```

Remove the appended `disclaimerRate` (lines 611-612) since that information already appears in the Pattern Breakdown section.

---

### Files Summary

| File | Change |
|------|--------|
| `supabase/functions/analyze-trading-chart/tradingKnowledge.ts` | Convert `calculatePatternReliability` from multiplicative to additive math |
| `supabase/functions/analyze-trading-chart/index.ts` | Add limited-news warning, simplify disclaimer |

After changes, redeploy the `analyze-trading-chart` edge function.

