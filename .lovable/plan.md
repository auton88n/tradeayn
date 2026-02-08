

## Show File Attachments in Message History

**Problem**: When you send a file with a message, the attachment data is saved to the database and loaded back into `Message.attachment`, but the `TranscriptMessage` component only renders `content` text. The file preview disappears in the conversation history.

**Solution**: Pass the attachment data to `TranscriptMessage` and render a visual file preview inside the message bubble.

---

### Changes

**1. `src/components/transcript/TranscriptMessage.tsx`**

- Add `attachment?: { url: string; name: string; type: string }` to the component props
- Inside the message bubble (after the text content), render a file preview when `attachment` exists:
  - **Images** (type contains "image"): show an inline `<img>` thumbnail (max-height ~160px, rounded, clickable)
  - **PDFs** (type contains "pdf"): show a styled card with red PDF icon, filename, and download button
  - **Excel/CSV** (type contains "spreadsheet" or name ends in .xlsx/.csv): green icon card with filename and download
  - **Other files**: generic file card with icon, name, and download button
- Use the existing `openDocumentUrl` utility for download handling

**2. `src/components/eye/ResponseCard.tsx`**

- Where `TranscriptMessage` is rendered (around line 425), pass `msg.attachment` as a new prop:
```
<TranscriptMessage
  key={msg.id}
  content={msg.content}
  sender={...}
  timestamp={ts}
  attachment={msg.attachment}
  ...
/>
```

This ensures every message that had a file attached will show the file preview card alongside the text content in the history transcript.

