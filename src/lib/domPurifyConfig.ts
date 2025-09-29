import DOMPurify from 'dompurify';

/**
 * Configure DOMPurify with safe settings for chat messages
 * Allows markdown formatting while blocking scripts and dangerous attributes
 */
export const configureDOMPurify = () => {
  // Allow specific HTML tags for markdown rendering
  DOMPurify.setConfig({
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'strike', 'del', 'mark',
      'code', 'pre', 'p', 'br', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'hr',
      'blockquote'
    ],
    ALLOWED_ATTR: [
      'class', 'title' // Only allow styling classes and tooltips
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true, // Keep content of blocked tags
    RETURN_TRUSTED_TYPE: false,
    SANITIZE_DOM: true, // Sanitize DOM to prevent mXSS
    FORCE_BODY: false, // Don't wrap in <body>
  });

  // Add hook to prevent DOM clobbering attacks
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Prevent DOM clobbering by removing problematic id/name attributes
    if (node.hasAttribute('id') && node.getAttribute('id')?.match(/^(constructor|prototype|__proto__)$/i)) {
      node.removeAttribute('id');
    }
    if (node.hasAttribute('name') && node.getAttribute('name')?.match(/^(constructor|prototype|__proto__)$/i)) {
      node.removeAttribute('name');
    }
  });

  return DOMPurify;
};

/**
 * Sanitize user input with DOMPurify
 */
export const sanitizeWithDOMPurify = (input: string): string => {
  const purify = configureDOMPurify();
  return purify.sanitize(input, {
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  }) as string;
};

/**
 * Sanitize and validate user message content
 * Combines DOMPurify with additional validation
 */
export const sanitizeMessageContent = (content: string): string => {
  // First pass: DOMPurify sanitization
  let sanitized = sanitizeWithDOMPurify(content);
  
  // Second pass: Remove any remaining dangerous patterns
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return sanitized;
};
