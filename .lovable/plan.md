

# Fix Duplicate "Forgot Password" and Text Visibility

## The Problem

Based on the screenshot and code analysis, there are two issues:

1. **Duplicate "Forgot Password" elements** - The Sign In form has:
   - A small text link next to "Password" label (line 444-451)
   - A prominent button with key icon at the bottom (line 475-484)
   
2. **Text visibility concern** - The small link uses `text-white/70` which may appear dark/invisible in certain conditions

## Solution

**Remove the prominent bottom button and keep only the inline link** - This is the standard UX pattern used by most authentication forms (Google, Apple, etc.). The link next to the password field is the expected location.

**Ensure the inline link is always visible** - Update the styling to use explicit white text with proper contrast.

---

## Technical Changes

### File: `src/components/auth/AuthModal.tsx`

**Change 1: Remove the duplicate "Forgot Password" button (lines 474-484)**

Delete this entire block:
```tsx
{/* Prominent Forgot Password Button */}
<Button
  type="button"
  variant="outline"
  onClick={handleForgotPassword}
  disabled={isResettingPassword || !email}
  className="w-full gap-2 border-white/20 text-white hover:bg-white hover:text-neutral-950 disabled:opacity-50"
>
  <KeyRound className="w-4 h-4" />
  {t('auth.forgotPasswordButton')}
</Button>
```

**Change 2: Improve visibility of the inline "Forgot password?" link (lines 444-451)**

Update the button styling to ensure consistent visibility:
```tsx
<button
  type="button"
  onClick={handleForgotPassword}
  disabled={isResettingPassword}
  className="text-sm text-white hover:text-primary transition-colors disabled:opacity-50"
>
  {isResettingPassword ? t('auth.forgotPasswordSending') : t('auth.forgotPassword')}
</button>
```

Key change: `text-white/70` → `text-white` for guaranteed visibility on the dark modal

---

## Visual Result

Before:
```
Password                    Forgot password?  ← link (hard to see)
[••••••••                              ]

        [ Sign In ]

    🔑 Forgot Password?   ← duplicate button
```

After:
```
Password                    Forgot password?  ← clear white link
[••••••••                              ]

        [ Sign In ]
```

---

## Why This Approach

1. **Industry standard** - Single "Forgot password?" link next to password field is the expected UX pattern
2. **Less visual clutter** - Removes redundant button, cleaner form
3. **Better accessibility** - Link is now explicitly white, guaranteed visible on dark background
4. **No functionality loss** - Same action, just one trigger point instead of two

