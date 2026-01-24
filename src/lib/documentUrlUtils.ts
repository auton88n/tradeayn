/**
 * Utility functions for handling Supabase Storage document URLs
 * Handles normalization of signed URLs to public URLs and provides
 * consistent URL handling across the application.
 */

const SUPABASE_PROJECT_ID = 'dfkoxuokfkttjhfjcecx';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

/**
 * Converts a document URL to use the proxy endpoint
 * This bypasses ad-blocker blocking of Supabase domains
 * 
 * @param url - The original Supabase Storage URL
 * @returns Proxy URL through the edge function
 */
export const toProxyUrl = (url: string): string => {
  if (!url) return url;
  
  // Extract the path from the URL
  // Matches: /storage/v1/object/public/documents/...
  // or: /storage/v1/object/sign/documents/...
  const pathMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/documents\/(.+?)(?:\?|$)/);
  
  if (pathMatch && pathMatch[1]) {
    const filePath = pathMatch[1];
    return `${SUPABASE_URL}/functions/v1/download-document?path=${encodeURIComponent(filePath)}`;
  }
  
  // If we can't extract the path, return normalized URL as fallback
  return normalizeDocumentUrl(url);
};

/**
 * Normalizes a Supabase Storage document URL to use the public endpoint
 * This prevents "Invalid JWT" errors when signed URLs expire
 * 
 * @param url - The original URL (may be signed or public)
 * @returns Normalized public URL
 */
export const normalizeDocumentUrl = (url: string): string => {
  if (!url) return url;
  
  // Convert signed URLs to public URLs
  // From: /storage/v1/object/sign/documents/... 
  // To:   /storage/v1/object/public/documents/...
  let normalized = url.replace(
    /\/storage\/v1\/object\/sign\/documents\//g,
    '/storage/v1/object/public/documents/'
  );
  
  // Strip any token query parameter from public URLs
  // This handles cases where ?token= might still be appended
  if (normalized.includes('/storage/v1/object/public/')) {
    const urlParts = normalized.split('?');
    normalized = urlParts[0];
  }
  
  return normalized;
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
 * Opens a document URL in a new tab using the proxy endpoint
 * This bypasses ad-blocker blocking of Supabase domains
 * 
 * @param url - The document URL to open
 */
export const openDocumentUrl = (url: string): void => {
  // Use proxy URL to bypass ad-blockers
  const proxyUrl = toProxyUrl(url);
  
  // Use anchor-based navigation for better compatibility
  const anchor = document.createElement('a');
  anchor.href = proxyUrl;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  
  // Programmatically click the anchor
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};
