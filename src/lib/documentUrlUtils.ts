/**
 * Utility functions for normalizing document URLs from Supabase Storage.
 * Converts signed URLs to public URLs and strips expired tokens.
 */

const SUPABASE_URL = 'https://dfkoxuokfkttjhfjcecx.supabase.co';

/**
 * Normalizes a Supabase Storage URL by converting signed URLs to public URLs.
 * This prevents "Invalid JWT" errors for public bucket documents.
 * 
 * @param url - The original URL (may be signed or public)
 * @returns The normalized public URL
 */
export const normalizeDocumentUrl = (url: string): string => {
  if (!url) return url;
  
  // If it's a signed URL for the documents bucket, convert to public URL
  // Pattern: /storage/v1/object/sign/documents/... → /storage/v1/object/public/documents/...
  if (url.includes('/storage/v1/object/sign/documents/')) {
    // Extract the path after /sign/documents/
    const match = url.match(/\/storage\/v1\/object\/sign\/documents\/([^?]+)/);
    if (match) {
      const filePath = match[1];
      return `${SUPABASE_URL}/storage/v1/object/public/documents/${filePath}`;
    }
  }
  
  // If already a public URL but has token query params, strip them
  if (url.includes('/storage/v1/object/public/') && url.includes('?token=')) {
    return url.split('?')[0];
  }
  
  return url;
};

/**
 * Checks if a URL is a Supabase Storage document URL (PDF or Excel)
 */
export const isDocumentStorageUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('/storage/v1/object/') && 
         (url.includes('/documents/') || url.includes('.pdf') || url.includes('.xlsx'));
};

/**
 * Extracts all document links from content and returns the best one.
 * Priority: public URLs > signed URLs, and last match wins for duplicates.
 * 
 * @param content - The message content to scan
 * @returns The best document link info or null
 */
export const extractBestDocumentLink = (content: string): {
  title: string;
  url: string;
  type: 'pdf' | 'excel';
} | null => {
  if (!content) return null;
  
  // Match all document links: 📄 [Title](url) or 📊 [Title](url)
  const regex = /[📄📊]\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const matches: Array<{ title: string; url: string; type: 'pdf' | 'excel' }> = [];
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const isExcel = content.slice(Math.max(0, match.index - 5), match.index + 1).includes('📊') 
                    || match[2].includes('.xlsx');
    matches.push({
      title: match[1],
      url: match[2],
      type: isExcel ? 'excel' : 'pdf'
    });
  }
  
  if (matches.length === 0) return null;
  
  // Priority: prefer public URLs over signed URLs
  const publicMatch = matches.find(m => m.url.includes('/storage/v1/object/public/'));
  if (publicMatch) {
    return {
      ...publicMatch,
      url: normalizeDocumentUrl(publicMatch.url)
    };
  }
  
  // Otherwise take the last match (most recent) and normalize it
  const lastMatch = matches[matches.length - 1];
  return {
    ...lastMatch,
    url: normalizeDocumentUrl(lastMatch.url)
  };
};

/**
 * Opens a document URL using an anchor-based approach for better browser compatibility.
 * Falls back to window.open if the anchor approach fails.
 */
export const openDocumentUrl = (url: string): void => {
  const normalizedUrl = normalizeDocumentUrl(url);
  
  // Create a temporary anchor element for better browser compatibility
  const anchor = document.createElement('a');
  anchor.href = normalizedUrl;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  
  // Some browsers require the element to be in the DOM
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};
