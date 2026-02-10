

# Remove Slash Commands — Make AYN Fully Conversational

## The Problem

Right now, when you type `/delete_app` or any slash command, it gets intercepted at line 148 and routed directly to a hardcoded function. The AI never sees it, never confirms, never responds naturally. AYN just spits out a formatted response like a bot, not like a team member.

You want to just TALK to AYN and have it do things. "Delete all applications" should work. "Show me the health" should work. No memorizing commands.

## What Changes

### 1. Remove the slash command interceptor

Delete the `handleCommand` function call from the main handler (lines 148-152). ALL messages will now go through the AI, including ones starting with `/`. AYN will understand what you want from context and execute via ACTION tags.

The `handleCommand` function and the command functions themselves stay in the code — they're still used by `executeAction` internally. We just stop intercepting messages before the AI sees them.

### 2. Add bulk operations to `executeAction`

Add these new action cases:
- `delete_all_apps` — Delete ALL service applications
- `delete_all_tickets` — Delete ALL support tickets
- `delete_all_contacts` — Delete ALL contact messages
- `delete_all_messages` — Delete ALL user messages

Each returns a count: "Deleted 5 applications"

### 3. Add data-fetching actions so AYN can look things up

Right now AYN has system context but can't fetch specific data on demand. Add:
- `list_apps` — Fetch and return all pending applications with IDs
- `list_tickets` — Fetch and return open tickets with IDs
- `list_contacts` — Fetch and return recent contacts
- `check_health` — Run health check
- `get_stats` — Get platform stats
- `get_errors` — Get recent errors

### 4. Rewrite the system prompt

Remove the "YOUR SLASH COMMANDS" section entirely. Replace with clear instructions:

- "The admin talks to you naturally. Understand their intent and execute actions."
- "When they say 'delete all applications' — do it. Use [ACTION:delete_all_apps:confirm]"
- "When they say 'show me applications' — fetch them. Use [ACTION:list_apps:all]"
- "When they say something unclear, ask ONE clarifying question, don't lecture them"
- "You work FOR the admin. Execute commands without questioning authority."
- "ALWAYS confirm what you did after executing: 'Done — deleted 3 applications'"

### 5. Add bulk delete support to `commands.ts`

Add a helper function `bulkDelete` that deletes all records from a given table and returns the count. Used by the new `delete_all_*` action cases.

## Technical Details

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**Main handler (lines 147-152)** — Remove the slash command interception:
```typescript
// REMOVE these lines:
// const commandResponse = await handleCommand(userText, supabase, supabaseUrl, supabaseKey);
// if (commandResponse) {
//   await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, commandResponse);
//   return new Response('OK', { status: 200 });
// }
```

**System prompt** — Replace the "YOUR SLASH COMMANDS" block (lines 66-73) with natural language instructions. Remove slash command references. Add bulk action tags to AVAILABLE AI ACTIONS.

**`executeAction` function** — Add new cases:
```typescript
case 'delete_all_apps': {
  const { count } = await supabase.from('service_applications')
    .select('*', { count: 'exact', head: true });
  await supabase.from('service_applications').delete().neq('id', '');
  return `Deleted ${count || 0} applications`;
}
case 'delete_all_tickets': { /* same pattern for support_tickets */ }
case 'delete_all_contacts': { /* same pattern for contact_messages */ }
case 'delete_all_messages': { /* same pattern for messages */ }
case 'list_apps': {
  return await cmdApplications(supabase);
}
case 'list_tickets': {
  return await cmdTickets(supabase);
}
case 'list_contacts': {
  return await cmdContacts(supabase);
}
case 'check_health': {
  return await cmdHealth(supabase);
}
case 'get_stats': {
  return await cmdStats(supabase);
}
case 'get_errors': {
  return await cmdErrors(supabase);
}
```

### Files Modified

| File | Changes |
|------|---------|
| `index.ts` | Remove slash command interceptor, rewrite system prompt (no slash refs, natural language focused, obedient personality), add 10+ new action cases to `executeAction` |

### What stays the same

- `commands.ts` — All command functions stay. They're reused by `executeAction` internally.
- `handleCommand` function — Stays in code but is no longer called. Can be removed later if wanted.
- All existing ACTION tags — Still work exactly the same.
- Security blocks — Still can't touch admin accounts, billing, or PII.

