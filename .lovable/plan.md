
# Fix Build Error and Scope RTL to Response Content Only

## Issues Found

### 1. Build Error in dialog.tsx
The `DialogDescription` component has an empty function body that returns nothing (`void`), causing a TypeScript error:
```tsx
// Line 48-51 - BROKEN
const DialogDescription = React.forwardRef<...>(({
  className,
  ...props
}, ref) => {});  // Empty! Returns void
```

### 2. RTL Applied to Entire Dashboard
When Arabic is selected as the language, the `LanguageContext` sets `document.documentElement.dir = 'rtl'` which flips the entire UI layout. However, based on your design:
- The **dashboard layout** should always remain **LTR** (left-to-right)
- Only the **AI response content** should use RTL when Arabic text is detected

The good news: `MessageFormatter` and `StreamingMarkdown` already detect Arabic text and apply RTL styling **only to their content**. We just need to stop the global RTL from being applied.

---

## Solution

### Part 1: Fix DialogDescription Build Error

Restore the proper JSX return in `dialog.tsx`:

```tsx
// Before (broken):
const DialogDescription = React.forwardRef<...>(({
  className,
  ...props
}, ref) => {});

// After (fixed):
const DialogDescription = React.forwardRef<...>(({
  className,
  ...props
}, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
```

### Part 2: Remove Global RTL Direction

Update `LanguageContext.tsx` to **not** apply `dir="rtl"` to the document:

```tsx
// Before (lines 1964-1975):
useEffect(() => {
  document.documentElement.lang = language;
  document.documentElement.dir = direction;  // ❌ Remove this
  
  if (language === 'ar') {
    document.documentElement.classList.add('rtl');  // ❌ Remove this
  } else {
    document.documentElement.classList.remove('rtl');
  }
}, [language, direction]);

// After:
useEffect(() => {
  // Only set the language attribute for accessibility/SEO
  document.documentElement.lang = language;
  // Do NOT set dir="rtl" on document - RTL is handled per-component
  // MessageFormatter and StreamingMarkdown detect Arabic content
  // and apply RTL styling only to their content areas
}, [language]);
```

---

## How RTL Works After This Fix

| Component | RTL Behavior |
|-----------|--------------|
| Dashboard Layout (Sidebar, Header) | Always LTR - consistent design |
| AI Response Content | Auto-detects Arabic → applies RTL styling |
| MessageFormatter | Has `hasArabicText()` → sets `dir="rtl"` on content div |
| StreamingMarkdown | Has `hasArabicText()` → applies RTL to streamed text |
| Chat Input | User can type Arabic, flows naturally |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/dialog.tsx` | Fix DialogDescription to return proper JSX |
| `src/contexts/LanguageContext.tsx` | Remove `document.dir` and RTL class application |

---

## Result

- Build error fixed
- Dashboard always shows LTR layout (buttons, sidebar on left, etc.)
- When user sends Arabic message, AI response displays in RTL with proper Arabic font
- Language switcher still works for translations (Arabic labels/text in UI elements)
- Screenshot issue (reversed layout) will be resolved
