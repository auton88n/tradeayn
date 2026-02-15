

## Restore Chart Analyzer as Standalone Tool + Link History to AYN

### Overview

Move the Chart Analyzer back to a standalone sidebar tool (like Engineering and Compliance) while keeping AYN aware of the user's chart analysis history so it can reference past analyses in conversation.

### Part 1: Add Chart Analyzer as Sidebar Button

**File: `src/components/dashboard/Sidebar.tsx`**

Add a "Charts" button next to the existing "Eng" and "Compliance" buttons in the action buttons row (around line 393-451). It will navigate to `/chart-analyzer`.

```text
<Button onClick={() => navigate('/chart-analyzer')} ...>
  <BarChart3 /> Charts
</Button>
```

The three buttons (Eng, Compliance, Charts) will share the row equally with `flex-1`.

### Part 2: Create Chart Analyzer Page

**New file: `src/pages/ChartAnalyzerPage.tsx`**

A simple authenticated page wrapper (similar to `EngineeringWorkspacePage.tsx`) that:
- Checks auth, redirects to `/` if not logged in
- Renders the existing `ChartAnalyzer` component (which already has upload, analysis, history tabs, compare, and stats)
- Includes a back button to return to the dashboard

### Part 3: Add Route

**File: `src/App.tsx`**

Add lazy import and route:
```text
const ChartAnalyzerPage = lazy(() => import("./pages/ChartAnalyzerPage"));
// ...
<Route path="/chart-analyzer" element={<Suspense ...><ChartAnalyzerPage /></Suspense>} />
```

### Part 4: Give AYN Context About Chart History

When AYN builds its system prompt, inject the user's recent chart analyses so it can discuss them naturally.

**File: `supabase/functions/ayn-unified/index.ts`**

After fetching `userContext` (line 656-659), also fetch the user's last 5 chart analyses:

```text
const [limitCheck, userContext, chartHistory] = await Promise.all([
  ...,
  ...,
  supabase.from('chart_analyses')
    .select('ticker, asset_type, timeframe, prediction_signal, confidence, sentiment_score, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)
]);
```

Then append a chart history section to the system prompt (line 683):

```text
const chartSection = chartHistory?.data?.length
  ? `\n\nUSER'S RECENT CHART ANALYSES (reference when they ask about their trading history):
${chartHistory.data.map(c => 
  `- ${c.ticker} (${c.asset_type}): ${c.prediction_signal} signal, ${c.confidence}% confidence, ${c.timeframe} timeframe (${new Date(c.created_at).toLocaleDateString()})`
).join('\n')}`
  : '';

const systemPrompt = buildSystemPrompt(...) + chartSection + INJECTION_GUARD;
```

This lets AYN naturally answer questions like "what was my last analysis?", "how did my BTC chart look?", or "what signals have I been getting?" without any new intent -- it's just part of AYN's memory context.

### Part 5: Keep Chat-Embedded Analysis Working

The existing chat-embedded chart analysis (sending an image to AYN with chart keywords) will continue to work as-is. The standalone tool is an additional entry point that uses the same `analyze-trading-chart` edge function and same `chart_analyses` table. Both paths write to the same history.

### Files Summary

| File | Action |
|------|--------|
| `src/pages/ChartAnalyzerPage.tsx` | Create - authenticated wrapper for ChartAnalyzer component |
| `src/App.tsx` | Edit - add lazy import + route for `/chart-analyzer` |
| `src/components/dashboard/Sidebar.tsx` | Edit - add Charts button in action row |
| `supabase/functions/ayn-unified/index.ts` | Edit - fetch chart history + inject into system prompt |

### What Stays the Same

- All existing Chart Analyzer components (ChartAnalyzer, ChartAnalyzerResults, ChartHistoryList, etc.) - reused as-is
- Chat-embedded chart analysis via image attachment still works
- `analyze-trading-chart` edge function unchanged
- `chart_analyses` database table unchanged
- `useChartAnalyzer` and `useChartHistory` hooks unchanged

