
# Fix Transient "Two Black Colors" on Landing Page Load

## Problem

During page load in dark mode, a brief visual artifact appears where two different shades of black are visible. This happens in the first 1-3 seconds while animations play.

## Root Causes Identified

### 1. Hero Absorption Pulse Animation
**File:** `src/components/landing/Hero.tsx` (lines 279-287)

The "absorption glow" animation uses `bg-foreground/8`:
```tsx
<motion.div 
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1.1, opacity: 0.4 }}
  exit={{ scale: 1.3, opacity: 0 }}
  className="... rounded-full bg-foreground/8 ..."
/>
```

In dark mode, `foreground` = `hsl(0 0% 98%)` (near white), so `bg-foreground/8` creates an 8% white overlay. When this animates at 40% opacity, it produces a visible light gray circle that contrasts against the dark background.

### 2. index.html Inline Body Background
**File:** `index.html`

The body has an inline style:
```html
<body style="background-color: #0a0a0a;">
```

While this is meant to prevent flash-of-white, the CSS theme uses `hsl(0 0% 4%)` for the background. These are nearly identical but can render differently during the initial paint phase.

---

## Solution

### Change 1: Fix Absorption Pulse Color (Hero.tsx)

Replace the light foreground overlay with a dark-themed glow that matches the design intent:

```tsx
// Before
className="... bg-foreground/8 ..."

// After  
className="... bg-white/5 dark:bg-white/3 ..."
```

This uses a much subtler white opacity that blends seamlessly in both modes.

### Change 2: Align Body Background with Theme (index.html)

Update the inline body style to use the exact same color as the CSS variable:

```html
<!-- Before -->
<body style="background-color: #0a0a0a;">

<!-- After -->
<body style="background-color: hsl(0 0% 4%);">
```

This ensures perfect color matching between the initial HTML paint and the CSS theme.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/landing/Hero.tsx` | Change `bg-foreground/8` to `bg-white/5 dark:bg-white/3` for subtle glow |
| `index.html` | Change body background from `#0a0a0a` to `hsl(0 0% 4%)` |

## Result

After these changes:
- The absorption pulse animation will be barely visible (as intended for a subtle glow effect)
- The initial body background will match the CSS theme exactly
- No more "two blacks" visual artifact during page load
