import DOMPurify from 'dompurify';

/**
 * Sanitizes user input using DOMPurify to prevent XSS attacks.
 * Strips all HTML tags and dangerous content by default.
 */
export function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Sanitizes HTML content, allowing safe markup (bold, italic, links, etc.)
 * but removing dangerous elements like script tags and event handlers.
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input);
}

/**
 * Validates that text doesn't contain malicious patterns.
 * Uses DOMPurify to check if sanitization would change the input.
 */
export function isValidUserInput(input: string): boolean {
  return DOMPurify.sanitize(input) === input;
}
