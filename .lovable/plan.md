

# Marketing Studio V2 — Complete Redesign

## The Problems

1. **The AI feels like a bot** — The creative chat uses a generic system prompt and lacks memory of past conversations, brand context, and strategic continuity. It asks the same opening question every time.
2. **Weak capabilities** — You can only generate tweets one at a time, no scheduling, no analytics view, no thread support, no campaign planning.
3. **Dated UI** — Tabbed layout feels like an admin panel, not a creative command center. The Creative Editor is locked behind a dialog. The Brand Kit is collapsible clutter.

---

## What Changes

### A. Smarter AI (Backend)

**`twitter-creative-chat/index.ts`** — Rewrite the system prompt and add memory:

- Give AYN a sharper, more opinionated personality — fewer generic responses, more strategic pushback ("that hook is weak, try this instead")
- Inject the last 5 tweets + their engagement data into context so AYN knows what worked
- Inject the full Brand Kit automatically (no more "tell me the vibe")
- Add awareness of time (day of week, time zone) for posting strategy
- Add a "campaign mode" where AYN plans a 5-7 tweet content calendar in one shot
- Support thread generation (multi-tweet output as JSON array)
- When generating images, pass more specific brand instructions (colors, grid pattern, typography rules from the memory)

**`twitter-auto-market/index.ts`** — Enhance tweet generation:

- Add `thread_mode` parameter that generates 3-5 connected tweets
- Add `campaign_plan` parameter that generates a week of content with varied types/audiences
- Include engagement data from recent posts in the prompt so the AI learns what works

### B. Full UI Redesign (Frontend)

Replace the current tabbed `TwitterMarketingPanel.tsx` with a modern **Marketing Command Center**:

```text
+-------------------------------------------------------+
|  MARKETING HQ                          [Auto-Pilot: ON]|
+------------------+------------------------------------+
|                  |                                     |
|  BRAND KIT BAR   |   CONTENT AREA                     |
|  (compact,       |   (switches between views)         |
|   always visible)|                                     |
|  - Logo          |   [Pipeline] [Studio] [Analytics]   |
|  - Colors row    |                                     |
|  - Quick edit    |   Pipeline: Kanban-style columns    |
|                  |     Draft → Scheduled → Posted      |
|  CO-PILOT CHAT   |                                     |
|  (persistent     |   Studio: Full-screen creative      |
|   sidebar)       |     editor (not a dialog)           |
|                  |                                     |
|  - Always open   |   Analytics: Engagement charts      |
|  - Remembers     |     over time, best performers      |
|    context       |                                     |
+------------------+------------------------------------+
```

**New Components:**

| Component | Purpose |
|-----------|---------|
| `MarketingCommandCenter.tsx` | Main layout with sidebar + content area |
| `ContentPipeline.tsx` | Kanban board: Draft / Scheduled / Posted columns with drag cards |
| `MarketingCoPilot.tsx` | Persistent chat sidebar — always visible, remembers context |
| `AnalyticsDashboard.tsx` | Engagement charts (recharts), best performing tweets, content type breakdown |
| `ThreadComposer.tsx` | Multi-tweet thread builder with preview |
| `CampaignPlanner.tsx` | AI generates a week of content, you approve/edit/schedule |
| `CompactBrandBar.tsx` | Slim brand identity bar — logo + color dots + tagline, click to expand |

**Removed:**
- Old `TwitterMarketingPanel.tsx` (replaced entirely)
- Dialog-based `CreativeEditor.tsx` (replaced with inline studio)

**Kept & Enhanced:**
- `BrandKit.tsx` logic (refactored into CompactBrandBar)
- `CampaignGallery.tsx` (integrated into Pipeline view)
- `AynEyeIcon.tsx` (unchanged)

### C. New Features

1. **Campaign Planner** — Ask AYN "plan my week" and get 7 tweets with varied content types, audiences, and scheduled times. Approve, edit, or regenerate individual ones.

2. **Thread Composer** — Create 3-5 tweet threads. AYN structures them with hook + expansion + proof + CTA. Preview the full thread before posting.

3. **Scheduling** — Set date/time for tweets. A new `scheduled_at` column in `twitter_posts` table. A cron-invoked edge function `twitter-scheduled-poster` checks every 15 min and posts due tweets.

4. **Analytics View** — Pull engagement data from `twitter_posts` (impressions, likes, retweets, replies) and show trend charts. Highlight best-performing content types and audiences.

5. **Persistent Co-Pilot** — The chat sidebar stays open as you navigate between Pipeline/Studio/Analytics. AYN sees what you're looking at and offers contextual advice.

---

## Technical Details

### Database Changes

Add column to `twitter_posts`:
- `scheduled_at` (timestamptz, nullable) — when to auto-post
- `thread_id` (uuid, nullable) — groups tweets in a thread
- `thread_order` (int, nullable) — position in thread

### New Edge Function

**`twitter-scheduled-poster/index.ts`** — Invoked by cron every 15 min:
- Query `twitter_posts` where `status = 'scheduled'` and `scheduled_at <= now()`
- Post each via existing `twitter-post` function
- Update status to `posted` or `failed`
- Notify via Telegram

### Files Changed

| File | Action |
|------|--------|
| `src/components/admin/TwitterMarketingPanel.tsx` | **Replaced** with `MarketingCommandCenter.tsx` |
| `src/components/admin/marketing/CreativeEditor.tsx` | **Replaced** with inline `MarketingCoPilot.tsx` |
| `src/components/admin/marketing/BrandKit.tsx` | **Refactored** into `CompactBrandBar.tsx` |
| `src/components/admin/marketing/CampaignGallery.tsx` | **Integrated** into `ContentPipeline.tsx` |
| `src/components/admin/marketing/ContentPipeline.tsx` | **New** — Kanban pipeline |
| `src/components/admin/marketing/MarketingCommandCenter.tsx` | **New** — Main layout |
| `src/components/admin/marketing/MarketingCoPilot.tsx` | **New** — Persistent chat |
| `src/components/admin/marketing/AnalyticsDashboard.tsx` | **New** — Charts & insights |
| `src/components/admin/marketing/ThreadComposer.tsx` | **New** — Thread builder |
| `src/components/admin/marketing/CampaignPlanner.tsx` | **New** — Week planning |
| `src/components/admin/marketing/CompactBrandBar.tsx` | **New** — Slim brand bar |
| `supabase/functions/twitter-creative-chat/index.ts` | **Rewritten** — Smarter personality + memory |
| `supabase/functions/twitter-auto-market/index.ts` | **Enhanced** — Thread + campaign modes |
| `supabase/functions/twitter-scheduled-poster/index.ts` | **New** — Cron poster |
| `src/components/AdminPanel.tsx` | **Updated** — Point to new component |

### Implementation Order

1. Database migration (add columns)
2. Backend: Rewrite `twitter-creative-chat` with smarter prompt + memory
3. Backend: Enhance `twitter-auto-market` with thread/campaign modes
4. Backend: Create `twitter-scheduled-poster`
5. Frontend: Build `CompactBrandBar` + `MarketingCoPilot` (core pieces)
6. Frontend: Build `ContentPipeline` + `ThreadComposer`
7. Frontend: Build `CampaignPlanner` + `AnalyticsDashboard`
8. Frontend: Assemble `MarketingCommandCenter` and wire into AdminPanel
9. Deploy all edge functions

