

# Marketing Creative Studio -- Complete Quality Overhaul

## What's Wrong

1. **Buttons still cut off**: The DialogContent base class applies `grid` layout with `gap-4`, which conflicts with the inner grid. The close button also takes grid space. This pushes content down and hides the action buttons.

2. **Low-quality feel**: The current editor uses basic inputs, small color circles, and cramped spacing. Pomelli-level quality means: generous whitespace, large interactive elements, smooth visual feedback, and a cohesive design system.

3. **Brand identity weak**: The AYN eye symbol is just a generic Brain icon from Lucide. It should be a proper styled SVG eye symbol matching the brand.

## What Changes

### 1. CreativeEditor.tsx -- Full Rewrite

The dialog layout fix and quality upgrade:

- Override the base DialogContent `gap-4` with `gap-0` so the inner layout is fully controlled
- Use a flex column layout instead of CSS grid for the right panel to ensure the action buttons are always pinned to the bottom
- Increase the dialog to near-full-screen on desktop (`max-w-6xl`, `h-[90vh]`)
- Left panel (60%): Large preview with subtle checkerboard/grid background, proper aspect ratio container, and the AYN eye SVG placeholder (not Brain icon)
- Right panel (40%): Polished control sections with:
  - Textarea for header text (not single-line input) with live character count
  - Large background theme cards (not tiny squares) with preview thumbnails showing what each looks like
  - Bigger accent color circles (w-12 h-12) with labels and selected ring
  - CTA input with placeholder
  - Logo toggle with proper AYN eye icon
- Action buttons pinned at bottom with clear visual hierarchy

### 2. BrandKit.tsx -- Add AYN Eye SVG

Replace the Brain icon with a proper inline SVG eye symbol that matches the AYN brand (the eye icon visible in the user's generated image screenshot).

### 3. CampaignGallery.tsx -- Minor Polish

No major changes needed -- the grid layout is already good. Small tweaks to card border radius and hover transitions.

## Technical Details

### DialogContent gap fix (line 62 of CreativeEditor)

```
Before: className="max-w-5xl max-h-[85vh] p-0 overflow-hidden"
After:  className="max-w-6xl h-[90vh] max-h-[800px] p-0 gap-0 overflow-hidden"
```

Adding `gap-0` overrides the base `gap-4` from the dialog component. Using `h-[90vh] max-h-[800px]` gives more room.

### Right panel structure

```
<div className="flex flex-col h-full overflow-hidden">
  <header className="shrink-0 p-6 border-b">...</header>
  <ScrollArea className="flex-1 min-h-0">
    <div className="p-6 space-y-8">...controls...</div>
  </ScrollArea>
  <footer className="shrink-0 p-6 border-t bg-background">
    ...buttons...
  </footer>
</div>
```

The key fix is `min-h-0` on ScrollArea (needed for flex children to shrink below content size) and `shrink-0` on header/footer.

### AYN Eye SVG Component

A reusable `AynEyeIcon` component rendering a stylized eye/perception symbol in SVG, used across BrandKit, CreativeEditor placeholder, and CampaignGallery empty state.

## Files Modified

| File | Change |
|------|--------|
| `src/components/admin/marketing/CreativeEditor.tsx` | Full rewrite -- layout fix + Pomelli-quality UI |
| `src/components/admin/marketing/BrandKit.tsx` | Replace Brain icon with AYN eye SVG |
| `src/components/admin/marketing/AynEyeIcon.tsx` | New -- reusable AYN eye brand icon component |

