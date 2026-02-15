

## Security Audit: All AI Functions + Firecrawl Hardening Plan

### ✅ COMPLETED — All Priority 1-4 items implemented

---

### What Was Done

#### ✅ Step 1: Created `_shared/sanitizeFirecrawl.ts`
- `sanitizeScrapedContent()` — strips HTML, scripts, entities, javascript: URIs, event handlers
- `sanitizeForPrompt()` — redacts 17 injection keywords + wraps with [EXTERNAL SOURCE] marker + truncates
- `FIRECRAWL_CONTENT_GUARD` — system prompt guard for external content sections

#### ✅ Step 2: Hardened `_shared/firecrawlHelper.ts` at the source
- All `scrapeUrl` output sanitized via `sanitizeScrapedContent`
- All `searchWeb` results sanitized (title, description, markdown)
- `rawFetchFallback` now uses `sanitizeScrapedContent` instead of manual regex

#### ✅ Step 3: Applied `sanitizeForPrompt` to 6 Firecrawl consumers
| File | What was sanitized |
|------|-------------------|
| `ayn-unified/index.ts` | Scraped article content + search results wrapped with FIRECRAWL_CONTENT_GUARD |
| `analyze-trading-chart/index.ts` | News headlines + descriptions sanitized via sanitizeForPrompt, FIRECRAWL_CONTENT_GUARD added |
| `ayn-investigator/index.ts` | Website content sanitized, INJECTION_GUARD + FIRECRAWL_CONTENT_GUARD added to system prompt |
| `ayn-sales-outreach/index.ts` | Website content sanitized via sanitizeForPrompt, INJECTION_GUARD added |
| `ayn-marketing-strategist/index.ts` | Competitor scraped content sanitized, INJECTION_GUARD + FIRECRAWL_CONTENT_GUARD added |
| `ayn-marketing-proactive-loop/index.ts` | Search result titles sanitized via sanitizeForPrompt |

#### ✅ Step 4: Added prompt injection defense to user-facing functions
| File | Changes |
|------|---------|
| `analyze-trading-chart/index.ts` | INJECTION_GUARD appended to prediction prompt |
| `engineering-ai-assistant/index.ts` | Already had sanitizePrompt imports (was incorrectly listed as missing) |

#### ✅ Step 5: News caching implemented
- Created `news_cache` table (ticker TEXT PK, news_data JSONB, created_at TIMESTAMPTZ)
- RLS enabled, service-role only (no public policies)
- `analyze-trading-chart`: checks 30-min cache before Firecrawl fetch, writes results to cache
- Index on `created_at` for TTL queries

---

### Updated Security Coverage

| Function | Sanitize Prompt | Injection Guard | Firecrawl Sanitized | News Cached |
|----------|:-:|:-:|:-:|:-:|
| **ayn-unified** | YES | YES | ✅ YES | (search) |
| **analyze-trading-chart** | ✅ YES | ✅ YES | ✅ YES | ✅ YES |
| **ayn-investigator** | ✅ YES | ✅ YES | ✅ YES | - |
| **ayn-sales-outreach** | ✅ YES | ✅ YES | ✅ YES | - |
| **ayn-marketing-strategist** | ✅ YES | ✅ YES | ✅ YES | - |
| **ayn-marketing-proactive-loop** | - | - | ✅ YES | - |

### Remaining (Lower Priority — Step 6)
Internal/admin AI functions without defense (lower risk):
- `ayn-advisor`, `ayn-auto-reply`, `ayn-chief-of-staff`, `ayn-customer-success`, etc.
- `ai-*` testing agents, Twitter agents, PDF generators
- These are admin-only and don't process external web content
