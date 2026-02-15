

## Security Audit: All AI Functions + Firecrawl Hardening Plan

### Current State Summary

**41 edge functions** call the AI gateway. Only **9** use the shared `sanitizePrompt.ts` defense. The `sanitizeFirecrawl.ts` file (approved in the last plan) was **never created**. No Firecrawl content is sanitized anywhere.

---

### AUDIT: Security Layer Coverage

| Function | Sanitize Prompt | Injection Guard | Injection Detection | Firecrawl Used | Firecrawl Sanitized | News Cached |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|
| **ayn-unified** | YES | YES | YES | YES (scrape + search) | NO | NO |
| **engineering-ai-agent** | YES | YES | YES | - | - | - |
| **engineering-ai-chat** | YES | YES | YES | - | - | - |
| **support-bot** | YES | YES | YES | - | - | - |
| **ayn-telegram-webhook** | YES | YES | YES | - | - | - |
| **generate-suggestions** | YES | YES | - | - | - | - |
| **generate-document** | YES | - | - | - | - | - |
| **admin-command-center** | YES | YES | YES | - | - | - |
| **engineering-ai-analysis** | YES | YES | YES | - | - | - |
| **analyze-trading-chart** | NO | NO | NO | YES (searchWeb) | NO | NO |
| **ayn-investigator** | NO | NO | NO | YES (scrape + map) | NO | - |
| **ayn-sales-outreach** | NO | NO | NO | YES (scrape) | NO | - |
| **ayn-marketing-strategist** | NO | NO | NO | YES (scrape + search) | NO | - |
| **ayn-marketing-proactive-loop** | NO | NO | NO | YES (scrape + search) | NO | - |
| **ayn-advisor** | NO | NO | NO | - | - | - |
| **ayn-auto-reply** | NO | NO | NO | - | - | - |
| **ayn-chief-of-staff** | NO | NO | NO | - | - | - |
| **ayn-customer-success** | NO | NO | NO | - | - | - |
| **ayn-follow-up-agent** | NO | NO | NO | - | - | - |
| **ayn-hr-manager** | NO | NO | NO | - | - | - |
| **ayn-innovation** | NO | NO | NO | - | - | - |
| **ayn-marketing-webhook** | NO | NO | NO | - | - | - |
| **ayn-outcome-evaluator** | NO | NO | NO | - | - | - |
| **ayn-qa-watchdog** | NO | NO | NO | - | - | - |
| **ayn-security-guard** | NO | NO | NO | - | - | - |
| **engineering-ai-assistant** | NO | NO | NO | - | - | - |
| **engineering-ai-validator** | NO | NO | NO | - | - | - |
| **ai-edit-image** | NO | NO | NO | - | - | - |
| **ai-caption-generator** | NO | NO | NO | - | - | - |
| **ai-improvement-advisor** | NO | NO | NO | - | - | - |
| **ai-comprehensive-tester** | NO | NO | NO | - | - | - |
| **ai-visual-tester** | NO | NO | NO | - | - | - |
| **ai-ux-tester** | NO | NO | NO | - | - | - |
| **ai-ayn-evaluator** | NO | NO | NO | - | - | - |
| **generate-grading-design** | NO | NO | NO | - | - | - |
| **parse-pdf-drawing** | NO | NO | NO | - | - | - |
| **twitter-auto-market** | NO | NO | NO | - | - | - |
| **twitter-creative-chat** | NO | NO | NO | - | - | - |
| **twitter-generate-image** | NO | NO | NO | - | - | - |

---

### CRITICAL GAPS (Priority Order)

**Priority 1 -- Firecrawl content is injected raw into LLM prompts (attack vector)**:
- `ayn-unified` (trading coach): raw scraped markdown and search results go straight into the system prompt
- `analyze-trading-chart`: raw news headlines injected into prediction prompt (line 348)
- `ayn-investigator`: raw scraped website content sent to AI
- `ayn-sales-outreach`: raw scraped content sent to AI
- `ayn-marketing-strategist`: raw scraped content + search results sent to AI
- `ayn-marketing-proactive-loop`: raw scraped content + search results

**Priority 2 -- User-facing AI functions without any prompt injection defense**:
- `analyze-trading-chart` (users upload charts -- public-facing)
- `engineering-ai-assistant` (users ask engineering questions -- public-facing)
- `engineering-ai-validator` (users submit designs -- public-facing)

**Priority 3 -- Internal/admin AI functions without defense** (lower risk since admin-only, but still should be hardened):
- All `ayn-*` workforce agents (investigator, sales, marketing, etc.)
- All `ai-*` testing agents
- Twitter agents
- PDF/document generators

---

### Implementation Plan

#### Step 1: Create `_shared/sanitizeFirecrawl.ts` (new file)

Shared sanitizer for all Firecrawl content before it enters any LLM prompt:

```text
sanitizeScrapedContent(text):
  - Strip all HTML tags
  - Remove <script> content
  - Decode HTML entities (&amp; &lt; etc.)
  - Remove javascript: and on*= handlers
  - Trim whitespace

sanitizeForPrompt(text, maxLength = 3000):
  - Call sanitizeScrapedContent first
  - Redact injection keywords: IGNORE, SYSTEM:, INSTRUCTION:, OVERRIDE,
    "forget your instructions", "new instructions", "act as", "you are now"
  - Wrap output with [EXTERNAL SOURCE] marker
  - Truncate to maxLength
```

#### Step 2: Harden `_shared/firecrawlHelper.ts` at the source

Apply `sanitizeScrapedContent` to ALL output from `scrapeUrl`, `searchWeb`, and `rawFetchFallback` before returning -- so every consumer automatically gets clean data.

#### Step 3: Apply `sanitizeForPrompt` at injection points (6 files)

| File | What to sanitize |
|------|-----------------|
| `ayn-unified/index.ts` | Scraped article content (line 715) and search results (lines 730-733) |
| `analyze-trading-chart/index.ts` | News headlines before injection into prediction prompt (line 348), and raw news title/description (lines 228-233) |
| `ayn-investigator/index.ts` | Scraped website content before sending to AI |
| `ayn-sales-outreach/index.ts` | Scraped website content before sending to AI |
| `ayn-marketing-strategist/index.ts` | Scraped competitor content and search results |
| `ayn-marketing-proactive-loop/index.ts` | Scraped site content and search results |

#### Step 4: Add prompt injection defense to user-facing functions (3 files)

Add `import { sanitizeUserPrompt, INJECTION_GUARD } from "../_shared/sanitizePrompt.ts"` and apply to:

| File | Changes |
|------|---------|
| `analyze-trading-chart/index.ts` | No direct user text input, but add INJECTION_GUARD to prediction prompt |
| `engineering-ai-assistant/index.ts` | Sanitize user question + add INJECTION_GUARD to system prompt |
| `engineering-ai-validator/index.ts` | Sanitize user inputs + add INJECTION_GUARD |

#### Step 5: News caching (database + 2 functions)

Create `news_cache` table:

```text
news_cache
  - id: TEXT (ticker as primary key)
  - news_data: JSONB
  - created_at: TIMESTAMPTZ (default NOW())
  - index on created_at for TTL queries
```

Add 30-minute TTL cache check in:
- `analyze-trading-chart/index.ts` -- `fetchTickerNews()` function
- `ayn-unified/index.ts` -- trading coach `searchQuery` handler

#### Step 6: Add defense to remaining workforce agents (batch update, lower priority)

For all remaining `ayn-*` and `ai-*` functions that accept any form of user/external input, add `sanitizeUserPrompt` + `INJECTION_GUARD` imports. These are mostly admin/internal but should still be hardened for defense-in-depth.

---

### Files Summary

| File | Change |
|------|--------|
| `supabase/functions/_shared/sanitizeFirecrawl.ts` | NEW: HTML sanitization + prompt injection redaction for scraped content |
| `supabase/functions/_shared/firecrawlHelper.ts` | Apply sanitizeScrapedContent to all outputs at the source |
| `supabase/functions/ayn-unified/index.ts` | Apply sanitizeForPrompt to Firecrawl results |
| `supabase/functions/analyze-trading-chart/index.ts` | Sanitize news + add INJECTION_GUARD + add news caching |
| `supabase/functions/ayn-investigator/index.ts` | Import + apply sanitizeForPrompt to scraped content |
| `supabase/functions/ayn-sales-outreach/index.ts` | Import + apply sanitizeForPrompt to scraped content |
| `supabase/functions/ayn-marketing-strategist/index.ts` | Import + apply sanitizeForPrompt to scraped/search content |
| `supabase/functions/ayn-marketing-proactive-loop/index.ts` | Import + apply sanitizeForPrompt to scraped/search content |
| `supabase/functions/engineering-ai-assistant/index.ts` | Add sanitizeUserPrompt + INJECTION_GUARD |
| `supabase/functions/engineering-ai-validator/index.ts` | Add sanitizeUserPrompt + INJECTION_GUARD |
| Database migration | Create `news_cache` table with TTL index |

11 files + 1 migration. No frontend changes needed -- all security is backend.

