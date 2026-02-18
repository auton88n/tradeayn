
# Critical UX Fixes — Layout + Chat History

## Issue 1: Performance Tab Content Cutoff

### Root Cause (Confirmed)

`ChartAnalyzerPage.tsx` line 55 constrains the entire page to `max-w-3xl` (768px max-width). When the Performance tab is active, `PerformanceDashboard` renders inside this narrow column, but several of its child elements were designed for wider viewports:

- `TradeRow` uses `grid-cols-7` — 7 equal columns in 768px is ~90px per column, causing squeeze and horizontal overflow
- `SetupPerf` table uses `grid-cols-5`
- The `ActivityTimeline` and `AIDecisionLog` subcomponents may also have minimum widths

The fix is two-part:
1. When the Performance tab is active, break out of the `max-w-3xl` constraint and let `PerformanceDashboard` use up to `max-w-5xl`
2. Make `TradeRow` and the Setup Performance table responsive for narrow screens (replace fixed grid with a mobile-friendly layout)

### Fix

**`src/pages/ChartAnalyzerPage.tsx`**: Change the page wrapper from a single `max-w-3xl` column to a width that adapts per active tab. The Chat and History tabs stay at `max-w-3xl` (good for reading), while the Performance tab expands to `max-w-5xl`. The simplest way is to move the width constraint *inside* each tab's content, rather than on the shared page wrapper. The `h-screen flex flex-col` layout should also become scrollable for the Performance tab — it already wraps Performance in a `ScrollArea`, but the outer container having `overflow-hidden` (implied by flex+screen layout) can clip content.

Specifically:
- Remove `max-w-3xl mx-auto` from the outer wrapper on line 55
- For the Chat and History content area, add `max-w-3xl mx-auto` directly
- For the Performance content area, use `max-w-5xl mx-auto` with full scroll

**`src/components/trading/PerformanceDashboard.tsx`**: Make `TradeRow` responsive. The `grid-cols-7` layout with Entry/Exit prices is tight on any width below ~900px. Replace with a two-line card layout on small screens: ticker+signal+P&L on the first line, entry/exit/setup/duration as small metadata on the second line.

---

## Issue 2: Chat History Lost on Tab Switch

### Root Cause (Confirmed)

Three-part problem:

1. **Component unmounts on tab switch.** `ChartAnalyzerPage.tsx` line 110 uses `{activeTab === 'chat' && <ChartUnifiedChat />}` — conditional rendering unmounts the component completely when switching tabs.

2. **Messages state is purely local.** `ChartUnifiedChat.tsx` line 126: `const [messages, setMessages] = useState<ChatMessage[]>([])` — this array lives only in the component instance and is destroyed on unmount.

3. **Coach resets on remount.** `ChartUnifiedChat.tsx` line 221 calls `coach.newChat()` inside a `useEffect` with an empty dep array — this runs every time the component mounts, starting a new coach session and discarding the visual context of the previous one. (The coach hook *does* persist sessions in localStorage, but `newChat()` abandons the active session and creates a fresh ID.)

### Fix — Option A: Lift State + Keep Mounted (Recommended)

This is the cleanest fix with no backend changes, database migrations, or new dependencies. It has two sub-parts:

**Sub-part 1: Lift `messages` state to `ChartAnalyzerPage`**

Move the `messages: ChatMessage[]` array and `latestResult: ChartAnalysisResult | null` state up to `ChartAnalyzerPage`. Pass them down as props to `ChartUnifiedChat`. This way the messages survive tab switches at the parent level.

`ChartUnifiedChat` gets two new optional props:
```
messages: ChatMessage[]
onMessagesChange: (messages: ChatMessage[]) => void
latestResult: ChartAnalysisResult | null
onLatestResultChange: (result: ChartAnalysisResult | null) => void
```

Inside `ChartUnifiedChat`, instead of `const [messages, setMessages] = useState([])`, use the prop value and the prop setter. All existing message-writing logic (`setMessages(prev => [...prev, ...])`) works unchanged — just the storage location changes.

**Sub-part 2: Fix the `newChat()` call on mount**

`ChartUnifiedChat` line 221 calls `coach.newChat()` unconditionally on every mount. This should only happen when there is genuinely no active session (i.e., first ever load). With messages lifted to the parent, we can gate this: if the messages array passed in is empty, it's a fresh session → call `newChat()`. If messages exist, the component is remounting after a tab switch → skip `newChat()` to preserve the coach session continuity.

Additionally, the `useChartCoach` hook's `prevCoachLenRef` (line 218) resets to 0 on every remount. This causes previously-seen coach messages to be re-appended. The fix: initialize `prevCoachLenRef` to `coach.messages.length` rather than 0, so the sync effect starts from the current coach state instead of replaying all prior messages.

**Why not "keep mounted" (CSS `display:none`)?**

Hiding with CSS instead of conditional rendering would also work and is even simpler — no prop threading needed. However, it means `PerformanceDashboard` (with its 8 Supabase queries + 2 realtime channels) and `ChartHistoryTab` are *always* mounted, even when the user has never visited those tabs. For `PerformanceDashboard` this is actually fine (it's a dashboard that benefits from always being subscribed), but `ChartHistoryTab` fetches on mount and would fire immediately on page load. The lifted-state approach is more targeted — only the chat state is preserved, avoiding unnecessary background fetching.

---

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/pages/ChartAnalyzerPage.tsx` | Remove shared `max-w-3xl`; add per-tab widths; add `messages`+`latestResult` state; pass as props | Fixes layout + chat persistence |
| `src/components/dashboard/ChartUnifiedChat.tsx` | Accept `messages`/`onMessagesChange`/`latestResult`/`onLatestResultChange` props; fix `newChat()` guard; fix `prevCoachLenRef` init | Fixes chat persistence |
| `src/components/trading/PerformanceDashboard.tsx` | Make `TradeRow` responsive (2-line card on small screens) | Fixes cutoff on `max-w-3xl` parent |

## Implementation Order

1. **`ChartAnalyzerPage.tsx`** — fix layout width AND add lifted state + prop passing in one edit
2. **`ChartUnifiedChat.tsx`** — accept props, guard `newChat()`, fix `prevCoachLenRef` init
3. **`PerformanceDashboard.tsx`** — make `TradeRow` responsive for narrow widths
