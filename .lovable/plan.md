

# Move "New" Button into Chat Input Toolbar

## What Changes

Add a **"+ New"** pill-shaped button to the chat input toolbar that lets users start a new chat. When the message limit is reached, this button becomes visually prominent (highlighted, pulsing) to guide users to click it.

---

## Change 1: Add "+ New" Button to Toolbar

**File: `src/components/dashboard/ChatInput.tsx`**

In the toolbar row (line 575-627), add a "+ New" button to the **left side** of the toolbar, before the file upload Plus button:

- Renders as a pill-shaped button: `rounded-full border border-border px-3 py-1` with `Plus` icon + "New" text (matching the screenshot reference)
- Calls `onStartNewChat` on click
- Always visible in the toolbar (not just when limit is reached)
- When `hasReachedLimit` is true: the button gets a highlighted style (e.g., `bg-foreground text-background` or a subtle pulse animation) to draw attention
- When `hasReachedLimit` is false: the button has a muted/ghost style (`text-muted-foreground hover:bg-muted/60`)

## Change 2: Simplify Limit Overlay

**File: `src/components/dashboard/ChatInput.tsx`**

Since the "+ New" button is now always in the toolbar, simplify the limit reached overlay (lines 418-434):

- Remove the `Button` from inside the overlay (no longer needed -- the toolbar "+ New" button handles it)
- Keep the overlay text message ("You exceeded your limit") as a subtle indicator
- The overlay still blurs the input area, but users can see and click the toolbar "+ New" button (move it outside/below the overlay z-index, or make the toolbar sit above the overlay)
- Actually, better approach: **remove the full-screen overlay entirely** and instead just disable the textarea + show a small inline message. The "+ New" button in the toolbar is the primary CTA.

Revised approach for the limit state:
- Disable the textarea (already done via `isDisabled`)
- Show a small text above or inside the input area: "Limit reached -- start a new chat"
- The "+ New" button in the toolbar pulses/highlights to be the clear action

## Change 3: Toolbar Layout Adjustment

The current toolbar left section has: Plus (file), Voice, Sound. The new layout:

**Left section**: `[+ New pill]` `[file attach icon]` `[voice icon]` `[sound icon]`

The "+ New" pill is visually distinct from the icon buttons -- it has text + border like the screenshot.

---

## Technical Details

### New Button Markup (inside toolbar left `div`, before the file upload button)

```text
<button
  onClick={onStartNewChat}
  disabled={!onStartNewChat}
  className={cn(
    "inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs sm:text-sm transition-all",
    hasReachedLimit
      ? "bg-foreground text-background border-foreground animate-pulse shadow-md"
      : "border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
  )}
>
  <Plus className="w-3.5 h-3.5" />
  <span>New</span>
</button>
```

### Limit Overlay Simplification

Replace the current overlay (lines 418-434) with a simple inline banner above the textarea:

```text
{hasReachedLimit && !maintenanceActive && !creditsExhausted && (
  <div className="px-4 pt-2 text-center">
    <span className="text-xs text-muted-foreground">
      Message limit reached - tap <strong>+ New</strong> to start a new chat
    </span>
  </div>
)}
```

This removes the blocking overlay so users can still see the toolbar and click "+ New".

---

## Files Modified (1)

| File | Changes |
|------|---------|
| `ChatInput.tsx` | Add "+ New" pill button to toolbar left section, highlight when limit reached, replace blocking overlay with inline message |

