

# Admin User Upgrade Feature - Allow Manual Tier Assignment

## Overview

You want admins to be able to upgrade users manually (in addition to Stripe). Currently, the SubscriptionManagement component only shows **1 user** (who has a Stripe subscription record), but there are **14 users** in the system.

## Current State

| Data | Count |
|------|-------|
| Total profiles (users) | 14 |
| Users with subscription records | 1 |
| Users missing from admin UI | 13 |

**The Problem:** The current UI only shows users who already have a `user_subscriptions` record (created when they interact with Stripe). Most users have no record, so admins cannot upgrade them.

## Solution

Modify `SubscriptionManagement.tsx` to:

1. **Show ALL users** from profiles table (not just those with subscription records)
2. **Allow creating new subscription records** for users who don't have one
3. **Keep existing edit functionality** for users who already have records

## Visual Design

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN PANEL → Subscriptions Tab                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User Subscriptions                                    [Refresh]        │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 👤 Sara (SGA)          │ Free    │ Inactive │ [Edit ✏️]         │   │
│  │ 👤 Hameed AlHaj        │ —       │ —        │ [Set Tier ➕]     │   │
│  │ 👤 Mouad               │ —       │ —        │ [Set Tier ➕]     │   │
│  │ 👤 Ali (crypters)      │ —       │ —        │ [Set Tier ➕]     │   │
│  │ ...10 more users...                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Legend:                                                                │
│  • "Edit" = User has existing subscription record                       │
│  • "Set Tier" = User has no record (will be created)                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### File: `src/components/admin/SubscriptionManagement.tsx`

**Change 1: Update Interface**

Add a new interface to represent merged user data:

```typescript
interface MergedUserData {
  user_id: string;
  company_name: string | null;
  contact_person: string | null;
  subscription: UserSubscription | null;
  hasSubscriptionRecord: boolean;
}
```

**Change 2: Modify Data Fetching**

Update `fetchSubscriptions` to fetch ALL profiles and merge with existing subscriptions:

- Fetch all 14 users from `profiles` table
- Fetch existing subscription records (1 record)
- Merge into a single list showing all users
- Users without subscription records show "No Record" badge

**Change 3: Update UI Rendering**

- Show "No Record" badge for users without subscription entries
- Show "Set Tier" button (with Plus icon) for new users
- Show "Edit" button (with Edit icon) for existing users

**Change 4: Handle INSERT for New Records**

Update `handleOverrideTier` to:

- **INSERT** new subscription record if user has no record
- **UPDATE** existing record if user already has one
- **UPSERT** into `user_ai_limits` to set credit limits

```typescript
// For new users (no subscription record):
await supabase.from('user_subscriptions').insert({
  user_id: selectedUser.user_id,
  subscription_tier: newTier,
  status: newTier === 'free' ? 'inactive' : 'active',
  stripe_customer_id: null,  // Admin override - no Stripe
  stripe_subscription_id: null
});

// For existing users:
await supabase.from('user_subscriptions')
  .update({ subscription_tier: newTier, status: ... })
  .eq('id', existingRecord.id);

// Update credit limits for both cases:
await supabase.from('user_ai_limits').upsert({
  user_id: selectedUser.user_id,
  monthly_messages: tierData.limits.monthlyCredits,
  monthly_engineering: tierData.limits.monthlyEngineering
}, { onConflict: 'user_id' });
```

**Change 5: Update Dialog Text**

- "Set Subscription Tier" for new records
- "Override Subscription Tier" for existing records
- Add note explaining admin override

## Credit Limits by Tier

| Tier | Monthly Credits | Monthly Engineering |
|------|----------------|---------------------|
| Free | 5 (daily) | 1 |
| Starter | 500 | 10 |
| Pro | 1,000 | 50 |
| Business | 3,000 | 100 |

## Technical Flow

```text
Admin clicks "Set Tier" on user with no record
                │
                ▼
┌─────────────────────────────────────┐
│  Dialog: "Set Subscription Tier"   │
│  User: Hameed AlHaj                │
│  Select Tier: [Pro ▼]              │
│  [Cancel]           [Save]         │
└─────────────────────────────────────┘
                │
                ▼ (Admin clicks Save)
                │
┌─────────────────────────────────────────────────────────┐
│  1. INSERT into user_subscriptions:                     │
│     - user_id: <hameed_uuid>                            │
│     - subscription_tier: 'pro'                          │
│     - status: 'active'                                  │
│     - stripe_customer_id: null (admin override)         │
│                                                         │
│  2. UPSERT into user_ai_limits:                         │
│     - user_id: <hameed_uuid>                            │
│     - monthly_messages: 1000                            │
│     - monthly_engineering: 50                           │
│                                                         │
│  3. Show success toast                                  │
│  4. Refresh user list                                   │
└─────────────────────────────────────────────────────────┘
```

## Summary

| Change | Description |
|--------|-------------|
| Fetch all profiles | Show all 14 users instead of just 1 |
| Merge with subscriptions | LEFT JOIN logic in frontend |
| Add "Set Tier" button | For users without subscription records |
| Handle INSERT | Create new subscription records |
| Update user_ai_limits | Set correct credit limits for tier |
| Update dialog | Different text for new vs existing records |

This gives admins full control to manually upgrade any user, while the Stripe integration continues to work for users who subscribe themselves.

