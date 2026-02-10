

# AYN Social Media Marketing Intelligence

## Summary

Embed a comprehensive **Marketing Psychology Knowledge Base** directly into the `twitter-auto-market` edge function's system prompt. This gives AYN deep understanding of human psychology, social media behavior, persuasion principles, and audience engagement -- so it generates tweets that actually convert, not just generic content.

## The Problem You're Solving

Without marketing intelligence, AYN would just post bland feature announcements like "AYN can calculate beams!" -- which nobody engages with. Real social media success requires understanding **why** people click, share, and follow.

## What AYN Will Know

### 1. Core Persuasion Psychology (Cialdini's 6 Principles)
- **Reciprocity**: Give value first (free tips, insights) before asking for anything
- **Social Proof**: Reference user counts, testimonials, industry adoption
- **Authority**: Position AYN as an expert (building codes, engineering standards)
- **Scarcity**: Limited-time features, exclusive capabilities
- **Consistency**: Build on previous commitments (threads, series)
- **Liking**: Be relatable, use humor, show personality

### 2. Social Media Behavior Patterns
- **Hook in 7 words**: First line determines 90% of engagement
- **Optimal tweet structures**: Question openers, bold claims, "Most people don't know..." formats
- **Engagement triggers**: Curiosity gaps, contrarian takes, relatable struggles
- **Best content types**: Tips/threads (high saves), hot takes (high replies), before/after (high shares)
- **Timing awareness**: Post during peak hours, reference current events when relevant

### 3. Audience Psychology Profiles
AYN will understand different personality types and tailor content:
- **Engineers**: Value precision, data, efficiency -- speak their language
- **Business owners**: Care about ROI, time savings, competitive advantage
- **Students**: Want learning, career growth, affordability
- **Curious browsers**: Need wow-factor, visual appeal, simplicity

### 4. Emotional Triggers That Drive Sharing
- **FOMO**: "While you're manually calculating..."
- **Pride**: Content people want to share to look smart
- **Relief**: "Finally, an AI that actually understands building codes"
- **Surprise**: Unexpected capabilities or stats
- **Identity**: "If you're an engineer who..." (tribal belonging)

### 5. Content Strategy Framework
The system prompt will include a rotating content mix:
- 40% **Value posts** (tips, how-tos, industry insights)
- 25% **Engagement posts** (questions, polls, debates)
- 20% **Feature showcases** (with real use-case framing, not feature dumps)
- 15% **Personality/culture** (humor, behind-the-scenes, relatability)

## Technical Changes

### 1. New Edge Function: `twitter-auto-market`

The system prompt will contain the full marketing psychology playbook above, structured as actionable rules. Example rules embedded:

```
- NEVER post a plain feature announcement. Always frame features as solutions to PAIN POINTS
- Use the "PAS" framework: Problem -> Agitate -> Solution
- Vary sentence rhythm: short punchy line. Then a longer one that builds context and curiosity
- Mirror the language your audience uses (not corporate speak)
- Every tweet must pass the "would I stop scrolling for this?" test
- Include a hook pattern rotation: question, bold stat, contrarian take, story opener
```

### 2. Content Generation with Personality Awareness

The AI will receive context about:
- What AYN's actual capabilities are (engineering, floor plans, PDF/Excel, multilingual)
- Target audience segments and which to focus on per tweet
- Previous tweets (from `twitter_posts` table) to avoid repetition
- Current trends/topics (optional: via Perplexity search before generating)

### 3. Tweet Quality Scoring

Before posting, the function will self-evaluate each tweet against:
- Does it have a strong hook? (first 7 words)
- Does it use a psychological trigger?
- Is it under 280 chars with room for engagement?
- Does it avoid generic AI/tech buzzwords?
- Would the target persona actually care?

### 4. Database Table: `twitter_posts`

Columns: `id`, `content`, `status`, `psychological_strategy` (which principle was used), `target_audience`, `content_type` (value/engagement/feature/personality), `posted_at`, `tweet_id`

This lets you track which strategies perform best over time.

### 5. Files to Create/Edit

| File | Action |
|------|--------|
| `supabase/functions/twitter-auto-market/index.ts` | Create -- AI tweet generation with full psychology prompt |
| `supabase/functions/twitter-post/index.ts` | Create -- OAuth 1.0a posting to X API |
| `src/components/admin/TwitterMarketingPanel.tsx` | Create -- Admin UI for review/post/schedule |
| Database migration for `twitter_posts` table | Create |

### 6. Secrets Required

You will need to provide four Twitter/X API credentials (the tool will prompt you to enter them):
- `TWITTER_CONSUMER_KEY`
- `TWITTER_CONSUMER_SECRET`  
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`

## What This Means in Practice

Instead of: *"AYN can calculate beams and columns. Try it today!"*

AYN would generate: *"Engineers spend 4+ hours on manual beam calcs. I do it in 12 seconds with full ACI 318-25 compliance. The math doesn't lie."*

The difference is psychology: specificity, authority, contrast, and a mic-drop closer.

