

## Fix Star Icon Visibility with Padding Adjustment

### Problem
The star icons in the sidebar chat list are being cut off at the edges.

### Solution
Add right padding of 6 (`pr-6`) to the chat item container to create more space for the star icon to display fully.

### Technical Change

**File:** `src/components/dashboard/Sidebar.tsx` (line 541)

Change the chat item container padding:
- **Current:** `px-3` (equal left and right padding)
- **New:** `px-3 pr-6` (keep left padding at 3, increase right padding to 6)

```tsx
// Before
className={cn("flex-1 h-auto py-3.5 px-3 rounded-xl cursor-pointer", ...)}

// After  
className={cn("flex-1 h-auto py-3.5 px-3 pr-6 rounded-xl cursor-pointer", ...)}
```

### Expected Result
- Star icon will be fully visible without any clipping
- Extra 12px (from 12px to 24px) of right padding provides room for the icon
- Chat title will still truncate properly leaving space for star

