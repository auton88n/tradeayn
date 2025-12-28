import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AYNMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AYNResponse {
  content: string;
  model?: string;
  wasFallback?: boolean;
  intent?: string;
}

interface UseAYNOptions {
  onStreamChunk?: (chunk: string) => void;
  onComplete?: (response: AYNResponse) => void;
  onError?: (error: Error) => void;
}

export function useAYN(options: UseAYNOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<AYNResponse | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    context?: {
      intent?: string;
      language?: string;
      conversationHistory?: AYNMessage[];
      fileContext?: string;
    }
  ): Promise<AYNResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const messages: AYNMessage[] = context?.conversationHistory || [];
      messages.push({ role: 'user', content: message });

      const { data, error: invokeError } = await supabase.functions.invoke('ayn-unified', {
        body: {
          messages,
          intent: context?.intent,
          language: context?.language,
          context: {
            fileContext: context?.fileContext,
          },
          stream: false,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to get response from AYN');
      }

      const aynResponse: AYNResponse = {
        content: data?.content || data?.message || '',
        model: data?.model,
        wasFallback: data?.wasFallback,
        intent: data?.intent,
      };

      setResponse(aynResponse);
      options.onComplete?.(aynResponse);
      return aynResponse;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const streamMessage = useCallback(async (
    message: string,
    context?: {
      intent?: string;
      language?: string;
      conversationHistory?: AYNMessage[];
      fileContext?: string;
    }
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const messages: AYNMessage[] = context?.conversationHistory || [];
      messages.push({ role: 'user', content: message });

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ayn-unified`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages,
            intent: context?.intent,
            language: context?.language,
            context: {
              fileContext: context?.fileContext,
            },
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Stream error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                options.onStreamChunk?.(content);
              }
            } catch {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }

      const aynResponse: AYNResponse = {
        content: fullContent,
      };

      setResponse(aynResponse);
      options.onComplete?.(aynResponse);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResponse = useCallback(() => {
    setResponse(null);
  }, []);

  return {
    sendMessage,
    streamMessage,
    isLoading,
    error,
    response,
    clearError,
    clearResponse,
  };
}

export default useAYN;
