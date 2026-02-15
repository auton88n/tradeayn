

## Fix Tutorial: Separate Charts from Engineering Tools

### Problem
The Engineering tutorial step currently shows all 3 sidebar tools together (Engineering, Compliance, Charts). But Charts is **not** an engineering tool -- it's for stock and crypto trading analysis. They need to be presented separately with proper context.

### Changes

#### 1. Update Engineering illustration -- remove Charts card
**File: `src/components/tutorial/TutorialIllustrations.tsx`** (lines 543-590)

- Change the grid from `grid-cols-3` to `grid-cols-2` 
- Remove the Charts card from the array (keep only Engineering and Compliance)
- Update the title from "Your Tool Suite" to "Engineering Suite" or similar
- Update the hint text to match

#### 2. Update Chart Analyzer tutorial step description
**File: `src/types/tutorial.types.ts`** (lines 71-75)

- Change the description to better explain it's for stocks and crypto trading, not engineering:
  - Current: "Upload trading charts for AI-powered technical analysis with pattern detection, support/resistance levels, and trade signals."
  - New: "Analyze stock and crypto charts with AI-powered pattern detection, support/resistance levels, entry/exit signals, and market sentiment scoring."

#### 3. Enhance Chart Analyzer illustration
**File: `src/components/tutorial/TutorialIllustrations.tsx`** (lines 714-795)

- Add a ticker label (e.g., "BTC/USDT" or "AAPL") to the header to make it clear this is for trading
- Add asset type badges (Stock, Crypto, Forex) below the header to show supported markets
- Keep the existing candlestick chart, indicators, and signal badge (they already look good)

### Files Summary

| File | Change |
|------|--------|
| `src/types/tutorial.types.ts` | Update chart-analyzer description to emphasize stocks/crypto |
| `src/components/tutorial/TutorialIllustrations.tsx` | Remove Charts from Engineering illustration; enhance Chart Analyzer illustration with ticker + asset badges |

