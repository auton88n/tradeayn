

# Make the History Button Fully Rounded (Pill Shape)

## Problem

The History button currently uses `rounded-lg` which gives it slightly rounded corners but still looks rectangular/boxy. It should be a smooth pill-shaped button.

## Fix

### File: `src/components/dashboard/ChatInput.tsx` (line 712)

Change `rounded-lg` to `rounded-full` on the History button. This gives it a fully rounded pill shape that looks clean and natural.

| Current | New |
|---------|-----|
| `rounded-lg` | `rounded-full` |

