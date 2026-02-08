
# Fix Cosmetic Settings Toggles

## Overview

Remove UI toggles that save to the database but are never read by any system. Keep the DB columns intact for future use. Add "Coming soon" labels to email toggles since an email system may be built later.

## Changes

### 1. NotificationSettings.tsx -- Add "Coming soon" to email toggles

For all three email toggles (System Alerts, Usage Warnings, Marketing), disable them and add a subtle "Coming soon" badge next to each label. This is honest UI -- users see the toggles exist but know they aren't wired yet.

- Set `disabled={true}` on all three email `Switch` components
- Add a small `(Coming soon)` text span next to each Label

### 2. PrivacySettings.tsx -- Remove "Store Chat History" toggle

Remove the entire "Data & Personalization" card (lines 143-161) containing the `store_chat_history` toggle. No code in `useMessages.ts` or any edge function checks this value, so the toggle is misleading.

The "Allow Personalization" toggle was already removed from the UI previously (confirmed -- not present in `PrivacySettings.tsx`). No action needed there.

### 3. useUserSettings.ts -- Keep fields in interface

Keep `store_chat_history`, `allow_personalization`, `email_*` fields in the `UserSettings` interface and fetch logic. The DB columns remain for future use. Only the UI toggles are removed/disabled.

## What does NOT change

- No DB schema changes (columns stay for future use)
- `in_app_sounds` toggle stays (it works -- wired to `soundStore`)
- `desktop_notifications` toggle stays (it works -- wired to browser Notification API)
- Export Data, Delete Chat History, Delete Account buttons stay (they work)
- Memory Management section stays
- No edge function changes

## Technical Details

### NotificationSettings.tsx

Replace each email toggle's `Switch` with disabled state and add "Coming soon" text:

```tsx
<div className="flex items-center justify-between opacity-60">
  <div className="space-y-0.5">
    <Label>{t('settings.systemAlerts')} <span className="text-xs text-muted-foreground ml-1">(Coming soon)</span></Label>
    <p className="text-sm text-muted-foreground">
      {t('settings.systemAlertsDesc')}
    </p>
  </div>
  <Switch checked={false} disabled={true} />
</div>
```

Same pattern for Usage Warnings and Marketing toggles. Remove the `settings.email_*` bindings from `onCheckedChange` since the toggles are now static/disabled.

### PrivacySettings.tsx

Remove lines 143-161 (the "Data & Personalization" card with the `store_chat_history` toggle).
