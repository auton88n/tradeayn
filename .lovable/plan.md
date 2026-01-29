

# Chat Transcript Avatar Improvements

## Problem
The current transcript message avatars are confusing:
- **User messages** show "Y" (unclear meaning)
- **AYN messages** show "A" instead of the Brain icon used everywhere else in the app

## Solution
Update the `TranscriptMessage` component to use proper icons:
- **User**: Replace "Y" with a `User` icon from Lucide
- **AYN**: Replace "A" with the `Brain` icon to match AYN's brand identity

## Visual Changes

| Current | New |
|---------|-----|
| Black circle with "Y" | Primary color circle with User icon |
| Black circle with "A" | Dark circle with Brain icon |

---

## Technical Details

### File: `src/components/transcript/TranscriptMessage.tsx`

**Changes:**
1. Import `User` and `Brain` icons from `lucide-react`
2. Replace text-based avatars with icon-based avatars:
   - User: `<User className="w-4 h-4" />`
   - AYN: `<Brain className="w-4 h-4" />`

```tsx
// Before
{isUser ? 'Y' : 'A'}

// After
{isUser ? (
  <User className="w-4 h-4" />
) : (
  <Brain className="w-4 h-4" />
)}
```

This is a minimal, focused change that aligns the transcript with AYN's visual identity used across the rest of the application.

