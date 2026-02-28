

## Plan: Kill cron job + Fix intent routing

### 1. Unschedule the legacy cron job
Create a new SQL migration to stop `ayn-monitor-trades-every-5min`:
```sql
SELECT cron.unschedule('ayn-monitor-trades-every-5min');
```

### 2. Fix intent routing — backend ignores `mode` field
**File:** `supabase/functions/ayn-unified/index.ts`

**Line 711** — add `mode` to destructuring:
```ts
const { messages: rawMessages, intent: forcedIntent, mode, context = {}, stream = true, sessionId } = await req.json();
```

**Line 748** — use `mode` as fallback before `detectIntent`:
```ts
let intent = (forcedIntent && forcedIntent !== 'chat') ? forcedIntent : (mode && mode !== 'chat') ? mode : detectIntent(lastMessage, hasImageFile);
```

This ensures when the frontend sends `mode: 'trading-coach'`, the backend actually routes to the trading-coach prompt instead of falling through to generic chat.

