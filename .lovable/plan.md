

## Phase 4: Analysis Comparison & Performance Insights

### What's changing

Add a "Compare" feature to the History tab and a performance summary card, letting users place two past analyses side-by-side and see aggregate stats about their analysis history.

### New Components

**1. `src/components/dashboard/ChartCompareView.tsx`** -- Side-by-side comparison

- Two-column layout showing two selected analyses
- Each column displays: chart image, signal badge, confidence, trade setup (entry/SL/TP), key patterns
- Highlights differences: signal direction, confidence delta, pattern overlap
- "Select analyses to compare" prompt when fewer than 2 are chosen
- Responsive: stacks vertically on mobile

**2. `src/components/dashboard/ChartHistoryStats.tsx`** -- Aggregate performance card

- Shown at the top of the History tab
- Displays:
  - Total analyses count
  - Signal distribution (pie/bar: X% Bullish, Y% Bearish, Z% Neutral)
  - Average confidence across all analyses
  - Most analyzed ticker
  - Most common pattern detected
- Computed client-side from the loaded history items
- Collapsible to save space

### Modifications to Existing Files

**3. `src/components/dashboard/ChartHistoryList.tsx`** -- Add compare selection mode

- Add a "Compare" toggle button in the filter bar
- When active, show checkboxes on each history card (max 2 selections)
- "Compare Selected" button appears when exactly 2 items are checked
- Clicking it calls `onCompare(item1, item2)`

**4. `src/components/dashboard/ChartAnalyzer.tsx`** -- Wire compare view

- Add state for compare mode: `compareItems: [ChartHistoryItem, ChartHistoryItem] | null`
- When compare is triggered from history list, render `ChartCompareView` instead of detail view
- "Back to History" returns to list

**5. `src/hooks/useChartHistory.ts`** -- Add stats computation

- Add a `stats` property computed from `items`:
  - `totalCount`, `signalDistribution`, `avgConfidence`, `topTicker`, `topPattern`
- Add `compareItems` state and `setCompareItems` setter

### Technical Details

**Stats computation (client-side):**
```text
items[] --> reduce to:
  { total, bullish/bearish/neutral counts, confidence sum, ticker frequency map, pattern frequency map }
```

No additional database queries needed -- stats are derived from already-fetched history items. For users with many analyses, initial fetch already pages in 10 at a time; stats will reflect loaded items with a note like "Based on last N analyses."

**Compare layout uses CSS grid:**
- Desktop: `grid-cols-2` with a thin divider
- Mobile: `grid-cols-1` stacked

**No schema changes needed.**

### Success Criteria

1. Users can toggle "Compare" mode in the history list
2. Selecting exactly 2 analyses enables the "Compare" button
3. Side-by-side view clearly shows both analyses with signal/confidence/trade setup
4. Stats card at top of History shows signal distribution and average confidence
5. Compare view works on both desktop and mobile layouts

