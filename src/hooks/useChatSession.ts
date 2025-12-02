import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ChatHistory, Message, UseChatSessionReturn } from '@/types/dashboard.types';

export const useChatSession = (userId: string): UseChatSessionReturn => {
  const [currentSessionId, setCurrentSessionId] = useState(() => crypto.randomUUID());
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());
  const [showChatSelection, setShowChatSelection] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Load recent chat history
  const loadRecentChats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender, session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading recent chats:', error);
        return;
      }

      if (!data || data.length === 0) {
        setRecentChats([]);
        return;
      }

      // Group messages by session_id
      const sessionGroups: { [key: string]: any[] } = {};

      data.forEach(message => {
        const sessionId = message.session_id;
        // Skip messages without a session_id
        if (!sessionId) return;
        
        if (!sessionGroups[sessionId]) {
          sessionGroups[sessionId] = [];
        }
        sessionGroups[sessionId].push({
          id: message.id,
          content: message.content,
          sender: message.sender as 'user' | 'ayn',
          timestamp: new Date(message.created_at)
        });
      });

      // Convert to ChatHistory format, sorted by most recent session
      const chatHistories: ChatHistory[] = Object.entries(sessionGroups)
        .map(([sessionId, messages]) => {
          // Sort messages chronologically for proper conversation flow
          const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

          // Find the first user message for the title
          const firstUserMessage = sortedMessages.find(msg => msg.sender === 'user');
          const lastMessage = sortedMessages[sortedMessages.length - 1];

          return {
            title: firstUserMessage ? (
              firstUserMessage.content.length > 30 
                ? firstUserMessage.content.substring(0, 30) + '...'
                : firstUserMessage.content
            ) : 'Chat Session',
            lastMessage: lastMessage.content.length > 50
              ? lastMessage.content.substring(0, 50) + '...'
              : lastMessage.content,
            timestamp: lastMessage.timestamp,
            messages: sortedMessages,
            sessionId: sessionId
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort by most recent
        .slice(0, 10); // Limit to latest 10 sessions

      setRecentChats(chatHistories);
    } catch (error) {
      console.error('Error loading recent chats:', error);
    }
  }, [userId]);

  // Start a new chat session
  const startNewChat = useCallback(() => {
    const newSessionId = crypto.randomUUID();
    setCurrentSessionId(newSessionId);
    
    toast({
      title: t('common.newChat'),
      description: t('dashboard.newChatDesc') || 'You can now start a fresh conversation with AYN.',
    });
  }, [toast, t]);

  // Load an existing chat
  const loadChat = useCallback((chatHistory: ChatHistory): Message[] => {
    setCurrentSessionId(chatHistory.sessionId as `${string}-${string}-${string}-${string}-${string}`);
    
    toast({
      title: t('dashboard.chatLoaded') || 'Chat Loaded',
      description: `${t('dashboard.loadedConversation') || 'Loaded conversation'}: ${chatHistory.title}`,
    });

    return chatHistory.messages;
  }, [toast, t]);

  // Delete selected chats
  const deleteSelectedChats = useCallback(async () => {
    if (selectedChats.size === 0) return;

    try {
      const chatIndicesToDelete = Array.from(selectedChats);
      const messageIdsToDelete: string[] = [];

      // Collect message IDs from selected chats
      chatIndicesToDelete.forEach(index => {
        if (recentChats[index]) {
          messageIdsToDelete.push(...recentChats[index].messages.map(m => m.id));
        }
      });

      // Delete messages from database
      if (messageIdsToDelete.length > 0) {
        const { error } = await supabase
          .from('messages')
          .delete()
          .in('id', messageIdsToDelete);

        if (error) {
          console.error('Error deleting messages:', error);
          toast({
            title: t('error.deleteError') || 'Error',
            description: t('error.deleteChatsError') || 'Failed to delete some chat messages.',
            variant: "destructive"
          });
          return;
        }
      }

      // Update local state
      const updatedChats = recentChats.filter((_, index) => !selectedChats.has(index));
      setRecentChats(updatedChats);
      setSelectedChats(new Set());
      setShowChatSelection(false);

      toast({
        title: t('dashboard.chatsDeleted') || 'Chats Deleted',
        description: `${t('dashboard.successfullyDeleted') || 'Successfully deleted'} ${selectedChats.size} ${t('dashboard.conversations') || 'conversation(s)'}.`,
      });
    } catch (error) {
      console.error('Error deleting chats:', error);
      toast({
        title: t('error.deleteError') || 'Error',
        description: t('error.deleteChatsError') || 'Failed to delete selected chats.',
        variant: "destructive"
      });
    }
  }, [selectedChats, recentChats, toast, t]);

  // Toggle chat selection
  const toggleChatSelection = useCallback((index: number) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedChats(newSelected);
  }, [selectedChats]);

  // Select all chats
  const selectAllChats = useCallback(() => {
    if (selectedChats.size === recentChats.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(recentChats.map((_, index) => index)));
    }
  }, [selectedChats, recentChats]);

  // Load recent chats on mount
  useEffect(() => {
    loadRecentChats();
  }, [loadRecentChats]);

  return {
    currentSessionId,
    recentChats,
    selectedChats,
    showChatSelection,
    setSelectedChats,
    setShowChatSelection,
    loadRecentChats,
    startNewChat,
    loadChat,
    deleteSelectedChats,
    toggleChatSelection,
    selectAllChats
  };
};
