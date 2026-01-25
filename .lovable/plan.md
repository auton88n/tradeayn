
# Fix Dark Button Text on Service Pages

## Problem
On the service pages (AI Employee, AI Agents, Automation, InfluencerSites, Ticketing), outline buttons like "View All Services", "Detailed Form", and "Close" have dark text that is not visible against the dark backgrounds. The text only becomes visible when hovering.

## Root Cause
The Button component's `outline` variant uses `text-foreground` by default, which shows dark text. On these service pages with `bg-neutral-950` dark backgrounds, the text needs to be explicitly set to white.

## Solution
Add `text-white hover:text-white` (or appropriate hover color) to all outline buttons on dark backgrounds across all service pages.

## Files to Modify

### 1. AIEmployee.tsx
- Line 257: "Detailed Form" button - add `text-white hover:text-white`
- Line 301: "Close" button (modal) - add `text-white hover:text-white`

### 2. AIAgents.tsx  
- Line 423: "Close" button (modal) - add `text-white hover:text-white`

### 3. Automation.tsx
- Line 381: "Close" button (modal) - add `text-white hover:text-white`

### 4. InfluencerSites.tsx
- Line 265: "View All Services" button - add `text-white hover:text-white`
- Line 313: "Close" button (modal) - add `text-white hover:text-white`

### 5. Ticketing.tsx
- Line 233: "Apply Now" button - add `text-white hover:text-white`
- Line 343: "Close" button (modal) - add `text-white hover:text-white`

## Technical Details

```text
Before:
<Button variant="outline" className="border-neutral-700 hover:bg-neutral-800">

After:
<Button variant="outline" className="border-neutral-700 hover:bg-neutral-800 text-white hover:text-white">
```

This ensures buttons have white text in their default state and maintain white text on hover, providing consistent visibility on dark backgrounds.

## Notes
- CivilEngineering.tsx already has the fix applied (line 432)
- The AI Agents and Automation pages have "View All Services" buttons that already include `text-white` in their styling
