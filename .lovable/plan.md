

# Expandable Card & Message Feedback System

## What You're Asking For

1. **Zoom/Expand Card**: Add an expand button to view AYN's response in a full-screen reading mode
2. **Like/Dislike Connected to Admin**: Currently, the thumbs up/down buttons only change color locally. They need to save feedback to the database so admins can see which responses were helpful

---

## Current Status

| Feature | Current State |
|---------|---------------|
| Expand button | The dialog exists in code but has no trigger button |
| Like/Dislike | Only visual (local state), not saved anywhere |
| Admin view | No table or viewer for message feedback |

---

## Plan

### Part 1: Add Expand Button to ResponseCard

Add an expand/zoom icon next to the feedback buttons that opens the existing full-screen reading dialog.

**Visual:**
```
[Copy]                    [👍] [👎] [⤢ Expand]
```

### Part 2: Create Message Feedback Table

Create a new database table to store per-message ratings:

**Table: `message_ratings`**
- `id` (uuid, primary key)
- `user_id` (uuid, nullable for anonymous)
- `session_id` (uuid, for grouping)
- `message_content` (text, truncated preview)
- `rating` (text: 'positive' | 'negative')
- `created_at` (timestamp)

### Part 3: Connect Like/Dislike to Database

Update `handleFeedback` in ResponseCard to:
1. Save the rating to `message_ratings` table
2. Show a subtle confirmation (toast or visual)

### Part 4: Create Admin Message Feedback Viewer

Add a new component `MessageFeedbackViewer.tsx` in admin panel:
- Show all ratings with message previews
- Filter by positive/negative
- Show which messages users find unhelpful (useful for improving AI responses)

---

## Technical Details

### Database Migration (SQL)
```sql
CREATE TABLE message_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id UUID,
  message_preview TEXT NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE message_ratings ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert feedback" ON message_ratings
  FOR INSERT WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON message_ratings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### File Changes

**`src/components/eye/ResponseCard.tsx`**
- Add expand button with `ChevronDown` or `Maximize2` icon
- Wire it to `setIsExpanded(true)` 
- Update `handleFeedback` to call Supabase insert

**New: `src/components/admin/MessageFeedbackViewer.tsx`**
- Card with positive/negative counts
- ScrollArea with message previews
- Filter toggle for positive/negative
- Refresh button

**`src/components/admin/AdminDashboard.tsx`**
- Add MessageFeedbackViewer to admin navigation/tabs

