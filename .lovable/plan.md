
# Add "Unlimited" Tier Option to Subscription Management

## Problem

The tier dropdown in the subscription management modal is missing the "Unlimited" option. Currently:
- `SUBSCRIPTION_TIERS` includes `enterprise` (with -1 values for custom pricing)
- The dropdown shows it incorrectly as "Enterprise - $-1/mo (-1 credits)"
- There's no visual styling (icon/color) for enterprise tier
- The "Unlimited" concept (infinite credits with no limits) is not clearly available

## Solution

Add proper support for both "Enterprise" and "Unlimited" tiers in the admin subscription modal.

---

## Changes

### 1. Add "unlimited" tier to SUBSCRIPTION_TIERS

**File: `src/contexts/SubscriptionContext.tsx`**

Add a new `unlimited` tier entry:

```text
unlimited: {
  name: 'Unlimited',
  price: 0,  // Admin-granted, no Stripe billing
  priceId: null,
  productId: null,
  limits: { monthlyCredits: -1, monthlyEngineering: -1 },
  features: ['Unlimited credits', 'Unlimited engineering calcs', 'Full access'],
}
```

### 2. Update tierConfig for UI styling

**File: `src/components/admin/SubscriptionManagement.tsx`**

Add entries for `enterprise` and `unlimited` tiers:

```text
enterprise: { icon: Building, color: 'text-rose-500', bg: 'bg-rose-500/10' },
unlimited: { icon: Infinity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
```

### 3. Fix the tier dropdown display

**File: `src/components/admin/SubscriptionManagement.tsx`**

Update the `SelectItem` rendering to handle special cases:

| Tier | Display Text |
|------|--------------|
| free | Free - $0/mo (5 credits/day) |
| starter | Starter - $9/mo (500 credits) |
| pro | Pro - $29/mo (1000 credits) |
| business | Business - $79/mo (3000 credits) |
| enterprise | Enterprise - Contact Sales |
| unlimited | Unlimited (Admin Override) |

### 4. Update effective credits display

Handle `-1` values to show "Unlimited" instead of "-1":

```text
Effective credits: Unlimited
```

### 5. Update metrics to include enterprise/unlimited counts

Add tracking for these tiers in the dashboard metrics.

---

## Technical Summary

| File | Changes |
|------|---------|
| `SubscriptionContext.tsx` | Add `unlimited` tier definition |
| `SubscriptionManagement.tsx` | Add tier styling, fix dropdown display, handle -1 as "Unlimited" |

## Result

After implementation:
- Admin can select "Unlimited" from the tier dropdown
- Enterprise tier displays correctly with "Contact Sales" 
- The effective credits summary shows "Unlimited" instead of "-1"
- Both tiers have proper icons and styling in the UI
