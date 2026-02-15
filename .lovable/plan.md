

## Remove Chart Analysis Intent from AYN Chat

### Overview

Strip chart analysis handling from AYN so it only works via the standalone Charts tool. AYN will still know about past chart history (system prompt context stays), but will no longer process chart images or detect chart-related keywords as a special intent.

### Changes

#### 1. Remove chart_analysis intent detection
**File: `supabase/functions/ayn-unified/intentDetector.ts`** (lines 82-92, 107-108)

- Delete the entire `chartPatterns` block and its `if` check (lines 82-92)
- Change the image fallback on line 108 from `return 'chart_analysis'` to `return 'chat'`

#### 2. Remove chart_analysis handler from edge function
**File: `supabase/functions/ayn-unified/index.ts`** (lines 987-1083)

- Delete the entire `if (intent === 'chart_analysis') { ... }` block (lines 987-1083)

#### 3. Remove inline chart results from ResponseCard
**File: `src/components/eye/ResponseCard.tsx`**

- Remove the `ChartAnalyzerResultsLazy` import (line 41)
- Remove the `chartAnalysis` prop from the `ResponseBubbleProps` interface (line 54)
- Remove the inline chart results rendering block (lines 554-561)

#### 4. Remove inline chart results from TranscriptMessage
**File: `src/components/transcript/TranscriptMessage.tsx`**

- Remove the `ChartAnalyzerResults` lazy import (line 14) and the `ChartAnalysisResult` type import (line 12)
- Remove `chartAnalysis` from the props interface
- Remove the chart results rendering block (lines 136-142)

### What Stays
- AYN's system prompt still includes chart history context (can discuss past analyses)
- Standalone Chart Analyzer page and tool unchanged
- `analyze-trading-chart` edge function unchanged
- All chart components and hooks unchanged

### Files Summary

| File | Change |
|------|--------|
| `supabase/functions/ayn-unified/intentDetector.ts` | Remove chart patterns + image fallback |
| `supabase/functions/ayn-unified/index.ts` | Remove chart_analysis handler block |
| `src/components/eye/ResponseCard.tsx` | Remove chart analysis imports + rendering |
| `src/components/transcript/TranscriptMessage.tsx` | Remove chart analysis imports + rendering |

