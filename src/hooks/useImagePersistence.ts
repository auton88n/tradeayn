import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Cache for URL mappings to avoid re-saving
const urlCache = new Map<string, string>();

export const useImagePersistence = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDalleUrl = useCallback((url: string): boolean => {
    return url.includes('oaidalleapiprodscus.blob.core.windows.net');
  }, []);

  const getPersistentUrl = useCallback(async (imageUrl: string): Promise<string> => {
    // Check cache first
    if (urlCache.has(imageUrl)) {
      return urlCache.get(imageUrl)!;
    }

    // If not a DALL-E URL, return as-is
    if (!isDalleUrl(imageUrl)) {
      return imageUrl;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('save-generated-image', {
        body: { imageUrl }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        if (data.expired) {
          throw new Error('Image has expired');
        }
        throw new Error(data.error);
      }

      const permanentUrl = data.permanentUrl;
      
      // Cache the mapping
      urlCache.set(imageUrl, permanentUrl);
      
      return permanentUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save image';
      setError(message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [isDalleUrl]);

  const saveImageIfNeeded = useCallback(async (imageUrl: string): Promise<{ url: string; wasSaved: boolean }> => {
    if (!isDalleUrl(imageUrl)) {
      return { url: imageUrl, wasSaved: false };
    }

    try {
      const permanentUrl = await getPersistentUrl(imageUrl);
      return { url: permanentUrl, wasSaved: permanentUrl !== imageUrl };
    } catch {
      return { url: imageUrl, wasSaved: false };
    }
  }, [isDalleUrl, getPersistentUrl]);

  return {
    getPersistentUrl,
    saveImageIfNeeded,
    isDalleUrl,
    isSaving,
    error,
    clearError: () => setError(null)
  };
};

// Utility function for use outside React components
export const persistDalleImage = async (imageUrl: string): Promise<string> => {
  if (!imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
    return imageUrl;
  }

  // Check cache
  if (urlCache.has(imageUrl)) {
    return urlCache.get(imageUrl)!;
  }

  const { data, error } = await supabase.functions.invoke('save-generated-image', {
    body: { imageUrl }
  });

  if (error || data.error) {
    console.error('Failed to persist image:', error || data.error);
    return imageUrl;
  }

  urlCache.set(imageUrl, data.permanentUrl);
  return data.permanentUrl;
};
