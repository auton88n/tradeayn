

## Make AYN Coach Chat Floating

Convert the coach chat from an inline collapsible embedded in the results to a **floating chat widget** (fixed bottom-right corner) that's always visible on the Chart Analyzer page.

---

### Changes

#### 1. Rewrite `src/components/dashboard/ChartCoachChat.tsx`

Remove the `Collapsible` wrapper. Replace with:

- **Floating trigger button**: A circular amber button with Brain icon, fixed at `bottom-6 right-6` with `z-50`. Includes a subtle pulse animation when results are available. Shows unread dot when there are new messages.
- **Floating chat panel**: When open, renders a card panel fixed at `bottom-20 right-6` (above the button), sized ~`w-80 h-96`. Contains:
  - Header bar with "AYN Coach" title + close (X) button
  - Same ScrollArea message list with react-markdown rendering
  - Same quick-action buttons when no messages
  - Same input bar at bottom
  - Same security (input validation, response sanitization, emotion detection already in the hook)
- The `result` prop becomes **optional** (`result?: ChartAnalysisResult | null`). When no result exists, the quick actions change to general ones and the placeholder says "Upload a chart first for personalized coaching."

#### 2. Move rendering from `ChartAnalyzer.tsx` to `ChartAnalyzerPage.tsx`

- **Remove** the `<ChartCoachChat>` from inside `ChartAnalyzer.tsx` (line 200)
- **Add** it to `ChartAnalyzerPage.tsx` as a sibling rendered outside the main content flow, so it floats independently
- Pass the current analysis result via a lifted state or by making `ChartAnalyzer` expose its result. Simplest approach: add an `onResult` callback prop to `ChartAnalyzer` that fires when analysis completes, and store it in `ChartAnalyzerPage` state.

#### 3. Update `src/components/dashboard/ChartAnalyzer.tsx`

- Remove `ChartCoachChat` import and usage (line 200)
- Add `onResult?: (result: ChartAnalysisResult) => void` prop
- Call `onResult(result)` when analysis completes (in the results render block or via useEffect)

---

### Technical Details

**ChartCoachChat.tsx new structure:**
```text
<>
  {/* Floating trigger */}
  <button fixed bottom-6 right-6 z-50
    circular w-12 h-12 bg-amber-500 shadow-lg
    onClick toggle isOpen>
    <Brain /> or <X /> based on isOpen
  </button>

  {/* Chat panel */}
  {isOpen && (
    <div fixed bottom-20 right-6 z-50
      w-80 h-[400px] rounded-2xl shadow-2xl
      border border-amber-500/20 bg-background>
      
      Header: "AYN Coach" + minimize button
      ScrollArea: messages or quick actions
      Input bar: same as current
    </div>
  )}
</>
```

**ChartAnalyzerPage.tsx integration:**
```text
const [analysisResult, setAnalysisResult] = useState(null);

return (
  <div>
    ...
    <ChartAnalyzer onResult={setAnalysisResult} />
    <ChartCoachChat result={analysisResult} />
  </div>
);
```

---

### Files Summary

| File | Change |
|------|--------|
| `src/components/dashboard/ChartCoachChat.tsx` | Rewrite to floating widget (fixed position, circular trigger, panel) |
| `src/components/dashboard/ChartAnalyzer.tsx` | Remove ChartCoachChat, add onResult callback prop |
| `src/pages/ChartAnalyzerPage.tsx` | Add state for result, render floating ChartCoachChat |

No edge function changes needed -- only UI restructuring.
