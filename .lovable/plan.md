

# Remove Firecrawl — Use Direct Fetch + Gemini Instead

## Why This Works

You're right — we don't need Firecrawl. We can just `fetch()` the website directly in the edge function to get the HTML, then send it to Gemini (already configured via Lovable AI Gateway) to analyze it. Two birds, one stone, zero extra API keys.

## Changes

### File: `supabase/functions/ayn-sales-outreach/index.ts`

**1. Replace Firecrawl scraping with direct `fetch()` (lines 58-83)**

Remove the Firecrawl API key check and scrape call. Instead:
- `fetch(formattedUrl)` to get raw HTML
- Extract text content by stripping HTML tags with a simple regex
- Extract the `<title>` tag for metadata
- Pass the cleaned text to Gemini (already happens on line 92+)

```typescript
// Instead of Firecrawl:
let websiteContent = 'Could not fetch website';
let metadata: any = {};
try {
  const res = await fetch(formattedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AYNBot/1.0)' }
  });
  if (res.ok) {
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    metadata = { title: titleMatch?.[1] || 'Unknown' };
    // Strip HTML tags to get clean text
    websiteContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
} catch (e) {
  console.error('Website fetch failed:', e);
}
```

**2. Replace Firecrawl search with Gemini-powered search alternative (lines 440-483)**

For `handleSearchLeads`, since we can't do web search without an API, we'll change the approach:
- Use Gemini to generate likely company URLs based on the search query (industry + region)
- Then prospect those URLs using the updated direct-fetch approach
- This isn't as powerful as a real search API, but it works without any extra keys

**3. Remove all `FIRECRAWL_API_KEY` references**

Clean up the entire file — no more Firecrawl dependency.

## What Won't Change
- AI analysis logic (already uses Lovable AI Gateway / Gemini)
- Email drafting, sending, follow-ups, pipeline status
- All database operations

## Trade-offs
- Direct `fetch()` won't render JavaScript-heavy sites (SPAs) — but most company websites have enough server-rendered content for analysis
- Search will be less precise without a real search API — but it's functional and free

