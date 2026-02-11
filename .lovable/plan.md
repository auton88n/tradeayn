

# Fix: AYN Telegram Webhook Boot Crash

## Problem

The webhook is completely down due to a **duplicate variable declaration**. The variable `replyLower` is declared with `const` on **line 402** (action enforcement layer added in the last edit) and again on **line 479** (existing confirmation detection code). JavaScript/Deno throws a `SyntaxError` at boot and the function never starts.

Error from logs:
```
Uncaught SyntaxError: Identifier 'replyLower' has already been declared
  at index.ts:504:11
```

## Fix

**One-line change** in `supabase/functions/ayn-telegram-webhook/index.ts`:

- **Line 479**: Change `const replyLower = cleanReply.toLowerCase();` to just reuse the existing `replyLower` variable from line 402, or rename it. Since the line 402 version uses `reply.toLowerCase()` and line 479 uses `cleanReply.toLowerCase()`, the simplest safe fix is to rename the second one to a different variable name (e.g., `const cleanReplyLower`), then update its usages on lines 480-513.

Alternatively, since `cleanReply` strips ACTION tags from `reply`, and the confirmation detection logic doesn't need ACTION tags, we can just rename the second variable to `cleanReplyLower` and update the ~6 references below it.

## Technical Details

| Line | Current | Fix |
|------|---------|-----|
| 479 | `const replyLower = cleanReply.toLowerCase();` | `const cleanReplyLower = cleanReply.toLowerCase();` |
| 480-486 | References to `replyLower.includes(...)` | Change to `cleanReplyLower.includes(...)` |
| 512-513 | References to `replyLower.includes(...)` | Change to `cleanReplyLower.includes(...)` |

## Impact

This is a **critical fix** -- AYN is currently completely offline on Telegram because the function can't even boot. The fix is a simple rename with no behavior change.
