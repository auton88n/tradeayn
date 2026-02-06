

# Remove Compact Mode from Chat History

## Problem
The chat input and history panel are displaying in a shrunken/compact mode. The user wants them displayed at full size — normal-sized avatars, full padding, and proper spacing — exactly as shown in their screenshot.

## Changes

### 1. ChatInput.tsx — Remove compact mode and restore full spacing

- **Messages area**: Change `max-h-64` to `max-h-[50vh]` to give the history more room (like the screenshot shows)
- **Container spacing**: Change `py-1 space-y-0` back to `p-3 space-y-1` for proper message gaps
- **TranscriptMessage**: Remove the `compact` prop so messages render at full size with normal avatars, padding, and copy buttons

```
Before:  <TranscriptMessage ... compact />
After:   <TranscriptMessage ... />

Before:  <div className="py-1 space-y-0">
After:   <div className="p-3 space-y-1">

Before:  <div className="max-h-64 overflow-y-auto">
After:   <div className="max-h-[50vh] overflow-y-auto">
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/ChatInput.tsx` | Remove `compact` prop, restore `p-3 space-y-1` spacing, increase max-height to `50vh` |

