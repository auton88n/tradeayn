

# Fix: Add Delay Between Email Sends to Avoid Rate Limits

## The Problem

Your SMTP provider (Resend) has a rate limit of **2 emails per second**. When AYN sends emails to multiple leads at once, the 3rd email fires too fast and gets rejected with a 429 error. You saw this with "The Crack Doctor" failing.

## The Fix

Two changes in one file:

### 1. Add a 1-second delay between email-related actions

In the action execution loop (line 348-356 of `ayn-telegram-webhook/index.ts`), add a `sleep(1000)` delay after any `send_outreach`, `send_email`, or `follow_up` action completes. This spaces out email sends so they never exceed the 2/second limit.

### 2. Add retry logic in `ayn-sales-outreach` for 429 errors

In `handleSendEmail` (line 332-356 of `ayn-sales-outreach/index.ts`), if the SMTP send fails, check if it's a rate limit error. If so, wait 1.5 seconds and retry once before giving up.

## Technical Details

### File 1: `supabase/functions/ayn-telegram-webhook/index.ts`

In the action execution `while` loop (around line 348), after `executeAction` returns, check if the action was an email-sending type. If so, add a 1-second delay:

```text
while ((actionMatch = actionRegex.exec(reply)) !== null) {
  const [, actionType, actionParams] = actionMatch;
  // ... existing tracking code ...
  const result = await executeAction(actionType, actionParams || '', supabase, supabaseUrl, supabaseKey);
  if (result) executedActions.push(result);
  
  // Delay between email-sending actions to avoid SMTP rate limits (2/sec on Resend)
  if (['send_outreach', 'send_email', 'follow_up'].includes(actionType)) {
    await new Promise(r => setTimeout(r, 1500));
  }
}
```

### File 2: `supabase/functions/ayn-sales-outreach/index.ts`

In the `handleSendEmail` function, wrap the SMTP send in a retry:

- If `client.send()` throws and the error message contains "rate_limit" or "429" or "Too many requests", wait 2 seconds and retry once
- If the retry also fails, proceed with the existing failure handling

## Files Changed
- `supabase/functions/ayn-telegram-webhook/index.ts` -- Add delay between email actions in the action loop
- `supabase/functions/ayn-sales-outreach/index.ts` -- Add retry-on-429 for SMTP sends
