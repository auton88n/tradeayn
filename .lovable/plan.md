

# Add File & Document Support to AYN's Telegram

## Problem

When you send a file (PDF, Excel, Word, etc.) or a document via Telegram, AYN ignores it completely. The code only checks for `message.photo` and `message.text` — anything else gets silently dropped at line 206 (`if (!message.text) return`).

## What Will Change

After this update, AYN will be able to receive and process:
- **Documents** (PDF, Excel, CSV, Word, text files) — extracts text content and analyzes it
- **Voice messages** — transcribes using AI and responds
- **Files sent as photos with captions** — already works, no change needed

## Technical Changes

### File: `supabase/functions/ayn-telegram-webhook/index.ts`

#### 1. Add document handler (new function `handleDocument`)

Before the `if (!message.text)` check (line 206), add a new block:

```text
if (message.document) {
  const reply = await handleDocument(message, supabase, botToken, chatId);
  if (reply) await sendTelegramMessage(..., reply);
  return new Response('OK', { status: 200 });
}
```

The `handleDocument` function will:
1. Get the file info from Telegram API (`getFile`)
2. Check file size (limit to 10MB to avoid memory issues)
3. Check file type — support: PDF, CSV, TXT, JSON, XML, XLSX, DOCX, MD
4. Download the file from Telegram's file server
5. For text-based files (CSV, TXT, JSON, XML, MD): read as text directly
6. For binary files (PDF, XLSX, DOCX): convert to base64 and send to Gemini with a prompt to extract and analyze the content
7. Send AYN's analysis back as a Telegram message
8. Log the exchange to `ayn_mind` for conversation memory

#### 2. Add voice message handler (new function `handleVoice`)

Similarly, add before the text check:

```text
if (message.voice || message.audio) {
  const reply = await handleVoice(message, supabase, botToken, chatId);
  if (reply) await sendTelegramMessage(..., reply);
  return new Response('OK', { status: 200 });
}
```

The `handleVoice` function will:
1. Get the voice file from Telegram
2. Convert to base64
3. Send to Gemini with audio understanding capability
4. Return AYN's response

#### 3. Update the early return for unknown message types

Change the `if (!message.text)` block to send a helpful message instead of silently ignoring:

```text
if (!message.text) {
  await sendTelegramMessage(token, chatId, "Got your message but I can't process this type yet. Try sending text, photos, or documents.");
  return new Response('OK', { status: 200 });
}
```

### Supported File Types

| Type | How AYN Reads It |
|------|-----------------|
| PDF | Base64 to Gemini vision (reads pages as images) |
| CSV, TXT, JSON, XML, MD | Direct text extraction, sent to Gemini as text |
| XLSX, DOCX | Base64 to Gemini for extraction |
| Images (JPG, PNG) | Already works via existing `handlePhoto` |
| Voice/Audio | Base64 to Gemini audio understanding |
| Unsupported | Friendly "can't process this type" message |

### Safety Limits
- Max file size: 10MB (Telegram's limit is 20MB, but we cap lower for edge function memory)
- Text content truncated to 50,000 characters before sending to AI
- All file exchanges logged to `ayn_mind` for conversation continuity

## Files Changed
- `supabase/functions/ayn-telegram-webhook/index.ts` — Add `handleDocument` and `handleVoice` functions, update message routing
