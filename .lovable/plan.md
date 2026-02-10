

# Fix AYN: Stop Duplicate Reports + Make Him Actually Conversational

## The Real Problem

There are **two separate Telegram messages** being sent every cycle:

1. `ayn-auto-reply` always sends a formatted report (`🎫 New Ticket — Auto-Replied...`) via `ayn-telegram-notify` -- this is the ugly data dump you keep seeing
2. `ayn-proactive-loop` sends its own natural AI-generated message

When the proactive loop auto-replies to a stale ticket, it triggers `ayn-auto-reply`, which sends the formatted report. Then the proactive loop sends its own message. Result: two messages, one robotic, one natural.

Additionally, when you text AYN ("Why you don't talk"), instead of replying to you, the webhook may be triggering internal functions that send those reports instead of (or alongside) a conversational reply.

---

## Fixes

### Fix A: Stop `ayn-auto-reply` from sending Telegram reports when called internally

**File**: `supabase/functions/ayn-auto-reply/index.ts`

Add a `skip_telegram` parameter. When the proactive loop calls `ayn-auto-reply`, it passes `skip_telegram: true` to suppress the formatted Telegram notification. The proactive loop handles its own messaging.

- Accept `skip_telegram` in the request body (line 49)
- Wrap the Telegram notification block (lines 148-177) in `if (!skip_telegram)`
- This way, tickets submitted by real users still get notifications, but proactive loop auto-replies stay silent

### Fix B: Pass `skip_telegram: true` from the proactive loop

**File**: `supabase/functions/ayn-proactive-loop/index.ts`

When calling `ayn-auto-reply` for stale tickets (line 40-44), add `skip_telegram: true` to the request body so it doesn't trigger a duplicate report.

### Fix C: Ensure the webhook replies conversationally

**File**: `supabase/functions/ayn-telegram-webhook/index.ts`

The webhook code looks correct -- it should reply naturally. But the system context dump in the user message (line 116: `System status: ${JSON.stringify(context)}`) can overwhelm the AI and make it respond with data instead of conversation. Fix:

- Move the system context into the system prompt instead of the user message
- Keep the user message clean: just "Admin says: [their message]"
- This helps the AI focus on conversing rather than reporting data

---

## Technical Summary

| Change | File | What |
|--------|------|------|
| Add `skip_telegram` param | ayn-auto-reply | Suppress Telegram when called internally |
| Pass `skip_telegram: true` | ayn-proactive-loop | Stop duplicate report from auto-reply |
| Clean user message | ayn-telegram-webhook | Move system context to system prompt so AI talks naturally |

After these changes:
- You'll get ONE message per cycle (natural language, not a report)
- Texting AYN will get a conversational reply, not a data dump
- New user tickets still send notifications (only internal calls are silenced)

