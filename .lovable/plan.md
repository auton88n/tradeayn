

# Fix: Clean Up AYN's Telegram Messages (Remove Raw Markdown)

## Problem

AYN's messages on Telegram show raw markdown like `**Ontario**` instead of **Ontario**. Paragraphs also run together without spacing. This happens because the `sendTelegramMessage` helper sends plain text without telling Telegram how to format it.

## Solution

Two changes:

### 1. Convert Markdown to Telegram HTML

Before sending, convert common markdown patterns to Telegram-supported HTML:
- `**text**` becomes `<b>text</b>` (bold)
- `*text*` becomes `<i>text</i>` (italic)
- Bullet points and line breaks are preserved

### 2. Enable HTML Parsing in Telegram API

Add `parse_mode: "HTML"` to the Telegram API call so it renders the formatting.

## Technical Details

### File: `supabase/functions/_shared/telegramHelper.ts`

Add a `markdownToTelegramHtml` conversion function that:
- Escapes HTML special characters (`<`, `>`, `&`) in the text first (except our converted tags)
- Converts `**text**` to `<b>text</b>`
- Converts `*text*` to `<i>text</i>`
- Preserves line breaks and paragraph spacing
- Strips any remaining markdown artifacts

Update the `sendMessage` API call to include `parse_mode: "HTML"` in the request body.

This is a single-file change that fixes formatting across ALL of AYN's Telegram messages (status updates, lead previews, alerts, etc.) since they all use this shared helper.

## Files Changed
- `supabase/functions/_shared/telegramHelper.ts` -- Add markdown-to-HTML conversion and enable HTML parse mode

