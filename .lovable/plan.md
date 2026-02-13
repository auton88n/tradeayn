

# Update Footer Services to Match Actual Offerings

## Problem
The footer's "Services" column lists engineering sub-categories (Structural Analysis, Estimation, Code Compliance, Terrain Analysis, Event Planning) instead of the platform's actual 6 services.

## Fix
Replace the services list in the footer with the real service names:

1. Premium Content Creator Sites
2. Custom AI Agents
3. Process Automation
4. AI Employees
5. Civil Engineering
6. Smart Ticketing System

## Technical Details

**File:** `src/components/LandingPage.tsx` (lines 845-853)

Replace the current service name array with the correct 6 services, each with EN/AR/FR translations matching the service cards already defined earlier in the file.

