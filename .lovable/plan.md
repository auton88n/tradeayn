

# Fix Disorganized Chat History Layout in ChatInput

## Problem
The chat history messages inside the ChatInput card look messy and unstructured. The `TranscriptMessage` component was designed for a full sidebar view and uses oversized spacing, large avatars, and copy buttons that don't work in the compact inline panel.

## Solution
Add a `compact` prop to `TranscriptMessage` that reduces sizing and spacing when used inside the ChatInput history panel.

---

## Technical Changes

### 1. TranscriptMessage.tsx - Add `compact` mode

Add an optional `compact` prop that adjusts:
- Container padding: `p-3` down to `py-1 px-2`
- Avatar size: `w-8 h-8` down to `w-5 h-5` with smaller icons
- Content max-width: `max-w-[80%]` down to `max-w-[85%]`
- Bubble padding: `px-4 py-2` down to `px-2.5 py-1`
- Text size: `text-sm` down to `text-xs`
- Hide the copy button entirely in compact mode
- Smaller timestamp text

### 2. ChatInput.tsx - Use compact mode and tighter container

- Pass `compact={true}` to each `TranscriptMessage` in the history panel
- Reduce container padding from `p-3 space-y-1` to `py-1 space-y-0` (messages handle their own spacing)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/transcript/TranscriptMessage.tsx` | Add `compact` prop with reduced sizing for all elements |
| `src/components/dashboard/ChatInput.tsx` | Pass `compact={true}` to TranscriptMessage, tighten container spacing |

