/**
 * Shared Firecrawl helper for AYN workforce agents.
 * Provides clean markdown scraping, search, and mapping via Firecrawl API.
 */

const FIRECRAWL_API = 'https://api.firecrawl.dev/v1';

interface ScrapeResult {
  success: boolean;
  markdown?: string;
  metadata?: { title?: string; description?: string; sourceURL?: string };
  error?: string;
}

interface SearchResult {
  success: boolean;
  data?: Array<{ url: string; title: string; description: string; markdown?: string }>;
  error?: string;
}

/**
 * Scrape a single URL and return clean markdown content.
 * Falls back to raw fetch if Firecrawl key is not configured.
 */
export async function scrapeUrl(url: string, options?: {
  onlyMainContent?: boolean;
  formats?: string[];
}): Promise<ScrapeResult> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

  // Fallback to raw fetch if no Firecrawl key
  if (!apiKey) {
    console.warn('[firecrawl] No FIRECRAWL_API_KEY, falling back to raw fetch');
    return rawFetchFallback(url);
  }

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;

  try {
    const res = await fetch(`${FIRECRAWL_API}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: options?.formats || ['markdown'],
        onlyMainContent: options?.onlyMainContent ?? true,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[firecrawl] Scrape failed:', res.status, errBody);
      // Fall back to raw fetch
      return rawFetchFallback(formattedUrl);
    }

    const data = await res.json();
    return {
      success: true,
      markdown: data.data?.markdown || data.markdown || '',
      metadata: data.data?.metadata || data.metadata || {},
    };
  } catch (e) {
    console.error('[firecrawl] Scrape error:', e);
    return rawFetchFallback(formattedUrl);
  }
}

/**
 * Search the web for a query and optionally scrape results.
 */
export async function searchWeb(query: string, options?: {
  limit?: number;
  scrapeResults?: boolean;
}): Promise<SearchResult> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'FIRECRAWL_API_KEY not configured' };
  }

  try {
    const res = await fetch(`${FIRECRAWL_API}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: options?.limit || 5,
        scrapeOptions: options?.scrapeResults ? { formats: ['markdown'] } : undefined,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: `Search failed: ${res.status} ${errBody}` };
    }

    const data = await res.json();
    return { success: true, data: data.data || [] };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Search error' };
  }
}

/**
 * Map a website to discover all its URLs (fast sitemap).
 */
export async function mapWebsite(url: string, options?: {
  limit?: number;
  search?: string;
}): Promise<{ success: boolean; links?: string[]; error?: string }> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'FIRECRAWL_API_KEY not configured' };
  }

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;

  try {
    const res = await fetch(`${FIRECRAWL_API}/map`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        limit: options?.limit || 100,
        search: options?.search,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: `Map failed: ${res.status} ${errBody}` };
    }

    const data = await res.json();
    return { success: true, links: data.links || [] };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Map error' };
  }
}

/**
 * Raw fetch fallback when Firecrawl is unavailable.
 */
async function rawFetchFallback(url: string): Promise<ScrapeResult> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AYNBot/1.0)' },
      redirect: 'follow',
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };

    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      success: true,
      markdown: content,
      metadata: { title: titleMatch?.[1]?.trim(), sourceURL: url },
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Fetch failed' };
  }
}
