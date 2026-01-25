
# Password Reset Flow Fix Plan

## Problem Analysis

From the auth logs and code review, I've identified the following issues:

### Issue 1: Race Condition with Global Auth Listener
When a user clicks the password reset link from their email:
1. The link redirects to `/reset-password` with recovery tokens
2. Supabase validates the token and fires a global `SIGNED_IN` event
3. The **Index page** (`/`) has its own `onAuthStateChange` listener that catches this event
4. If the Index page processes this event before the ResetPassword page does, the user gets shown the Dashboard (with the AYN eye and chat input) instead of the password reset form

### Issue 2: Link Already Used
The auth logs show:
```
"error":"One-time token not found"
"msg":"403: Email link is invalid or has expired"
```
This indicates the recovery link was clicked twice or the token was already consumed. After the first successful validation, subsequent clicks show the expired link error.

## Proposed Solution

### Step 1: Protect the `/reset-password` Route from Auth Listener Interference
Modify the `Index.tsx` to detect when a password recovery flow is in progress and NOT intercept the auth state, allowing the ResetPassword page to handle it.

**Logic:**
- Check if the current URL path is `/reset-password` 
- If yes, don't redirect to Dashboard even if a session exists
- Let the ResetPassword page handle the `PASSWORD_RECOVERY` event

### Step 2: Improve ResetPassword Page Session Detection
The ResetPassword page should:
1. Use a flag/localStorage to indicate it's handling a recovery flow
2. Prioritize the `PASSWORD_RECOVERY` event over `SIGNED_IN`
3. Clear URL tokens immediately after extracting them (already done)
4. Show the password form immediately when a valid session exists from recovery

### Step 3: Add Route-Level Protection
Create a check in the App.tsx or Index.tsx to detect when user arrives at `/reset-password` with recovery tokens and prevent automatic Dashboard redirect.

## Technical Implementation

### File: `src/pages/Index.tsx`
```tsx
useEffect(() => {
  // Skip Dashboard redirect if on password reset flow
  const isRecoveryFlow = window.location.pathname === '/reset-password' ||
                         window.location.hash.includes('type=recovery');
  
  if (isRecoveryFlow) {
    console.log('[Index] Recovery flow detected, skipping auth intercept');
    return; // Don't set up listener - let ResetPassword handle it
  }
  
  // ... existing auth listener code
}, []);
```

### File: `src/pages/ResetPassword.tsx`
1. Ensure the page checks for session first before showing expired state
2. Add a "recovering" flag to localStorage to prevent other pages from redirecting
3. Clear the flag after successful password update

### Flow Diagram

```text
User clicks email link
        |
        v
/reset-password?token=xxx#access_token=yyy&type=recovery
        |
        v
ResetPassword.tsx loads
        |
        +---> Parses tokens from URL
        |
        +---> Sets session via Supabase
        |
        v
Shows password reset form (NOT Dashboard)
        |
        v
User enters new password
        |
        v
Password updated -> Redirect to /
```

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Add recovery flow detection to skip Dashboard redirect |
| `src/pages/ResetPassword.tsx` | Improve session detection priority and add recovery flag |

## Testing Checklist

1. Request password reset from AuthModal
2. Click email link -> Should show password reset form (NOT Dashboard with eye)
3. Enter new password -> Should succeed and redirect to home
4. Clicking expired link -> Should show "Link Expired" message
5. Normal login flow should still work correctly

## Edge Cases Handled

- User already logged in when clicking reset link -> Still shows password reset form
- Token already used -> Shows expired message with option to request new link  
- Slow network -> Shows "Validating" spinner with reload option after 8 seconds
- User clicks link twice rapidly -> Second click shows expired (expected behavior)
