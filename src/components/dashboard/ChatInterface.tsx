import { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, Paperclip, Copy, Reply, Loader2, Heart, HeartIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageFormatter } from '@/components/MessageFormatter';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useLanguage } from '@/contexts/LanguageContext';
import { globalThreatMonitor, detectMaliciousInput, reportThreatEvent } from '@/lib/threatDetection';
import { useFileUploadRetry } from '@/hooks/useFileUploadRetry';
import { FilePreviewDialog } from './FilePreviewDialog';

// Timeout wrapper for webhook calls
const invokeWithTimeout = async (
  functionName: string, 
  payload: any, 
  timeoutMs: number = 55000
): Promise<{ data: any; error: any }> => {
  return Promise.race([
    supabase.functions.invoke(functionName, { body: payload }),
    new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    )
  ]);
};

// Ensure JWT token is fresh before Supabase function calls
const ensureFreshToken = async (): Promise<boolean> => {
  console.log('🔐 Checking session status...');
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('❌ Session error:', sessionError);
    return false;
  }

  // Calculate time until token expiry
  const tokenExpiresAt = session.expires_at || 0;
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = tokenExpiresAt - now;

  console.log(`⏰ Token expires in ${timeUntilExpiry} seconds (${Math.round(timeUntilExpiry / 60)} minutes)`);

  // Refresh if less than 5 minutes remaining
  if (timeUntilExpiry < 300) {
    console.log('🔄 Token expiring soon, refreshing...');
    const startTime = Date.now();
    
    const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !newSession) {
      console.error('❌ Session refresh failed:', refreshError);
      return false;
    }
    
    const refreshDuration = Date.now() - startTime;
    console.log(`✅ Session refreshed in ${refreshDuration}ms, new expiry in ${newSession.expires_at ? (newSession.expires_at - now) : 'unknown'} seconds`);
  } else {
    console.log('✅ Token is valid, no refresh needed');
  }

  return true;
};

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
  const [uploadState, setUploadState] = useState<'idle' | 'reading' | 'uploading' | 'processing'>('idle');
  const [uploadProgress, setUploadProgress] = useState<{ phase: string; fileSize?: string }>({ phase: '' });
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [favoriteMessages, setFavoriteMessages] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const { uploadWithRetry, retryAttempt } = useFileUploadRetry();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset textarea height when message is cleared
  useEffect(() => {
    if (inputMessage === '' && inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  }, [inputMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaveToFavorites = async (message: Message) => {
    try {
      const { error } = await supabase
        .from('saved_insights')
        .insert({
          user_id: user.id,
          category: 'Chat Message',
          insight_text: message.content,
          tags: ['chat', 'favorite', selectedMode.toLowerCase()]
        });

      if (error) throw error;

      setFavoriteMessages(prev => new Set([...prev, message.id]));
      toast({
        title: 'Message saved',
        description: 'Message added to your favorites.',
      });
    } catch (error) {
      console.error('Error saving to favorites:', error);
      toast({
        title: 'Error saving message',
        description: 'Failed to save message to favorites.',
        variant: 'destructive'
      });
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Message Copied",
        description: "Message copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy message to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setInputMessage(`@${message.sender}: "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"\n\n`);
    inputRef.current?.focus();
  };

  const handleFileSelect = () => {
    if (!hasAccess || !hasAcceptedTerms) {
      toast({
        title: "Access Required",
        description: "You need active access to upload files.",
        variant: "destructive"
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeInMB = (file.size / 1024 / 1024).toFixed(1);
      setSelectedFile(file);
      setUploadProgress({ 
        phase: 'ready', 
        fileSize: `${sizeInMB}MB` 
      });
      toast({
        title: "File Selected",
        description: `${file.name} (${sizeInMB}MB) is ready to send.`,
      });
    }
  };

  const handlePreviewConfirm = () => {
    setShowPreview(false);
    // Continue with sending the message
    continueSendingMessage();
  };

  const handlePreviewCancel = () => {
    setShowPreview(false);
    setPreviewFile(null);
    setPendingMessage('');
    setSelectedFile(null);
    toast({
      title: "Upload Cancelled",
      description: "File upload was cancelled.",
    });
  };

  const continueSendingMessage = async () => {
    // Debug logging for attachment state
    console.log('📎 continueSendingMessage called:', {
      hasPendingMessage: !!pendingMessage,
      hasPreviewFile: !!previewFile,
      previewFileDetails: previewFile ? {
        name: previewFile.name,
        type: previewFile.type,
        hasUrl: !!previewFile.url
      } : null
    });

    const content = pendingMessage;
    const attachment = previewFile;

    // Reset preview state
    setPreviewFile(null);
    setPendingMessage('');

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content || (attachment ? `📎 ${attachment.name}` : ''),
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
      attachment
    };

    const updatedMessages = [...messages, userMessage];
    onMessagesChange(updatedMessages);
    setInputMessage('');
    // Immediately reset textarea height to prevent resize bug
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
    setSelectedFile(null);
    setReplyingTo(null);
    setUploadProgress({ phase: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsTyping(true);

    try {
      // Check and increment usage
      const { data: canUse, error: usageError } = await supabase.rpc('increment_usage', {
        _user_id: user.id,
        _action_type: 'message',
        _count: 1
      });

      if (usageError || !canUse) {
        setIsTyping(false);
        toast({
          title: t('error.usageLimit'),
          description: t('error.usageLimitDesc'),
          variant: "destructive"
        });
        return;
      }

      // Get user profile for context
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('company_name, business_type, business_context, contact_person')
        .eq('user_id', user.id)
        .single();

      // Enhanced payload with user context and conversation history
      const payload = { 
        message: content,
        userId: user.id,
        userEmail: user.email,
        mode: selectedMode,
        sessionId: currentSessionId,
        conversationHistory: messages.slice(-5).map(msg => ({
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp.toISOString(),
          has_attachment: !!msg.attachment,
          attachment: msg.attachment ? {
            url: msg.attachment.url,
            filename: msg.attachment.name,
            type: msg.attachment.type
          } : null
        })),
        userContext: userProfile ? {
          companyName: userProfile.company_name,
          businessType: userProfile.business_type,
          businessContext: userProfile.business_context,
          contactPerson: userProfile.contact_person
        } : null,
        timestamp: new Date().toISOString(),
        has_attachment: !!attachment,
        fileData: attachment ? {
          url: attachment.url,
          filename: attachment.name,
          content: null,
          type: attachment.type
        } : null
      };

      console.log('📦 Webhook payload constructed:', {
        messageLength: payload.message?.length,
        mode: payload.mode,
        sessionId: payload.sessionId,
        hasUserContext: !!payload.userContext,
        conversationHistoryLength: payload.conversationHistory?.length,
        has_attachment: payload.has_attachment,
        fileData: payload.fileData ? {
          filename: payload.fileData.filename,
          type: payload.fileData.type,
          hasUrl: !!payload.fileData.url,
          urlLength: payload.fileData.url?.length
        } : null
      });

      // ✅ CRITICAL: Final JWT check before webhook call
      console.log('🔐 Pre-webhook: Ensuring fresh JWT token...');
      const tokenValid = await ensureFreshToken();
      if (!tokenValid) {
        throw new Error('SESSION_EXPIRED');
      }

      console.log('🚀 Calling ayn-webhook with payload:', {
        mode: selectedMode,
        hasFile: !!payload.fileData,
        fileName: payload.fileData?.filename,
        messageLength: payload.message?.length
      });

      const startTime = Date.now();

      // Call webhook with timeout protection
      const { data, error } = await invokeWithTimeout('ayn-webhook', payload, 55000);

      const callDuration = Date.now() - startTime;
      console.log(`⏱️ Webhook call completed in ${callDuration}ms`);

      if (error) {
        console.error('❌ Webhook error:', error);
        throw error;
      }

      // Log raw response structure for debugging
      console.log('📨 Raw webhook response structure:', {
        hasData: !!data,
        dataType: typeof data,
        hasResponse: !!data?.response,
        responseType: typeof data?.response,
        dataKeys: data ? Object.keys(data) : [],
        responseKeys: data?.response && typeof data.response === 'object' ? Object.keys(data.response) : []
      });

      // Extract text from response (handle various n8n formats)
      let responseText = '';
      try {
        if (typeof data.response === 'string') {
          responseText = data.response;
        } else if (data?.response?.output) {
          responseText = typeof data.response.output === 'string' 
            ? data.response.output 
            : JSON.stringify(data.response.output);
        } else if (data?.response?.text) {
          responseText = data.response.text;
        } else if (data?.response?.message) {
          responseText = data.response.message;
        } else if (data?.output) {
          responseText = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
        } else if (data?.text) {
          responseText = data.text;
        } else if (data?.message) {
          responseText = data.message;
        } else if (data?.response && typeof data.response === 'object') {
          // Safe stringify with circular reference handling
          responseText = JSON.stringify(data.response, (key, value) => {
            if (typeof value === 'function') return '[Function]';
            if (typeof value === 'undefined') return undefined;
            return value;
          }, 2);
        } else if (data) {
          responseText = JSON.stringify(data, (key, value) => {
            if (typeof value === 'function') return '[Function]';
            if (typeof value === 'undefined') return undefined;
            return value;
          }, 2);
        } else {
          responseText = 'Received response but could not extract text content';
        }
      } catch (stringifyError) {
        console.error('⚠️ Error extracting response text:', stringifyError);
        responseText = 'Received response but encountered formatting error.';
      }

      console.log('✅ Extracted response text:', {
        length: responseText.length,
        preview: responseText.substring(0, 100) + (responseText.length > 100 ? '...' : '')
      });

      // Add AYN's response
      const aynMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText || 'No response received',
        sender: 'ayn',
        timestamp: new Date(),
        status: 'sent'
      };

      onMessagesChange([...updatedMessages, aynMessage]);

      // Save messages to database
      await Promise.all([
        supabase.from('messages').insert({
          user_id: user.id,
          content: userMessage.content,
          sender: 'user',
          session_id: currentSessionId,
          mode_used: selectedMode,
          attachment_url: attachment?.url,
          attachment_name: attachment?.name,
          attachment_type: attachment?.type
        }),
        supabase.from('messages').insert({
          user_id: user.id,
          content: aynMessage.content,
          sender: 'ayn',
          session_id: currentSessionId,
          mode_used: selectedMode
        })
      ]);

    } catch (error: any) {
      console.error('❌ Error in continueSendingMessage:', error);
      
      let errorTitle = "Error";
      let errorDescription = "Failed to send message";
      
      // Categorize errors
      if (error.message === 'SESSION_EXPIRED' || error.message === 'SESSION_REFRESH_FAILED') {
        errorTitle = "Session Expired";
        errorDescription = "Your session has expired. Please refresh the page and log in again.";
        console.error('🔐 Session error - user needs to re-authenticate');
      } else if (error.message === 'TIMEOUT') {
        errorTitle = "Request Timeout";
        errorDescription = "The request took too long to complete. Please try again with a smaller file or check your connection.";
        console.error('⏱️ Timeout error - webhook took longer than 55 seconds');
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        errorTitle = "Connection Error";
        errorDescription = "Unable to reach AYN. Please check your internet connection and try again.";
        console.error('🌐 Network error - connection issue');
      } else {
        errorTitle = "Processing Error";
        errorDescription = error.message || "An unexpected error occurred. Please try again.";
        console.error('❓ Unknown error:', error);
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });
      
      // Update the user message to show error status
      const updatedMessagesWithError = updatedMessages.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'error' as const } : msg
      );
      onMessagesChange(updatedMessagesWithError);
    } finally {
      setIsTyping(false);
    }
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
            content: content.substring(0, 100),
            threats: maliciousCheck.threats,
            sessionId: currentSessionId
          }
        });

        toast({
          title: "Security Alert",
          description: "Your message contains potentially harmful content and cannot be sent.",
          variant: "destructive"
        });
        return;
      }
    }

    // Upload file if selected
    let attachment = null;
    if (selectedFile) {
      let fileUploadStartTime = Date.now();
      try {
        console.log('📁 Starting file upload process:', {
          fileName: selectedFile.name,
          fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
          fileType: selectedFile.type
        });

        // ✅ CRITICAL: Refresh JWT token BEFORE file upload
        console.log('🔐 Pre-upload: Ensuring fresh JWT token...');
        const tokenValid = await ensureFreshToken();
        if (!tokenValid) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please refresh the page and log in again.",
            variant: "destructive"
          });
          return;
        }
        console.log('✅ Pre-upload: Token is fresh, proceeding with upload...');

        fileUploadStartTime = Date.now();

        // Phase 1: Reading file
        setUploadState('reading');
        setUploadProgress({ 
          phase: `Reading ${selectedFile.name}...`, 
          fileSize: uploadProgress.fileSize 
        });

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(selectedFile);
        });

        // Phase 2: Uploading
        setUploadState('uploading');
        setUploadProgress({ 
          phase: `Uploading ${selectedFile.name}...`, 
          fileSize: uploadProgress.fileSize 
        });

        const data = await uploadWithRetry({
          file: base64,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          userId: user.id
        }, {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000
        });

        const uploadDuration = Date.now() - fileUploadStartTime;
        console.log(`✅ File uploaded in ${uploadDuration}ms:`, {
          url: data.fileUrl,
          retries: retryAttempt
        });

        if (retryAttempt > 0) {
          toast({
            title: "Upload Successful",
            description: `File uploaded after ${retryAttempt + 1} attempt(s)`,
          });
        }

        // Phase 3: Processing
        setUploadState('processing');
        setUploadProgress({ 
          phase: 'Processing file...', 
          fileSize: uploadProgress.fileSize 
        });

        // Small delay to show processing state
        await new Promise(resolve => setTimeout(resolve, 500));

        attachment = {
          url: data.fileUrl,
          name: data.fileName,
          type: data.fileType
        };

        setUploadState('idle');
        setUploadProgress({ phase: '' });

        // Show preview dialog before sending
        setPreviewFile(attachment);
        setPendingMessage(content);
        setShowPreview(true);
        return; // Stop here, wait for user confirmation
      } catch (error) {
        const uploadDuration = Date.now() - fileUploadStartTime;
        console.error(`❌ File upload failed after ${uploadDuration}ms:`, error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          title: "Upload Failed",
          description: retryAttempt > 0 
            ? `Failed after ${retryAttempt + 1} attempts: ${errorMessage}`
            : `Failed to upload file: ${errorMessage}`,
          variant: "destructive"
        });
        setUploadState('idle');
        setUploadProgress({ phase: '' });
        return;
      }
    } else {
      // No file to upload, send message directly via preview
      setPendingMessage(content);
      setPreviewFile(null);
      setShowPreview(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 pb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {message.sender === 'ayn' && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src="/favicon-brain.png" alt="AYN" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`relative max-w-[85%] md:max-w-[70%] rounded-lg px-4 py-2 group transition-colors duration-200 overflow-hidden ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
              >
                <div className="flex flex-col gap-2">
                  {message.attachment && (
                    <div className="flex items-center gap-2 p-2 rounded border bg-background/50">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm truncate">{message.attachment.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {message.attachment.type.split('/')[0]}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-sm break-words whitespace-pre-wrap">
                    <MessageFormatter content={message.content} />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs opacity-70">
                    <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.status && (
                      <Badge variant="outline" className="text-xs">
                        {message.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Message Actions */}
                <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 backdrop-blur-sm border rounded-md shadow-md flex z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMessage(message.content)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReply(message)}
                    className="h-6 w-6 p-0"
                  >
                    <Reply className="w-3 h-3" />
                  </Button>
                  
                  {message.sender === 'ayn' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveToFavorites(message)}
                      className={`h-6 w-6 p-0 ${favoriteMessages.has(message.id) ? 'text-red-500' : ''}`}
                    >
                      <Heart className={`w-3 h-3 ${favoriteMessages.has(message.id) ? 'fill-current' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
              
              {message.sender === 'user' && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback>
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start gap-2">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src="/favicon-brain.png" alt="AYN" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2 max-w-[70%]">
                <TypingIndicator />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply Context */}
      {replyingTo && (
        <div className="mx-4 mb-2 p-2 bg-muted rounded-md text-sm border-l-4 border-primary flex items-center justify-between">
          <div>
            <span className="text-muted-foreground">Replying to:</span>
            <p className="line-clamp-1">{replyingTo.content}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(null)}
            className="h-6 w-6 p-0"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="mx-4 mb-2 p-2 bg-muted rounded-md text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            <span>{selectedFile.name}</span>
            <Badge variant="outline" className="text-xs">
              {uploadProgress.fileSize}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFile(null);
              setUploadProgress({ phase: '' });
              setUploadState('idle');
            }}
            className="h-6 w-6 p-0"
            disabled={uploadState !== 'idle'}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {uploadState !== 'idle' && uploadProgress.phase && (
        <div className="mx-4 mb-2 p-2 bg-primary/10 border border-primary/20 rounded-md text-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-primary font-medium">{uploadProgress.phase}</span>
            {uploadProgress.fileSize && (
              <Badge variant="outline" className="text-xs">
                {uploadProgress.fileSize}
              </Badge>
            )}
          </div>
          <div className="mt-1 h-1 bg-primary/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{
                width: uploadState === 'reading' ? '33%' : 
                       uploadState === 'uploading' ? '66%' : 
                       uploadState === 'processing' ? '100%' : '0%'
              }}
            />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.json,image/*"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleFileSelect}
            disabled={!hasAccess || !hasAcceptedTerms || uploadState !== 'idle'}
            className="shrink-0"
          >
            {uploadState !== 'idle' ? (
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
              onKeyDown={handleKeyPress}
              placeholder={hasAccess ? "Type your message..." : "Access required to send messages"}
              disabled={!hasAccess || !hasAcceptedTerms || isTyping}
              className="min-h-[44px] max-h-32 resize-none pr-12"
            />
            
            <Button
              onClick={() => handleSendMessage()}
              disabled={(!inputMessage.trim() && !selectedFile) || !hasAccess || !hasAcceptedTerms || isTyping || uploadState !== 'idle'}
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0"
            >
              {isTyping || uploadState !== 'idle' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <FilePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        file={previewFile}
        onConfirm={handlePreviewConfirm}
        onCancel={handlePreviewCancel}
      />
    </div>
  );
};