

# Consolidate User & Subscription Controls

## Problem Summary

You have duplicate controls in two places:
- **Subscriptions tab**: Sets tiers and credit limits
- **Users tab**: Also has "Edit Limit" modal that does the same thing

## Solution

Separate responsibilities cleanly:

| Tab | Purpose | Controls |
|-----|---------|----------|
| **Subscriptions** | All billing/credits | Tier selection, custom credit overrides, usage tracking |
| **Users** | User states only | Role changes (admin/duty/user), activate/deactivate, block/unblock |

## Changes

### 1. Users Tab - Remove Credit/Limit Controls

**File: `UserManagement.tsx`**

Remove:
- `EditLimitModal` import and usage
- `handleUpdateLimit` function
- `handleBulkUpdateLimit` function
- "Edit Limit" menu items
- "Edit Limits" bulk action
- Usage progress bars (these belong in Subscriptions)

Keep:
- Role management (admin/duty/user dropdown)
- Activate/Deactivate controls
- Status filtering (active/pending/revoked)
- User search and export

### 2. Subscriptions Tab - Add Custom Override

The Subscriptions tab already handles tiers. I'll enhance it with:
- Custom credit override option (the toggle from EditLimitModal)
- Show current usage alongside tier
- Bulk tier updates for selected users

**File: `SubscriptionManagement.tsx`**

Add to the edit dialog:
- "Custom Credit Override" toggle
- Number input for custom limit when enabled
- Show effective credits summary

### 3. Clean Up Unused Code

Remove from `UserManagement.tsx`:
- `EditLimitModal` component usage
- Bulk edit state (`bulkEditUsers`)
- All limit-related update logic

---

## Technical Details

### UserManagement.tsx - Simplified

```text
Removed:
- import { EditLimitModal, UpdatePayload } from './EditLimitModal'
- handleUpdateLimit() function
- handleBulkUpdateLimit() function
- editingUser state (for limits)
- bulkEditUsers state
- Usage progress bar in user cards
- "Edit Limit" dropdown menu item
- "Edit Limits" bulk action

Kept:
- handleRoleChange() - role management
- handleActivate/handleDeactivate - user states
- handleBulkAction('activate'/'deactivate'/'delete')
- Role badges and role filter
```

### SubscriptionManagement.tsx - Enhanced

```text
Added:
- useCustomOverride state toggle
- customLimit number input
- Enhanced dialog with:
  ┌────────────────────────────────────┐
  │ Edit User Subscription             │
  ├────────────────────────────────────┤
  │ User: Company XYZ                  │
  │ Current Tier: Starter              │
  │                                    │
  │ New Tier: [Pro ▼]                  │
  │                                    │
  │ ☐ Custom Credit Override           │
  │   [_________] credits/month        │
  │                                    │
  │ Effective: 500 credits/month       │
  └────────────────────────────────────┘
```

The save logic will update:
1. `user_subscriptions.subscription_tier`
2. `user_ai_limits.monthly_messages` (with custom value if enabled)
3. `access_grants.monthly_limit` (for compatibility)

---

## Result

After implementation:
- **Users tab**: Focused on roles and account status only
- **Subscriptions tab**: Single source of truth for all billing/credits
- No duplicate functionality between tabs

