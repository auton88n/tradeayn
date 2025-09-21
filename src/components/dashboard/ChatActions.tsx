import { ChatExportDialog } from './ChatExportDialog';
import { ChatSearchDialog } from './ChatSearchDialog';
import { FavoriteMessagesDialog } from './FavoriteMessagesDialog';
import { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  isTyping?: boolean;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

interface ChatActionsProps {
  user: User;
  showExportDialog: boolean;
  showSearchDialog: boolean;
  showFavoritesDialog: boolean;
  onExportClose: () => void;
  onSearchClose: () => void;
  onFavoritesClose: () => void;
  onMessageSelect?: (message: Message) => void;
  onSessionLoad?: (sessionId: string) => void;
}

export const ChatActions = ({
  user,
  showExportDialog,
  showSearchDialog,
  showFavoritesDialog,
  onExportClose,
  onSearchClose,
  onFavoritesClose,
  onMessageSelect,
  onSessionLoad
}: ChatActionsProps) => {
  return (
    <>
      <ChatExportDialog
        isOpen={showExportDialog}
        onClose={onExportClose}
        user={user}
      />
      
      <ChatSearchDialog
        isOpen={showSearchDialog}
        onClose={onSearchClose}
        user={user}
        onMessageSelect={onMessageSelect}
        onSessionLoad={onSessionLoad}
      />
      
      <FavoriteMessagesDialog
        isOpen={showFavoritesDialog}
        onClose={onFavoritesClose}
      />
    </>
  );
};