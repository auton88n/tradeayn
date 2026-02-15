

## Add Firecrawl to AYN Trading Coach

Integrate web search and URL scraping into the trading coach so users can get live market news and paste URLs for the coach to analyze.

---

### How it works

- When a user asks about a ticker, market event, or news, the system automatically searches the web for recent information and includes it as context for the AI
- When a user pastes a URL, the system scrapes the page content and feeds it to the AI for discussion
- All of this happens transparently -- the user just chats normally

---

### Changes

#### 1. `src/hooks/useChartCoach.ts` -- Add URL detection and search trigger

- **Detect URLs** in user messages using a regex. If a URL is found, call the backend with a `scrapeUrl` flag
- **Detect search-worthy messages** (mentions of tickers, "news about", "what's happening with", market events). Pass a `searchQuery` flag to the backend
- Pass these as part of the `context` object sent to `ayn-unified`

#### 2. `supabase/functions/ayn-unified/index.ts` -- Handle Firecrawl for trading-coach intent

When intent is `trading-coach` and context contains:
- `scrapeUrl`: Call `scrapeUrl()` from `firecrawlHelper.ts`, truncate to 3000 chars, and inject the scraped content into the system prompt as "ARTICLE CONTENT" context
- `searchQuery`: Call `searchWeb()` from `firecrawlHelper.ts` with the query (limit 5), and inject the results into the system prompt as "LIVE MARKET NEWS" context

This leverages the existing shared `firecrawlHelper.ts` that already has raw-fetch fallback.

#### 3. `src/components/dashboard/ChartCoachChat.tsx` -- UI additions

- Add a small link/globe icon button in the action row to let users know they can paste URLs
- Add a "What's the latest news?" quick action chip when a chart result with a ticker is available (e.g., "Latest news on BTC")
- Show a subtle "Searching web..." or "Reading article..." indicator below the input when Firecrawl is active

---

### Technical Details

**URL Detection (useChartCoach.ts):**
```text
const URL_REGEX = /https?:\/\/[^\s]+/gi;
const urls = trimmed.match(URL_REGEX);

// Pass to backend
context: {
  fileContext,
  scrapeUrl: urls?.[0],  // first URL found
  searchQuery: detectSearchIntent(trimmed, result?.ticker)
}
```

**Search Intent Detection (useChartCoach.ts):**
```text
function detectSearchIntent(msg, ticker):
  if msg matches /news|latest|what.*happening|market.*update|headlines/i:
    return ticker ? `${ticker} trading news today` : extract subject from msg
  return null
```

**Backend integration (ayn-unified/index.ts):**
```text
// Inside the trading-coach handler, before building messages:
if (context.scrapeUrl) {
  const scraped = await scrapeUrl(context.scrapeUrl);
  if (scraped.success) {
    fileContext += "\n\nARTICLE CONTENT (user shared this URL):\n" 
      + scraped.markdown.substring(0, 3000);
  }
}

if (context.searchQuery) {
  const results = await searchWeb(context.searchQuery, { limit: 5 });
  if (results.success && results.data?.length) {
    fileContext += "\n\nLIVE MARKET NEWS:\n" 
      + results.data.map(r => `- ${r.title}: ${r.description}`).join("\n");
  }
}
```

**Security**: The existing `FORBIDDEN_PATTERNS` in the hook already blocks mentions of "firecrawl" from users. The scrape/search happens server-side only, and results are sanitized through the existing response sanitization layer.

---

### Files Summary

| File | Change |
|------|--------|
| `src/hooks/useChartCoach.ts` | Add URL detection, search intent detection, pass to context |
| `supabase/functions/ayn-unified/index.ts` | Import firecrawlHelper, add scrape/search for trading-coach intent |
| `src/components/dashboard/ChartCoachChat.tsx` | Add "Latest news" quick action, web search loading indicator |

