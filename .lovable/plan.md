
# Make AYN Alive: Autonomous Mind + Telegram Two-Way Chat

Right now, AYN is **one-directional** — he only talks when you ask him something. He can't reply to your Telegram messages, he doesn't think on his own, and he doesn't initiate conversations. This plan fixes all three.

---

## What Changes

### 1. Telegram Webhook — AYN Reads Your Messages
A new edge function `ayn-telegram-webhook` that receives incoming Telegram messages from you and lets AYN respond intelligently.

- Register the function as a Telegram Bot webhook (so Telegram forwards your messages to it)
- When you text AYN on Telegram, the function:
  - Verifies the message is from your chat ID (security)
  - Feeds it to the AI with full system context (same as admin-ai-assistant)
  - Sends the AI response back to Telegram
  - Executes any actions AYN suggests (unblock user, run tests, etc.)
- Supports commands like `/health`, `/tickets`, `/stats` for quick checks

### 2. AYN's Brain — Autonomous Thinking Loop
Upgrade the `ayn-proactive-loop` so AYN doesn't just report — he **thinks, decides, and initiates**.

New database table `ayn_mind` to store:
- AYN's current thoughts and observations
- Ideas he wants to share with you
- Tasks he assigned himself
- His "mood" based on system health

The upgraded proactive loop will:
- Compare current metrics with previous runs to detect **trends** (not just snapshots)
- Generate **original thoughts** like "user signups dropped 30% this week, should we check onboarding?"
- Initiate Telegram conversations when something interesting happens (not just digests)
- Track what he already told you to avoid repeating himself

### 3. Scheduled Heartbeat — AYN Runs Automatically
Set up a cron job so the proactive loop runs every 6 hours without anyone triggering it. AYN wakes up, scans everything, thinks, and messages you if something is worth sharing.

---

## Architecture

```text
You (Telegram) ──message──> ayn-telegram-webhook ──> AI + System Context ──> Reply to Telegram
                                                                          ──> Execute actions

Every 6 hours:
  cron ──> ayn-proactive-loop ──> Scan system
                               ──> Compare with previous (ayn_mind table)
                               ──> Generate thoughts
                               ──> Send interesting findings to Telegram
                               ──> Log to ayn_mind
```

---

## Technical Details

### New Edge Function: `ayn-telegram-webhook`
- `verify_jwt = false` (Telegram sends webhooks directly)
- Security: validates `chat_id` matches `TELEGRAM_CHAT_ID` secret
- Uses the same AI model and system context as `admin-ai-assistant`
- Supports text messages and `/commands`
- Responds in AYN's casual personality style

### New Database Table: `ayn_mind`
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| type | text | thought, observation, idea, task, mood |
| content | text | What AYN is thinking |
| context | jsonb | Related metrics/data |
| shared_with_admin | boolean | Whether he already told you |
| created_at | timestamp | When he thought of it |

### Upgraded `ayn-proactive-loop`
- Reads previous `ayn_mind` entries to avoid repeating
- Detects metric trends by comparing with last run
- Generates 1-2 original thoughts per cycle
- Only messages you on Telegram when something is genuinely interesting or actionable
- Saves all observations to `ayn_mind`

### Cron Job (pg_cron)
- Runs `ayn-proactive-loop` every 6 hours
- Uses `pg_net` to call the edge function

### Telegram Bot Webhook Registration
- One-time setup: call Telegram's `setWebhook` API to point to `ayn-telegram-webhook`
- Will provide the registration command after deployment

---

## What AYN Will Be Able to Do After This

- **Reply to your Telegram messages** with full system awareness
- **Start conversations** when he notices something ("hey, 3 tickets have been sitting for 8 hours")
- **Think independently** and log observations ("beam calculator usage spiked 400% today — maybe we should feature it")
- **Remember what he told you** so he doesn't repeat himself
- **Run on autopilot** every 6 hours without you triggering anything
- **Execute actions** from Telegram (you text "unblock users" and he does it)
