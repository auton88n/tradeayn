

# Fix ResponseCard Not Showing for Document Generation

## Problem Identified

After thorough investigation, I found the root cause of why the ResponseCard doesn't show for PDF generation responses:

In `useMessages.ts`, when creating the AYN message for non-streaming responses (like documents), the message is created with:
```typescript
isTyping: true
```

However, unlike the streaming path which sets `isTyping: false` after stream completion, the non-streaming path never updates this flag.

Then in `CenterStageLayout.tsx`, the response processing effect has an early return:
```typescript
if (lastMessage.isTyping) return;
```

This causes the effect to skip processing the document response message, so `emitResponseBubble()` is never called, and the ResponseCard never appears.

## Solution

Update the non-streaming message path in `useMessages.ts` to set `isTyping: false` instead of `true` since the response is already complete (not being streamed).

## File Changes

### `src/hooks/useMessages.ts`

**Change:** Set `isTyping: false` for non-streaming responses since the content is complete

**Location:** Around line 571

```typescript
// Before
const aynMessage: Message = {
  id: crypto.randomUUID(),
  content: response,
  sender: 'ayn',
  timestamp: new Date(),
  isTyping: true,  // <-- Wrong for non-streaming
  ...(labData ? { labData } : {}),
  ...(documentAttachment ? { attachment: documentAttachment } : {})
};

// After
const aynMessage: Message = {
  id: crypto.randomUUID(),
  content: response,
  sender: 'ayn',
  timestamp: new Date(),
  isTyping: false,  // <-- Non-streaming = already complete
  status: 'sent',   // Also add status for consistency
  ...(labData ? { labData } : {}),
  ...(documentAttachment ? { attachment: documentAttachment } : {})
};
```

## Technical Flow After Fix

```text
User: "Create a PDF about Greenland"
                │
                ▼
┌─────────────────────────────────────────┐
│  ayn-unified returns JSON (non-stream)  │
│  with documentUrl, documentName, etc.   │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  useMessages.ts                         │
│  ─────────────────────────────────────  │
│  Creates message with:                  │
│  - isTyping: false   ← FIXED            │
│  - status: 'sent'                       │
│  - attachment: { url, name, type }      │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  CenterStageLayout.tsx                  │
│  ─────────────────────────────────────  │
│  Effect sees:                           │
│  - lastMessage.sender === 'ayn' ✓       │
│  - lastMessage.isTyping === false ✓     │
│  - lastMessage.content has text ✓       │
│                                         │
│  → Calls emitResponseBubble()           │
│  → ResponseCard appears with download   │
└─────────────────────────────────────────┘
```

## Why This Works

1. **Streaming responses** start with `isTyping: true` and get updated to `false` after stream completes
2. **Non-streaming responses** (documents, images) are complete on arrival and should be `isTyping: false` immediately
3. The `CenterStageLayout` effect correctly filters out incomplete messages using `isTyping`, but now it will process completed non-streaming messages properly

## Summary

| File | Change |
|------|--------|
| `src/hooks/useMessages.ts` | Set `isTyping: false` for non-streaming AYN messages |

This is a one-line fix that will restore ResponseCard display for PDF/Excel document generation.

