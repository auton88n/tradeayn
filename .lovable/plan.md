

# Supercharge AYN: Full Platform Access + Activity Log + New Commands

## Overview

Connect AYN to every major system in the platform so he can actively manage things on your behalf via Telegram, and create a visible activity log so you can see everything he does.

---

## Part 1: Create `ayn_activity_log` Table

A new database table to track every action AYN takes -- auto-replies, emails sent, commands executed, etc.

**Columns:**
- `id` (uuid, primary key)
- `action_type` (text) -- e.g. "ticket_reply", "email_sent", "user_unblocked", "application_replied", "message_deleted"
- `target_id` (text, nullable) -- the ID of the thing acted on (ticket_id, email_id, etc.)
- `target_type` (text, nullable) -- "ticket", "application", "contact_message", "email"
- `summary` (text) -- human-readable summary: "Replied to ticket #abc123: Your issue has been..."
- `details` (jsonb) -- full context (the actual reply text, recipient, etc.)
- `triggered_by` (text) -- "telegram_command", "proactive_loop", "auto_reply", "admin_chat"
- `created_at` (timestamptz, default now())

---

## Part 2: Expand AYN's Telegram Commands

Add these new commands to `ayn-telegram-webhook/index.ts`:

| Command | What it does |
|---------|-------------|
| `/applications` | List recent service applications with status |
| `/reply_app [id] [message]` | Reply to a service application via email |
| `/contacts` | List recent contact messages |
| `/reply_contact [id] [message]` | Reply to a contact message via email |
| `/delete_ticket [id]` | Delete a support ticket |
| `/delete_message [id]` | Delete a chat message |
| `/delete_app [id]` | Delete a service application |
| `/email [to] [subject] \| [body]` | Send a custom email via Resend |
| `/logs` | Show AYN's recent activity log |
| `/users` | List recent users with activity |
| `/errors` | (already exists, keep as-is) |
| `/clear_errors [hours]` | Clear old error logs |

---

## Part 3: Give AYN Access to Applications & Contact Messages

In `ayn-telegram-webhook/index.ts`, add new functions:

1. **`handleApplications()`** -- query `service_applications` table, return recent applications with status
2. **`handleReplyApplication(id, message)`** -- insert into `application_replies`, call `send-reply-email` edge function to email the applicant, log to `ayn_activity_log`
3. **`handleContacts()`** -- query `contact_messages`, return recent ones
4. **`handleReplyContact(id, message)`** -- update contact message status, send email via Resend, log to `ayn_activity_log`

---

## Part 4: Give AYN Email Sending Capability

Add a `/email` command that lets you tell AYN to send an email directly:

```
/email recipient@email.com Subject Here | Body text here
```

AYN will use the existing `send-email` edge function (Resend) to send it, and log it to `ayn_activity_log`.

---

## Part 5: Give AYN Delete Capabilities

Add delete commands:

- `/delete_ticket [id]` -- deletes from `support_tickets` (cascades replies)
- `/delete_message [id]` -- deletes from `messages` table
- `/delete_app [id]` -- deletes from `service_applications`
- `/delete_contact [id]` -- deletes from `contact_messages`

All deletions are logged to `ayn_activity_log` with the content that was deleted (for audit trail).

---

## Part 6: Log Everything AYN Does

Every action AYN takes gets logged to `ayn_activity_log`:

- Auto-replies to tickets (from `ayn-auto-reply`)
- Telegram command executions
- Emails sent
- Deletions
- User unblocks
- Health scans triggered

The `/logs` command shows the last 10 actions with timestamps and summaries.

---

## Part 7: Expand AYN's AI Actions

Update the `AYN_PERSONALITY` prompt to include new available actions so the AI can proactively suggest/execute them during natural conversation:

```
- [ACTION:reply_application:id:message] -- Reply to application
- [ACTION:reply_contact:id:message] -- Reply to contact message
- [ACTION:send_email:to:subject:body] -- Send email
- [ACTION:delete_ticket:id] -- Delete ticket
- [ACTION:clear_errors:hours] -- Clear old errors
```

---

## Part 8: Feed System Errors to AYN Context

Update `gatherSystemContext()` in the webhook to also pull:
- Recent entries from `error_logs` (last 5 errors with messages)
- Recent `llm_failures` (last 3)
- Pending `service_applications` count
- Unread `contact_messages` count

This way when you ask "anything going on?", AYN knows about applications and contact messages too, not just tickets.

---

## Technical Summary

| Change | File | What |
|--------|------|------|
| New table | Migration | `ayn_activity_log` for audit trail |
| New commands | ayn-telegram-webhook | /applications, /reply_app, /contacts, /reply_contact, /delete_*, /email, /logs, /users, /clear_errors |
| Email access | ayn-telegram-webhook | Direct Resend integration for sending emails |
| Delete access | ayn-telegram-webhook | Delete tickets, messages, applications, contacts |
| Activity logging | ayn-telegram-webhook + ayn-auto-reply | Log every action to ayn_activity_log |
| Expanded context | ayn-telegram-webhook | Add errors, applications, contacts to system context |
| AI actions | ayn-telegram-webhook | New action types the AI can trigger during chat |
| Proactive loop | ayn-proactive-loop | Log actions to ayn_activity_log |

## Result

After these changes, AYN will:
- See and manage service applications, contact messages, tickets, and emails
- Reply to applications and contacts via email on your command
- Delete anything you tell him to
- Send custom emails
- Log every action he takes so you can review in `/logs`
- Have all this context during natural conversation so he can proactively mention new applications or contacts

