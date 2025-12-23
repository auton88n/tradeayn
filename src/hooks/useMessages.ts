import { useState, useCallback } from 'react';
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
  const { toast } = useToast();

  // Load messages from database for current session using direct REST API
  const loadMessages = useCallback(async () => {
    if (!session || !sessionId) {
      console.warn('[useMessages] No session or sessionId available');
      return;
    }
    
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

        setMessages(chatMessages);
      }
    } catch (error) {
      console.error('[useMessages] Error loading messages:', error);
      // Silent fail - messages will be empty
    }
  }, [userId, sessionId, session]);

  // Send message with optional file attachment - using direct fetch() to avoid deadlocks
  const sendMessage = useCallback(async (
    content: string,
    attachment: FileAttachment | null = null
  ) => {
    if (!session) {
      toast({
        title: "Session Error",
        description: "Please sign in again to continue.",
        variant: "destructive"
      });
      return;
    }

    // Check chat message limit
    if (messages.length >= MAX_MESSAGES_PER_CHAT) {
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
        toast({
          title: "Usage Error",
          description: "Unable to verify usage limits. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const canUse = await rpcResponse.json();

      if (!canUse) {
        toast({
          title: "Usage Limit Reached",
          description: "You've reached your monthly message limit. Please contact support.",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
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

    // Add to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // CRITICAL FIX: Construct payload with has_attachment and file_data
      // When content is empty but attachment exists, send a placeholder message
      const messageContent = content.trim() || (attachment ? `📎 Attached file: ${attachment.name}` : '');
      
      const payload: WebhookPayload = {
        message: messageContent,
        userId,
        userEmail,
        mode: selectedMode,
        sessionId,
        conversationHistory: messages.slice(-5).map(msg => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp instanceof Date 
            ? msg.timestamp.toISOString() 
            : msg.timestamp,
          has_attachment: !!msg.attachment,
          attachment: msg.attachment || null
        })),
        userProfile: {
          company_name: userProfile?.company_name || '',
          contact_person: userProfile?.contact_person || '',
          business_type: userProfile?.business_type || '',
        },
        allowPersonalization,
        detectedLanguage: detectLanguage(content).code, // Fresh detection from actual message
        concise: false,
        timestamp: new Date().toISOString(),
        has_attachment: !!attachment,
        file_data: attachment || null,
        emotionHistory: emotionHistory.slice(-10) // Send last 10 emotions for pattern analysis
      };

      // Call webhook via direct fetch to avoid deadlocks
      const webhookResponse = await fetch(`${SUPABASE_URL}/functions/v1/ayn-webhook`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      setIsTyping(false);

      // Handle 429 Rate Limit Response
      if (webhookResponse.status === 429) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "You've reached the rate limit for messages. Please wait a moment before sending more messages.",
          sender: 'ayn',
          timestamp: new Date(),
          status: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
        
        toast({
          title: "Rate Limit Reached",
          description: "You're sending messages too quickly. Please wait before trying again.",
          variant: "destructive"
        });
        return;
      }

      if (!webhookResponse.ok) {
        throw new Error(`Webhook call failed: ${webhookResponse.status}`);
      }

      const webhookData = await webhookResponse.json();

      // Extract suggested emotion from backend
      if (webhookData?.suggestedAynEmotion) {
        setLastSuggestedEmotion(webhookData.suggestedAynEmotion);
      }

      // Extract and store mood pattern
      if (webhookData?.moodPattern) {
        setMoodPattern(webhookData.moodPattern);
      }

      // Track emotion history from user emotion
      if (webhookData?.userEmotion) {
        setEmotionHistory(prev => [...prev.slice(-9), {
          emotion: webhookData.userEmotion.emotion,
          intensity: webhookData.userEmotion.intensity,
          timestamp: new Date().toISOString()
        }]);
      }

      // Extract response (handle both string and nested object formats)
      const response = typeof webhookData?.response === 'string'
        ? webhookData.response
        : webhookData?.response?.output || 
          webhookData?.output ||
          'I received your message and I\'m processing it. Please try again if you don\'t see a proper response.';

      // Extract LAB data if present (for LAB mode)
      const labData: LABResponse | undefined = webhookData?.labData;

      // Create AI response message
      const aynMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ayn',
        timestamp: new Date(),
        isTyping: true,
        ...(selectedMode === 'LAB' && labData ? { labData } : {})
      };

      setMessages(prev => [...prev, aynMessage]);

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
      await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
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
            attachment_url: attachment?.url,
            attachment_name: attachment?.name,
            attachment_type: attachment?.type
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

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'ayn',
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Connection Error",
        description: "Unable to reach AYN. Please try again.",
        variant: "destructive"
      });
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
    loadMessages,
    sendMessage,
    setMessages
  };
};
