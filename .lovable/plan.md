

## Add History Tab to Chart Analyzer

Currently, chart analysis history is hidden inside a small popover in the Chat view. This plan moves it to a dedicated **History** tab alongside Chat and Performance, making it a first-class section.

### Changes

**1. Update `src/pages/ChartAnalyzerPage.tsx`**

- Add a third tab: **History** (with a `History` icon from lucide-react)
- Extend `activeTab` state to `'chat' | 'history' | 'performance'`
- When History is active, render a new `ChartHistoryTab` component inside a `ScrollArea`

**2. Create `src/components/dashboard/ChartHistoryTab.tsx`**

A full-height component that combines the existing history building blocks:
- `ChartHistoryStats` at the top (aggregate metrics)
- `ChartHistoryList` below (searchable, filterable, with compare mode)
- `ChartHistoryDetail` shown when an item is selected (with a back button to return to the list)
- `ChartCompareView` shown when comparing two items

This reuses `useChartHistory` and all existing sub-components -- just laid out in a full page view instead of crammed into a popover.

**3. Remove History Popover from `ChartUnifiedChat.tsx`**

Since history now has its own dedicated tab, remove the History popover button and its related code from the chat top bar. This simplifies the chat component and avoids duplicate access points.

### Result

The Chart Analyzer page will have three tabs:
- **Chat** -- upload charts, get analysis, ask questions
- **History** -- browse, search, compare past chart analyses
- **Performance** -- paper trading stats and equity curve

