

# Fix AYN's Memory — Messages Aren't Being Saved At All

## The Real Problem

Looking at the database, there are **zero** `telegram_admin` or `telegram_ayn` entries in the `ayn_mind` table. AYN literally has no conversation history. Every message is a fresh start with zero context. This is why AYN "forgets" — it's not a truncation issue, the messages are never saved (or silently fail to save).

The `ayn_mind` table only has entries of types: `observation`, `mood`, `idea`, `thought`, `trend` — all from the proactive loop. Nothing from Telegram chats.

## Root Cause

The insert on line 373 is a batch insert of two rows. If this fails silently (Supabase returns an error but the code doesn't check it), all conversations vanish. The code does `await supabase.from('ayn_mind').insert([...])` but never checks the result for errors.

## Changes

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**1. Add error checking and fallback on ALL ayn_mind inserts (lines 373-376, 251-254, 456-459)**

Replace fire-and-forget inserts with error-checked inserts. If the batch insert fails, retry with individual inserts. Log any errors so we can see what's happening:

```typescript
// Instead of:
await supabase.from('ayn_mind').insert([...]);

// Do:
const { error: insertErr } = await supabase.from('ayn_mind').insert([
  { type: 'telegram_admin', content: userText.slice(0, 4000), ... },
  { type: 'telegram_ayn', content: cleanReply.slice(0, 4000), ... },
]);
if (insertErr) {
  console.error('ayn_mind batch insert failed:', insertErr.message);
  // Fallback: try individual inserts
  await supabase.from('ayn_mind').insert({ type: 'telegram_admin', ... });
  await supabase.from('ayn_mind').insert({ type: 'telegram_ayn', ... });
}
```

**2. Increase ALL storage limits to 4000 characters**

Every `.slice(0, 2000)` becomes `.slice(0, 4000)`. This applies to:
- Main conversation insert (line 374-375)
- Auto-execute confirmation insert (line 252-253)  
- Photo/vision insert (line 457-458)

**3. Increase conversation history window from 40 to 80 messages (line 519)**

Change `.limit(40)` to `.limit(80)` so AYN can look further back in conversation history.

**4. Add debug logging throughout**

Add `console.log` statements at key points so we can trace exactly what happens:
- When a message is received
- When conversation history is loaded (how many entries found)
- When the AI response is received
- When the insert succeeds or fails

This will show up in the edge function logs and help diagnose if the problem persists.

**5. Photo message storage — also increase to 4000 (line 458)**

The vision response insert also uses `.slice(0, 500)` — bump it to 4000 for consistency.

## Summary

| Fix | What |
|-----|------|
| Error-checked inserts with fallback | Messages actually get saved to the database |
| 4000 char storage | Full email drafts, long conversations preserved |
| 80 message history window | Deeper conversation context |
| Debug logging | Can see what's happening in edge function logs |

The core fix is making the insert reliable. Everything else (pending actions, confirmation detection) already works in the code — it just needs the conversation history to actually exist in the database.
