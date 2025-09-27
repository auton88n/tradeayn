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

interface FavoriteChat {
  id: string;
  chat_title: string;
  chat_data: {
    messages: any[];
    lastMessage: string;
    timestamp: string;
  };
  created_at: string;
  session_id: string;
}

interface FavoriteMessagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FavoriteMessagesDialog = ({
  isOpen,
  onClose
}: FavoriteMessagesDialogProps) => {
  const [favorites, setFavorites] = useState<FavoriteChat[]>([]);
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
        .from('favorite_chats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to match our interface
      const typedData: FavoriteChat[] = (data || []).map(item => ({
        ...item,
        chat_data: item.chat_data as {
          messages: any[];
          lastMessage: string;
          timestamp: string;
        }
      }));
      
      setFavorites(typedData);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        title: 'Error loading favorites',
        description: 'Failed to load your saved chats.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('favorite_chats')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== id));
      toast({
        title: 'Favorite removed',
        description: 'Chat removed from favorites.'
      });
    } catch (error) {
      console.error('Error deleting favorite:', error);
      toast({
        title: 'Error removing favorite',
        description: 'Failed to remove chat from favorites.',
        variant: 'destructive'
      });
    }
  };

  const handleLoadChat = (chat: FavoriteChat) => {
    // This function would need to be passed from the parent component
    // For now, we'll just show a toast
    toast({
      title: 'Chat Selected',
      description: `Loading "${chat.chat_title}"...`
    });
    onClose();
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
            Your saved chat conversations. Click the heart icon next to chats in the sidebar to save entire conversations here.
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
              <p>No favorite chats yet</p>
              <p className="text-sm">Click the heart icon next to chats to save them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleLoadChat(favorite)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(favorite.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFavorite(favorite.id);
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{favorite.chat_title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {favorite.chat_data.lastMessage}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{favorite.chat_data.messages.length} messages</span>
                    <span>•</span>
                    <span>Last active: {new Date(favorite.chat_data.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};