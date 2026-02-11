

# Add Rolling Memory System to Marketing Bot

## The Problem

The marketing bot saves conversations to `ayn_mind` and loads the last 50 messages as history -- but it has no rolling summary system. Once conversations go past 50 entries, older context is just gone. The admin bot solves this with a `telegram_summary` system that condenses old messages into summaries so AYN never forgets.

## What Changes

### Add a `marketing_summary` type to the memory system

Mirror the admin bot's approach:

1. **After each message exchange**, check the total count of `marketing_chat` + `marketing_ayn` entries
2. **If count exceeds 100**, take the oldest 30 entries, send them to Gemini to summarize into a compact paragraph, save as a `marketing_summary` entry in `ayn_mind`, then delete the originals
3. **When loading history**, first load all `marketing_summary` entries (chronological), then load the latest 50 live messages -- this gives AYN full long-term memory

### Database change

Add `marketing_summary` to the `ayn_mind` type CHECK constraint (alongside the existing types like `telegram_summary`).

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/ayn-marketing-webhook/index.ts` | Add `pruneMarketingHistory()` function (mirrors admin's pruning logic). Call it after saving each exchange. Update `getMarketingHistory()` to load summaries first. |
| Database migration | Add `marketing_summary` to `ayn_mind` type CHECK constraint |

### How it works

```text
New message comes in
  |
  Save exchange to ayn_mind (marketing_chat + marketing_ayn)
  |
  Count total marketing entries
  |
  > 100 entries?
  |   YES --> Take oldest 30
  |           Summarize with Gemini
  |           Save as marketing_summary
  |           Delete the 30 originals
  |   NO  --> Done
  |
  Next message: load summaries + last 50 = full memory
```

### Updated getMarketingHistory flow

1. Fetch all `marketing_summary` entries (ordered by date)
2. Fetch latest 50 `marketing_chat` / `marketing_ayn` entries
3. Combine: summaries first as system context, then live messages as conversation history
4. AYN now remembers everything -- old stuff as summaries, recent stuff in detail

