

# Fix AYN's Memory (For Real This Time) + Email Signature

## The ACTUAL Root Cause

The `ayn_mind` table has a database CHECK constraint that only allows these types:
`thought`, `observation`, `idea`, `task`, `mood`, `trend`

Every Telegram message uses `telegram_admin` or `telegram_ayn` as the type -- which the database **rejects**. Same for sales entries (`sales_lead`, `sales_draft`). That's why AYN has had zero conversation history this entire time. The code was correct, the database was blocking it.

## Fix 1: Update the CHECK Constraint (Database Migration)

Drop the old constraint and add a new one that includes all the types AYN uses:

```sql
ALTER TABLE ayn_mind DROP CONSTRAINT ayn_mind_type_check;
ALTER TABLE ayn_mind ADD CONSTRAINT ayn_mind_type_check 
  CHECK (type = ANY (ARRAY[
    'thought', 'observation', 'idea', 'task', 'mood', 'trend',
    'telegram_admin', 'telegram_ayn',
    'sales_lead', 'sales_draft',
    'vision_analysis', 'proactive_research'
  ]));
```

This is the only change needed to fix memory. Once this constraint is updated, all the error-checked insert code we already added will start working immediately.

## Fix 2: Email Signature — Strengthen the Prompt

In `supabase/functions/ayn-sales-outreach/index.ts`, the email drafting prompt already says to use a personal name, but the AI ignores it. We'll make it more forceful:

- Add an explicit "NEVER sign as AYN, AYN Team, Best AYN, or any variation" rule
- Add example signatures the AI must choose from
- Add a post-generation check: if the draft contains "AYN Team" in the signature, auto-replace it with a random personal name + role

### Technical Details

In the `handleDraftEmail` function's system prompt (around line 170 of `ayn-sales-outreach/index.ts`), strengthen the signature instruction and add a fallback regex replacement after parsing the AI response:

```typescript
// After parsing the draft, fix signature if needed
const teamSignatureRegex = /(?:Best|Regards|Cheers|Thanks),?\s*\n?\s*AYN\s*(?:\n?\s*AYN Team)?/gi;
if (teamSignatureRegex.test(draft.html_body || '') || /AYN Team/i.test(draft.html_body || '')) {
  const names = ['Sarah', 'Mark', 'Lina', 'James', 'Noor'];
  const roles = ['Sales @ AYN', 'Growth Lead @ AYN', 'Partnerships @ AYN'];
  const name = names[Math.floor(Math.random() * names.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];
  draft.html_body = draft.html_body.replace(teamSignatureRegex, `${name}\n${role}`);
  if (draft.plain_text) draft.plain_text = draft.plain_text.replace(teamSignatureRegex, `${name}\n${role}`);
}
```

## Summary

| Problem | Root Cause | Fix |
|---------|-----------|-----|
| AYN forgets everything | Database CHECK constraint rejects `telegram_admin`/`telegram_ayn` types | Add those types to the constraint |
| "Best, AYN AYN Team" signature | AI ignores prompt instructions | Stronger prompt + code-level fallback replacement |

## Files Changed
- **Database migration**: Update `ayn_mind_type_check` constraint
- **`supabase/functions/ayn-sales-outreach/index.ts`**: Signature fix in `handleDraftEmail`

