
# Transform Marketing from Social Media Bot to Strategic Marketing Brain

## The Problem

Right now, Marketing = `twitter-auto-market`, which can ONLY:
- Generate tweets
- Generate tweet threads
- Generate 7-day social media calendars

That's it. It's a social media posting tool, not a marketing strategist. It has zero connection to Sales or Investigator, can't craft email campaigns, doesn't analyze your leads or pipeline, and doesn't know what products to push or to whom.

## The New Marketing Agent

Replace the `twitter-auto-market` routing with a new `ayn-marketing-strategist` edge function that acts as a real marketing brain.

### New Capabilities

1. **Campaign Strategy** -- Analyze your pipeline (from Sales data) and create targeted marketing plans for specific industries/companies
2. **Email Campaign Crafting** -- Write personalized outreach email templates based on Investigator dossiers and lead pain points
3. **Lead-Aware Content** -- Pull data from `ayn_sales_pipeline` to understand who you're targeting, then create content aimed at those industries
4. **Cross-Agent Collaboration** -- Can request Investigator to research a company before crafting outreach, or pull Sales pipeline data to prioritize who to market to
5. **Competitive Positioning** -- Analyze competitor websites (via Firecrawl) and recommend positioning strategies
6. **Product-Market Messaging** -- Create messaging frameworks for each of AYN's 6 services tailored to specific audience segments

### How It Works

```text
You: "Marketing, create an outreach strategy for engineering firms in Halifax"

Marketing pulls Sales pipeline data for Halifax leads
Marketing pulls Investigator dossiers if available
Marketing crafts:
  - Email templates personalized per company
  - LinkedIn/cold outreach messaging
  - Value propositions matched to each company's pain points
  - Follow-up sequence recommendations
```

## Technical Details

### 1. New Edge Function: `supabase/functions/ayn-marketing-strategist/index.ts`

Modes:
- **`campaign`** -- Create a full outreach campaign for a target audience or set of leads
  - Reads from `ayn_sales_pipeline` (leads, pain points, dossiers)
  - Generates personalized email templates, messaging frameworks, outreach sequences
- **`email_copy`** -- Draft marketing email copy for a specific lead or segment
  - Uses lead's dossier (from Investigator), pain points, and recommended services
  - Applies brand voice and email standards (no buzzwords, casual founder tone)
- **`positioning`** -- Analyze a competitor URL and recommend positioning against them
  - Uses Firecrawl to scrape competitor, then generates differentiation strategy
- **`content_plan`** -- Create a content/marketing plan that aligns with current pipeline priorities
  - Pulls top leads and industries from pipeline, suggests content themes
- **`analyze_pipeline`** -- Review the full sales pipeline and recommend marketing priorities
  - Which leads need nurturing, which industries are underserved, where to focus

### 2. Update Command Center Routing

**File: `supabase/functions/admin-command-center/index.ts`**

- Change `marketing` route from `twitter-auto-market` to `ayn-marketing-strategist`
- Update `AGENT_PARAM_HINTS` for marketing:
  ```
  marketing: "modes: 'campaign' (needs target_audience or industry), 
              'email_copy' (needs lead_id or industry), 
              'positioning' (needs competitor_url), 
              'content_plan' (creates plan based on pipeline), 
              'analyze_pipeline' (reviews pipeline for marketing priorities)"
  ```
- Keep `twitter-auto-market` available separately (social media is just one channel, not the whole marketing function)

### 3. Cross-Agent Data Access

The new marketing function will:
- Query `ayn_sales_pipeline` for leads, stages, pain points, dossiers
- Query `employee_tasks` to see what Investigator has found
- Query `ayn_mind` for strategic insights and past decisions
- Use Firecrawl (via `firecrawlHelper.ts`) for competitor analysis
- Use the existing email branding standards (no buzzwords, casual tone, professional signature)

### 4. Update Marketing Personality

**File: `supabase/functions/_shared/aynBrand.ts`**

Update the marketing personality from "think in campaigns, not posts" to reflect the new strategic role:
- "You're Marketing. You work hand-in-hand with Sales and Investigator. You craft outreach strategies, email campaigns, and positioning -- not just social posts. You think about who we're targeting, what they need, and how to reach them. Data-driven, conversion-focused."

### Example Interactions After Changes

```text
You: "Marketing, help me reach engineering firms in Nova Scotia"

Marketing Strategist: "I pulled 8 leads from our pipeline in Nova Scotia. 
3 have Investigator dossiers. Here's what I recommend:

For Smith Engineering (quality score 8/10): They're using outdated 
spreadsheets for structural calcs. Lead with our AI Structural Calculator 
-- draft email focuses on time savings.

For Atlantic Design (quality 6/10): Civil firm, no clear pain point yet. 
Recommend asking Investigator to dig deeper before outreach.

I've drafted personalized emails for the 3 with dossiers. Want me to 
share them with Sales for sending?"
```

```text
You: "Marketing, position us against CompetitorX.com"

Marketing Strategist: "I scanned CompetitorX. They focus on generic 
project management -- no AI, no engineering calcs, no code compliance. 
Our angle: we're the only platform that does ACI 318 structural analysis 
AND generates compliance reports. They can't touch that. 

Suggested tagline for outreach: 'Your project management tool can't 
check your rebar spacing.' Want me to build a comparison deck?"
```

### Files to Create/Modify

1. **Create**: `supabase/functions/ayn-marketing-strategist/index.ts` -- The new marketing brain
2. **Modify**: `supabase/functions/admin-command-center/index.ts` -- Update routing and param hints
3. **Modify**: `supabase/functions/_shared/aynBrand.ts` -- Update marketing personality
