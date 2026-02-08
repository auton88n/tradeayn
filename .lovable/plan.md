

# Offline Message Queue with Auto-Retry

## Overview

When a user loses internet mid-chat, their message currently fails and they get a friendly but unhelpful AI error response. This change queues failed messages locally and auto-retries them when connectivity is restored.

## Changes

### 1. New file: `src/lib/offlineQueue.ts`

A singleton class that:
- Maintains an in-memory queue of failed messages, persisted to `sessionStorage`
- Exposes `add(content, attachment?)` returning a queue ID
- Exposes `processQueue()` which iterates queued items, calls a registered retry handler, and removes successful ones
- Caps retries at 3 per message, then discards
- Stores message content, optional attachment metadata, and retry count

### 2. Update: `src/types/dashboard.types.ts`

Add `'queued'` to the `Message.status` union type so pending messages can be visually distinguished:
```
status?: 'sending' | 'sent' | 'error' | 'queued';
```

### 3. Update: `src/hooks/useMessages.ts`

In the main `catch` block (lines 743-773), detect network errors specifically:
- If `!navigator.onLine` or the error is a `TypeError` (fetch network failure):
  - Add the message to `offlineQueue`
  - Mark the already-displayed user message status as `'queued'` instead of adding a fake AI response
  - Show a toast: "Message queued -- will send when you're back online"
- If it's a non-network error (timeout, server error): keep current behavior unchanged

Register a retry handler on mount that calls `sendMessage` for queued items.

Expose a `retryQueued()` function that calls `offlineQueue.processQueue()`.

### 4. Update: `src/components/shared/OfflineBanner.tsx`

When connectivity is restored (`wasOffline.current` transitions to online):
- Import and call `offlineQueue.processQueue()`
- If the queue has items, show toast: "Sending X queued message(s)..." instead of just "Back online"
- If queue is empty, show the existing "Back online" toast

### 5. Update: Chat message UI (visual indicator)

In the component that renders individual messages, add a small "queued" badge or clock icon for messages with `status: 'queued'`. This is a minor addition -- a `Clock` icon from lucide-react with "Queued" text below the message bubble.

## How It Works

```text
User sends message while offline
        |
        v
sendMessage() fires -> fetch fails (TypeError)
        |
        v
Message stays in UI with status='queued' + clock icon
offlineQueue.add(content, attachment)
Toast: "Message queued"
        |
        v
... user regains connection ...
        |
        v
OfflineBanner detects online event
offlineQueue.processQueue()
Toast: "Sending 1 queued message..."
        |
        v
sendMessage() called again for queued content
Success -> remove from queue, update message status to 'sent'
Failure -> increment retry count (max 3)
```

## Edge Cases Handled

- **Multiple queued messages**: Processed sequentially to maintain order
- **Tab refresh while offline**: Queue persists in `sessionStorage`, loaded on init
- **Max retries exceeded**: Message removed from queue after 3 failures (user can always re-type)
- **Rate limiting on retry**: If retry hits a 429, the message stays queued for next attempt rather than being discarded
- **Already online but server error**: Only network failures trigger queueing; server errors keep existing friendly-response behavior

## Files Changed

| File | Change |
|------|--------|
| `src/lib/offlineQueue.ts` | New -- singleton queue with sessionStorage persistence |
| `src/types/dashboard.types.ts` | Add `'queued'` to Message status union |
| `src/hooks/useMessages.ts` | Queue on network error, register retry handler |
| `src/components/shared/OfflineBanner.tsx` | Process queue on reconnection |
| Chat message render component | Show queued indicator for pending messages |

