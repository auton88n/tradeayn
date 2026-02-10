

# Fix AYN's Action Execution — Make It Actually Do Things

## The Problem

AYN has two ways to execute commands:
1. **Slash commands** (`/delete_app`, `/delete_contact`, etc.) — these WORK
2. **AI actions** (natural language like "delete that application") — these are BROKEN

When you chat naturally with AYN, the AI generates action tags like `[ACTION:delete_app:id]`, but the `executeAction` function only handles a small subset of actions. Everything else silently fails (returns null, no error message).

This is why AYN "can't do anything" — the slash commands work but natural conversation actions don't.

## What Changes

### 1. Add missing actions to `executeAction` in `ayn-telegram-webhook/index.ts`

Wire up all the missing action types so AYN can execute them through natural conversation:

- `delete_app` — Delete a service application
- `delete_contact` — Delete a contact message
- `delete_message` — Delete a user message
- `approve_app` — Update application status to approved
- `reject_app` — Update application status to rejected

### 2. Add the missing actions to the system prompt's AVAILABLE AI ACTIONS list

AYN's personality prompt lists the actions it can use. Add the missing ones:

```
- [ACTION:delete_app:app_id] — Delete a service application
- [ACTION:delete_contact:contact_id] — Delete a contact message
- [ACTION:delete_message:message_id] — Delete a user message
- [ACTION:approve_app:app_id] — Approve service application
- [ACTION:reject_app:app_id] — Reject service application
```

### 3. Make failed actions visible (not silent)

Currently when an action falls to `default`, it returns `null` and nothing is reported. Change this to return an error message so AYN (and you) know something went wrong.

## Technical Details

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**`executeAction` function (lines 458-543)** — Add new cases:

```typescript
case 'delete_app': {
  return await cmdDelete(`/delete_app ${params}`, supabase);
}
case 'delete_contact': {
  return await cmdDelete(`/delete_contact ${params}`, supabase);
}
case 'delete_message': {
  return await cmdDelete(`/delete_message ${params}`, supabase);
}
case 'approve_app': {
  // Update application status to approved
  const { data } = await supabase.from('service_applications')
    .select('id, full_name').ilike('id', `${params}%`).limit(1);
  if (!data?.length) return `No application found`;
  await supabase.from('service_applications')
    .update({ status: 'approved' }).eq('id', data[0].id);
  await logAynActivity(supabase, 'application_approved', 
    `Approved application from ${data[0].full_name}`, {
    target_id: data[0].id, target_type: 'application',
    triggered_by: 'admin_chat',
  });
  return `Approved application from ${data[0].full_name}`;
}
case 'reject_app': {
  const { data } = await supabase.from('service_applications')
    .select('id, full_name').ilike('id', `${params}%`).limit(1);
  if (!data?.length) return `No application found`;
  await supabase.from('service_applications')
    .update({ status: 'rejected' }).eq('id', data[0].id);
  await logAynActivity(supabase, 'application_rejected',
    `Rejected application from ${data[0].full_name}`, {
    target_id: data[0].id, target_type: 'application',
    triggered_by: 'admin_chat',
  });
  return `Rejected application from ${data[0].full_name}`;
}
default:
  return `Unknown action: ${type}`;  // <-- was returning null silently
```

**System prompt AVAILABLE AI ACTIONS (line 75-90)** — Add the missing entries so AYN knows it can use them.

### File changed

| File | Changes |
|------|---------|
| `supabase/functions/ayn-telegram-webhook/index.ts` | Add 5 new action cases to `executeAction`, update system prompt with complete action list, make default case return error instead of null |

### No frontend or database changes needed

This is purely a backend fix — wiring up the actions that already exist as slash commands into the natural language action system.

