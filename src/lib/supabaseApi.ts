/**
 * Centralized Supabase REST API utility
 * Bypasses Supabase client to avoid deadlocks and improve performance
 */

const SUPABASE_URL = 'https://dfkoxuokfkttjhfjcecx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Make a direct REST API call to Supabase
 */
export const supabaseApi = {
  /**
   * GET request to Supabase REST API
   */
  async get<T = unknown>(endpoint: string, token: string, options: Omit<FetchOptions, 'method'> = {}): Promise<T> {
    return this.fetch<T>(endpoint, token, { ...options, method: 'GET' });
  },

  /**
   * POST request to Supabase REST API
   */
  async post<T = unknown>(endpoint: string, token: string, body: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.fetch<T>(endpoint, token, { ...options, method: 'POST', body });
  },

  /**
   * PATCH request to Supabase REST API
   */
  async patch<T = unknown>(endpoint: string, token: string, body: unknown, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.fetch<T>(endpoint, token, { ...options, method: 'PATCH', body });
  },

  /**
   * DELETE request to Supabase REST API
   */
  async delete<T = unknown>(endpoint: string, token: string, options: Omit<FetchOptions, 'method'> = {}): Promise<T> {
    return this.fetch<T>(endpoint, token, { ...options, method: 'DELETE' });
  },

  /**
   * Call an RPC function via REST API
   */
  async rpc<T = unknown>(functionName: string, token: string, params: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RPC error ${response.status}: ${errorText}`);
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  },

  /**
   * Core fetch method with timeout and error handling
   */
  async fetch<T = unknown>(endpoint: string, token: string, options: FetchOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, timeout = 15000, signal } = options;

    // Only create internal controller if no external signal provided
    const internalController = signal ? null : new AbortController();
    const timeoutId = internalController ? setTimeout(() => internalController.abort(), timeout) : null;
    const effectiveSignal = signal || internalController?.signal;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: effectiveSignal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const text = await response.text();
      return (text ? JSON.parse(text) : null) as T;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        // Re-throw AbortError so callers can handle it
        throw error;
      }
      throw error;
    }
  },
};

export { SUPABASE_URL, SUPABASE_ANON_KEY };
