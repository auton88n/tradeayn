

# Auto-Maintenance Mode on Credit Failure + AYN Activity Log Panel

## Overview

Two features: (1) When the Lovable AI Gateway returns a 402 (no credits) or all models fail, automatically enable maintenance mode so users see a clean "maintenance" screen instead of errors, and immediately alert you on Telegram. (2) Add an "AYN Logs" panel in the admin dashboard showing everything AYN has done.

---

## Part 1: Auto-Maintenance Mode on Gateway Failure

### How it works

When `ayn-unified` (the main AI chat function) detects a **402 Payment Required** from the Lovable Gateway, or when **all fallback models fail**, it will:

1. Flip `maintenance_mode` to `true` in `system_config` table (the existing maintenance system)
2. Set a custom message: "We're performing a quick system update. Back shortly!"
3. Send you a Telegram alert immediately: "CRITICAL: AI credits exhausted. Maintenance mode activated automatically."
4. Log the action to `ayn_activity_log`

Users will see the existing maintenance screen (already built) -- they'll never know it's a credit issue.

### Files to change

**`supabase/functions/ayn-unified/index.ts`** -- In the `callWithFallback` function (line ~282), when all models fail:
- Check if the last error was a 402
- If yes, call a new `activateMaintenanceMode()` helper
- This helper updates `system_config` and sends a Telegram alert

**`supabase/functions/_shared/maintenanceGuard.ts`** (new file) -- Shared helper:
- `activateMaintenanceMode(supabase, reason)` -- sets maintenance_mode=true in system_config, sends Telegram alert, logs to ayn_activity_log
- Reusable by any edge function that hits a critical failure

### What users see

The exact same maintenance screen that already exists in `Dashboard.tsx` (lines 151-191) -- a clean orange "System Maintenance" page. No error messages, no "credits" mentioned.

---

## Part 2: AYN Activity Log Panel in Admin

### New admin tab: "AYN Logs"

A new section in the admin sidebar showing a timeline of everything AYN has done, pulled from the `ayn_activity_log` table.

### What it shows

- Timeline view with action type, summary, timestamp
- For replies: the actual text AYN sent
- For emails: recipient + subject + body preview
- For deletions: what was deleted
- Color-coded by action type (reply = blue, email = green, delete = red, alert = orange)
- Filter by action type and date range
- Auto-refreshes with real-time subscription

### Files to create/change

1. **`src/components/admin/AYNActivityLog.tsx`** (new) -- The log viewer component:
   - Fetches from `ayn_activity_log` ordered by `created_at DESC`
   - Shows each entry as a card with icon, action type badge, summary, and expandable details
   - Filters: All / Replies / Emails / Deletions / Alerts / Commands
   - Real-time updates via Supabase subscription

2. **`src/components/admin/AdminSidebar.tsx`** -- Add new tab:
   - Add `'ayn-logs'` to `AdminTabId` type
   - Add entry in `aiSections` array with Bot/Activity icon

3. **`src/components/AdminPanel.tsx`** -- Render the new tab:
   - Import `AYNActivityLog`
   - Add `{activeTab === 'ayn-logs' && <AYNActivityLog />}` in the render section

---

## Part 3: Also Protect Other AI Functions

Apply the same maintenance-mode trigger to all 10 migrated functions. When any function gets a 402 from the gateway:
- Activate maintenance mode
- Alert via Telegram
- Return a generic "service temporarily unavailable" to the user

This ensures no function leaks "credit exhausted" errors to users.

---

## Technical Summary

| Change | File | What |
|--------|------|------|
| Auto-maintenance helper | `_shared/maintenanceGuard.ts` (new) | Shared function to flip maintenance mode + Telegram alert |
| Credit failure detection | `ayn-unified/index.ts` | Detect 402 in callWithFallback, trigger maintenance |
| Protect all functions | 10 edge functions | Add 402 -> maintenance mode trigger |
| AYN Logs component | `admin/AYNActivityLog.tsx` (new) | Timeline viewer for ayn_activity_log |
| Admin sidebar | `AdminSidebar.tsx` | Add "AYN Logs" tab |
| Admin panel | `AdminPanel.tsx` | Render AYN Logs tab |

