import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ChatHistory, Message, UseChatSessionReturn } from '@/types/dashboard.types';

const CHATS_PER_PAGE = 10;

export const useChatSession = (userId: string): UseChatSessionReturn => {
  const [currentSessionId, setCurrentSessionId] = useState(() => crypto.randomUUID());
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [hasMoreChats, setHasMoreChats] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Track loaded session count for pagination
  const loadedSessionsRef = useRef(0);
  // Guard to prevent duplicate concurrent calls
  const isLoadingRef = useRef(false);
  // Debounce timer for realtime updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent chat history with pagination
  const loadRecentChats = useCallback(async (reset = true) => {
    if (!userId) return;
    // Prevent duplicate concurrent calls
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    
    try {
      setError(null);
      if (reset) {
        setIsLoadingChats(true);
        loadedSessionsRef.current = 0;
      }
      
      // Fetch messages with timeout
      const queryPromise = supabase
        .from('messages')
        .select('id, content, created_at, sender, session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200); // Fetch more to ensure we have enough sessions
      
      // Resolve with error object instead of rejecting to match Supabase response format
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => 
        setTimeout(() => resolve({ 
          data: null, 
          error: new Error('Request timeout - please try again') 
        }), 8000)
      );
      
      const { data, error: queryError } = await Promise.race([queryPromise, timeoutPromise]);

      if (queryError) throw queryError;

      if (!data || data.length === 0) {
        setRecentChats([]);
        setHasMoreChats(false);
        return;
      }

      // Fetch pinned sessions
      const { data: pinnedData } = await supabase
        .from('pinned_sessions')
        .select('session_id')
        .eq('user_id', userId);
      
      const pinnedSet = new Set(pinnedData?.map(p => p.session_id) || []);

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

      // Convert to ChatHistory format with isPinned flag
      const allChats: ChatHistory[] = Object.entries(sessionGroups)
        .map(([sessionId, messages]) => {
          const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
            sessionId: sessionId,
            isPinned: pinnedSet.has(sessionId)
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // For reset, show first page; for append, add next page
      const startIndex = reset ? 0 : loadedSessionsRef.current;
      const endIndex = startIndex + CHATS_PER_PAGE;
      const pageChats = allChats.slice(startIndex, endIndex);
      
      loadedSessionsRef.current = endIndex;
      setHasMoreChats(endIndex < allChats.length);

      if (reset) {
        setRecentChats(pageChats);
      } else {
        setRecentChats(prev => [...prev, ...pageChats]);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chats';
      console.error('Error loading recent chats:', err);
      setError(errorMessage);
      
      toast({
        title: "Failed to load chats",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoadingChats(false);
      isLoadingRef.current = false;
    }
  }, [userId, toast]);

  // Load more chats (pagination)
  const loadMoreChats = useCallback(async () => {
    if (!hasMoreChats || isLoadingMore) return;
    
    setIsLoadingMore(true);
    await loadRecentChats(false);
    setIsLoadingMore(false);
  }, [hasMoreChats, isLoadingMore, loadRecentChats]);

  // Pin a chat session
  const pinChat = useCallback(async (sessionId: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('pinned_sessions')
        .insert({ user_id: userId, session_id: sessionId });
      
      if (error) throw error;
      
      // Update local state immediately
      setRecentChats(prev => prev.map(chat => 
        chat.sessionId === sessionId ? { ...chat, isPinned: true } : chat
      ));
      
      toast({ title: "Chat pinned" });
    } catch (err) {
      console.error('Failed to pin chat:', err);
      toast({ 
        title: "Failed to pin chat", 
        variant: "destructive" 
      });
    }
  }, [userId, toast]);

  // Unpin a chat session
  const unpinChat = useCallback(async (sessionId: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('pinned_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('session_id', sessionId);
      
      if (error) throw error;
      
      // Update local state immediately
      setRecentChats(prev => prev.map(chat => 
        chat.sessionId === sessionId ? { ...chat, isPinned: false } : chat
      ));
      
      toast({ title: "Chat unpinned" });
    } catch (err) {
      console.error('Failed to unpin chat:', err);
      toast({ 
        title: "Failed to unpin chat", 
        variant: "destructive" 
      });
    }
  }, [userId, toast]);

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
      const sessionIdsToDelete: string[] = [];

      chatIndicesToDelete.forEach(index => {
        if (recentChats[index]) {
          messageIdsToDelete.push(...recentChats[index].messages.map(m => m.id));
          sessionIdsToDelete.push(recentChats[index].sessionId);
        }
      });

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
        
        // Also delete any pinned references
        if (sessionIdsToDelete.length > 0) {
          await supabase
            .from('pinned_sessions')
            .delete()
            .eq('user_id', userId)
            .in('session_id', sessionIdsToDelete);
        }
      }

      setSelectedChats(new Set());
      setShowChatSelection(false);
      await loadRecentChats();

      toast({
        title: 'Chats Deleted',
        description: `Successfully deleted ${selectedChats.size} conversation(s).`,
      });
    } catch (err) {
      console.error('Error deleting chats:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete selected chats.',
        variant: "destructive"
      });
    }
  }, [selectedChats, recentChats, userId, toast, loadRecentChats]);

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
      // Delete all pinned sessions first
      await supabase
        .from('pinned_sessions')
        .delete()
        .eq('user_id', userId);
        
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

      setRecentChats([]);
      setSelectedChats(new Set());
      setShowChatSelection(false);
      setHasMoreChats(false);

      toast({
        title: 'All Chats Deleted',
        description: 'Your entire chat history has been cleared.',
      });
    } catch (err) {
      console.error('Error deleting all chats:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete chat history.',
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  // Load recent chats on mount
  useEffect(() => {
    loadRecentChats();
  }, [loadRecentChats]);

  // Real-time sync for cross-tab updates
  useEffect(() => {
    if (!userId) return;
    
    const subscription = supabase
      .channel('recent-chats-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Debounce realtime updates to prevent rapid-fire reloads
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            loadRecentChats();
          }, 500);
        }
      )
      .subscribe();
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(subscription);
    };
  }, [userId, loadRecentChats]);

  return {
    currentSessionId,
    recentChats,
    selectedChats,
    showChatSelection,
    setSelectedChats,
    setShowChatSelection,
    loadRecentChats: () => loadRecentChats(true),
    startNewChat,
    loadChat,
    deleteSelectedChats,
    deleteAllChats,
    toggleChatSelection,
    selectAllChats,
    // Pagination
    loadMoreChats,
    hasMoreChats,
    isLoadingMore,
    isLoadingChats,
    // Pin functionality
    pinChat,
    unpinChat,
    // Error handling
    error
  };
};