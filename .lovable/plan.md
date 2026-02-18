
# Two Small UI Fixes: Remove Top-Bar History Buttons + Restyle Upload

## What Changes

### Fix 1: Remove history toggle buttons from the top bar

In `ChartAnalyzerPage.tsx`, lines 139–163, there is a conditional block that renders two buttons when `activeTab === 'chat'`:
- A mobile "History" button (opens mobile sheet)
- A desktop `PanelLeft` toggle button (shows/hides sidebar)

These need to be **removed entirely** from the top bar. The History toggle is already in the chat input toolbar (the center "History N" button), which is the correct location.

The sidebar toggle functionality that was previously on the desktop `PanelLeft` button should still work via the chat input's History button — the `onToggleSidebar` prop already wires that through.

For mobile: the mobile sidebar sheet is currently triggered by the top-bar button. After removing it from the top bar, the center "History" button in the chat input toolbar will handle this on all screen sizes. The `onToggleSidebar` in `ChartUnifiedChat` currently only calls `setSidebarOpen(o => !o)` (desktop). It should also toggle `mobileSidebarOpen` on small screens. The simplest fix: change `onToggleSidebar` to toggle both states, or use a single unified `toggleSidebar` handler in the page that handles both.

**Change in `ChartAnalyzerPage.tsx`:**
- Delete lines 140–163 (the entire `{activeTab === 'chat' && (...)}` sidebar toggle block)
- Change `onToggleSidebar` handler to toggle both desktop and mobile states: `() => { if (window.innerWidth >= 1024) setSidebarOpen(o => !o); else setMobileSidebarOpen(o => !o); }`

### Fix 2: Restyle the Upload button to match `+ New` pill style

In `ChartUnifiedChat.tsx`, lines 565–572, the Upload button is a bare icon with `p-1.5 rounded-lg`. 

The user's screenshot shows it should be a **rounded border button** matching the `+ New` pill style — same border, same padding, same rounded-full shape — but showing just the upload icon (no text label).

**Change in `ChartUnifiedChat.tsx` (lines 565–572):**

Replace:
```tsx
<button
  onClick={() => fileInputRef.current?.click()}
  disabled={isBusy}
  className="p-1.5 rounded-lg hover:bg-muted/60 transition-all disabled:opacity-40"
  title="Upload chart"
>
  <Upload className="w-4 h-4 text-muted-foreground" />
</button>
```

With:
```tsx
<button
  onClick={() => fileInputRef.current?.click()}
  disabled={isBusy}
  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all disabled:opacity-40"
  title="Upload chart"
>
  <Upload className="w-4 h-4" />
</button>
```

This makes it a circular bordered button that matches the reference screenshot exactly — a pill/circle with just the upload arrow icon inside, visually consistent with the `+ New` pill next to it.

## Files Changed

| File | Lines | Change |
|---|---|---|
| `src/pages/ChartAnalyzerPage.tsx` | 139–163 | Remove top-bar history buttons; update `onToggleSidebar` to handle both mobile and desktop |
| `src/components/dashboard/ChartUnifiedChat.tsx` | 565–572 | Restyle Upload button to bordered rounded-full pill (icon only) |

No new components. No new dependencies. Two small targeted edits.
