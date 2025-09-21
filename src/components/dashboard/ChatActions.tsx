import { ChatExportDialog } from './ChatExportDialog';
import { ChatSearchDialog } from './ChatSearchDialog';
import { FavoriteMessagesDialog } from './FavoriteMessagesDialog';

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
  messages: Message[];
  currentSessionId: string;
  showExportDialog: boolean;
  showSearchDialog: boolean;
  showFavoritesDialog: boolean;
  onExportClose: () => void;
  onSearchClose: () => void;
  onFavoritesClose: () => void;
  onMessageSelect?: (message: Message) => void;
}

export const ChatActions = ({
  messages,
  currentSessionId,
  showExportDialog,
  showSearchDialog,
  showFavoritesDialog,
  onExportClose,
  onSearchClose,
  onFavoritesClose,
  onMessageSelect
}: ChatActionsProps) => {
  return (
    <>
      <ChatExportDialog
        isOpen={showExportDialog}
        onClose={onExportClose}
        messages={messages}
        sessionId={currentSessionId}
      />
      
      <ChatSearchDialog
        isOpen={showSearchDialog}
        onClose={onSearchClose}
        messages={messages}
        onMessageSelect={onMessageSelect}
      />
      
      <FavoriteMessagesDialog
        isOpen={showFavoritesDialog}
        onClose={onFavoritesClose}
      />
    </>
  );
};