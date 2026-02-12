

# Multi-Bot Telegram Group Chat — "The Real War Room"

## Overview

Each of AYN's 13 agents becomes a real Telegram bot in a group chat. When a deliberation fires, each agent posts from their own bot account — so you see 13 different names and avatars chatting, not one bot narrating.

## What You Need to Do (Before I Build)

1. Go to **@BotFather** on Telegram and create bots. You don't need all 13 right away — start with the most active ones:

| Priority | Bot Name Suggestion | Username Suggestion |
|----------|-------------------|-------------------|
| 1 | AYN | @ayn_brain_bot |
| 2 | Sales Hunter | @ayn_sales_bot |
| 3 | Chief of Staff | @ayn_cos_bot |
| 4 | Security Guard | @ayn_security_bot |
| 5 | Strategic Advisor | @ayn_advisor_bot |
| 6 | Innovation Lead | @ayn_innovation_bot |
| 7 | Investigator | @ayn_investigator_bot |
| 8 | Legal Counsel | @ayn_lawyer_bot |
| 9 | Marketing Strategist | @ayn_marketing_bot |
| 10 | QA Watchdog | @ayn_qa_bot |
| 11 | Follow-Up Agent | @ayn_followup_bot |
| 12 | Customer Success | @ayn_cs_bot |
| 13 | HR Manager | @ayn_hr_bot |

2. Create a **Telegram Group** and add ALL the bots to it
3. Send a message in the group, then use `https://api.telegram.org/bot<TOKEN>/getUpdates` for any one bot to get the **group chat ID**
4. Give me all the bot tokens and the group chat ID

## What I'll Build

### 1. New database table: `agent_telegram_bots`

Stores the mapping between employee IDs and their Telegram bot tokens:

```text
agent_telegram_bots
- id (uuid, PK)
- employee_id (text, unique) -- e.g. "sales", "advisor"
- bot_token (text) -- each agent's bot token
- is_active (boolean, default true)
- created_at (timestamptz)
```

This is better than 13 separate secrets because you can add/remove bots without redeploying.

### 2. New secret: `TELEGRAM_GROUP_CHAT_ID`

The group chat ID where all bots post. Separate from the existing `TELEGRAM_CHAT_ID` (your 1-on-1 with AYN).

### 3. Update `telegramHelper.ts` — Multi-bot broadcast

Replace `broadcastDeliberation()` to send each agent's position using **that agent's own bot token**:

```text
- Load bot tokens from agent_telegram_bots table
- For the debate opener: send via AYN's bot (system)
- For each agent position: send via that agent's bot
- For the final decision: send via AYN's bot
- Fallback: if an agent doesn't have a bot, skip or use AYN's bot
```

### 4. Update `deliberation.ts`

Pass the Supabase client to the broadcast function so it can look up bot tokens from the database. The broadcast parameter changes from `{ token, chatId }` to `{ chatId, supabase }`.

### 5. Your existing AYN 1-on-1 chat stays unchanged

The main `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` still handles your direct conversations with AYN. The group chat is a separate channel for deliberations only.

## How It Will Look

In your Telegram group:

```text
AYN (bot):
  "INTERNAL DEBATE: Should we pivot pricing for Engineering Tools?"
  Impact: HIGH | Agents: 5

Sales Hunter (bot):
  "Support. Current pricing is leaving money on the table..."

Security Guard (bot):
  "Conditional. Price changes affect existing contracts..."

Innovation Lead (bot):
  "Support. But bundle it with AI features..."

Legal Counsel (bot):
  "Oppose. Existing contracts have fixed pricing clauses."

AYN (bot):
  "DECISION — Winner: Sales Hunter (weight: 0.82)..."
```

Each message comes from a **different bot** with its own name and profile picture.

## Implementation Sequence

1. Create `agent_telegram_bots` table with RLS (service role only)
2. Add `TELEGRAM_GROUP_CHAT_ID` secret
3. Update `telegramHelper.ts` with multi-bot sending
4. Update `deliberation.ts` to pass supabase to broadcast
5. Update webhook to use group chat for deliberations
6. You create bots, add them to group, and I'll store the tokens

## What Does NOT Change

- Your 1-on-1 AYN chat (commands, conversations, confirmations)
- The deliberation logic itself (60/40 weighting, doctrine, trust)
- All cron agents and background jobs
- Existing Telegram commands

