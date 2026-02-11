

# AYN Marketing Bot Overhaul -- Autonomous Social Media Brain

## The Problem

The marketing bot talks like a chatbot -- stiff, formulaic, robotic. It also just sits there waiting for messages. It has no autonomy, no ability to scrape Twitter, no competitor monitoring, no proactive content creation, and no real intelligence about what's happening on your social accounts.

## What Changes

### 1. Fix the Personality (talk like a friend, not a bot)

Rewrite the `MARKETING_PERSONA` in `ayn-marketing-webhook/index.ts` to match the same natural conversational style the admin bot uses. Key changes:

- Remove all the corporate "creative director" framing that makes it sound performative
- Add the same conversation continuity rules (handle "yes", "do it", confirmations)
- Match energy -- short replies for simple things, detailed when needed
- Use real casual language: contractions, lowercase, to the point
- Stop saying things like "let's get back to making content that slaps" -- just talk normally
- "we" and "our" -- it's part of the team, not a hired consultant
- Pending action flow for confirmations (like the admin bot)

### 2. Autonomous Marketing Proactive Loop (new)

Create a new function `ayn-marketing-proactive-loop/index.ts` that runs on a cron schedule (every 4-6 hours). This is the brain that works while the creator sleeps:

**What it does each cycle:**

a. **Scrape your Twitter account via Apify** -- pull latest tweets, engagement metrics, follower count, trending replies. Store in `twitter_posts` for analysis.

b. **Scrape competitors via Apify** -- monitor 3-5 competitor Twitter accounts. Extract their top-performing tweets, content patterns, posting frequency. Store insights in `ayn_mind`.

c. **Analyze what's working** -- use Gemini to compare your engagement vs competitors. Spot patterns: what hooks are winning, what times get engagement, what content types perform best.

d. **Auto-generate content** -- based on analysis, autonomously create 1-2 tweet drafts and 1 branded image. Save as `pending_review` in `twitter_posts`.

e. **Monitor website health** -- hit your site, check if it loads, capture any issues.

f. **Send a Telegram report** -- message the marketing bot chat with findings: "hey, checked our twitter -- last post got 340 impressions, competitor X dropped a thread that got 2k likes, here's what i think we should do..."

**Architecture:**
```text
Cron (every 4-6h)
  |
  ayn-marketing-proactive-loop
  |
  +---> Apify Actor: Twitter Scraper (our account)
  +---> Apify Actor: Twitter Scraper (competitors)
  +---> Gemini Analysis (patterns, hooks, gaps)
  +---> Auto-draft tweets + images
  +---> Save to twitter_posts (pending_review)
  +---> Telegram report to marketing chat
  +---> Log everything to ayn_mind + ayn_activity_log
```

### 3. Apify Integration for Twitter Scraping

Add Apify as a new integration. The `APIFY_API_TOKEN` secret will be needed.

**How it works:**
- Use Apify's Twitter Scraper actor (`apidojo/tweet-scraper` or similar) via their REST API
- Create a shared helper `_shared/apifyHelper.ts` with functions:
  - `scrapeUserTweets(handle, count)` -- get recent tweets from any account
  - `scrapeUserProfile(handle)` -- follower count, bio, recent activity
  - `searchTweets(query, count)` -- search for tweets by keyword/hashtag

**Usage in the proactive loop:**
- Every cycle: scrape your account (@ayn handle) for latest engagement data
- Every cycle: scrape 3-5 competitor accounts stored in a config/table
- Periodically: search trending topics in your niche

### 4. Competitor Monitoring System

**New table: `marketing_competitors`**
- `id`, `handle` (Twitter handle), `name`, `notes`, `last_scraped_at`, `created_at`
- Admin can add/remove competitors via Telegram

**New table: `competitor_tweets`**
- `id`, `competitor_id`, `tweet_id` (Twitter ID), `content`, `likes`, `retweets`, `replies`, `impressions`, `scraped_at`
- Used for trend analysis

**New admin actions** in `ayn-telegram-webhook`:
- `[ACTION:add_competitor:handle]` -- add a Twitter account to monitor
- `[ACTION:remove_competitor:handle]` -- stop monitoring
- `[ACTION:competitor_report:all]` -- show competitor analysis

### 5. Autonomous Image Generation

The proactive loop will also autonomously create branded images:
- Based on top-performing hooks from competitor analysis
- Using the existing `twitter-generate-image` function (already has B&W rules)
- Images are saved to storage and linked to draft tweets
- Best ones are sent to the marketing Telegram chat for preview

### 6. Website Monitoring

Each proactive cycle pings the AYN website and checks:
- Response time
- HTTP status
- Basic availability

Reports back in the Telegram update if anything is off.

### 7. Marketing Bot Gets Action Tags

Like the admin bot, the marketing bot will support actions:
- `[ACTION:scrape_account:handle]` -- scrape a Twitter account on demand
- `[ACTION:analyze_competitors:all]` -- run competitor analysis now
- `[ACTION:generate_content:topic]` -- create a tweet + image about a topic
- `[ACTION:check_our_twitter:all]` -- pull latest metrics from our account
- `[ACTION:website_status:all]` -- check website health

### Technical Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/ayn-marketing-webhook/index.ts` | Rewrite | Fix personality, add action tags, add Apify integration, add conversation continuity |
| `supabase/functions/ayn-marketing-proactive-loop/index.ts` | Create | Autonomous loop: scrape, analyze, create, report |
| `supabase/functions/_shared/apifyHelper.ts` | Create | Shared Apify API helper functions |
| `supabase/functions/ayn-telegram-webhook/index.ts` | Edit | Add competitor management actions |
| `supabase/config.toml` | Edit | Register new function |
| Database migration | Execute | Create `marketing_competitors` and `competitor_tweets` tables |

### Secrets Needed

- `APIFY_API_TOKEN` -- from your Apify account (https://console.apify.com/account/integrations)

### Cron Setup

SQL to schedule the marketing proactive loop (run after implementation):
```text
Every 4 hours: call ayn-marketing-proactive-loop
```

### Result

The marketing bot becomes a real autonomous social media brain that:
- Talks like a friend, not a corporate chatbot
- Watches your Twitter account 24/7
- Monitors competitors and spots opportunities
- Creates content and images autonomously
- Reports findings proactively
- Gets things done when you say "do it"
- Uses Apify for real Twitter data instead of guessing

