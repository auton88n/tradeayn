
# AYN Mind -- Suggestions and Memory Dashboard for Admin

## Overview

Add a new admin tab called "AYN Mind" that shows AYN's observations, improvement ideas, thoughts, trends, and mood -- all pulled from the existing `ayn_mind` database table that is already being populated by the proactive loop and Telegram webhook.

This gives you a window into what AYN is thinking, what it has observed across the platform, and its suggestions for improvements -- all in one place.

## What Already Exists

- **`ayn_mind` table** -- already in the database with 45+ entries across types: `observation` (20), `mood` (13), `idea` (6), `thought` (3), `trend` (3), plus `telegram_admin` and `telegram_ayn` conversation logs
- **Proactive loop** (`ayn-proactive-loop`) -- already writes observations, ideas, moods, and trends to `ayn_mind`
- **Telegram webhook** -- already logs conversations to `ayn_mind`

## What We Will Build

### New Component: `src/components/admin/AYNMindDashboard.tsx`

A dashboard with:

1. **AYN's Current Status** -- mood indicator and latest observation summary at the top
2. **Improvement Suggestions** -- filtered view of `type = 'idea'` entries, showing AYN's actionable suggestions with context data
3. **Observations** -- filtered view of `type = 'observation'` entries showing platform health snapshots (user counts, error counts, health scores)
4. **Thoughts** -- `type = 'thought'` entries showing AYN's strategic thinking
5. **Trends** -- `type = 'trend'` entries showing patterns AYN has noticed
6. **Filter tabs** -- filter by type (All, Ideas, Observations, Thoughts, Trends, Mood)
7. **Real-time updates** -- subscribe to `ayn_mind` table changes for live updates
8. **Context expansion** -- click to expand and see the full JSON context data attached to each entry

### Sidebar Addition: `src/components/admin/AdminSidebar.tsx`

- Add `'ayn-mind'` to the `AdminTabId` type
- Add a new sidebar item in the AI Tools section with a Brain icon and gradient

### Admin Panel Wiring: `src/components/AdminPanel.tsx`

- Import and render `AYNMindDashboard` when `activeTab === 'ayn-mind'`

## Technical Details

### AYNMindDashboard Component Structure

```text
+------------------------------------------+
| AYN's Mind                               |
+------------------------------------------+
| [Mood: happy]  Health: 97%  Active: 9    |
+------------------------------------------+
| Filter: [All] [Ideas] [Observations]     |
|         [Thoughts] [Trends] [Mood]       |
+------------------------------------------+
| [Idea] Analyze 10 errors to identify     |
|        if from rate-limited user...       |
|        Context: { errors: 10, ... }      |
|------------------------------------------|
| [Thought] Target 5 inactive users with   |
|           feature update notification...  |
|        Context: { active: 9, total: 14 } |
|------------------------------------------|
| [Observation] System check: health 97%,  |
|              10 errors, 1 open ticket...  |
|        Context: { health_score: 97 }     |
+------------------------------------------+
```

### Data Flow

- Query `ayn_mind` table filtered by type, ordered by `created_at DESC`
- Real-time subscription for new entries via Supabase channels
- Each entry displays: type badge, content, timestamp, expandable context

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/admin/AYNMindDashboard.tsx` | **Create** -- main dashboard component |
| `src/components/admin/AdminSidebar.tsx` | **Modify** -- add `'ayn-mind'` tab |
| `src/components/AdminPanel.tsx` | **Modify** -- import and render new component |

No database changes needed -- the `ayn_mind` table and its data pipeline already exist and are working.
