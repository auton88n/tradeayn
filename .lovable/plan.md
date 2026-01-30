
# Plan: Fix Beta Feedback Modal - Instant Credits & One-Time Display

## Problems Identified

1. **Credits don't update immediately** - After submitting feedback, the 5 bonus credits don't show up right away in the UI
2. **Modal should disappear after submission** - Once a user submits feedback, the modal should auto-close and never appear again (unless admin reactivates it)

---

## Solution Overview

### Part 1: Instant Credit Update

The `useUsageTracking` hook already has a real-time subscription that listens for changes to `user_ai_limits`. However, the credits may not update instantly due to timing. We'll add an explicit `refreshUsage()` callback to the BetaFeedbackModal.

### Part 2: Auto-Close & One-Time Display

After showing the success message briefly (2-3 seconds), automatically close the modal. The existing logic already hides the "Earn Credits" button after feedback is submitted by checking the database.

---

## Technical Changes

### File 1: `src/components/dashboard/BetaFeedbackModal.tsx`

**Change 1: Add `onCreditsUpdated` callback prop**

Add a new prop to trigger immediate credit refresh after successful submission:

```tsx
interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  rewardAmount: number;
  onSuccess?: () => void;
  onCreditsUpdated?: () => void;  // NEW: Trigger immediate UI refresh
}
```

**Change 2: Call `onCreditsUpdated` after successful submission**

In the `handleSubmit` function, after the credits are added:

```tsx
if (creditsError) throw creditsError;

// Trigger immediate credit refresh
onCreditsUpdated?.();

setStep('success');
onSuccess?.();
```

**Change 3: Auto-close after success animation**

Add a `useEffect` that automatically closes the modal 3 seconds after reaching the success step:

```tsx
// Auto-close modal after success (3 seconds)
useEffect(() => {
  if (step === 'success') {
    const timer = setTimeout(() => {
      handleClose();
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [step]);
```

---

### File 2: `src/components/dashboard/CenterStageLayout.tsx`

**Pass the `refreshUsage` callback to the modal**

The parent component needs to pass down a function to refresh credits. Since `useUsageTracking` is used in `DashboardContainer`, we need to pass `refreshUsage` through props.

Add to `CenterStageLayoutProps`:

```tsx
onCreditsUpdated?: () => void;
```

Then pass to `BetaFeedbackModal`:

```tsx
<BetaFeedbackModal
  isOpen={showFeedbackModal}
  onClose={() => setShowFeedbackModal(false)}
  userId={userId}
  rewardAmount={betaFeedbackReward || 5}
  onCreditsUpdated={onCreditsUpdated}
/>
```

---

### File 3: `src/components/dashboard/DashboardContainer.tsx`

**Pass `refreshUsage` from useUsageTracking to CenterStageLayout**

```tsx
<CenterStageLayout
  ...
  onCreditsUpdated={usageTracking.refreshUsage}
/>
```

---

## Flow After Changes

```text
User submits feedback
       ↓
Credits added to database (via add_bonus_credits RPC)
       ↓
onCreditsUpdated() called → refreshUsage() fetches new credit count
       ↓
UI updates immediately with new credit balance
       ↓
Success animation shows for 3 seconds
       ↓
Modal auto-closes
       ↓
"Earn Credits" button hidden (already checks beta_feedback table)
```

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/BetaFeedbackModal.tsx` | Add `onCreditsUpdated` prop, call after success, auto-close after 3s |
| `src/components/dashboard/CenterStageLayout.tsx` | Add `onCreditsUpdated` prop, pass to BetaFeedbackModal |
| `src/components/dashboard/DashboardContainer.tsx` | Pass `usageTracking.refreshUsage` as `onCreditsUpdated` |

---

## Result

- Credits update instantly after feedback submission
- Modal auto-closes 3 seconds after success
- "Earn Credits" button disappears permanently (already working)
- Admin can still view all feedback in the admin panel
- Admin can toggle beta mode on/off to control feedback collection visibility
