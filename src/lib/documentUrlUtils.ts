/**
 * Document URL utilities - simplified for base64 data URLs
 * Data URLs are ad-blocker proof since they're inline content
 */

/**
 * Check if URL is a base64 data URL
 */
export const isDataUrl = (url: string): boolean => {
  return url?.startsWith('data:');
};

/**
 * Downloads a document from a data URL or regular URL
 * @param url - The document URL (data URL or http URL)
 * @param filename - Optional filename for the download
 */
export const openDocumentUrl = async (url: string, filename?: string): Promise<void> => {
  if (!url) return;
  
  const name = filename || 'document';

  // Data URLs: direct anchor download (already works)
  if (url.startsWith('data:')) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return;
  }

  // HTTPS URLs: fetch as blob to avoid browser navigation / ad-blocker issues
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(blobUrl);
};

/**
 * Checks if a URL is a document URL (PDF or Excel)
 */
export const isDocumentUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Data URLs
  if (url.startsWith('data:application/pdf') || 
      url.startsWith('data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    return true;
  }
  
  // Supabase storage URLs
  if (url.includes('supabase.co/storage/v1/object')) {
    return true;
  }
  
  // HTTP URLs with document extensions
  return url.includes('.pdf') || url.includes('.xlsx') || url.includes('.xls');
};

/**
 * Check if a URL points to Supabase storage
 */
export const isSupabaseStorageUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('supabase.co/storage/v1/object');
};

/**
 * Extracts all document links from content and returns the best one.
 * Priority: data URLs > public URLs, and last match wins for duplicates.
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
  
  // Match document links in these formats:
  // 1. 📄 [Title](url) or 📊 [Title](url) - with emojis
  // 2. [Download here](url) or [Download](url) - simple download links
  const emojiRegex = /[📄📊]\s*\[([^\]]+)\]\(((?:https?:\/\/[^\s)]+|data:[^\s)]+))\)/g;
  const downloadRegex = /\[([Dd]ownload[^\]]*|[Cc]lick here[^\]]*)\]\(((?:https?:\/\/[^\s)]+|data:[^\s)]+))\)/g;
  // Generic fallback: any markdown link pointing to a document URL
  const genericDocRegex = /\[([^\]]+)\]\(((?:https?:\/\/[^\s)]*(?:\.pdf|\.xlsx|\.xls|supabase\.co\/storage\/v1\/object)[^\s)]*|data:application\/(?:pdf|vnd\.openxmlformats[^\s)]+)[^\s)]*))\)/g;
  
  const matches: Array<{ title: string; url: string; type: 'pdf' | 'excel' }> = [];

  // Check emoji links first
  let match;
  while ((match = emojiRegex.exec(content)) !== null) {
    const url = match[2];
    const isExcel = content.slice(Math.max(0, match.index - 5), match.index + 1).includes('📊') 
                    || url.includes('.xlsx')
                    || url.includes('spreadsheetml.sheet');
    matches.push({
      title: match[1],
      url: url,
      type: isExcel ? 'excel' : 'pdf'
    });
  }
  
  // Check "Download ..." / "Click here ..." style links
  while ((match = downloadRegex.exec(content)) !== null) {
    const url = match[2];
    const isExcel = url.includes('.xlsx') || url.includes('.xls') || url.includes('spreadsheetml.sheet');
    matches.push({
      title: match[1],
      url: url,
      type: isExcel ? 'excel' : 'pdf'
    });
  }

  // Generic fallback: any link to a document URL
  while ((match = genericDocRegex.exec(content)) !== null) {
    const url = match[2];
    // Skip if already captured
    if (matches.some(m => m.url === url)) continue;
    const isExcel = url.includes('.xlsx') || url.includes('.xls') || url.includes('spreadsheetml.sheet');
    matches.push({
      title: match[1],
      url: url,
      type: isExcel ? 'excel' : 'pdf'
    });
  }
  
  if (matches.length === 0) return null;
  
  // Priority: prefer data URLs (they work with ad-blockers)
  const dataUrlMatch = matches.find(m => m.url.startsWith('data:'));
  if (dataUrlMatch) {
    return dataUrlMatch;
  }
  
  // Otherwise take the last match (most recent)
  return matches[matches.length - 1];
};

// Legacy exports for backward compatibility (deprecated)
export const normalizeDocumentUrl = (url: string): string => url;
export const toProxyUrl = (url: string): string => url;
export const isDocumentStorageUrl = isDocumentUrl;
