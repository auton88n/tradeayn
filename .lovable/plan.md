

# Fix: File/Image Visibility, Stale File Context, and Better File Reading

## Problems Identified

1. **Users can't see which file AYN is referencing** -- When a file or image is uploaded and sent, there's no visual indicator in the chat UI (flying bubble, transcript, or response) showing what file was attached. The user has no way to know which file AYN is analyzing.

2. **Uploading a new file -- AYN still talks about the old one** -- The conversation history sent to the AI includes previous messages with `[Attached file: old.pdf]` text baked in. When a new file is uploaded, AYN's context still contains references to the old file from prior messages.

3. **AYN can't actually read images or PDFs** -- Currently, the backend only receives the file's name, type, and storage URL as plain text. It never downloads or passes the actual file content to the AI model. For images and PDFs, the AI literally only sees "[Attached file: photo.jpg]" -- it cannot see the image or read the PDF.

---

## Solution Overview

### Change 1: Show file/image preview in the chat UI

**Files:** `src/components/eye/UserMessageBubble.tsx`, `src/components/dashboard/CenterStageLayout.tsx`, `src/components/dashboard/ChatInput.tsx`

- Add an optional `attachment` prop to `UserMessageBubble` showing a small thumbnail (for images) or file icon + name (for documents) below the message text
- In the transcript/history view, show a small file indicator next to messages that had attachments
- When the flying bubble is created in `CenterStageLayout`, pass the current attachment info along with the message content

### Change 2: Clear stale file references from conversation history

**File:** `src/hooks/useMessages.ts`

- Strip the `[Attached file: ...]` suffix from historical messages when building conversation history (lines 333-336)
- Only include the current file context for the current message, not baked-in text references from old messages
- This ensures AYN always focuses on the newly uploaded file, not old ones

### Change 3: Pass actual file content to the AI (multimodal support)

**Files:** `src/hooks/useMessages.ts`, `supabase/functions/ayn-unified/index.ts`

This is the most impactful change. Currently the AI only sees the file name as text.

**Frontend (`useMessages.ts`):**
- For image files: fetch the file from the storage URL and convert to base64, then include it in the `fileContext` sent to the backend
- For non-image files (PDF, text, CSV): the URL is already passed; the backend will fetch and read it

**Backend (`ayn-unified/index.ts`):**
- When `fileContext` is present, build a multimodal message for the LLM:
  - For images: use the Gemini/Lovable AI Gateway's `image_url` content type to pass the actual image for vision analysis
  - For PDFs: fetch the file from storage, convert to base64, and use the `file` content type (as already done in `parse-pdf-drawing`)
  - For text files (CSV, TXT, JSON, XML): fetch the file and include content as text in the message
- Replace the simple `[Attached file: name]` text with actual multimodal content so the AI can truly see images and read documents

---

## Technical Details

### UserMessageBubble attachment display

```tsx
// Add attachment prop
interface UserMessageBubbleProps {
  content: string;
  attachment?: { name: string; type: string; url: string };
  // ... existing props
}

// In the bubble render:
{attachment && (
  attachment.type.startsWith('image/') ? (
    <img src={attachment.url} alt={attachment.name} className="mt-1 rounded max-h-12 max-w-20 object-cover" />
  ) : (
    <div className="mt-1 flex items-center gap-1 text-xs opacity-80">
      <FileText className="w-3 h-3" />
      <span className="truncate max-w-[120px]">{attachment.name}</span>
    </div>
  )
)}
```

### Stripping stale file references

```typescript
// In useMessages.ts, when building conversation history:
const conversationMessages = messages.slice(-5).map(msg => ({
  role: msg.sender === 'user' ? 'user' : 'assistant',
  content: msg.content.replace(/\n\n\[Attached file: [^\]]+\]$/, '') // Strip old file refs
}));
```

### Multimodal message building in ayn-unified

```typescript
// When fileContext exists with an image:
if (context.fileContext?.type?.startsWith('image/')) {
  // Replace last user message with multimodal content
  const lastIdx = fullMessages.length - 1;
  fullMessages[lastIdx] = {
    role: 'user',
    content: [
      { type: 'text', text: lastMessage },
      { type: 'image_url', image_url: { url: context.fileContext.url } }
    ]
  };
}

// For PDFs: fetch from storage, convert to base64, use file type
// For text files: fetch and inline the content as text
```

### Files Modified

| File | Change |
|------|--------|
| `src/components/eye/UserMessageBubble.tsx` | Add attachment thumbnail/icon display |
| `src/components/dashboard/CenterStageLayout.tsx` | Pass attachment to flying bubble |
| `src/components/dashboard/ChatInput.tsx` | Show file indicator in transcript messages |
| `src/hooks/useMessages.ts` | Strip stale file refs from history; include base64 for images |
| `supabase/functions/ayn-unified/index.ts` | Build multimodal messages for images/PDFs/text files |
| `supabase/functions/ayn-unified/systemPrompts.ts` | Enhance file analysis prompt to describe what AYN sees |

