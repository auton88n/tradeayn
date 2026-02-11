

# Add a Second Marketing Creator to the Bot

## What Changes

The bot currently checks `message.chat.id` against a single environment variable (`TELEGRAM_MARKETING_CHAT_ID`). We need to support multiple allowed chat IDs so both creators can interact with the bot.

## Approach

### 1. Add a new secret for the second creator's chat ID

Add a new environment variable: `TELEGRAM_MARKETING_CHAT_ID_2` with the new person's Telegram chat ID (you'll provide this).

### 2. Update the authorization check

In `supabase/functions/ayn-marketing-webhook/index.ts`, change the single chat ID check to accept either:

```text
Before:
  if (String(message.chat.id) !== TELEGRAM_MARKETING_CHAT_ID) -> reject

After:
  const allowedChatIds = [TELEGRAM_MARKETING_CHAT_ID, TELEGRAM_MARKETING_CHAT_ID_2].filter(Boolean);
  if (!allowedChatIds.includes(String(message.chat.id))) -> reject
```

### 3. Replies go to the sender's chat

Update all `sendTelegramMessage` calls in the main handler to use `String(message.chat.id)` instead of the hardcoded `TELEGRAM_MARKETING_CHAT_ID`, so replies go back to whoever sent the message (not always to the first creator's chat).

### 4. Track who's talking

Include the sender's chat ID or username in the `ayn_mind` context so AYN knows which creator it's talking to.

### File changes

| File | Change |
|------|--------|
| `supabase/functions/ayn-marketing-webhook/index.ts` | Multi-chat-ID auth check, reply to sender's chat, track sender identity |
| Secrets | Add `TELEGRAM_MARKETING_CHAT_ID_2` |

### No database changes needed

