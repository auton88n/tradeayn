import React, { useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider, Sidebar as ShadcnSidebar, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Sidebar as DashboardSidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AIMode, FileAttachment, AIModeConfig } from '@/types/dashboard.types';

// Import custom hooks
import { useAuth } from '@/hooks/useAuth';
import { useChatSession } from '@/hooks/useChatSession';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMessages } from '@/hooks/useMessages';

// Import icons for modes
import { MessageSquare, TrendingUp, Search, FileText, Eye, Hammer, Menu, X } from 'lucide-react';

interface DashboardContainerProps {
  user: User;
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

export const DashboardContainer = ({ user }: DashboardContainerProps) => {
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
  const handleReplyToMessage = useCallback((message: any) => {
    handleCopyMessage(message.content);
  }, [handleCopyMessage]);

  // Handle load chat
  const handleLoadChat = useCallback((chat: any) => {
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
    <SidebarProvider>
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
      />
    </SidebarProvider>
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
  handleLogout
}: any) => {
  const { open, toggleSidebar } = useSidebar();

  return (
    <div className="flex h-screen w-full">
      <ShadcnSidebar>
        <DashboardSidebar
          userName={user.user_metadata?.name}
          userEmail={user.email}
          userAvatar={user.user_metadata?.name?.charAt(0)}
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
              chatSession.setSelectedChats(new Set(chatSession.recentChats.map((_, i) => i)));
            }
          }}
          onDeleteSelected={chatSession.deleteSelectedChats}
          onShowChatSelection={chatSession.setShowChatSelection}
          onLogout={handleLogout}
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
        />
      </main>
    </div>
  );
};
