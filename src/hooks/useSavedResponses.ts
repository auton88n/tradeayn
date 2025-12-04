import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SavedResponse {
  id: string;
  user_id: string;
  content: string;
  mode: string | null;
  emotion: string | null;
  session_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export const useSavedResponses = () => {
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSavedResponses = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_responses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedResponses(data || []);
    } catch (err) {
      console.error('Error loading saved responses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveResponse = useCallback(async (
    content: string,
    mode?: string,
    emotion?: string,
    sessionId?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save responses');
        return false;
      }

      // Generate a title from first 50 chars of content
      const title = content.slice(0, 50).trim() + (content.length > 50 ? '...' : '');

      const { error } = await supabase
        .from('saved_responses')
        .insert({
          user_id: user.id,
          content,
          mode: mode || null,
          emotion: emotion || null,
          session_id: sessionId || null,
          title,
        });

      if (error) throw error;
      
      toast.success('Response saved!');
      await loadSavedResponses();
      return true;
    } catch (err) {
      console.error('Error saving response:', err);
      toast.error('Failed to save response');
      return false;
    }
  }, [loadSavedResponses]);

  const deleteSavedResponse = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('saved_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSavedResponses(prev => prev.filter(r => r.id !== id));
      toast.success('Removed from saved');
      return true;
    } catch (err) {
      console.error('Error deleting saved response:', err);
      toast.error('Failed to remove');
      return false;
    }
  }, []);

  const isResponseSaved = useCallback((content: string): string | null => {
    const found = savedResponses.find(r => r.content === content);
    return found ? found.id : null;
  }, [savedResponses]);

  useEffect(() => {
    loadSavedResponses();
  }, [loadSavedResponses]);

  return {
    savedResponses,
    isLoading,
    saveResponse,
    deleteSavedResponse,
    isResponseSaved,
    loadSavedResponses,
  };
};
