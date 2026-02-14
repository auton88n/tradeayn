

## Fix Message Counter to Show Total Count (Not Loaded Page Count)

### Problem
The Chat Pagination Fix introduced a `PAGE_SIZE = 20` limit, loading only the 20 most recent messages instead of all messages. However, two UI elements now incorrectly reflect the **loaded** count instead of the **total** count:

- **"History 20"** button shows 20 (loaded messages) instead of the actual total messages in the session
- **"20/100"** counter shows 20/100 instead of the real total (e.g., 45/100)

### Solution

**1. Track total message count separately in `useMessages.ts`**
- Add a `totalMessageCount` state variable
- When loading messages, make an additional lightweight COUNT query (or use the Supabase `Prefer: count=exact` header) to get the total number of messages in the current session
- Update `totalMessageCount` when messages are sent or loaded
- Expose `totalMessageCount` in the return value and `UseMessagesReturn` type

**2. Update the types in `dashboard.types.ts`**
- Add `totalMessageCount: number` to the `UseMessagesReturn` type
- The existing `messageCount` can be replaced with or supplemented by `totalMessageCount`

**3. Wire up the counter in `ChatInput.tsx`**
- Change the `messageCount` prop to use `totalMessageCount` so the "20/100" display shows the real total

**4. Wire up History badge in `ChatHistoryCollapsible.tsx`**
- The History button badge currently uses `messages.length` -- update it to accept and display the total count

### Technical Details

**Count query approach** (lightweight, no extra data transfer):
```
messages?user_id=eq.{userId}&session_id=eq.{sessionId}&select=id&order=created_at.desc
```
With HTTP header `Prefer: count=exact` and `Range: 0-0` to get only the count without fetching rows.

Alternatively, increment `totalMessageCount` locally when a new message is sent, and set it from the initial query response.

**Files to modify:**
- `src/hooks/useMessages.ts` -- add total count tracking
- `src/types/dashboard.types.ts` -- add `totalMessageCount` to types
- `src/components/dashboard/DashboardContainer.tsx` -- pass `totalMessageCount`
- `src/components/dashboard/CenterStageLayout.tsx` -- pass through
- `src/components/dashboard/ChatInput.tsx` -- use total count for display
- `src/components/dashboard/ChatHistoryCollapsible.tsx` -- use total count for badge

