
# Supercharge AYN Telegram Bot — Full Power Upgrade

## Overview

Adding all proposed enhancements to make AYN a fully autonomous operations manager on Telegram: user management, vision AI, weekly reports, smarter proactive alerts, and multi-step workflows.

---

## 1. User Management Commands (commands.ts)

New commands for managing users directly from Telegram:

- `/user [id]` — View full profile: company, contact person, status, last login, access grant details (monthly limit, current usage, active status)
- `/grant [email]` — Create a new access grant for a user (looks up user by email in profiles)
- `/revoke [id]` — Deactivate an access grant (`is_active = false`)
- `/set_unlimited [id]` — Set a user's `monthly_limit` to `-1` (unlimited)

All commands log to `ayn_activity_log` with `triggered_by: 'telegram_command'`.

---

## 2. Vision AI — Image Analysis (index.ts)

When AYN receives a photo on Telegram (not just text), he will:

1. Download the image via Telegram Bot API (`getFile` + file URL)
2. Convert to base64
3. Send to Gemini 3 Flash via Lovable AI Gateway with a multimodal message
4. Reply with the AI's analysis

This uses the same pattern as `twitter-brand-scan` (already working in the codebase). AYN's system prompt will instruct him to describe what he sees and offer actionable insights.

---

## 3. Weekly Report Command (commands.ts)

`/weekly_report` — Compiles a comprehensive 7-day summary:

- User growth (new access grants this week vs last week)
- Error trends (errors this week vs last week)
- Ticket resolution rate (resolved / total)
- Top 5 most-viewed pages from `visitor_analytics`
- Twitter performance (posts, impressions, engagement)
- AI usage (message count by mode from `messages` table)
- Feedback summary (positive/negative ratio)

Uses AI (Gemini) to format the raw data into a natural executive summary instead of a raw data dump.

---

## 4. Smarter Proactive Loop (ayn-proactive-loop/index.ts)

Enhance the existing 6-hour loop with immediate alert triggers:

- **Error spike**: If errors in the last 1 hour exceed 10, send immediate alert (separate from cooldown)
- **New service application**: Check for applications created since last run, mention them naturally
- **Rate-limited user**: If a user gets blocked, notify immediately
- **New high-priority ticket**: Flag any `priority: 'urgent'` tickets created since last run

Add an `urgency` flag that bypasses the 5-hour cooldown for critical events (health < 60, error spike, urgent ticket).

---

## 5. Direct DB Read Query (commands.ts)

`/query [table] [limit]` — Read-only data peek with strict guardrails:

- Whitelist of allowed tables: `error_logs`, `support_tickets`, `service_applications`, `contact_messages`, `visitor_analytics`, `ayn_activity_log`, `twitter_posts`, `engineering_activity`
- Blacklisted tables: `user_subscriptions`, `credit_gifts`, anything with `stripe`, `payment`, `billing`
- Always SELECT only, limit capped at 20
- Returns formatted results

---

## 6. Webhook/System Monitoring (commands.ts)

`/webhooks` — Check recent webhook activity:

- Query `email_logs` for failed emails in last 24h
- Query `llm_failures` for patterns (same error repeating)
- Query `error_logs` grouped by `error_message` to show top recurring errors

---

## 7. Updated Help & Personality

- Update `/help` to include all new commands organized by category
- Update `AYN_PERSONALITY` system prompt to include new capabilities
- Add new ACTION patterns for AI-triggered user management

---

## Files Changed

| File | Changes |
|------|---------|
| `supabase/functions/ayn-telegram-webhook/commands.ts` | Add `cmdUser`, `cmdGrant`, `cmdRevoke`, `cmdSetUnlimited`, `cmdWeeklyReport`, `cmdQuery`, `cmdWebhooks` |
| `supabase/functions/ayn-telegram-webhook/index.ts` | Add photo handling, new command routing, updated personality prompt with new commands, new ACTION patterns for user management |
| `supabase/functions/ayn-proactive-loop/index.ts` | Add urgent alert bypass, new application detection, rate-limit notifications |
| `supabase/functions/_shared/telegramHelper.ts` | No changes needed |

## Deployment

Redeploy both edge functions:
- `ayn-telegram-webhook`
- `ayn-proactive-loop`
