

## Fix Text Visibility Issues (Without Removing Visual Effects)

This plan addresses text visibility issues across light and dark modes while **preserving all beautiful visual effects** like blurs, glows, and gradients.

---

## Strategy

Instead of removing `backdrop-blur` or `blur-2xl` effects, we will:
1. Add Safari-specific CSS properties to fix rendering artifacts
2. Add theme-aware text color classes (`text-color dark:text-color`)
3. Keep all existing visual styling

---

## Changes

### File 1: `src/index.css`

Add Safari-specific CSS fix for backdrop-blur artifacts (no visual change, just prevents the "black thing"):

```css
/* Safari backdrop-blur fix - add after existing backdrop-blur styles */
@supports (-webkit-backdrop-filter: blur(1px)) {
  .backdrop-blur-sm {
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
    -webkit-transform: translate3d(0, 0, 0);
  }
}
```

This forces Safari to use GPU compositing without removing any blur effects.

---

### File 2: `src/components/services/EngineeringMockup.tsx`

**Text visibility fixes only** (keeping all visual effects):

| Line | Current | Fixed |
|------|---------|-------|
| 92 | `text-cyan-300` | `text-cyan-600 dark:text-cyan-300` |
| 104 | `text-cyan-300/80` | `text-cyan-600/80 dark:text-cyan-300/80` |
| 118 | `text-emerald-300` | `text-emerald-600 dark:text-emerald-300` |
| 149 | `text-cyan-200` | `text-cyan-700 dark:text-cyan-200` |
| 152 | `text-emerald-300` | `text-emerald-600 dark:text-emerald-300` |

---

### File 3: `src/components/services/AutomationFlowMockup.tsx`

**Fix indicator dots** (invisible white on white in light mode):

| Line | Current | Fixed |
|------|---------|-------|
| 22 | `bg-white dark:bg-gray-200` | `bg-neutral-700 dark:bg-white` |
| 40 | `bg-white dark:bg-gray-200` | `bg-neutral-700 dark:bg-white` |

---

### File 4: `src/components/services/AIEmployeeMockup.tsx`

**Fix role labels** (icon colors may not be visible in light mode on light bg):

| Line | Current | Fixed |
|------|---------|-------|
| 91 | `${role.iconColor}` | `text-foreground/80` |

---

### File 5: `src/components/services/DeviceMockups.tsx`

**Improve chat bubble text contrast**:

| Line | Current | Fixed |
|------|---------|-------|
| 59 | `text-muted-foreground` | `text-foreground/70` |

---

## What Stays Unchanged

| Element | Why Keep |
|---------|----------|
| `blur-2xl` on Hero glow | Beautiful soft halo effect |
| `backdrop-blur-sm` on cards | Glass morphism effect |
| All gradient backgrounds | Visual richness |
| All shadows and glows | Depth and dimension |

---

## Summary

| File | Changes | Visual Impact |
|------|---------|---------------|
| `src/index.css` | Safari CSS fix | None (just prevents artifacts) |
| `EngineeringMockup.tsx` | Theme-aware text colors | Text visible in both modes |
| `AutomationFlowMockup.tsx` | Dark dots in light mode | Dots visible on white |
| `AIEmployeeMockup.tsx` | Theme-aware labels | Labels visible in both modes |
| `DeviceMockups.tsx` | Better text contrast | Chat bubble text readable |

All visual effects remain intact. Only text colors are adjusted for proper contrast in both light and dark modes.

