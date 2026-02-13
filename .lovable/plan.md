
# Link Footer Services to Their Pages

## Problem
The six services listed in the footer's "Services" column are plain text with no navigation links.

## Fix

**File:** `src/components/LandingPage.tsx` (lines 844-855)

Convert each service from a plain string to an object with label + route, then render as `<Link>` elements using react-router-dom.

The mapping will be:
- Premium Content Creator Sites -> `/services/content-creator-sites`
- Custom AI Agents -> `/services/ai-agents`
- Process Automation -> `/services/automation`
- AI Employees -> `/services/ai-employee`
- Civil Engineering -> `/services/civil-engineering`
- Smart Ticketing System -> `/services/ticketing`

Each `<li>` will use a `<Link to={route}>` instead of plain text, with `hover:text-foreground transition-colors` styling to match the other footer links.

### Technical Details

Replace the current string array (lines 845-854) with an array of `{ label, route }` objects and map them to `<Link>` components. The routes are already defined in `src/constants/routes.ts` under `ROUTES.SERVICES`.
