import { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, Paperclip, Copy, Reply, Loader2, Heart 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageFormatter } from '@/components/MessageFormatter';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useLanguage } from '@/contexts/LanguageContext';
import { globalThreatMonitor, detectMaliciousInput, reportThreatEvent } from '@/lib/threatDetection';

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

interface ChatInterfaceProps {
  user: User;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  selectedMode: string;
  modeWebhooks: Record<string, string>;
  currentSessionId: string;
  hasAccess: boolean;
  hasAcceptedTerms: boolean;
}

export const ChatInterface = ({
  user,
  messages,
  onMessagesChange,
  selectedMode,
  modeWebhooks,
  currentSessionId,
  hasAccess,
  hasAcceptedTerms
}: ChatInterfaceProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (messageContent?: string) => {
    if (!hasAcceptedTerms) {
      toast({
        title: t('auth.termsRequired'),
        description: t('auth.termsRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    if (!hasAccess) {
      toast({
        title: t('auth.accessRequired'),
        description: t('auth.accessRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    const content = messageContent || inputMessage.trim();
    if (!content && !selectedFile) return;

    // Security: Check for malicious input
    if (content) {
      const maliciousCheck = detectMaliciousInput(content);
      if (maliciousCheck.isMalicious) {
        await reportThreatEvent({
          type: 'malicious_input',
          severity: 'high',
          details: {
            threats_detected: maliciousCheck.threats,
            input_content: content,
            user_id: user.id
          }
        });
        
        toast({
          title: 'Security Warning',
          description: 'Your message contains potentially harmful content and has been blocked.',
          variant: 'destructive'
        });
        return;
      }
    }

    // Monitor for suspicious activity
    const isSuspicious = globalThreatMonitor.trackRequest('/chat/send', user.id);
    if (isSuspicious) {
      toast({
        title: 'Rate Limit Exceeded',
        description: 'Please slow down your message sending.',
        variant: 'destructive'
      });
      return;
    }

    const newMessage: Message = {
      id: crypto.randomUUID(),
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    if (selectedFile) {
      try {
        setIsUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        newMessage.attachment = {
          url: publicUrl,
          name: selectedFile.name,
          type: selectedFile.type
        };
      } catch (error) {
        toast({
          title: 'Upload Failed',
          description: 'Failed to upload file. Please try again.',
          variant: 'destructive'
        });
        return;
      } finally {
        setIsUploading(false);
      }
    }

    onMessagesChange([...messages, newMessage]);
    setInputMessage('');
    setSelectedFile(null);
    setReplyingTo(null);

    try {
      // Save user message to database
      const { error: saveError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          session_id: currentSessionId,
          content,
          sender: 'user',
          attachment_url: newMessage.attachment?.url,
          attachment_name: newMessage.attachment?.name,
          attachment_type: newMessage.attachment?.type,
          mode_used: selectedMode
        });

      if (saveError) throw saveError;

      // Update message status
      const updatedMessages = messages.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'sent' as const } : msg
      );
      onMessagesChange(updatedMessages);

      // Increment usage
      await supabase.rpc('increment_usage', {
        _user_id: user.id,
        _action_type: 'message',
        _count: 1
      });

      // Send to AI webhook
      setIsTyping(true);
      const webhookUrl = modeWebhooks[selectedMode];
      
      if (!webhookUrl) {
        throw new Error('No webhook configured for selected mode');
      }

      const { data, error } = await supabase.functions.invoke('ayn-webhook', {
        body: {
          message: content,
          user_id: user.id,
          session_id: currentSessionId,
          mode: selectedMode,
          webhook_url: webhookUrl,
          attachment: newMessage.attachment,
          reply_to: replyingTo?.content
        }
      });

      if (error) throw error;

      // Add AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: data.response || 'I apologize, but I encountered an issue processing your request.',
        sender: 'ayn',
        timestamp: new Date(),
        status: 'sent'
      };

      onMessagesChange([...messages, aiMessage]);

      // Save AI response
      await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          session_id: currentSessionId,
          content: aiMessage.content,
          sender: 'ayn',
          mode_used: selectedMode
        });

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessages = messages.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'error' as const } : msg
      );
      onMessagesChange(errorMessages);

      toast({
        title: 'Message Failed',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard'
    });
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'ayn' && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs">
                    AYN
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`group max-w-[80%] ${message.sender === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`relative rounded-lg p-3 transition-all duration-200 hover:shadow-md ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  {message.attachment && (
                    <div className="mb-2 p-2 rounded bg-black/10 text-xs">
                      📎 {message.attachment.name}
                    </div>
                  )}
                  
                  <MessageFormatter content={message.content} />
                  
                  {message.status === 'error' && (
                    <div className="mt-2 text-xs text-red-400">
                      Failed to send
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 text-xs opacity-60">
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.status === 'sending' && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                  </div>

                  {/* Message Actions */}
                  <div className="absolute -top-2 right-0 hidden group-hover:flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 bg-background shadow-sm"
                      onClick={() => handleCopyMessage(message.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 bg-background shadow-sm"
                      onClick={() => handleReply(message)}
                    >
                      <Reply className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {message.sender === 'user' && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs">
                  AYN
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <TypingIndicator />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply Indicator */}
      {replyingTo && (
        <div className="p-2 bg-muted/50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4" />
            <span className="text-sm">Replying to: {replyingTo.content.substring(0, 50)}...</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(null)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="p-2 bg-muted/50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            <span className="text-sm">{selectedFile.name}</span>
            <Badge variant="outline">{(selectedFile.size / 1024).toFixed(1)} KB</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFile(null)}
          >
            Remove
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={handleFileSelect}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>

          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask ${selectedMode} anything...`}
              className="min-h-[40px] max-h-32 pr-12 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isTyping || isUploading}
            />
            <Button
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => handleSendMessage()}
              disabled={(!inputMessage.trim() && !selectedFile) || isTyping || isUploading}
            >
              {isTyping || isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
      />
    </div>
  );
};