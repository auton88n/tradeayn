
# AYN Proactive Communication: Telegram Bridge + Auto-Reply + Self-Initiated Actions

## What This Does

AYN becomes proactive -- he doesn't wait for you to ask. He monitors what's happening, replies to users on his own, and sends you updates on Telegram in real time. Think of it as AYN having a direct line to your pocket.

## Three Core Capabilities

### 1. Telegram Bridge -- AYN Talks to You On-the-Go

A new edge function `ayn-telegram-notify` that AYN (and other functions) call to send you messages on Telegram whenever something important happens:

- New support ticket arrives -- AYN sends you a summary + suggested reply
- A user is stuck or frustrated -- AYN flags it
- Marketing tweet performed well (or flopped) -- AYN reports
- Error rate spikes -- AYN warns you
- AYN has an idea -- he messages you ("hey, I noticed beam calculator usage tripled this week. should I write a tweet about it?")
- AYN found something wrong in the app -- he tells you what and suggests a fix

**Setup**: You'll need to create a Telegram bot (via @BotFather) and add the `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` secrets. The function itself is simple -- it just calls `https://api.telegram.org/bot<token>/sendMessage`.

### 2. Auto-Reply to Support Tickets -- AYN Handles First Response

A new edge function `ayn-auto-reply` that gets triggered when a new support ticket is created. AYN:

1. Reads the ticket content
2. Checks the FAQ database for matching answers
3. Generates a helpful, personalized first response using AI
4. Sends the reply as an AI bot message on the ticket
5. Notifies you on Telegram: "New ticket from [user] about [topic]. I replied with [summary]. Need your input? [Yes/No]"
6. If the ticket is complex or AYN isn't confident, he escalates: "This one needs you. Here's what I think..."

### 3. Proactive Insights Loop -- AYN Initiates Actions

A new edge function `ayn-proactive-loop` that can be triggered on a schedule (or manually). AYN:

1. Scans system health (errors, failures, slow responses)
2. Checks for unanswered support tickets older than 4 hours
3. Reviews marketing performance (which tweets worked, which didn't)
4. Looks at user engagement patterns
5. Generates actionable insights
6. Sends everything to you via Telegram with suggested actions
7. Can auto-execute low-risk actions (like drafting a tweet, replying to simple tickets)

## Technical Details

### New Secrets Required

| Secret | Purpose |
|--------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | Your personal Telegram chat ID (so AYN knows where to message you) |

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/ayn-telegram-notify/index.ts` | Core Telegram messaging function -- other functions call this to reach you |
| `supabase/functions/ayn-auto-reply/index.ts` | Listens for new tickets, generates AI reply, sends it, notifies you |
| `supabase/functions/ayn-proactive-loop/index.ts` | Scheduled scan of system health, tickets, marketing -- sends digest to Telegram |

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/admin-ai-assistant/index.ts` | Add new actions: `[ACTION:telegram_me:message]`, `[ACTION:auto_reply_ticket:ticket_id]` |
| `supabase/functions/send-ticket-notification/index.ts` | After sending email, also trigger `ayn-auto-reply` for first AI response |
| `supabase/functions/twitter-auto-market/index.ts` | After posting, notify admin via Telegram with performance preview |
| `supabase/config.toml` | Register 3 new functions |

### Telegram Notify Function Architecture

```text
Any AYN function (support, marketing, admin, errors)
      |
      v
ayn-telegram-notify edge function
      |
      +-- Formats message with context + emoji indicators
      |     - Support ticket: ticket icon + summary + suggested reply
      |     - Marketing: chart icon + tweet preview + engagement
      |     - Error: warning icon + error details + suggested fix
      |     - Idea: lightbulb icon + proposal + action buttons
      |
      +-- Calls Telegram Bot API: POST /sendMessage
      |     - chat_id: TELEGRAM_CHAT_ID
      |     - text: formatted message (Markdown)
      |     - parse_mode: "Markdown"
      |
      +-- Logs notification to DB for audit trail
```

### Auto-Reply Flow

```text
User submits support ticket
      |
      v
send-ticket-notification (existing -- sends email)
      |
      +-- Also calls ayn-auto-reply
            |
            +-- 1. Read ticket content + category + priority
            |
            +-- 2. Search FAQ database for relevant answers
            |
            +-- 3. Call AI with ticket + FAQs + AYN personality
            |       "Generate a helpful first response. If you're
            |        not confident (score < 7), flag for human review."
            |
            +-- 4. If confident: Post reply as AI bot message
            |      If not: Skip reply, just notify admin
            |
            +-- 5. Telegram notify admin:
                    "New ticket: [subject]
                     From: [user]
                     Priority: [level]
                     My reply: [summary]
                     Confidence: [high/medium/low]
                     [Link to ticket]"
```

### Proactive Loop Logic

```text
ayn-proactive-loop (triggered on schedule or manually)
      |
      +-- 1. Check unanswered tickets (> 4 hours old)
      |       -> Auto-reply if simple, notify if complex
      |
      +-- 2. Check system health
      |       -> Error rate, LLM failures, rate limit blocks
      |       -> Alert if anything abnormal
      |
      +-- 3. Check marketing performance
      |       -> Compare last 7 days vs previous 7 days
      |       -> Suggest content strategy adjustments
      |
      +-- 4. Check user patterns
      |       -> Heavy free users (upgrade candidates)
      |       -> Inactive users (re-engagement needed)
      |
      +-- 5. Generate digest message for Telegram
      |
      +-- 6. If AYN found fixable issues, suggest specific actions
            -> "I noticed 3 users hit the same error in PDF generation.
                Want me to draft a status update?"
```

### Admin AI Assistant Upgrades

New actions added to the system prompt so AYN can self-initiate:

- `[ACTION:telegram_me:message]` -- Send admin a Telegram message
- `[ACTION:auto_reply_ticket:ticket_id]` -- Generate and send AI reply to a ticket  
- `[ACTION:draft_tweet:topic]` -- Draft a marketing tweet about a topic
- `[ACTION:scan_health:full]` -- Run a full system health check
- `[ACTION:suggest_improvement:description]` -- Log a product improvement idea

### Message Format Examples

**Support Ticket Notification (Telegram):**
```
🎫 *New Support Ticket*
From: Ahmad (ahmad@example.com)
Priority: High
Subject: PDF generation not working

*My reply:* "Hey Ahmad! Sorry about that. PDF generation needs a Pro subscription — looks like you're on Free. Want me to help you upgrade?"

Confidence: High
```

**Proactive Insight (Telegram):**
```
💡 *AYN Daily Insight*

📊 System Health: 94%
🎫 3 open tickets (1 needs you)
📈 Tweet "Most engineers waste 2hrs..." got 1.2k impressions
⚠️ 2 LLM failures in last 6 hours (timeout)

*Suggestion:* Beam calculator usage is up 40% this week. Want me to draft a tweet about it?
```

**Error Alert (Telegram):**
```
⚠️ *Alert: Error Spike Detected*

PDF generation failed 5 times in the last hour.
Error: "Timeout waiting for document render"
Affected users: 3

*My suggestion:* This might be a memory issue with large documents. Should I investigate?
```
