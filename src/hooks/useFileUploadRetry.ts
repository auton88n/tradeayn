import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface UploadParams {
  file: string;
  fileName: string;
  fileType: string;
  userId: string;
}

export const useFileUploadRetry = () => {
  const [retryAttempt, setRetryAttempt] = useState(0);

  const uploadWithRetry = async (
    params: UploadParams,
    options: RetryOptions = {}
  ): Promise<{ fileUrl: string; fileName: string; fileType: string }> => {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      setRetryAttempt(attempt);
      
      try {
        const { data, error } = await supabase.functions.invoke('file-upload', {
          body: params
        });

        if (error) throw error;
        if (!data) throw new Error('No data returned from upload');

        setRetryAttempt(0);
        return {
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`Upload attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries) {
          // Calculate exponential backoff delay
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    setRetryAttempt(0);
    throw lastError || new Error('Upload failed after all retries');
  };

  return { uploadWithRetry, retryAttempt };
};
