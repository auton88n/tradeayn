

## Better Error Handling for Non-Chart Images

### Problem

When you upload a regular photo (not a chart), the AI correctly identifies it's not a trading chart but then the system crashes trying to parse the response as chart data. You see a generic "Edge Function returned a non-2xx status code" error instead of a helpful message.

### Root Cause

The AI responds with plain text like "This is a photograph of a city skyline, not a trading chart" -- but the code expects a JSON object. The JSON parse fails, throwing a generic 500 error. The frontend doesn't extract the actual error message from the response body.

### Solution

Two fixes:

1. **Edge function**: Before trying to parse JSON, check if the AI response indicates "not a chart". Return a clear 400 error with a user-friendly message like "This doesn't appear to be a trading chart. Please upload a screenshot of a price chart with candlesticks or price action."

2. **Frontend hook**: Improve error extraction so even when the edge function returns a non-2xx status, the actual error message from the response body is displayed instead of the generic Supabase wrapper message.

---

### Technical Details

**File: `supabase/functions/analyze-trading-chart/index.ts` (lines 162-171)**

In the `analyzeChartImage` function, after getting the AI response content, check for non-chart indicators before attempting JSON parse:

```text
const content = data.choices?.[0]?.message?.content || '';

// Detect non-chart image responses
const notChartPatterns = [
  /not a.{0,20}(trading |price |stock )?chart/i,
  /cannot.{0,20}(apply|perform).{0,20}(technical )?analysis/i,
  /photograph|selfie|screenshot of.{0,10}(a |an )?(app|website|desktop)/i,
  /no.{0,10}(candlestick|price action|trading data)/i,
];
if (notChartPatterns.some(p => p.test(content))) {
  throw new Error('NOT_A_CHART');
}
```

Then in the main handler catch block (line 702-709), detect this specific error and return a 400 with a friendly message:

```text
} catch (error) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  
  if (msg === 'NOT_A_CHART') {
    return new Response(JSON.stringify({
      error: "This doesn't appear to be a trading chart. Please upload a screenshot of a price chart (candlesticks, line chart, or bar chart) for analysis."
    }), { status: 400, headers: corsHeaders });
  }
  
  return new Response(JSON.stringify({ error: msg }), {
    status: 500, headers: corsHeaders
  });
}
```

**File: `src/hooks/useChartAnalyzer.ts` (lines 38-49)**

Improve error extraction from Supabase function responses. When `supabase.functions.invoke` gets a non-2xx response, the actual error details are in `res.data?.error` or `res.error.context?.body`, not in `res.error.message`:

```text
const res = await supabase.functions.invoke(...);

if (res.error) {
  // Extract the actual error message from the response body
  const bodyError = res.data?.error;
  throw new Error(bodyError || res.error.message || 'Analysis failed');
}
```

| File | Change |
|------|--------|
| `supabase/functions/analyze-trading-chart/index.ts` | Detect non-chart AI responses, return friendly 400 error |
| `src/hooks/useChartAnalyzer.ts` | Extract actual error message from response body |

### Result

When you upload a photo instead of a chart, you'll see: "This doesn't appear to be a trading chart. Please upload a screenshot of a price chart (candlesticks, line chart, or bar chart) for analysis." -- instead of a confusing technical error.
