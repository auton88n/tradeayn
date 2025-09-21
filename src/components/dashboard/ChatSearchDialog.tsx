import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

interface ChatSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onMessageSelect?: (message: Message) => void;
}

export const ChatSearchDialog = ({
  isOpen,
  onClose,
  messages,
  onMessageSelect
}: ChatSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = messages.filter(message =>
      message.content.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
  };

  const handleMessageClick = (message: Message) => {
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
            Search through your chat history to find specific messages.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[300px]">
            {searchQuery && searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={message.sender === 'user' ? 'default' : 'secondary'}>
                        {message.sender === 'user' ? 'You' : 'AYN'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-3">
                      {message.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {searchQuery && searchResults.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Found {searchResults.length} message{searchResults.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};