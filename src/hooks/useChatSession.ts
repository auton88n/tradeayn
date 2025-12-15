import { useState, useCallback, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabaseApi } from '@/lib/supabaseApi';
import { useToast } from '@/hooks/use-toast';
import type { ChatHistory, Message, UseChatSessionReturn } from '@/types/dashboard.types';

export const useChatSession = (userId: string, session: Session | null): UseChatSessionReturn => {
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const lastInitializedUserId = useRef<string | null>(null);
  const { toast } = useToast();

  // Load recent chat history using direct REST API with stored titles
  const loadRecentChats = useCallback(async () => {
    if (!userId || !session) {
      console.warn('[useChatSession] No userId or session available');
      return;
    }
    
    try {
      // Fetch both messages and stored session titles in parallel
      const [messagesData, sessionsData] = await Promise.all([
        supabaseApi.get<Array<{
          id: string;
          content: string;
          created_at: string;
          sender: string;
          session_id: string | null;
        }>>(
          `messages?user_id=eq.${userId}&select=id,content,created_at,sender,session_id&order=created_at.desc&limit=100`,
          session.access_token
        ),
        supabaseApi.get<Array<{ session_id: string; title: string }>>(
          `chat_sessions?user_id=eq.${userId}&select=session_id,title`,
          session.access_token
        )
      ]);

      if (!messagesData || messagesData.length === 0) {
        setRecentChats([]);
        return;
      }

      // Create a map of session_id to stored title
      const storedTitles = new Map<string, string>();
      if (sessionsData) {
        sessionsData.forEach(s => storedTitles.set(s.session_id, s.title));
      }

      // Group messages by session_id
      interface ProcessedMessage {
        id: string;
        content: string;
        sender: 'user' | 'ayn';
        timestamp: Date;
      }
      
      const sessionGroups: { [key: string]: ProcessedMessage[] } = {};

      messagesData.forEach((message) => {
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

      // Convert to ChatHistory format using stored titles
      const chatHistories: ChatHistory[] = Object.entries(sessionGroups)
        .map(([sessionId, messages]) => {
          const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          const lastMessage = sortedMessages[sortedMessages.length - 1];

          // Use stored title first, fallback to first user message
          const storedTitle = storedTitles.get(sessionId);
          const firstUserMessage = sortedMessages.find(msg => msg.sender === 'user');
          let title = storedTitle;
          
          if (!title) {
            title = firstUserMessage 
              ? (firstUserMessage.content.length > 30 
                  ? firstUserMessage.content.substring(0, 30) + '...'
                  : firstUserMessage.content)
              : 'Chat Session';
          }

          // Use first user message for preview (ChatGPT-style - never changes)
          const previewMessage = firstUserMessage || lastMessage;
          
          return {
            title,
            lastMessage: previewMessage.content.length > 50
              ? previewMessage.content.substring(0, 50) + '...'
              : previewMessage.content,
            timestamp: lastMessage.timestamp,
            messages: sortedMessages,
            sessionId: sessionId
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      setRecentChats(chatHistories);
    } catch {
      // Error loading chats
    }
  }, [userId, session]);

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

  // Delete selected chats (messages and session records)
  const deleteSelectedChats = useCallback(async () => {
    if (selectedChats.size === 0) return;

    try {
      const chatIndicesToDelete = Array.from(selectedChats);
      const messageIdsToDelete: string[] = [];
      const sessionIdsToDelete: string[] = [];

      // Collect message IDs and session IDs from selected chats
      chatIndicesToDelete.forEach(index => {
        if (recentChats[index]) {
          messageIdsToDelete.push(...recentChats[index].messages.map(m => m.id));
          if (recentChats[index].sessionId) {
            sessionIdsToDelete.push(recentChats[index].sessionId);
          }
        }
      });

      if (session) {
        // Delete messages and chat_sessions records in parallel
        await Promise.all([
          // Delete messages
          ...messageIdsToDelete.map(id =>
            supabaseApi.delete(
              `messages?id=eq.${id}&user_id=eq.${userId}`,
              session.access_token
            )
          ),
          // Delete chat_sessions records
          ...sessionIdsToDelete.map(sessionId =>
            supabaseApi.delete(
              `chat_sessions?session_id=eq.${sessionId}&user_id=eq.${userId}`,
              session.access_token
            )
          )
        ]);
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
  }, [selectedChats, recentChats, toast, loadRecentChats, userId, session]);

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

  // Delete all chats for the user (messages and session records)
  const deleteAllChats = useCallback(async () => {
    if (!session) return;
    
    try {
      // Delete both messages and chat_sessions in parallel
      await Promise.all([
        supabaseApi.delete(
          `messages?user_id=eq.${userId}`,
          session.access_token
        ),
        supabaseApi.delete(
          `chat_sessions?user_id=eq.${userId}`,
          session.access_token
        )
      ]);

      // Clear local state
      setRecentChats([]);
      setSelectedChats(new Set());
      setShowChatSelection(false);

      toast({
        title: 'All Chats Deleted',
        description: 'Your entire chat history has been cleared.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete chat history.',
        variant: "destructive"
      });
    }
  }, [userId, toast, session]);

  // Load recent chats on mount and set initial session using REST API - PARALLELIZED
  useEffect(() => {
    let cancelled = false;
    
    const initializeSession = async () => {
      // Skip if no user or already initialized for this user
      if (!userId || lastInitializedUserId.current === userId) return;
      
      // Skip if no session available
      if (!session) {
        setCurrentSessionId(crypto.randomUUID());
        lastInitializedUserId.current = userId;
        setIsLoadingChats(false);
        return;
      }
      
      setIsLoadingChats(true);
      
      try {
        // PARALLEL QUERIES - fetch all at once for speed
        const [latestSessionData, recentMessagesData, sessionsData] = await Promise.all([
          // Query 1: Get latest session_id
          supabaseApi.get<Array<{ session_id: string }>>(
            `messages?user_id=eq.${userId}&select=session_id&order=created_at.desc&limit=1`,
            session.access_token
          ),
          // Query 2: Get recent messages (reduced from 100 to 50)
          supabaseApi.get<Array<{
            id: string;
            content: string;
            created_at: string;
            sender: string;
            session_id: string | null;
          }>>(
            `messages?user_id=eq.${userId}&select=id,content,created_at,sender,session_id&order=created_at.desc&limit=50`,
            session.access_token
          ),
          // Query 3: Get stored session titles
          supabaseApi.get<Array<{ session_id: string; title: string }>>(
            `chat_sessions?user_id=eq.${userId}&select=session_id,title`,
            session.access_token
          )
        ]);
        
        if (cancelled) return;
        
        // Set current session ID
        if (latestSessionData && latestSessionData.length > 0 && latestSessionData[0].session_id) {
          setCurrentSessionId(latestSessionData[0].session_id);
        } else {
          setCurrentSessionId(crypto.randomUUID());
        }
        
        // Create a map of session_id to stored title
        const storedTitles = new Map<string, string>();
        if (sessionsData) {
          sessionsData.forEach(s => storedTitles.set(s.session_id, s.title));
        }
        
        // Process recent messages inline (same logic as loadRecentChats)
        if (recentMessagesData && recentMessagesData.length > 0) {
          interface ProcessedMessage {
            id: string;
            content: string;
            sender: 'user' | 'ayn';
            timestamp: Date;
          }
          
          const sessionGroups: { [key: string]: ProcessedMessage[] } = {};

          recentMessagesData.forEach((message) => {
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

          const chatHistories: ChatHistory[] = Object.entries(sessionGroups)
            .map(([sessionId, messages]) => {
              const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              const lastMessage = sortedMessages[sortedMessages.length - 1];

              // Use stored title first, fallback to first user message
              const storedTitle = storedTitles.get(sessionId);
              let title = storedTitle;
              
              if (!title) {
                const firstUserMessage = sortedMessages.find(msg => msg.sender === 'user');
                title = firstUserMessage 
                  ? (firstUserMessage.content.length > 30 
                      ? firstUserMessage.content.substring(0, 30) + '...'
                      : firstUserMessage.content)
                  : 'Chat Session';
              }

              return {
                title,
                lastMessage: lastMessage.content.length > 50
                  ? lastMessage.content.substring(0, 50) + '...'
                  : lastMessage.content,
                timestamp: lastMessage.timestamp,
                messages: sortedMessages,
                sessionId: sessionId
              };
            })
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);

          if (!cancelled) {
            setRecentChats(chatHistories);
          }
        } else {
          if (!cancelled) {
            setRecentChats([]);
          }
        }
        
        lastInitializedUserId.current = userId;
      } catch {
        if (!cancelled) {
          setCurrentSessionId(crypto.randomUUID());
          setRecentChats([]);
        }
        lastInitializedUserId.current = userId;
      } finally {
        if (!cancelled) {
          setIsLoadingChats(false);
        }
      }
    };
    
    initializeSession();
    
    return () => { cancelled = true; };
  }, [userId, session]);

  return {
    currentSessionId,
    recentChats,
    isLoadingChats,
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
