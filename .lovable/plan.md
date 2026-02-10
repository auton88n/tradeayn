
# Fix AYN: Stop Spam + Make Him Actually Chat

## Problems Found

1. **Infinite ticket loop**: Ticket `917e3fb7` stays `open` forever. Every 6-hour cycle (and every manual trigger), AYN auto-replies to it again and sends you the same "I replied to stale ticket" message. The auto-reply never updates the ticket status.

2. **Report format, not conversation**: The proactive loop builds a rigid bullet-point digest every time. It doesn't sound like a person texting -- it sounds like a monitoring dashboard.

3. **No cooldown**: There's no check for "did I already message recently?" so if the loop runs multiple times (e.g., during testing), you get flooded.

4. **Webhook is working but needs conversation memory**: The webhook logs show AYN DID reply to your messages ("Hello", "So do you work 24hours", etc.), but it sends each message as a single-turn AI call with no chat history -- so AYN has no memory of what you said 2 messages ago.

---

## Fixes

### Fix 1: Stop the Ticket Spam Loop
**File**: `supabase/functions/ayn-proactive-loop/index.ts`

After auto-replying to a stale ticket, update its status to `pending` so it's never picked up again:
```
await supabase.from('support_tickets')
  .update({ status: 'pending' })
  .eq('id', ticket.id);
```

### Fix 2: Replace Data Dump with Natural Conversation
**File**: `supabase/functions/ayn-proactive-loop/index.ts`

Remove the hardcoded `digestParts` bullet-point format (lines 258-275). Instead, pass all metrics/trends/actions to the AI and ask it to write a casual Telegram message like a team member. If nothing is interesting, AYN responds with `[SKIP]` and no message is sent.

### Fix 3: Add Cooldown + Deduplication
**File**: `supabase/functions/ayn-proactive-loop/index.ts`

Before sending any Telegram message:
- Check when AYN last messaged you (query `ayn_mind` for last `shared_with_admin = true`)
- If less than 5 hours ago, skip messaging (still save observations)
- Compare current metrics hash with last shared metrics -- skip if identical

### Fix 4: Tighten "Worth Sharing" Logic
**File**: `supabase/functions/ayn-proactive-loop/index.ts`

Change the `worthSharing` condition from:
```
trends.length > 0 || healthScore < 80 || staleCount > 2 || actions.length > 0
```
To:
```
trends.length > 0 || healthScore < 80 || staleCount > 5
```
Remove `actions.length > 0` -- auto-replying to a ticket is routine, not newsworthy.

### Fix 5: Add Real Conversation Memory to Telegram Webhook
**File**: `supabase/functions/ayn-telegram-webhook/index.ts`

Currently AYN gets zero chat history -- every message is a fresh conversation. Fix by:
- Query the last 10 exchanges from `ayn_mind` where type is `observation` and content starts with "Admin asked:"
- Build a proper `messages` array with alternating user/assistant turns
- Send the full conversation history to the AI so AYN remembers what you talked about

### Fix 6: Add More Telegram Commands
**File**: `supabase/functions/ayn-telegram-webhook/index.ts`

Add these commands so you can control AYN directly from Telegram:
- `/think` -- Force AYN to run a thinking cycle and share results
- `/tweets` -- Show recent tweet performance
- `/errors` -- Show recent error details
- `/unblock [user_id]` -- Unblock a rate-limited user
- `/help` -- List all available commands

---

## Technical Summary

| Change | File | What |
|--------|------|------|
| Fix ticket loop | ayn-proactive-loop | Update ticket to `pending` after auto-reply |
| Natural messages | ayn-proactive-loop | AI generates casual message instead of bullet report |
| Cooldown | ayn-proactive-loop | Skip if messaged less than 5h ago |
| Deduplication | ayn-proactive-loop | Skip if metrics identical to last message |
| Tighter triggers | ayn-proactive-loop | Remove `actions.length > 0` from worthSharing |
| Chat memory | ayn-telegram-webhook | Send last 10 conversation turns to AI |
| More commands | ayn-telegram-webhook | Add /think, /tweets, /errors, /unblock, /help |

After these changes, AYN will:
- Stop spamming you with the same ticket notification
- Text you like a person, not a dashboard
- Remember your conversation context across messages
- Let you control him with commands from Telegram
- Stay quiet when nothing interesting is happening
