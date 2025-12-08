import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatHistory, Message, UseChatSessionReturn } from '@/types/dashboard.types';

export const useChatSession = (userId: string): UseChatSessionReturn => {
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());
  const [showChatSelection, setShowChatSelection] = useState(false);
  const lastInitializedUserId = useRef<string | null>(null);
  const { toast } = useToast();

  // Load recent chat history
  const loadRecentChats = useCallback(async () => {
    if (!userId) {
      return;
    }
    
    try {
      
      // Wrap query with 5-second timeout
      const queryPromise = supabase
        .from('messages')
        .select('id, content, created_at, sender, session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      const result = await Promise.race([
        queryPromise,
        new Promise<{ data: null; error: Error }>((resolve) => 
          setTimeout(() => resolve({ data: null, error: new Error('Query timeout after 5s') }), 5000)
        )
      ]);
      
      const { data, error } = result;

      if (error) {
        return;
      }

      if (!data || data.length === 0) {
        setRecentChats([]);
        return;
      }

      // Group messages by session_id
      interface ProcessedMessage {
        id: string;
        content: string;
        sender: 'user' | 'ayn';
        timestamp: Date;
      }
      
      const sessionGroups: { [key: string]: ProcessedMessage[] } = {};

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
      title: 'New Chat',
      description: 'You can now start a fresh conversation with AYN.',
    });
  }, [toast]);

  // Load an existing chat
  const loadChat = useCallback((chatHistory: ChatHistory): Message[] => {
    setCurrentSessionId(chatHistory.sessionId as `${string}-${string}-${string}-${string}-${string}`);
    
    toast({
      title: 'Chat Loaded',
      description: `Loaded conversation: ${chatHistory.title}`,
    });

    return chatHistory.messages;
  }, [toast]);

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

      // Delete messages from database with explicit user_id filter
      if (messageIdsToDelete.length > 0) {
        const { error } = await supabase
          .from('messages')
          .delete()
          .in('id', messageIdsToDelete)
          .eq('user_id', userId);

        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to delete some chat messages.',
            variant: "destructive"
          });
          return;
        }
      }

      // Clear local state first
      setSelectedChats(new Set());
      setShowChatSelection(false);

      // Refresh from database to ensure consistency
      await loadRecentChats();

      toast({
        title: 'Chats Deleted',
        description: `Successfully deleted ${selectedChats.size} conversation(s).`,
      });
    } catch (error) {
      console.error('Error deleting chats:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete selected chats.',
        variant: "destructive"
      });
    }
  }, [selectedChats, recentChats, toast, loadRecentChats, userId]);

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

  // Delete all chats for the user
  const deleteAllChats = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', userId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete all chat history.',
          variant: "destructive"
        });
        return;
      }

      // Clear local state
      setRecentChats([]);
      setSelectedChats(new Set());
      setShowChatSelection(false);

      toast({
        title: 'All Chats Deleted',
        description: 'Your entire chat history has been cleared.',
      });
    } catch (error) {
      console.error('Error deleting all chats:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete chat history.',
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  // Load recent chats on mount and set initial session
  useEffect(() => {
    const initializeSession = async () => {
      // Skip if no user or already initialized for this user
      if (!userId || lastInitializedUserId.current === userId) return;
      
      console.log('[useChatSession] Initializing for user:', userId);
      
      try {
        // Check for most recent session with messages
        const { data, error } = await supabase
          .from('messages')
          .select('session_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) {
          console.error('[useChatSession] Error fetching session:', error);
          toast({
            title: 'Error',
            description: 'Failed to load chat history.',
            variant: "destructive"
          });
          setCurrentSessionId(crypto.randomUUID());
          lastInitializedUserId.current = userId;
          return;
        }
        
        if (data && data.length > 0 && data[0].session_id) {
          console.log('[useChatSession] Found existing session:', data[0].session_id);
          setCurrentSessionId(data[0].session_id);
        } else {
          console.log('[useChatSession] No existing session, creating new one');
          setCurrentSessionId(crypto.randomUUID());
        }
        
        lastInitializedUserId.current = userId;
        await loadRecentChats();
      } catch (err) {
        console.error('[useChatSession] Error initializing:', err);
        setCurrentSessionId(crypto.randomUUID());
        lastInitializedUserId.current = userId;
      }
    };
    
    initializeSession();
  }, [userId, loadRecentChats, toast]);

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
    deleteAllChats,
    toggleChatSelection,
    selectAllChats
  };
};
