

## Update Tutorial: New Tool Cards Illustration + Add Chart Analyzer Step

### Overview

Two changes: (1) update the Engineering tutorial illustration to show the new card-style sidebar buttons (Engineering, Compliance, Charts) as they now appear, and (2) add a new "Chart Analyzer" tutorial step so users learn about the standalone charts tool.

### Changes

#### 1. Add Chart Analyzer tutorial step

**File: `src/types/tutorial.types.ts`**

Add a new step after the `compliance` step:

```
{
  id: 'chart-analyzer',
  title: 'Chart Analyzer',
  description: 'Upload trading charts for AI-powered technical analysis with pattern detection, support/resistance levels, and trade signals.',
  icon: 'BarChart3',
}
```

This brings the tutorial from 11 to 12 steps.

#### 2. Create ChartAnalyzerIllustration component

**File: `src/components/tutorial/TutorialIllustrations.tsx`**

Add a new `ChartAnalyzerIllustration` export showing a mockup of chart analysis -- a mini chart card with candlestick-style bars, indicator labels (RSI, MACD), and a signal badge (BULLISH/BEARISH). Uses amber/orange color theme consistent with the Charts sidebar button.

#### 3. Update EngineeringIllustration to show the 3 tool cards

**File: `src/components/tutorial/TutorialIllustrations.tsx`**

Replace the current `EngineeringIllustration` (which shows a detailed calculator list) with an illustration that mirrors the new sidebar layout -- three card-style buttons in a row:
- Engineering (cyan icon, "Design Tools" subtitle)
- Compliance (teal icon, "Code Check" subtitle)
- Charts (amber icon, "Analysis" subtitle)

This matches what the user sees in the actual sidebar.

#### 4. Register the new illustration

**File: `src/components/tutorial/TutorialPage.tsx`**

- Import `ChartAnalyzerIllustration`
- Add `'chart-analyzer': ChartAnalyzerIllustration` to the illustrations map

### Files Summary

| File | Change |
|------|--------|
| `src/types/tutorial.types.ts` | Add chart-analyzer step (12 steps total) |
| `src/components/tutorial/TutorialIllustrations.tsx` | Add ChartAnalyzerIllustration, update EngineeringIllustration to show 3 tool cards |
| `src/components/tutorial/TutorialPage.tsx` | Register chart-analyzer illustration |

