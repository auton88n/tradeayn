/**
 * Security utilities for input validation and sanitization
 */

// HTML entities to prevent XSS attacks
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes HTML entities to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"'/]/g, (match) => HTML_ENTITIES[match] || match);
}

/**
 * Sanitizes user input by removing potentially dangerous content
 */
export function sanitizeUserInput(input: string): string {
  // Remove script tags and event handlers
  let sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');

  // Escape remaining HTML
  return escapeHtml(sanitized);
}

/**
 * Validates that text doesn't contain malicious patterns
 */
export function isValidUserInput(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}
