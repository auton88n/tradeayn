
## Phase 3: Historical Tracking & Comparison

### What's changing

Add a "History" tab to the Chart Analyzer that lets users browse, filter, and compare their past chart analyses. Every analysis is already saved in `chart_analyses` -- this phase surfaces that data.

### New Components

**1. `src/hooks/useChartHistory.ts`** -- Data fetching hook

- Fetches user's past analyses from `chart_analyses` table ordered by `created_at DESC`
- Supports filtering by ticker, asset type, signal, and date range
- Pagination (load more / infinite scroll)
- Returns typed `ChartAnalysisResult[]` mapped from DB rows

**2. `src/components/dashboard/ChartHistoryList.tsx`** -- History list view

- Compact card for each past analysis showing:
  - Ticker badge, asset type icon, timeframe
  - Signal (BULLISH/BEARISH/NEUTRAL) with color coding
  - Confidence percentage
  - Date/time (relative: "2h ago", "Yesterday")
  - Small chart thumbnail (from stored `image_url`)
- Click a card to expand full `ChartAnalyzerResults` view
- Filter bar at top: ticker search, asset type dropdown, signal filter
- Empty state when no history exists

**3. `src/components/dashboard/ChartHistoryDetail.tsx`** -- Expanded detail view

- Shows the original chart image full-size
- Renders the full `ChartAnalyzerResults` component with stored data
- "Back to History" button
- Delete analysis button

### Modifications to Existing Files

**4. `src/components/dashboard/ChartAnalyzer.tsx`** -- Add tabs

- Add a tab bar at the top: **"Analyze"** | **"History"**
- "Analyze" tab shows the current upload + results flow (unchanged)
- "History" tab renders `ChartHistoryList`
- When user clicks a history item, swap to detail view

**5. `src/types/chartAnalyzer.types.ts`** -- Add history types

- `ChartHistoryItem`: extends `ChartAnalysisResult` with `id`, `created_at`
- `ChartHistoryFilter`: ticker, assetType, signal, dateRange

### Technical Details

**Data flow:**
```text
chart_analyses table
  --> useChartHistory hook (fetch + filter + paginate)
    --> ChartHistoryList (compact cards)
      --> ChartHistoryDetail (full view with original image)
```

**Database query pattern:**
- Uses Supabase client with RLS (user can only see own analyses)
- Query: `supabase.from('chart_analyses').select('*').eq('user_id', userId).order('created_at', { ascending: false }).range(offset, offset + limit)`
- Optional filters chained: `.eq('asset_type', filter)`, `.eq('prediction_signal', filter)`, `.ilike('ticker', '%search%')`

**No schema changes needed** -- the `chart_analyses` table already has all required columns including `image_url`, `prediction_details` (JSON with full prediction data), and `technical_analysis` (JSON).

**Tab implementation** uses Radix `Tabs` component (already installed) for consistent styling with the rest of the app.

### Success Criteria

1. Users see a "History" tab in Chart Analyzer
2. Past analyses appear as compact cards with signal, confidence, ticker
3. Clicking a card shows the full analysis with original chart image
4. Filters work for ticker search, asset type, and signal type
5. Empty state shown when no analyses exist yet
6. Delete functionality removes analysis from DB and list
