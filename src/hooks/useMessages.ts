import { useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import type { 
  Message, 
  FileAttachment, 
  UserProfile, 
  AIMode,
  UseMessagesReturn,
  WebhookPayload 
} from '@/types/dashboard.types';

// Same constants from useAuth.ts - direct REST API bypasses deadlocking Supabase client
const SUPABASE_URL = 'https://dfkoxuokfkttjhfjcecx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRma294dW9rZmt0dGpoZmpjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTg4NzMsImV4cCI6MjA3MTkzNDg3M30.Th_-ds6dHsxIhRpkzJLREwBIVdgkcdm2SmMNDmjNbxw';

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
  detectedLanguage: 'ar' | 'en',
  session: Session | null
): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
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
      const payload: WebhookPayload = {
        message: content,
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
          business_context: userProfile?.business_context || ''
        },
        allowPersonalization,
        detectedLanguage,
        concise: false,
        timestamp: new Date().toISOString(),
        has_attachment: !!attachment,
        file_data: attachment || null
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

      // Extract response (handle both string and nested object formats)
      const response = typeof webhookData?.response === 'string'
        ? webhookData.response
        : webhookData?.response?.output || 
          webhookData?.output ||
          'I received your message and I\'m processing it. Please try again if you don\'t see a proper response.';

      // Create AI response message
      const aynMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ayn',
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages(prev => [...prev, aynMessage]);

      // Save both messages to database via direct REST API
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
            mode_used: selectedMode
          }
        ])
      });

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
    detectedLanguage, 
    toast,
    session
  ]);

  return {
    messages,
    isTyping,
    loadMessages,
    sendMessage,
    setMessages
  };
};
