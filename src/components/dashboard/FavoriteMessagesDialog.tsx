import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SavedInsight {
  id: string;
  category: string;
  insight_text: string;
  created_at: string;
  tags: string[];
  user_id: string;
}

interface FavoriteMessagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FavoriteMessagesDialog = ({
  isOpen,
  onClose
}: FavoriteMessagesDialogProps) => {
  const [favorites, setFavorites] = useState<SavedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        title: 'Error loading favorites',
        description: 'Failed to load your saved messages.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_insights')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== id));
      toast({
        title: 'Favorite removed',
        description: 'Message removed from favorites.'
      });
    } catch (error) {
      console.error('Error deleting favorite:', error);
      toast({
        title: 'Error removing favorite',
        description: 'Failed to remove message from favorites.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Saved Collection
          </DialogTitle>
          <DialogDescription>
            Your saved messages, insights, and chat sessions. Individual messages are saved from chat responses, while entire conversations are saved from the chat history.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No favorite messages yet</p>
              <p className="text-sm">Save important AI responses to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Saved
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(favorite.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteFavorite(favorite.id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{favorite.category}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {favorite.insight_text}
                  </p>
                  {favorite.tags.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {favorite.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};