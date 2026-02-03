
# Fix: Sitemap Being Served as HTML

## Problem
Google Search Console reports "Sitemap is HTML" because your hosting server returns `index.html` (the React SPA) for all routes, including `/sitemap.xml`.

When Google fetches `https://aynn.io/sitemap.xml`, it receives your React app's HTML instead of the actual XML file.

## Root Cause
Single-page application (SPA) hosts typically have a catch-all rule that serves `index.html` for any route to support client-side routing. This accidentally catches requests for static files like `sitemap.xml`.

## Solution
Add a `public/_redirects` file with explicit rules to serve static files directly before the SPA catch-all rule kicks in.

### File to create: `public/_redirects`

```text
# Serve static files directly (before SPA catch-all)
/sitemap.xml    /sitemap.xml    200
/robots.txt     /robots.txt     200
/favicon.ico    /favicon.ico    200
/favicon.png    /favicon.png    200

# SPA catch-all - serve index.html for all other routes
/*    /index.html   200
```

## How This Works
1. Requests to `/sitemap.xml` → served directly as XML file (200)
2. Requests to `/robots.txt` → served directly as text file (200)
3. All other requests → served as `index.html` for React routing (200)

## After Publishing
1. Wait a few minutes for the deployment to complete
2. Test by visiting `https://aynn.io/sitemap.xml` directly in your browser - you should see raw XML, not your website
3. Go back to Google Search Console and resubmit the sitemap
4. The error should be resolved

## Technical Notes
- The `_redirects` file format is used by Lovable's hosting infrastructure
- The `200` status code means "serve this file" (as opposed to an actual redirect)
- Order matters: specific rules must come before the catch-all `/*` rule
