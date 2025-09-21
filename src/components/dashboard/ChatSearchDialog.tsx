import { useState, useEffect, useCallback } from 'react';
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
import { Search, MessageSquare, Loader2 } from 'lucide-react';
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
  const [resultCount, setResultCount] = useState(0);
  const { toast } = useToast();

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setResultCount(0);
      return;
    }

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
      setResultCount(results.length);
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
  }, [user.id, toast]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Focus search input if dialog is open
        if (isOpen) {
          const input = document.querySelector('#search-input') as HTMLInputElement;
          if (input) input.focus();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

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
            {resultCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {resultCount} result{resultCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Search through your conversation history with AYN. Use Ctrl+K to quickly access search.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Type to search your messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

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