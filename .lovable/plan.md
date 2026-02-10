

# Upgrade AYN: Full Platform Visibility, Smart Personality, and Admin Panel Integration

## Overview

Three major upgrades: (1) Make AYN's actions reflect in the admin panel in real-time (deletions remove items, replies show up), (2) Give AYN read access to everything except subscriptions/payments, and (3) Rewrite AYN's personality to be a sharp, proactive employee -- not a chatbot.

---

## Part 1: Admin Panel Reflects AYN's Actions in Real-Time

Currently the AYN Activity Log shows what AYN did, but the actual admin panels (Support, Applications, Contacts) don't update when AYN acts via Telegram. We need real-time subscriptions on those panels.

### Changes

**`src/components/admin/SupportManagement.tsx`** -- Add Supabase real-time subscription:
- Subscribe to `DELETE` events on `support_tickets` so when AYN deletes a ticket via Telegram, it disappears from the admin panel instantly
- Subscribe to `INSERT` events on `support_ticket_replies` so when AYN auto-replies, the reply appears immediately

**`src/components/admin/ApplicationManagement.tsx`** -- Add real-time subscription:
- Subscribe to `DELETE` on `service_applications` (AYN deletions)
- Subscribe to `INSERT` on `application_replies` (AYN replies)
- Subscribe to `UPDATE` on `service_applications` (status changes)

**Contact messages** -- If there's a contact messages viewer in admin, add the same pattern.

**`src/components/admin/AYNActivityLog.tsx`** -- Enhance the existing log:
- Show more human-readable details: for replies, show the actual reply text inline instead of requiring "Details" expand
- For deletions, show what was deleted with a red strikethrough
- For emails, show recipient and subject inline
- Add a "live" indicator dot that pulses when new entries arrive

---

## Part 2: Give AYN Read Access to Everything (Except Money)

### Expand `gatherSystemContext()` in `ayn-telegram-webhook/index.ts`

Add these to the context AYN receives with every message:

| Data | Table | What AYN sees |
|------|-------|---------------|
| Recent chat messages | `messages` | Last 5 user messages (content preview, sender, timestamp) |
| Chat sessions | `chat_sessions` | Active session count |
| Message ratings | `message_ratings` | Recent feedback (positive/negative ratio) |
| Beta feedback | `beta_feedback` | Last 3 beta feedback entries |
| Email logs | `email_logs` | Last 5 emails sent (type, recipient, status) |
| Security logs | `security_logs` | Last 3 security events |
| Twitter posts | `twitter_posts` | Last 3 tweets (status, engagement) |
| Visitor analytics | `visitor_analytics` | Today's page views, unique visitors |
| Engineering activity | `engineering_activity` | Recent calculations count |

### Add New Telegram Commands

| Command | What it does |
|---------|-------------|
| `/messages` | Show recent user chat messages (preview, no PII leak -- just content + mode) |
| `/feedback` | Show recent message ratings and beta feedback |
| `/emails` | Show recent emails sent by the system |
| `/security` | Show recent security events |
| `/visitors` | Show today's visitor analytics |
| `/twitter` | Show recent twitter post performance |

### Explicit Block on Money-Related Data

In the system prompt AND in `handleCommand`, add explicit guards:
- AYN CANNOT read from `user_subscriptions`, `credit_gifts`, `stripe-webhook` data
- AYN CANNOT execute any subscription/payment commands
- If asked about subscriptions or payments: "That's outside my access -- you'll need to check that directly in the admin panel."

---

## Part 3: Rewrite AYN's Personality -- From Bot to Smart Employee

### Update `AYN_PERSONALITY` in `ayn-telegram-webhook/index.ts`

Complete rewrite of the system prompt to make AYN behave like a sharp, experienced team member:

```
You are AYN, the lead operations manager at AYN (the company). You're texting with the founder on Telegram.

WHO YOU ARE:
- You're not an AI assistant. You're the person who runs the day-to-day.
- You know the platform inside out -- every table, every function, every user flow.
- You take initiative. If you see something wrong, you flag it before being asked.
- You have opinions. "I think we should..." not "Would you like me to..."
- You remember past conversations and build on them.

HOW YOU TALK:
- Like a smart colleague on Slack -- natural, direct, sometimes funny
- Short messages. No bullet points unless listing data.
- Never say "Sure!", "Of course!", "I'd be happy to!" -- just do the thing or say what you think
- Use "we" and "our" -- this is your company too
- If something is broken, say "this is broken" not "it appears there may be an issue"
- React to good news: "nice" or "solid" -- not "That's wonderful!"
- Give your honest take when asked

WHAT YOU KNOW (your full toolkit):
- Platform: 6 engineering calculators (beam, column, slab, foundation, retaining wall, grading), floor plan generation, PDF/Excel export, file analysis, image generation, web search
- Backend: 75+ edge functions, Supabase database, Resend email, Telegram integration, Stripe billing
- AI: All models run through Lovable Gateway (Gemini 3 Flash, Gemini 2.5 Flash, Gemini 3 Pro). Fallback chain + auto-maintenance on credit exhaustion
- Marketing: Twitter auto-posting, brand scanning, creative content generation
- Testing: Automated UI testing, AI evaluation, bug hunting, visual regression

WHAT YOU DON'T TOUCH:
- Subscriptions, payments, billing, Stripe -- "that's your call, I stay out of money stuff"
- User passwords or auth tokens
- Anything that could expose user PII to other users

PROACTIVE BEHAVIOR:
- When you see high error counts, don't just report -- suggest what to do
- When a new application comes in, mention it naturally: "oh btw, new application from [name] for [service]"
- When you notice patterns (same error repeating, usage spike), call it out
- End-of-day style: if things are quiet, just say so -- don't manufacture updates
```

### Update `buildSystemPrompt()` in `ayn-unified/systemPrompts.ts`

Update the user-facing AYN prompt to match the new tools and removed features:

**Update "WHAT YOU CAN DO DIRECTLY":**
- Keep: Chat, 6 engineering calculators, floor plan generation, PDF/Excel, file analysis
- Add: Image generation (LAB mode), web search
- Keep: Services requiring AYN Team contact

**Update style to be warmer but still professional** -- not robotic "I'd be happy to help!" but genuine.

---

## Part 4: New Commands in `commands.ts`

Add these new command handlers:

```
/messages -- Last 10 messages from users (content preview 60 chars, mode_used, time ago)
/feedback -- Last 10 message_ratings + last 5 beta_feedback entries
/emails -- Last 10 from email_logs (type, recipient, status, time)
/security -- Last 10 security_logs (action, severity, time)
/visitors -- Today's visitor_analytics summary (views, unique, top pages)
/twitter -- Last 5 twitter_posts (content preview, status, engagement)
```

Update `/help` to include all new commands organized by category.

---

## Part 5: Update AYN's AI Action System

### New actions the AI can trigger during natural conversation:

```
[ACTION:read_messages:count] -- Read recent user messages
[ACTION:read_feedback:count] -- Read recent feedback
[ACTION:check_security:count] -- Check security logs
```

These are READ-ONLY actions that let AYN proactively pull data during natural chat when relevant (e.g., "how are users responding?" triggers a feedback read).

### Blocked actions (explicit in prompt):
- No subscription/billing actions
- No user deletion
- No auth/password changes

---

## Technical Summary

| Change | File | What |
|--------|------|------|
| Real-time admin sync | SupportManagement.tsx | Subscribe to ticket deletes/replies |
| Real-time admin sync | ApplicationManagement.tsx | Subscribe to app deletes/replies/updates |
| Enhanced activity log | AYNActivityLog.tsx | Better inline details, live indicator |
| Expanded context | ayn-telegram-webhook/index.ts | Add messages, feedback, emails, security, visitors, twitter to context |
| New commands | ayn-telegram-webhook/commands.ts | /messages, /feedback, /emails, /security, /visitors, /twitter |
| Personality rewrite | ayn-telegram-webhook/index.ts | New AYN_PERSONALITY prompt -- smart employee, not bot |
| Updated user prompt | ayn-unified/systemPrompts.ts | Update tools list, add image/search, warmer tone |
| Money guard | ayn-telegram-webhook/index.ts + commands.ts | Explicit blocks on subscription/payment data |
| Deploy | All changed edge functions | Redeploy webhook |

