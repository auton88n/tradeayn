
# Fix Dark/Light Mode Text Visibility & Missing AI Employee Mockup

## Issues Identified

### Issue 1: Hard-to-see text in dark mode
From your screenshot, the "Terms & Conditions" checkbox text (`text-muted-foreground`) appears as dark gray on a dark background, making it nearly invisible.

**Affected areas:**
- Auth modal sign-up form (Terms checkbox label at line 535)
- PasswordStrengthIndicator requirements (uses `text-muted-foreground`)
- TermsModal checkbox labels (lines 239, 252, 265)

### Issue 2: Missing mockup on AI Employees service card
From your second screenshot, the AI Employees card shows only the title and description with a blank space where the mockup should appear. This is the card on the landing page (services section).

**Root cause:** The `AIEmployeeMockup` component uses `bg-card/80` for role cards, which may render transparent or invisible in light mode. The SVG orbit gradient and central brain also lack sufficient contrast in light mode.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/auth/AuthModal.tsx` | Fix terms checkbox label color for dark mode |
| `src/components/auth/PasswordStrengthIndicator.tsx` | Fix requirement text visibility in dark mode |
| `src/components/TermsModal.tsx` | Fix checkbox label colors |
| `src/components/services/AIEmployeeMockup.tsx` | Add proper background/border for visibility in both modes |
| `src/index.css` | Add auth-specific text color utilities |

---

## Technical Implementation Details

### Part 1: Fix Auth Modal Terms Checkbox (AuthModal.tsx)

**Current code (line 535):**
```tsx
className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
```

**Problem:** `text-muted-foreground` is too dark on the dark background of the auth modal.

**Fix:** Change to explicit white with opacity for the dark modal background:
```tsx
className="text-xs text-white/70 leading-relaxed cursor-pointer select-none"
```

And update the link colors (lines 543, 554) from `text-primary` to `text-cyan-400` for better visibility.

### Part 2: Fix PasswordStrengthIndicator (PasswordStrengthIndicator.tsx)

**Current code (lines 82-84):**
```tsx
className={`flex items-center gap-2 text-xs transition-colors ${
  req.met ? 'text-green-500' : 'text-muted-foreground'
}`}
```

**Problem:** Unmet requirements use `text-muted-foreground` which is invisible on dark background.

**Fix:** Change unmet requirement color to white with opacity:
```tsx
className={`flex items-center gap-2 text-xs transition-colors ${
  req.met ? 'text-green-500' : 'text-white/50'
}`}
```

Also fix the strength label (line 61) from `text-muted-foreground` to `text-white/50`.

### Part 3: Fix TermsModal Checkbox Labels (TermsModal.tsx)

**Current code (lines 239, 252, 265):**
```tsx
className="text-sm leading-5 text-white/70 cursor-pointer"
```

These are already using `text-white/70` which should be visible. However, the policy content uses `text-white/60` and `text-white/50` which could be improved.

No major changes needed here as they already use explicit white colors.

### Part 4: Fix AIEmployeeMockup (AIEmployeeMockup.tsx)

**Current issues:**
1. Role cards use `bg-card/80` which may be transparent in light mode
2. SVG orbit gradient uses low opacity colors
3. Brain container uses `rgba()` colors that lack contrast in light mode
4. Role labels use colored text that may not contrast well on light backgrounds

**Fixes:**

**Line 82 - Role cards:**
```tsx
// Before
className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-card/80 border border-border/30 shadow-lg hover:scale-105 transition-transform"

// After - add dark mode fallback
className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-neutral-800 dark:bg-card/80 border border-neutral-600 dark:border-border/30 shadow-lg hover:scale-105 transition-transform"
```

**Line 91 - Role labels:**
```tsx
// Before
className={`text-[11px] font-semibold whitespace-nowrap ${role.iconColor}`}

// After - add explicit styling that works in both modes
className={`text-[11px] font-semibold whitespace-nowrap ${role.iconColor} drop-shadow-sm`}
```

**Line 64-68 - Brain container:**
Add explicit dark background styling that works in both light and dark modes:
```tsx
style={{
  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
  border: '1px solid rgba(34, 211, 238, 0.4)',
  boxShadow: '0 8px 32px rgba(34, 211, 238, 0.3)'
}}
```

**Line 33 - Background glow:**
```tsx
// Before
className="w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl"

// After - increase opacity for visibility
className="w-64 h-64 bg-cyan-500/20 rounded-full blur-2xl"
```

### Part 5: Add CSS utility for auth text (index.css)

Add a new utility class for auth checkbox labels:
```css
/* Auth checkbox label - white text for dark modal backgrounds */
.auth-checkbox-label {
  color: rgba(255, 255, 255, 0.7) !important;
}

.auth-checkbox-label a {
  color: rgb(34, 211, 238) !important;
}

.auth-checkbox-label a:hover {
  text-decoration: underline;
}
```

---

## Summary of Changes

| Component | Issue | Fix |
|-----------|-------|-----|
| AuthModal terms label | `text-muted-foreground` invisible | Change to `text-white/70` |
| AuthModal terms links | `text-primary` low contrast | Change to `text-cyan-400` |
| PasswordStrengthIndicator | Unmet requirements invisible | Change to `text-white/50` |
| AIEmployeeMockup cards | `bg-card/80` transparent in light mode | Add explicit `bg-neutral-800` fallback |
| AIEmployeeMockup glow | Too faint in light mode | Increase opacity from 10% to 20% |
| AIEmployeeMockup brain | Low contrast | Increase color opacity |

---

## Expected Results

After these changes:
1. All text in the auth modal will be clearly visible on the dark background
2. Password requirements will be readable in both met and unmet states
3. Terms & Conditions checkbox text and links will be clearly visible
4. AI Employees mockup will render with proper contrast in both light and dark modes
5. The brain hub and orbiting role cards will be visible regardless of theme
