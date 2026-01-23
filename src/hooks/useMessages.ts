import { useState, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { detectLanguage } from '@/utils/languageDetection';
import type { 
  Message, 
  FileAttachment, 
  UserProfile, 
  AIMode,
  UseMessagesReturn,
  WebhookPayload,
  EmotionHistoryEntry,
  MoodPattern,
  LABResponse
} from '@/types/dashboard.types';

// Same constants from useAuth.ts - direct REST API bypasses deadlocking Supabase client
const SUPABASE_URL = 'https://dfkoxuokfkttjhfjcecx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw';

// Maximum messages allowed per chat session
const MAX_MESSAGES_PER_CHAT = 100;

// Silent retry helper - try twice before giving up
const fetchWithRetry = async (
  url: string, 
  options: RequestInit, 
  retries = 2
): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 429 || response.status === 402) return response;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
    }
  }
  throw new Error('Request failed after retries');
};

// Helper for direct REST API calls (bypasses deadlocking Supabase client)
const fetchFromSupabase = async (
  endpoint: string,
  token: string
): Promise<any> => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export const useMessages = (
  sessionId: string,
  userId: string,
  userEmail: string,
  selectedMode: AIMode,
  userProfile: UserProfile | null,
  allowPersonalization: boolean,
  session: Session | null
): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSuggestedEmotion, setLastSuggestedEmotion] = useState<string | null>(null);
  const [moodPattern, setMoodPattern] = useState<MoodPattern | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionHistoryEntry[]>([]);
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false);
  const { toast } = useToast();

  // Load messages from database for current session using direct REST API
  const loadMessages = useCallback(async () => {
    if (!session || !sessionId) {
      console.warn('[useMessages] No session or sessionId available');
      return;
    }
    
    // Mark as loading from history to prevent auto-showing response bubbles
    setIsLoadingFromHistory(true);
    
    try {
      const data = await fetchFromSupabase(
        `messages?user_id=eq.${userId}&session_id=eq.${sessionId}&select=id,content,created_at,sender,attachment_url,attachment_name,attachment_type&order=created_at.asc`,
        session.access_token
      );

      if (data && data.length > 0) {
        const chatMessages: Message[] = data.map((msg: {
          id: string;
          content: string;
          created_at: string;
          sender: string;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_type: string | null;
        }) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as 'user' | 'ayn',
          timestamp: new Date(msg.created_at),
          status: 'sent',
          attachment: msg.attachment_url ? {
            url: msg.attachment_url,
            name: msg.attachment_name || 'Attachment',
            type: msg.attachment_type || 'unknown'
          } : undefined
        }));

        // Deduplicate by ID and sort chronologically
        const uniqueMessages = Array.from(
          new Map(chatMessages.map(m => [m.id, m])).values()
        ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        setMessages(uniqueMessages);
      }
    } catch (error) {
      console.error('[useMessages] Error loading messages:', error);
      // Silent fail - messages will be empty
    } finally {
      // Reset after a short delay to allow effects to check the flag
      setTimeout(() => {
        setIsLoadingFromHistory(false);
      }, 100);
    }
  }, [userId, sessionId, session]);

  // Send message with optional file attachment - using direct fetch() to avoid deadlocks
  const sendMessage = useCallback(async (
    content: string,
    attachment: FileAttachment | null = null
  ) => {
    // Show thinking state IMMEDIATELY - before any validation
    console.log('[useMessages] sendMessage called:', { content: content.substring(0, 50), hasAttachment: !!attachment });
    setIsTyping(true);

    if (!session) {
      console.warn('[useMessages] No session - aborting');
      setIsTyping(false);
      toast({
        title: "Session Error",
        description: "Please sign in again to continue.",
        variant: "destructive"
      });
      return;
    }

    // Check chat message limit
    if (messages.length >= MAX_MESSAGES_PER_CHAT) {
      console.warn('[useMessages] Message limit reached');
      setIsTyping(false);
      toast({
        title: "Limit reached",
        description: "Start a new chat to continue.",
        variant: "destructive"
      });
      return;
    }

    // Check usage limits via direct REST API call
    try {
      const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_usage`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _user_id: userId,
          _action_type: 'message',
          _count: 1
        })
      });

      if (!rpcResponse.ok) {
        console.warn('[useMessages] Usage check failed');
        setIsTyping(false);
        toast({
          title: "Usage Error",
          description: "Unable to verify usage limits. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const canUse = await rpcResponse.json();

      if (!canUse) {
        console.warn('[useMessages] Usage limit reached');
        setIsTyping(false);
        toast({
          title: "Usage Limit Reached",
          description: "You've reached your monthly message limit. Please contact support.",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error('[useMessages] Usage check error:', error);
      setIsTyping(false);
      toast({
        title: "System Error",
        description: "Unable to process your request. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: content || (attachment ? `📎 ${attachment.name}` : ''),
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
      attachment: attachment || undefined
    };

    // Add to UI immediately with duplicate prevention
    setMessages(prev => {
      if (prev.some(m => m.id === userMessage.id)) return prev;
      return [...prev, userMessage];
    });
    console.log('[useMessages] User message added to UI');

    try {
      // Build message content
      const messageContent = content.trim() || (attachment ? `📎 Attached file: ${attachment.name}` : '');
      
      // Detect intent based on mode and content
      const detectIntent = (): string => {
        if (selectedMode === 'LAB' || selectedMode === 'Vision Lab') return 'image';
        if (selectedMode === 'Civil Engineering') return 'engineering';
        if (selectedMode === 'Research Pro') return 'search';
        if (selectedMode === 'PDF Analyst') return 'files';
        const lower = messageContent.toLowerCase();
        if (/search|find|look up|latest|news/.test(lower)) return 'search';
        if (/beam|column|foundation|slab|calculate|structural/.test(lower)) return 'engineering';
        return 'chat';
      };

      // Build conversation history in ayn-unified format
      const conversationMessages = messages.slice(-5).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add current user message
      conversationMessages.push({
        role: 'user',
        content: messageContent + (attachment ? `\n\n[Attached file: ${attachment.name}]` : '')
      });

      // Build context for ayn-unified
      const context: Record<string, unknown> = {
        buildingCode: userProfile?.business_type ? 'SBC 304-2018' : undefined,
        fileContext: attachment ? {
          name: attachment.name,
          type: attachment.type,
          url: attachment.url
        } : undefined,
        emotionHistory: emotionHistory.slice(-5)
      };

      // Call ayn-unified with timeout and retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const webhookResponse = await fetchWithRetry(`${SUPABASE_URL}/functions/v1/ayn-unified`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationMessages,
          intent: detectIntent(),
          context,
          stream: false
        })
      });

      clearTimeout(timeoutId);

      setIsTyping(false);

      // Handle 429 Rate Limit / Daily Limit Response
      if (webhookResponse.status === 429) {
        const errorData = await webhookResponse.json().catch(() => ({}));
        const isDailyLimit = errorData?.reason === 'daily_limit_reached';
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: isDailyLimit 
            ? "You've reached your daily message limit. Your limit will reset tomorrow. Check your usage in Settings."
            : "You're sending messages too quickly. Please wait a moment before trying again.",
          sender: 'ayn',
          timestamp: new Date(),
          status: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: isDailyLimit ? "Daily Limit Reached" : "Rate Limit Reached",
          description: isDailyLimit 
            ? "You've used all your messages for today. Limit resets tomorrow."
            : "You're sending messages too quickly. Please wait before trying again.",
          variant: "destructive"
        });
        return;
      }

      if (!webhookResponse.ok) {
        throw new Error(`Webhook call failed: ${webhookResponse.status}`);
      }

      const webhookData = await webhookResponse.json();

      // Handle ayn-unified response format
      // Response is: { content, model, wasFallback, intent, emotion } OR { imageUrl, revisedPrompt, model } for images
      const responseContent = webhookData?.content || webhookData?.response || webhookData?.output || '';
      
      // If response is empty, use a warm fallback instead of showing an error
      const response = responseContent.trim() 
        ? responseContent 
        : "Let me think about that differently... Could you try asking again? Sometimes a fresh start helps me give you a better answer! 💭";

      // Extract emotion from backend response - SET IMMEDIATELY for eye to react
      if (webhookData?.emotion) {
        console.log('[useMessages] Backend emotion:', webhookData.emotion);
        setLastSuggestedEmotion(webhookData.emotion);
      } else {
        // Fallback: analyze response content for emotion if backend didn't provide one
        const { analyzeResponseEmotion } = await import('@/utils/emotionMapping');
        const fallbackEmotion = analyzeResponseEmotion(response);
        console.log('[useMessages] Fallback emotion:', fallbackEmotion);
        setLastSuggestedEmotion(fallbackEmotion);
      }

      // Extract LAB data if present (for image generation)
      const labData: LABResponse | undefined = webhookData?.imageUrl ? {
        json: { image_url: webhookData.imageUrl, revised_prompt: webhookData.revisedPrompt || '' },
        text: webhookData.revisedPrompt || '',
        emotion: 'creative',
        raw: JSON.stringify(webhookData),
        hasStructuredData: true
      } : undefined;

      // Create AI response message
      const aynMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ayn',
        timestamp: new Date(),
        isTyping: true,
        ...(labData ? { labData } : {})
      };

      // Add AYN message with duplicate prevention
      setMessages(prev => {
        if (prev.some(m => m.id === aynMessage.id)) return prev;
        return [...prev, aynMessage];
      });

      // Send desktop notification if tab is hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification('AYN', {
            body: response.length > 100 ? response.substring(0, 100) + '...' : response,
            icon: '/favicon.png',
            tag: 'ayn-response', // Prevents duplicate notifications
          });
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch {
          // Silent fail - notifications are non-critical
        }
      }

      // FIRST: Save chat session title BEFORE messages (prevents race condition)
      try {
        const existingSession = await fetch(
          `${SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${sessionId}&user_id=eq.${userId}&select=id`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${session.access_token}`,
            }
          }
        );
        const sessionData = await existingSession.json();
        
        // Create session record with title if it doesn't exist
        if (!sessionData || sessionData.length === 0) {
          const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
          await fetch(`${SUPABASE_URL}/rest/v1/chat_sessions`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              session_id: sessionId,
              user_id: userId,
              title: title
            })
          });
        }
      } catch {
        // Silent fail - title storage is non-critical
      }

      // THEN: Save both messages to database via direct REST API
      // CRITICAL: Both objects MUST have identical keys to avoid PGRST102 error
      const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify([
          {
            user_id: userId,
            session_id: sessionId,
            content: content,
            sender: 'user',
            mode_used: selectedMode,
            attachment_url: attachment?.url || null,
            attachment_name: attachment?.name || null,
            attachment_type: attachment?.type || null
          },
          {
            user_id: userId,
            session_id: sessionId,
            content: response,
            sender: 'ayn',
            mode_used: selectedMode,
            attachment_url: null,
            attachment_name: null,
            attachment_type: null
          }
        ])
      });

      // Check if save was successful
      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('[useMessages] Failed to save messages:', saveResponse.status, errorText);
        toast({
          title: "Save Warning",
          description: "Message may not have been saved. Please refresh if issues persist.",
          variant: "destructive"
        });
      }

      // Check usage and show in-app warning if approaching limit
      try {
        const usageData = await fetchFromSupabase(
          `access_grants?user_id=eq.${userId}&select=current_month_usage,monthly_limit`,
          session.access_token
        );

        if (usageData?.[0]?.monthly_limit && usageData[0].monthly_limit > 0) {
          const currentUsage = usageData[0].current_month_usage || 0;
          const monthlyLimit = usageData[0].monthly_limit;
          const percentageUsed = Math.round((currentUsage / monthlyLimit) * 100);
          const remaining = monthlyLimit - currentUsage;

          if (percentageUsed >= 100) {
            toast({
              title: "Monthly Limit Reached",
              description: `You've used all ${monthlyLimit} messages. Your limit resets next month.`,
              variant: "destructive"
            });
          } else if (percentageUsed >= 90) {
            toast({
              title: "Almost at Limit",
              description: `You've used ${percentageUsed}% of your messages. Only ${remaining} remaining.`,
              variant: "destructive"
            });
          } else if (percentageUsed >= 75) {
            toast({
              title: "Usage Update",
              description: `You've used ${percentageUsed}% of your monthly messages. ${remaining} remaining.`,
            });
          }
        }
      } catch (usageError) {
        // Silent fail - don't disrupt the chat experience
        console.warn('[useMessages] Error checking usage:', usageError);
      }

    } catch (error) {
      setIsTyping(false);

      const isTimeout = error instanceof Error && error.name === 'AbortError';
      
      // Friendly messages that don't blame the system
      const friendlyResponses = isTimeout ? [
        "I'm taking a bit longer to think this through. Want to try asking in a simpler way? I'd love to help! ✨",
        "That's a deep question! Let me catch up - could you try sending it again? 💫"
      ] : [
        "I got a little distracted there! Could you send that again? I'm all ears now 👂",
        "Let's try that again - I want to make sure I give you my best answer! 🌟",
        "Hmm, let me reset my thoughts. Could you ask me one more time? 💭"
      ];
      
      const randomMessage = friendlyResponses[Math.floor(Math.random() * friendlyResponses.length)];
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomMessage,
        sender: 'ayn',
        timestamp: new Date(),
        status: 'sent' // Use 'sent' not 'error' - looks normal to user
      };

      setMessages(prev => [...prev, errorMessage]);
      
      // No toast notification - keep it seamless
    }
  }, [
    userId, 
    userEmail, 
    selectedMode, 
    sessionId, 
    messages, 
    userProfile, 
    allowPersonalization, 
    toast,
    session
  ]);

  // Wrapper to set messages from history with proper flag management
  // This prevents auto-showing ResponseCard when loading from sidebar
  const setMessagesFromHistory = useCallback((newMessages: Message[]) => {
    setIsLoadingFromHistory(true);
    setMessages(newMessages);
    // Reset flag after effects have checked it
    setTimeout(() => {
      setIsLoadingFromHistory(false);
    }, 200);
  }, []);

  // Message limit tracking
  const messageCount = messages.length;
  const hasReachedLimit = messageCount >= MAX_MESSAGES_PER_CHAT;

  return {
    messages,
    isTyping,
    lastSuggestedEmotion,
    moodPattern,
    messageCount,
    hasReachedLimit,
    maxMessages: MAX_MESSAGES_PER_CHAT,
    isLoadingFromHistory,
    loadMessages,
    sendMessage,
    setMessages,
    setMessagesFromHistory
  };
};
