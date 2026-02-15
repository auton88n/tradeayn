

## Redesign Chart Analyzer Page -- Premium Trading UI

### Overview

The current Chart Analyzer page looks bare and plain -- just a basic header, tabs, and a dashed upload box on a flat background. We'll transform it into a polished, professional trading-tool interface with visual depth, gradient accents, feature highlights, and a more engaging upload zone.

### Design Changes

#### 1. Page wrapper with subtle gradient background
**File: `src/pages/ChartAnalyzerPage.tsx`**

- Add a subtle radial gradient overlay behind the content (amber/orange glow, very faint) to give the page depth
- Widen the container from `max-w-2xl` to `max-w-3xl` for more breathing room
- Style the back button with a semi-transparent pill style

#### 2. Redesign the header section
**File: `src/components/dashboard/ChartAnalyzer.tsx`**

Replace the simple text header with a hero-style header:
- Large gradient icon container (amber/orange) with the BarChart3 icon
- Bigger title with gradient text effect
- Subtitle with better typography
- Add 3 small feature badges below: "Pattern Detection", "Entry/Exit Signals", "Sentiment Analysis" -- showing what the tool does at a glance
- Add supported asset badges: Stock, Crypto, Forex, Commodity

#### 3. Redesign the upload zone
**File: `src/components/dashboard/ChartAnalyzer.tsx`**

Transform the plain dashed box into a more inviting drop zone:
- Gradient dashed border (amber tint) instead of plain gray
- Animated upload icon with a subtle pulse
- Better visual hierarchy with icon in a gradient circle
- Add supported format badges (PNG, JPG, WEBP) as small pills instead of plain text
- Subtle background pattern or gradient inside the zone

#### 4. Style the tabs
**File: `src/components/dashboard/ChartAnalyzer.tsx`**

- Give the TabsList a more defined look with `bg-muted/50` and rounded corners
- Add amber accent to active tab

### Files Summary

| File | Change |
|------|--------|
| `src/pages/ChartAnalyzerPage.tsx` | Add gradient background, widen container, style back button |
| `src/components/dashboard/ChartAnalyzer.tsx` | Hero header with gradient icon + feature badges, redesigned upload zone, styled tabs |

