

## Chat Pagination Fix

### Will this impact the design?

**No.** The visual design stays exactly the same. All changes are in the data-fetching layer (hooks) and are invisible to the user. The chat UI, message bubbles, animations, sidebar layout -- everything looks identical. The only visible difference is that old chats load faster.

### What Changes (4 files)

**File 1: `src/hooks/useChatSession.ts`**

The sidebar currently fetches 200 messages just to build the "Recent Chats" list. This is wasteful because the `chat_sessions` table already has titles and timestamps.

Changes:
- Replace the `limit=200` messages query with a lightweight query to `chat_sessions` that only fetches `session_id, title, updated_at` (10 rows max)
- Remove the duplicate message-grouping logic (lines 54-111 in `loadRecentChats`, lines 338-401 in `initializeSession`) since we no longer need to derive titles from messages
- The `loadChat` function stays the same -- when a user clicks a sidebar chat, `useMessages.loadMessages()` fetches that session's messages

**File 2: `src/hooks/useMessages.ts`**

The `loadMessages` function currently fetches ALL messages for a session (no limit). Change it to:
- Add `&limit=20` and `&order=created_at.desc` to fetch only the 20 most recent messages
- Reverse the result to display chronologically (oldest first)
- Add a new `loadMoreMessages()` function that uses cursor-based pagination: fetches the next 20 messages older than the oldest currently loaded message (`&created_at=lt.{oldest_timestamp}`)
- Track `hasMoreMessages` state (set to `false` when a fetch returns fewer than 20 rows)
- Prepend older messages to the array without affecting scroll position

**File 3: `src/types/dashboard.types.ts`**

Add to the `UseMessagesReturn` interface:
- `loadMoreMessages: () => Promise<void>` -- function to fetch older messages
- `hasMoreMessages: boolean` -- whether there are more messages to load
- `isLoadingMore: boolean` -- loading state for the "load more" action

**File 4: `src/components/dashboard/ChatHistoryCollapsible.tsx`**

Note: This component is currently unused (not imported anywhere). However, to keep it consistent:
- Remove the `slice(-20)` workaround on line 49 since pagination now handles the limit at the database level
- Accept optional `onLoadMore` and `hasMore` props
- Add a small "Load earlier" button at the top of the scroll area (only visible when `hasMore` is true)

### What Does NOT Change

- Message bubbles, animations, layout -- zero visual changes
- Sidebar appearance -- still shows the same chat list with titles
- `sendMessage` -- completely untouched
- `CenterStageLayout` rendering -- still maps over the same `messages` array
- Scroll behavior -- auto-scroll to bottom still works identically

### Technical Notes

- Cursor pagination uses `created_at` timestamp (already indexed: `idx_messages_user_timestamp`)
- The `loadMoreMessages` function prepends to the array, so new messages still append at the bottom as before
- `ChatHistoryCollapsible` is dead code (no imports found) but will be updated for consistency
- No database migration needed -- existing indexes and tables support this already

