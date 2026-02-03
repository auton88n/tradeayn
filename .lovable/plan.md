
# Responsive Design & Card Overflow Fixes

## Summary
This plan addresses cross-device compatibility issues to ensure the website displays properly on all device types (mobile, tablet, desktop) with particular focus on preventing card overflow and ensuring proper content containment.

## Issues Identified

### 1. Hero Section Cards (Mobile Clipping)
The floating response cards in the Hero component use fixed pixel offsets that can cause clipping on smaller mobile screens.

**Current mobile positions:**
- Cards are positioned with pixel values like `x: -35, y: -105`
- On very small screens (320px width), these cards can extend beyond the viewport

### 2. Service Mockup Cards (Overflow Issues)
Several mockup components have elements that extend outside their containers:

**MobileMockup.tsx:**
- Instagram card positioned at `right-[-60px]` to `right-[-110px]`
- TikTok card positioned at `left-[-60px]` to `left-[-110px]`
- These negative offsets cause horizontal overflow on smaller screens

**AIEmployeeMockup.tsx:**
- Uses fixed `orbitRadius` of 120px (mobile) / 210px (desktop)
- Cards positioned outside the container bounds

**TicketingMockup.tsx:**
- Uses `scale-[0.65]` on mobile but the overlapping laptop/phone layout can still overflow

**EngineeringMockup.tsx:**
- Annotation elements positioned with negative offsets (`-left-16`, `-right-4`)
- Can extend beyond container on mobile

### 3. Service Card Containers
The bento grid service cards have `overflow-visible` which allows mockup elements to escape their bounds, potentially causing horizontal scroll.

## Solution

### Phase 1: Hero Card Position Refinement
Update the mobile card positions in `Hero.tsx` to use smaller, proportional offsets that stay within the viewport on all screen sizes.

**Changes:**
- Reduce mobile card X/Y offsets proportionally
- Add `overflow-hidden` to the card container on mobile
- Add max-width constraints to card text

### Phase 2: MobileMockup Responsive Fix
Update `MobileMockup.tsx` to contain floating cards within bounds on smaller screens.

**Changes:**
- Hide side cards on extra-small screens (below `sm`)
- Reduce negative offset values for tablet screens
- Add `overflow-hidden` wrapper

### Phase 3: AIEmployeeMockup Containment
Update `AIEmployeeMockup.tsx` to scale the entire mockup on smaller screens.

**Changes:**
- Add responsive scaling wrapper similar to TicketingMockup
- Reduce orbit radius further on extra-small screens

### Phase 4: EngineeringMockup Responsive Annotations
Update `EngineeringMockup.tsx` to hide or reposition annotations on mobile.

**Changes:**
- Hide side annotations on mobile (`hidden md:block`)
- Reposition bottom annotation to stay within bounds

### Phase 5: Service Card Container Overflow Control
Update service card containers in `LandingPage.tsx` to prevent mockup overflow from causing horizontal scroll.

**Changes:**
- Change `overflow-visible` to `overflow-hidden` on the container sections
- Add `overflow-x-hidden` to the services section wrapper
- Keep `overflow-visible` only on direct mockup containers where needed

### Phase 6: Global Overflow Prevention
Add CSS rules to prevent horizontal scroll at the page level.

**Changes in `index.css`:**
- Add `.overflow-clip-x` utility for overflow prevention
- Ensure `overflow-x: hidden` on key containers

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/Hero.tsx` | Tighter mobile card positions, overflow control |
| `src/components/services/MobileMockup.tsx` | Hide side cards on xs, reduce offsets |
| `src/components/services/AIEmployeeMockup.tsx` | Add responsive scaling wrapper |
| `src/components/services/EngineeringMockup.tsx` | Hide/reposition annotations on mobile |
| `src/components/LandingPage.tsx` | Update card containers with overflow control |
| `src/index.css` | Add overflow utility classes |

## Technical Details

### Hero Card Mobile Positions (Before vs After)
```text
Before:
  topLeft:     { x: -35, y: -105 }
  middleLeft:  { x: 0, y: -115 }
  bottomLeft:  { x: 35, y: -105 }
  
After:
  topLeft:     { x: -20, y: -85 }
  middleLeft:  { x: 0, y: -95 }
  bottomLeft:  { x: 20, y: -85 }
```

### Service Card Container Pattern
```tsx
// Before
<motion.div className="... overflow-visible">

// After
<motion.div className="... overflow-hidden">
  <div className="overflow-visible">
    {/* Mockup content */}
  </div>
</motion.div>
```

### MobileMockup Side Cards Pattern
```tsx
// Before
className="... hidden sm:block"

// After - Already hidden on xs, but reduce offsets
right-[-40px] md:right-[-70px] lg:right-[-110px]
```

## Testing Checklist
After implementation, verify on:
- iPhone SE (320px width)
- iPhone 14 Pro (390px width)
- iPad (768px width)
- Desktop (1920px width)

Check that:
1. No horizontal scrollbar appears
2. Cards don't clip at screen edges
3. Animations work smoothly
4. Content remains readable at all sizes
