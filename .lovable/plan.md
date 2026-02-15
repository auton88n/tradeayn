

## Embed Chart Analyzer into AYN Chat

### What's changing

Instead of the Chart Analyzer being a separate dashboard tool, users will be able to attach a chart image in the AYN chat and AYN will automatically detect it as a chart analysis request, run the full pipeline (vision analysis, news fetch, prediction), and render the results inline in the chat -- just like how image generation and document creation already work inside AYN.

### How it works (user perspective)

1. User attaches a chart screenshot via the existing paperclip button in AYN
2. User types something like "analyze this chart" or "what do you see?" (or just sends the image)
3. AYN detects the `chart_analysis` intent
4. AYN shows a typing/thinking indicator while the pipeline runs
5. Results appear inline in the chat as a rich message with signal badge, confidence, trade setup, and key observations
6. History tab in the dashboard still works for browsing past analyses

### Technical Changes

**1. `supabase/functions/ayn-unified/intentDetector.ts`** -- Add chart analysis intent

Add detection patterns before the "files" intent check:
- English: `analyze this chart`, `chart analysis`, `trading chart`, `what does this chart show`, `technical analysis`
- Arabic: `حلل الشارت`, `تحليل فني`, `تحليل الشارت`
- Combined: when a file attachment is an image AND message mentions chart/trading/analysis

**2. `supabase/functions/ayn-unified/index.ts`** -- Handle `chart_analysis` intent

Add a new intent handler block (similar to the existing `image` and `document` blocks) that:
- Extracts the attached image URL from the context (`context.fileContext.url`)
- Calls the `analyze-trading-chart` edge function internally (server-to-server fetch, like document generation does with `generate-document`)
- Formats the result into a rich markdown response with signal, confidence, trade setup, patterns, and disclaimer
- Returns it as a non-streaming JSON response with a special `chartAnalysis` field so the frontend can render it richly

**3. `src/hooks/useMessages.ts`** -- Detect chart intent on frontend

Add `chart_analysis` to the `detectIntent()` function:
- When an image file is attached AND the message matches chart-related keywords, set intent to `chart_analysis`
- Add `chart_analysis` to `requiresNonStreaming` list (it returns JSON, not streamed text)

**4. `src/components/transcript/TranscriptMessage.tsx`** -- Render chart results inline

When the assistant message contains `chartAnalysis` data:
- Render the existing `ChartAnalyzerResults` component inline in the chat bubble
- Show the chart image thumbnail, signal badge, confidence gauge, and trade setup
- This reuses the component already built in Phase 3

**5. `src/hooks/useMessages.ts`** -- Handle chart response format

After receiving the response, detect the `chartAnalysis` field and:
- Store the rich data alongside the message
- Trigger the results rendering in the transcript

### Architecture Flow

```text
User attaches chart image + types "analyze this"
  --> useMessages detects intent = "chart_analysis"
  --> Sends to ayn-unified with intent + fileContext (image URL)
  --> ayn-unified routes to chart_analysis handler
  --> Handler calls analyze-trading-chart internally
  --> Returns formatted result as JSON
  --> Frontend renders ChartAnalyzerResults inline in chat
```

### What stays the same

- The standalone Chart Analyzer dashboard tool remains available (power users may prefer it)
- The History tab continues to work (analyses are still saved to `chart_analyses` table by the edge function)
- The `analyze-trading-chart` edge function is unchanged -- ayn-unified calls it as a service

### Technical Details

**Server-to-server call pattern** (already used for document generation):
```typescript
const chartResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-trading-chart`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ imageBase64: null, imageUrl: fileContext.url, sessionId })
});
```

Note: The `analyze-trading-chart` function currently expects `imageBase64`. We will add support for accepting a direct `imageUrl` to skip the re-upload step when the image is already in storage (since the user already uploaded it via the chat attachment flow).

**Response format from ayn-unified:**
```json
{
  "content": "Here's my analysis of **AAPL** on the **4H** timeframe...",
  "chartAnalysis": { /* full ChartAnalysisResult object */ },
  "intent": "chart_analysis"
}
```

The `content` field contains a markdown summary for the chat bubble, while `chartAnalysis` contains the structured data for rendering the rich results component.

### Files Modified Summary

| File | Change |
|------|--------|
| `supabase/functions/ayn-unified/intentDetector.ts` | Add chart analysis patterns |
| `supabase/functions/ayn-unified/index.ts` | Add chart_analysis handler block |
| `supabase/functions/analyze-trading-chart/index.ts` | Accept `imageUrl` as alternative to `imageBase64` |
| `src/hooks/useMessages.ts` | Add chart intent detection + response handling |
| `src/components/transcript/TranscriptMessage.tsx` | Render ChartAnalyzerResults inline |

### Success Criteria

1. User attaches a chart image and says "analyze this chart" -- AYN runs the full pipeline
2. Results appear inline in the chat with signal badge, confidence, and trade setup
3. The analysis is saved to history (accessible from History tab)
4. The standalone Chart Analyzer tool still works independently
5. Intent detection correctly distinguishes chart images from regular image attachments
