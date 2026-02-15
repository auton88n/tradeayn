

## Fix Chart Analysis Auto-Detection and Response Card Display

### Problem Summary

1. **Intent detection too strict**: Requires keywords like "chart", "analyze", "trading" even when an image is attached. Users just attaching a chart and saying "what do you see?" or even just sending the image get regular chat instead of chart analysis.
2. **Response card truncates**: The `max-h-[35vh]` cuts off long chart analysis responses.
3. **Rich chart results not shown in live response**: The `ChartAnalyzerResults` component only renders in history transcript, not in the live ResponseCard.

### Changes

**1. `src/hooks/useMessages.ts` -- Auto-detect chart_analysis for image attachments**

Change the frontend intent detection (line ~397) so that when an image is attached, it defaults to `chart_analysis` unless another strong intent (image generation, document) was already matched. The logic becomes:

```text
If image attached AND no other intent matched --> chart_analysis
```

This means any image attachment without explicit image-generation or document keywords will trigger chart analysis. The backend already validates whether the image is actually a chart.

Specifically, replace the current chart detection line:
```
if (attachment && attachment.type.startsWith('image/') && /chart|trading|.../.test(lower)) return 'chart_analysis';
```

With a broader fallback at the END of the function (before `return 'chat'`):
```
// If image is attached and no other intent matched, default to chart analysis
if (attachment && attachment.type.startsWith('image/')) return 'chart_analysis';
```

**2. `supabase/functions/ayn-unified/intentDetector.ts` -- Backend fallback for image + no intent**

Add a `hasFile` parameter to `detectIntent()` so the backend can also default to `chart_analysis` when an image file is present and no other intent matched. This ensures even if the frontend sends `chat` intent, the backend re-evaluates.

**3. `src/components/eye/ResponseCard.tsx` -- Fix content height**

Change line 492:
```
"max-h-[35vh] sm:max-h-[40vh]"
```
to:
```
"max-h-[50vh] sm:max-h-[55vh]"
```

**4. `src/components/eye/ResponseCard.tsx` -- Render ChartAnalyzerResults inline**

- Add `chartAnalysis` field to the `ResponseBubble` interface
- After the `StreamingMarkdown`/`MessageFormatter` content block (around line 520), add conditional rendering of the `ChartAnalyzerResults` component when `chartAnalysis` data is present in the first visible response
- Lazy-load the component (same pattern as TranscriptMessage)

**5. `src/hooks/useMessages.ts` -- Pass chartAnalysis to response bubbles**

The code already extracts `chartAnalysisData` at line 695 and sets it on the message. We need to ensure the parent component that builds `ResponseBubble[]` passes it through. This requires checking `CenterStageLayout` or wherever `responses` prop is built.

**6. Wire chartAnalysis from Message to ResponseBubble in the parent**

Find where `ResponseBubble[]` array is constructed from messages and add `chartAnalysis: msg.chartAnalysis` to each bubble object.

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/useMessages.ts` | Move chart detection to fallback for any image attachment |
| `supabase/functions/ayn-unified/intentDetector.ts` | Add hasFile param, default image+no-intent to chart_analysis |
| `src/components/eye/ResponseCard.tsx` | Increase max-h, add ChartAnalyzerResults rendering, update ResponseBubble interface |
| Parent component building ResponseBubble[] | Pass chartAnalysis data through |

### Expected Behavior After Fix

1. User attaches any chart image (with or without keywords) --> triggers chart analysis automatically
2. Response card shows full content without cutting off
3. Rich chart results (signal badge, confidence, trade setup) appear inline in the live response card
