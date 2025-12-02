import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  Message, 
  FileAttachment, 
  UserProfile, 
  AIMode,
  UseMessagesReturn,
  WebhookPayload 
} from '@/types/dashboard.types';

export const useMessages = (
  sessionId: string,
  userId: string,
  userEmail: string,
  selectedMode: AIMode,
  userProfile: UserProfile | null,
  allowPersonalization: boolean,
  detectedLanguage: 'ar' | 'en'
): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();

  // Load messages from database for current session
  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender, attachment_url, attachment_name, attachment_type')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) return;

      if (data && data.length > 0) {
        const chatMessages: Message[] = data.map(msg => ({
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
      // Silent fail - messages will be empty
    }
  }, [userId, sessionId]);

  // Send message with optional file attachment
  const sendMessage = useCallback(async (
    content: string,
    attachment: FileAttachment | null = null
  ) => {
    // Check usage limits
    try {
      const { data: canUse, error: usageError } = await supabase.rpc('increment_usage', {
        _user_id: userId,
        _action_type: 'message',
        _count: 1
      });

      if (usageError) {
        toast({
          title: "Usage Error",
          description: "Unable to verify usage limits. Please try again.",
          variant: "destructive"
        });
        return;
      }

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
        concise: true,
        timestamp: new Date().toISOString(),
        has_attachment: !!attachment,
        file_data: attachment || null
      };

      // Call webhook via edge function
      const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('ayn-webhook', {
        body: payload
      });

      setIsTyping(false);

      if (webhookError) {
        throw new Error(webhookError.message || 'Webhook call failed');
      }

      // Extract response (handle both string and nested object formats)
      const response = typeof webhookResponse?.response === 'string'
        ? webhookResponse.response
        : webhookResponse?.response?.output || 
          webhookResponse?.output ||
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

      // Save both messages to database
      await supabase.from('messages').insert([
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
      ]);

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
    toast
  ]);

  return {
    messages,
    isTyping,
    loadMessages,
    sendMessage,
    setMessages
  };
};
