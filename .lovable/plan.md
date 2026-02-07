
# Move the Eye Down Slightly

## Change

### File: `src/components/dashboard/CenterStageLayout.tsx` (line 738)

Reduce the idle upward shift from `-30` to `-15`, and increase the active-panel shift from `10` to `20`.

**Current:**
```tsx
y: (hasVisibleResponses || transcriptOpen) ? 10 : -30,
```

**Updated:**
```tsx
y: (hasVisibleResponses || transcriptOpen) ? 20 : -15,
```

This moves the eye down by ~15px in both states.
