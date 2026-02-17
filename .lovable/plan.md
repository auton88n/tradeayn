

## Fix Broken Images + Natural Conversational Results

### Two Issues to Fix

**1. Broken chart image in chat**

The uploaded image breaks because `URL.createObjectURL()` creates a temporary blob URL, then `clearAttachment()` revokes it immediately after sending. The image in the chat thread points to a dead URL.

**Fix:** Convert the file to a base64 data URL before adding it to the message thread, so the image data is embedded and persists.

**2. Replace heavy card-based results with natural conversation**

Currently, analysis results dump the entire `ChartAnalyzerResults` component (signal cards, bot config, patterns, psychology sections, etc.) as a giant structured block. This feels robotic and overwhelming.

**Fix:** Replace the `ayn-analysis` message type with `ayn-text` containing a clean, concise markdown summary -- the way a real trading advisor would talk. Something like:

```text
BUY BTC/USDT (4H) -- 74% confidence

Breakout above 68,500 resistance with strong volume confirmation.
RSI at 62, MACD bullish crossover.

Entry: 68,520 (Limit)
Stop Loss: 67,200 (-1.9%)
TP1: 70,100 (+2.3%) -- close 50%
TP2: 72,400 (+5.7%) -- close 50%
R:R: 1:2.8 | Position: 2% | Leverage: 3x

Invalidation: Below 67,200

DYOR -- signals require your own verification.
```

Short, scannable, conversational. No cards, no collapsible sections, no headers.

### Changes in `src/components/dashboard/ChartUnifiedChat.tsx`

1. **Image fix**: In `handleSend`, use `FileReader.readAsDataURL()` to convert the file to base64 before adding the user-image message. The blob URL is only used for the input preview thumbnail.

2. **New `formatAnalysisAsText()` function**: Converts `ChartAnalysisResult` into a concise markdown string extracting:
   - Signal + ticker + timeframe + confidence (one line)
   - 1-2 sentence reasoning
   - Entry / SL / TP levels as a compact list
   - R:R, position size, leverage on one line
   - Invalidation condition
   - One-line disclaimer

3. **Remove `AnalysisBubble` component** and the `ayn-analysis` message type. When analysis completes, push an `ayn-text` message with the formatted string instead.

4. **Update `handleHistorySelect`** to also use `formatAnalysisAsText()` when loading a history item into chat.

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/ChartUnifiedChat.tsx` | Fix blob-to-base64 for images; add `formatAnalysisAsText()`; remove `AnalysisBubble`; change `ayn-analysis` to `ayn-text` with formatted markdown |

### What Stays the Same

- `ChartAnalyzerResults.tsx` -- still used in history detail view (popover)
- All hooks, backend, edge functions -- no changes
- History popover, drag-and-drop, input bar layout -- no changes

