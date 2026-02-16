

## Redesign: Claude-Style Unified Chat + Upload Interface

### The Idea

Instead of two separate components (an upload zone at the top + a floating chat bar at the bottom), everything merges into **one conversational interface** -- just like Claude. You see a single input bar at the bottom where you can type AND attach a chart image. The analysis results, chart previews, and follow-up conversations all appear as messages in one scrollable thread.

### How It Works

```text
+----------------------------------+
|  AYN Chart Analyzer   [History]  |  <-- Minimal top bar
+----------------------------------+
|                                  |
|  Welcome message / empty state   |  <-- When no messages yet
|                                  |
|  [User]: (attached chart.png)    |  <-- User uploads a chart
|          preview thumbnail       |
|                                  |
|  [AYN]: Analyzing...             |  <-- Step indicators inline
|         Uploading... done        |
|         Analyzing... done        |
|         Fetching news...         |
|                                  |
|  [AYN]: (Full analysis result)   |  <-- BotConfig, signals, etc.
|         rendered inline          |
|                                  |
|  [User]: Should I buy?           |  <-- Follow-up question
|  [AYN]: Based on the analysis... |
|                                  |
+----------------------------------+
|  [+] Type a message or drop a    |  <-- Unified input bar
|      chart...              [->]  |
+----------------------------------+
```

### What Changes

#### 1. New unified component: `src/components/dashboard/ChartUnifiedChat.tsx`

This replaces both `ChartAnalyzer` and `ChartCoachChat` with a single component:

- **Full-page chat layout**: Scrollable message area + fixed bottom input bar
- **Input bar** (bottom-anchored, Claude-style):
  - A `[+]` button to attach an image (opens file picker)
  - A textarea that auto-resizes
  - A send button that appears when there's text or an attached file
  - Drag-and-drop support on the entire page (using the existing dragCounter pattern)
  - When an image is attached, show a small thumbnail preview above the input with an X to remove it
- **Message types** in the thread:
  - **User text**: Simple text bubble (right-aligned)
  - **User image**: Chart thumbnail with optional text (right-aligned)
  - **AYN analysis**: The full `ChartAnalyzerResults` component rendered as a message bubble (left-aligned)
  - **AYN loading**: Step indicators (uploading, analyzing, fetching news, predicting) shown inline as a message
  - **AYN text response**: Regular chat responses using `MessageFormatter` (left-aligned)
- **Flow when user attaches a chart**:
  1. Image preview appears above input bar
  2. User can optionally type context (e.g., "1H timeframe BTC") or just hit send
  3. Image + text sent as a user message (shown in thread)
  4. AYN loading message appears with step indicators
  5. Analysis result renders inline as an AYN message
  6. User can then ask follow-up questions in the same thread
- **History access**: Small history button in the top bar opens a popover (reuses existing `ChartHistoryList`)

#### 2. Update `src/pages/ChartAnalyzerPage.tsx`

- Remove separate `ChartAnalyzer` and `ChartCoachChat` imports
- Render the new `ChartUnifiedChat` as the single component
- The page becomes just an auth wrapper + the unified chat

#### 3. Reuse existing components

- `ChartAnalyzerResults` -- rendered inline as a message bubble (no changes needed)
- `useChartAnalyzer` hook -- used for the analysis logic (no changes)
- `useChartCoach` hook -- used for follow-up chat (no changes)
- `useChartHistory` hook -- used for history popover (no changes)
- `MessageFormatter` -- used for AI text responses (no changes)
- Drag counter pattern -- reused from the existing implementation

#### 4. Remove old components (no longer needed)

- The old `ChartAnalyzer.tsx` component becomes unused (replaced by unified chat)
- The old `ChartCoachChat.tsx` component becomes unused (merged into unified chat)

### Technical Details

| File | Action |
|------|--------|
| `src/components/dashboard/ChartUnifiedChat.tsx` | **New** -- Claude-style unified chat with upload, analysis results inline, and follow-up chat all in one thread |
| `src/pages/ChartAnalyzerPage.tsx` | **Modify** -- Replace ChartAnalyzer + ChartCoachChat with single ChartUnifiedChat |
| `src/components/dashboard/ChartAnalyzer.tsx` | **Keep** (but no longer imported by page) |
| `src/components/dashboard/ChartCoachChat.tsx` | **Keep** (but no longer imported by page) |
| `src/components/dashboard/ChartAnalyzerResults.tsx` | **No change** -- rendered as a message bubble |
| `src/hooks/useChartAnalyzer.ts` | **No change** |
| `src/hooks/useChartCoach.ts` | **No change** |
| `src/hooks/useChartHistory.ts` | **No change** |

### Empty State

When the user first opens the page (no messages), show a centered welcome:
- AYN icon
- "Drop a chart or type a question"
- Quick action chips below (same ones from ChartCoachChat)

This disappears as soon as the first message is sent.

