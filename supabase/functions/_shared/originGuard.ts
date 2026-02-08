const ALLOWED_ORIGINS = [
  'https://aynn.io',
  'https://www.aynn.io',
  'https://ayn-insight-forge.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

/**
 * Validates the Origin header against the whitelist.
 * Allows requests with NO Origin (server-to-server, Postman).
 * Blocks requests where Origin IS present but doesn't match.
 */
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get('Origin');
  if (!origin) return true; // No origin = not a browser CSRF
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Returns the appropriate Access-Control-Allow-Origin value.
 * If the request origin is allowed, echo it back; otherwise use the primary origin.
 */
export function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

export { ALLOWED_ORIGINS };
