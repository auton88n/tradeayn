import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  sessionId?: string;
  status?: 'sending' | 'sent' | 'error';
  isTyping?: boolean;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

interface ChatSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onMessageSelect?: (message: Message) => void;
  onSessionLoad?: (sessionId: string) => void;
}

export const ChatSearchDialog = ({
  isOpen,
  onClose,
  user,
  onMessageSelect,
  onSessionLoad
}: ChatSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender, created_at, session_id')
        .eq('user_id', user.id)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const results: Message[] = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender as 'user' | 'ayn',
        timestamp: new Date(msg.created_at),
        sessionId: msg.session_id
      })) || [];

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search failed',
        description: 'Unable to search messages.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMessageClick = (message: Message) => {
    if (onSessionLoad && message.sessionId) {
      onSessionLoad(message.sessionId);
    }
    if (onMessageSelect) {
      onMessageSelect(message);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Messages
          </DialogTitle>
          <DialogDescription>
            Search through all your conversations with AYN.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search your messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          <ScrollArea className="h-[400px]">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : searchResults.length === 0 && searchQuery.trim() ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages found</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={message.sender === 'user' ? 'default' : 'secondary'}>
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {message.sender === 'user' ? 'You' : 'AYN'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-3">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};