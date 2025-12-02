import React, { useEffect, useCallback, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider, Sidebar as ShadcnSidebar, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Sidebar as DashboardSidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { TranscriptSidebar } from '@/components/transcript/TranscriptSidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AIMode, FileAttachment, AIModeConfig, ChatHistory } from '@/types/dashboard.types';

// Import custom hooks
import { useAuth } from '@/hooks/useAuth';
import { useChatSession } from '@/hooks/useChatSession';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMessages } from '@/hooks/useMessages';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { analyzeResponseEmotion } from '@/utils/emotionMapping';

// Import icons for modes
import { MessageSquare, TrendingUp, Search, FileText, Eye, Hammer, Menu, X } from 'lucide-react';

interface DashboardContainerProps {
  user: User;
  isAdmin?: boolean;
  onAdminPanelClick?: () => void;
}

// Get modes with translations
const getModes = (t: (key: string) => string): AIModeConfig[] => [
  { 
    name: 'General', 
    translatedName: t('modes.general'),
    description: 'General AI assistant for all your needs',
    icon: MessageSquare,
    color: 'text-slate-500',
    webhookUrl: ''
  },
  { 
    name: 'Nen Mode ⚡', 
    translatedName: t('modes.nenMode') + ' ⚡',
    description: 'Ultra-fast AI responses for quick insights',
    icon: TrendingUp,
    color: 'text-blue-500',
    webhookUrl: ''
  },
  { 
    name: 'Research Pro', 
    translatedName: t('modes.researchPro'),
    description: 'Deep research and comprehensive analysis',
    icon: Search,
    color: 'text-green-500',
    webhookUrl: ''
  },
  { 
    name: 'PDF Analyst', 
    translatedName: t('modes.pdfAnalyst'),
    description: 'Specialized document analysis and insights',
    icon: FileText,
    color: 'text-purple-500',
    webhookUrl: ''
  },
  { 
    name: 'Vision Lab', 
    translatedName: t('modes.visionLab'),
    description: 'Advanced image and visual content analysis',
    icon: Eye,
    color: 'text-orange-500',
    webhookUrl: ''
  },
  { 
    name: 'Civil Engineering', 
    translatedName: t('modes.civilEngineering'),
    description: 'Civil engineering analysis and calculations',
    icon: Hammer,
    color: 'text-teal-500',
    webhookUrl: ''
  },
];

export const DashboardContainer = ({ user, isAdmin, onAdminPanelClick }: DashboardContainerProps) => {
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  
  // Custom hooks
  const auth = useAuth(user);
  const chatSession = useChatSession(user.id);
  const fileUpload = useFileUpload(user.id);
  
  // State
  const [selectedMode, setSelectedMode] = React.useState<AIMode>('Nen Mode ⚡');
  const [allowPersonalization, setAllowPersonalization] = React.useState(false);

  // Messages hook - depends on other state
  const messagesHook = useMessages(
    chatSession.currentSessionId,
    user.id,
    user.email || '',
    selectedMode,
    auth.userProfile,
    allowPersonalization,
    language
  );

  // Get modes with translations
  const modes = getModes(t);

  // Load messages when session changes
  useEffect(() => {
    messagesHook.loadMessages();
  }, [chatSession.currentSessionId]);

  // Load recent chats on mount
  useEffect(() => {
    chatSession.loadRecentChats();
  }, []);

  // Detect language from user input and auto-switch
  const detectLanguage = useCallback((text: string): 'ar' | 'en' => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text) ? 'ar' : 'en';
  }, []);

  // Handle send message with file upload
  const handleSendMessage = useCallback(async (
    content: string,
    fileToUpload?: File | null
  ) => {
    if (!auth.hasAccess || !auth.hasAcceptedTerms) {
      toast({
        title: t('auth.accessRequired'),
        description: t('auth.accessRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    // Detect language and auto-switch
    if (content) {
      const detectedLang = detectLanguage(content);
      if (detectedLang !== language) {
        setLanguage(detectedLang);
      }
    }

    // Upload file if present
    let attachment: FileAttachment | null = null;
    if (fileToUpload) {
      attachment = await fileUpload.uploadFile(fileToUpload);
      if (!attachment) {
        // Upload failed, error already shown by uploadFile
        return;
      }
      // Clear the file after successful upload
      fileUpload.removeFile();
    }

    // Send message with attachment
    await messagesHook.sendMessage(content, attachment);
    
    // Refresh chat history
    chatSession.loadRecentChats();
  }, [
    auth.hasAccess,
    auth.hasAcceptedTerms,
    detectLanguage,
    language,
    setLanguage,
    messagesHook,
    chatSession,
    fileUpload,
    toast,
    t
  ]);

  // Handle copy message
  const handleCopyMessage = useCallback(async (content: string) => {
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
  }, [toast]);

  // Handle reply to message
  const handleReplyToMessage = useCallback((message: { content: string }) => {
    handleCopyMessage(message.content);
  }, [handleCopyMessage]);

  // Handle load chat
  const handleLoadChat = useCallback((chat: ChatHistory) => {
    const loadedMessages = chatSession.loadChat(chat);
    messagesHook.setMessages(loadedMessages);
  }, [chatSession, messagesHook]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    chatSession.startNewChat();
    messagesHook.setMessages([]);
  }, [chatSession, messagesHook]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <DashboardContent
      user={user}
      auth={auth}
      chatSession={chatSession}
      fileUpload={fileUpload}
      messagesHook={messagesHook}
      selectedMode={selectedMode}
      modes={modes}
      setSelectedMode={setSelectedMode}
      handleNewChat={handleNewChat}
      handleLoadChat={handleLoadChat}
      handleCopyMessage={handleCopyMessage}
      handleReplyToMessage={handleReplyToMessage}
      handleSendMessage={handleSendMessage}
      handleLogout={handleLogout}
      isAdmin={isAdmin}
      onAdminPanelClick={onAdminPanelClick}
    />
  );
};

// Separate component that can use useSidebar hook
const DashboardContent = ({
  user,
  auth,
  chatSession,
  fileUpload,
  messagesHook,
  selectedMode,
  modes,
  setSelectedMode,
  handleNewChat,
  handleLoadChat,
  handleCopyMessage,
  handleReplyToMessage,
  handleSendMessage,
  handleLogout,
  isAdmin,
  onAdminPanelClick
}: {
  user: User;
  auth: ReturnType<typeof useAuth>;
  chatSession: ReturnType<typeof useChatSession>;
  fileUpload: ReturnType<typeof useFileUpload>;
  messagesHook: ReturnType<typeof useMessages>;
  selectedMode: AIMode;
  modes: AIModeConfig[];
  setSelectedMode: (mode: AIMode) => void;
  handleNewChat: () => void;
  handleLoadChat: (chat: ChatHistory) => void;
  handleCopyMessage: (content: string) => Promise<void>;
  handleReplyToMessage: (message: { content: string }) => void;
  handleSendMessage: (content: string, fileToUpload?: File | null) => Promise<void>;
  handleLogout: () => Promise<void>;
  isAdmin?: boolean;
  onAdminPanelClick?: () => void;
}) => {
  const { open, toggleSidebar } = useSidebar();
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const { setEmotion, setIsResponding } = useAYNEmotion();

  // Update emotion when AYN responds
  useEffect(() => {
    if (!messagesHook.isTyping && messagesHook.messages.length > 0) {
      const lastMessage = messagesHook.messages[messagesHook.messages.length - 1];
      if (lastMessage.sender === 'ayn') {
        const emotion = analyzeResponseEmotion(lastMessage.content);
        setEmotion(emotion);
        setIsResponding(false);
      }
    } else if (messagesHook.isTyping) {
      setEmotion('thinking');
      setIsResponding(true);
    }
  }, [messagesHook.isTyping, messagesHook.messages, setEmotion, setIsResponding]);

  const handleClearTranscript = useCallback(() => {
    handleNewChat();
  }, [handleNewChat]);

  return (
    <div className="flex h-screen w-full">
      <ShadcnSidebar>
        <DashboardSidebar
          userName={auth.userProfile?.contact_person || user.user_metadata?.name || user.email?.split('@')[0]}
          userEmail={auth.userProfile?.company_name || 'No company'}
          userAvatar={auth.userProfile?.avatar_url}
          isTyping={messagesHook.isTyping}
          hasAccess={auth.hasAccess}
          selectedMode={selectedMode}
          modes={modes}
          recentChats={chatSession.recentChats}
          showChatSelection={chatSession.showChatSelection}
          selectedChats={chatSession.selectedChats}
          onModeSelect={setSelectedMode}
          onNewChat={handleNewChat}
          onLoadChat={handleLoadChat}
          onToggleChatSelection={(index) => {
            const newSelected = new Set(chatSession.selectedChats);
            if (newSelected.has(index)) {
              newSelected.delete(index);
            } else {
              newSelected.add(index);
            }
            chatSession.setSelectedChats(newSelected);
          }}
          onSelectAllChats={() => {
            if (chatSession.selectedChats.size === chatSession.recentChats.length) {
              chatSession.setSelectedChats(new Set());
            } else {
              chatSession.setSelectedChats(new Set(chatSession.recentChats.map((_chat: unknown, i: number) => i)));
            }
          }}
          onDeleteSelected={chatSession.deleteSelectedChats}
          onShowChatSelection={chatSession.setShowChatSelection}
          onLogout={handleLogout}
          onAvatarUpdated={auth.loadUserProfile}
          isAdmin={isAdmin}
          onAdminPanelClick={onAdminPanelClick}
        />
      </ShadcnSidebar>

      {/* Floating Menu Button - only show when sidebar is closed */}
      {!open && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 hidden md:flex bg-background/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Menu className="w-5 h-5" />
        </Button>
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile header with sidebar trigger */}
        <header className="md:hidden flex items-center p-3 border-b bg-background">
          <SidebarTrigger />
          <span className="ml-3 font-semibold text-foreground">AYN AI</span>
        </header>

        <ChatArea
          messages={messagesHook.messages}
          isTyping={messagesHook.isTyping}
          userName={user.user_metadata?.name}
          userAvatar={user.user_metadata?.name?.charAt(0)}
          onCopyMessage={handleCopyMessage}
          onReplyToMessage={handleReplyToMessage}
          onSendMessage={handleSendMessage}
          isDisabled={!auth.hasAccess || !auth.hasAcceptedTerms}
          selectedMode={selectedMode}
          selectedFile={fileUpload.selectedFile}
          isUploading={fileUpload.isUploading}
          isDragOver={fileUpload.isDragOver}
          onFileSelect={fileUpload.handleFileSelect}
          onRemoveFile={fileUpload.removeFile}
          onDragEnter={fileUpload.handleDragEnter}
          onDragLeave={fileUpload.handleDragLeave}
          onDragOver={fileUpload.handleDragOver}
          onDrop={fileUpload.handleDrop}
          fileInputRef={fileUpload.fileInputRef}
          sidebarOpen={open}
          modes={modes}
          onModeChange={setSelectedMode}
        />
      </main>

      {/* Right Sidebar - Transcript */}
      <TranscriptSidebar
        messages={messagesHook.messages}
        isOpen={transcriptOpen}
        onToggle={() => setTranscriptOpen(!transcriptOpen)}
        onClear={handleClearTranscript}
        currentMode={selectedMode}
      />
    </div>
  );
};
