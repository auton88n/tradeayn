

# Revert: Keep 100-Message Per-Chat Cap for Unlimited Users

## What Changed

The recent fix correctly bypassed the legacy monthly limit system for unlimited users. However, it also removed the 100-message per-chat session cap in `ayn-unified` for unlimited users -- you want that cap to stay.

## Change

### `supabase/functions/ayn-unified/index.ts`

Remove the `is_unlimited` query and conditional that was added around the `MAX_MESSAGES_PER_CHAT` check. Restore it to the original behavior where **all users** (including unlimited) are subject to the 100-message per-chat cap.

This means removing the block that queries `user_ai_limits.is_unlimited` and the `if (!isUnlimited)` wrapper around the session message count check.

The monthly limit fix (frontend `increment_usage` bypass and toast removal) stays intact -- only the per-chat cap revert is needed.

