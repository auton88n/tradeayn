

# OptimizedImage Component + Image Optimization

## Assessment

After reviewing the entire codebase, the situation is different from what was expected:

- **Landing page (Hero.tsx)**: No images at all -- pure CSS, SVG, and Lucide icons
- **Service pages (AI Agents, Automation, Civil Engineering, AI Employee)**: No `<img>` tags -- all mockups are CSS/SVG-based
- **InfluencerSites.tsx**: Imports `influencer-woman-bg.jpg` but delegates rendering to `MobileMockup.tsx`
- **MobileMockup.tsx**: Uses the JPG as a CSS `backgroundImage` at 40% opacity -- the only static image on any public page

The remaining `<img>` tags exist in:
- `SavedImagesGallery.tsx` (user-uploaded images in dashboard)
- `MessageFormatter.tsx` (AI-generated images in chat)
- `PortfolioCard.tsx` (user portfolio thumbnails)
- `VisualTestResults.tsx` (admin test screenshots)

These are all dynamic/user-generated content, not static marketing images.

## Proposed Changes

### 1. New file: `src/components/shared/OptimizedImage.tsx`

A reusable component with:
- **Native lazy loading** via `loading="lazy"` (skipped when `priority=true` for above-the-fold images)
- **Fade-in transition** on load to avoid content flash
- **Skeleton placeholder** while loading
- **`decoding="async"`** to avoid blocking the main thread
- **Optional `width`/`height`** to prevent layout shift (CLS)

### 2. Update: `src/components/services/MobileMockup.tsx`

Replace the inline `backgroundImage` style with a proper `<img>` tag using `OptimizedImage` with `loading="lazy"` and absolute positioning. This gives the browser the ability to natively lazy-load the image instead of eagerly fetching a CSS background.

### 3. Update: `src/components/shared/index.ts`

Add `OptimizedImage` to barrel exports for easy reuse across the project.

### 4. Apply to dynamic images (low effort, high impact)

Update `SavedImagesGallery.tsx` and `PortfolioCard.tsx` to use `OptimizedImage` for their thumbnails. These benefit from the fade-in transition and lazy loading since they render in scrollable lists.

## What this does NOT do

- No responsive `srcset` or size variants -- the project serves images from Supabase Storage URLs which don't support on-the-fly resizing. Adding a CDN image transform layer is a separate infrastructure task.
- No changes to `MessageFormatter.tsx` -- its image rendering has lightbox integration that needs to stay custom.

## Files changed

| File | Change |
|------|--------|
| `src/components/shared/OptimizedImage.tsx` | New component |
| `src/components/shared/index.ts` | Add export |
| `src/components/services/MobileMockup.tsx` | Replace CSS backgroundImage with OptimizedImage |
| `src/components/dashboard/SavedImagesGallery.tsx` | Use OptimizedImage for thumbnails |
| `src/components/engineering/PortfolioCard.tsx` | Use OptimizedImage for thumbnails |

