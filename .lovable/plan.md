

## Embed Performance Dashboard Inside the Chart Analyzer

Instead of having a separate `/performance` page, the trading performance dashboard will be integrated directly into the Chart Analyzer page as a tabbed view.

### Approach

Add a tab switcher at the top of the Chart Analyzer page with two views:
- **Chat** (default) -- the existing ChartUnifiedChat
- **Performance** -- the full performance dashboard content

### Changes

**1. Extract Performance Content into a Reusable Component**

Create `src/components/trading/PerformanceDashboard.tsx` that contains all the dashboard logic currently in `src/pages/Performance.tsx` (stats cards, open positions, trade history, equity curve, setup performance) but without the page wrapper, Helmet, and outer layout. It will be a self-contained component that fits inside any container.

**2. Update `src/pages/ChartAnalyzerPage.tsx`**

- Add a tab bar below the Back button with two tabs: "Chat" and "Performance"
- Conditionally render `ChartUnifiedChat` or `PerformanceDashboard` based on the active tab
- Style the tabs to match the amber/orange theme (active tab gets amber accent)

**3. Remove the Sidebar Performance Button**

Since performance is now inside the Chart Analyzer, remove the standalone Performance card button from `Sidebar.tsx` that was added previously.

**4. Keep `/performance` Route (Optional)**

The standalone `/performance` route and page can remain for direct-link access but is no longer the primary way users reach it.

### Technical Details

- `PerformanceDashboard` component reuses all existing types (`AccountState`, `PaperTrade`, `DailySnapshot`, `SetupPerf`), sub-components (`StatsCard`, `OpenPositionCard`, `TradeRow`), and the `loadData` logic with 30s auto-refresh
- The tab state is local to `ChartAnalyzerPage` -- no routing change needed
- The dashboard will scroll independently inside a `ScrollArea` within the flex container
- The chat height calculation (`h-[calc(100vh-100px)]`) stays the same for the chat tab; the performance tab uses `overflow-y-auto` for its scrollable content

