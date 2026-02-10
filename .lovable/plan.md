

# Refine AYN's Deletion Permissions on Telegram

## Understanding

AYN should have these permission levels:

| Data Category | Read | Delete |
|---|---|---|
| **Applications** (service_applications) | Yes | Yes |
| **Tickets** (support_tickets, ticket_messages) | Yes | Yes |
| **Contact messages** (contact_messages) | Yes | Yes |
| **User conversations** (messages table) | Yes | **NO** |
| **AYN dashboard data** (ayn_activity_log, security_logs, error_logs) | Yes | **NO** |
| **Engineering tool usage** | Yes | **NO** |

AYN keeps full read access everywhere to monitor, improve, and fix issues -- but cannot delete user conversations or any sensitive/analytical data.

## Changes

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

**System prompt updates:**
- Remove `[ACTION:delete_message:message_id]` from the actions list (line 96)
- Remove `[ACTION:delete_all_messages:confirm]` from the actions list (line 102)
- Update BLOCKED ACTIONS section (line 110-113) to add:
  - No deleting user messages/conversations
  - No deleting AYN logs, security logs, or error logs
  - No deleting engineering calculation data

**Action handler updates:**
- Replace `case 'delete_message'` (line 556-558) with a rejection: "User messages are protected and cannot be deleted. You can read them to monitor and improve AYN."
- Replace `case 'delete_all_messages'` (line 620-628) with same rejection message

All other delete actions (delete_app, delete_contact, delete_ticket, delete_all_apps, delete_all_tickets, delete_all_contacts) remain fully functional.

### File: `supabase/functions/ayn-telegram-webhook/commands.ts`

- Remove `/delete_message [id]` from the help text (line 62)
- Replace the `/delete_message` handler (lines 490-501) with a rejection message: "User messages are protected and cannot be deleted via Telegram. Use /messages to read them instead."

### Summary

| Action | Before | After |
|---|---|---|
| `/delete_ticket`, `/delete_app`, `/delete_contact` | Works | **No change** |
| `delete_all_apps`, `delete_all_tickets`, `delete_all_contacts` | Works | **No change** |
| `/delete_message [id]` | Deletes user message | **Blocked** with explanation |
| `delete_message` action | Deletes user message | **Blocked** with explanation |
| `delete_all_messages` action | Deletes all user messages | **Blocked** with explanation |
| `/messages`, `read_messages` | Read-only | **No change** |
| `read_feedback`, `check_security`, `get_errors` | Read-only | **No change** |

