import DOMPurify from 'dompurify';

// Create a single DOMPurify instance configured once
const purify = DOMPurify(window);

// Configure DOMPurify once with safe settings
purify.setConfig({
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'u', 'strike', 'del', 'mark',
    'code', 'pre', 'p', 'br', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'hr',
    'blockquote'
  ],
  ALLOWED_ATTR: [
    'class', 'title'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_TRUSTED_TYPE: false,
  SANITIZE_DOM: true,
  FORCE_BODY: false,
});

// Add hook to prevent DOM clobbering attacks
purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.hasAttribute('id') && node.getAttribute('id')?.match(/^(constructor|prototype|__proto__)$/i)) {
    node.removeAttribute('id');
  }
  if (node.hasAttribute('name') && node.getAttribute('name')?.match(/^(constructor|prototype|__proto__)$/i)) {
    node.removeAttribute('name');
  }
});

/**
 * Sanitize user input with DOMPurify
 */
export const sanitizeWithDOMPurify = (input: string): string => {
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
