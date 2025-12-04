import React, { useEffect, useCallback, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarProvider, Sidebar as ShadcnSidebar, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Sidebar as DashboardSidebar } from './Sidebar';
import { CenterStageLayout } from './CenterStageLayout';
import { TranscriptSidebar } from '@/components/transcript/TranscriptSidebar';
import { TutorialWelcome } from '@/components/tutorial/TutorialWelcome';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIMode, FileAttachment, AIModeConfig, ChatHistory } from '@/types/dashboard.types';

// Import custom hooks
import { useAuth } from '@/hooks/useAuth';
import { useChatSession } from '@/hooks/useChatSession';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMessages } from '@/hooks/useMessages';
import { useTutorial } from '@/hooks/useTutorial';
import { useAYNEmotion } from '@/contexts/AYNEmotionContext';
import { analyzeResponseEmotion } from '@/utils/emotionMapping';

// Import icons for modes
import { MessageSquare, TrendingUp, Search, FileText, Eye, Hammer, Menu, X } from 'lucide-react';

interface DashboardContainerProps {
  user: User;
  isAdmin?: boolean;
  onAdminPanelClick?: () => void;
}

// Get modes - English only
const getModes = (): AIModeConfig[] => [
  { 
    name: 'General', 
    translatedName: 'General',
    description: 'General AI assistant for all your needs',
    icon: MessageSquare,
    color: 'text-slate-500',
    webhookUrl: ''
  },
  // TODO: Re-enable these modes after testing
  // { name: 'Nen Mode ⚡', translatedName: t('modes.nenMode') + ' ⚡', description: 'Ultra-fast AI responses', icon: TrendingUp, color: 'text-blue-500', webhookUrl: '' },
  // { name: 'Research Pro', translatedName: t('modes.researchPro'), description: 'Deep research and analysis', icon: Search, color: 'text-green-500', webhookUrl: '' },
  // { name: 'PDF Analyst', translatedName: t('modes.pdfAnalyst'), description: 'Document analysis', icon: FileText, color: 'text-purple-500', webhookUrl: '' },
  // { name: 'Vision Lab', translatedName: t('modes.visionLab'), description: 'Image analysis', icon: Eye, color: 'text-orange-500', webhookUrl: '' },
  // { name: 'Civil Engineering', translatedName: t('modes.civilEngineering'), description: 'Engineering calculations', icon: Hammer, color: 'text-teal-500', webhookUrl: '' },
];

export const DashboardContainer = ({ user, isAdmin, onAdminPanelClick }: DashboardContainerProps) => {
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  
  // Custom hooks
  const auth = useAuth(user);
  const chatSession = useChatSession(user.id);
  const fileUpload = useFileUpload(user.id);
  
  // State
  const [selectedMode, setSelectedMode] = React.useState<AIMode>('General');
  const [allowPersonalization, setAllowPersonalization] = React.useState(false);

  // Messages hook - depends on other state
  const messagesHook = useMessages(
    chatSession.currentSessionId,
    user.id,
    user.email || '',
    selectedMode,
    auth.userProfile,
    allowPersonalization,
    'en'
  );

  // Get modes (English only)
  const modes = getModes();

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
        title: 'Access Required',
        description: 'Please accept the terms to continue.',
        variant: "destructive"
      });
      return;
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
    toast
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
  const { open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar } = useSidebar();
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [replyPrefill, setReplyPrefill] = useState<string>('');
  const { setEmotion, setIsResponding } = useAYNEmotion();
  
  // Tutorial system
  const tutorial = useTutorial(user.id);

  // Mutual exclusivity: close transcript when left sidebar opens
  useEffect(() => {
    const sidebarIsOpen = isMobile ? openMobile : open;
    if (sidebarIsOpen && transcriptOpen) {
      setTranscriptOpen(false);
    }
  }, [open, openMobile, isMobile, transcriptOpen]);

  // Handle transcript toggle with mutual exclusivity
  // Accepts optional boolean from Sheet's onOpenChange
  const handleToggleTranscript = useCallback((newState?: boolean) => {
    const shouldOpen = typeof newState === 'boolean' ? newState : !transcriptOpen;
    
    if (shouldOpen && !transcriptOpen) {
      // Opening transcript - close left sidebar
      if (isMobile) {
        setOpenMobile(false);
      } else {
        setOpen(false);
      }
    }
    setTranscriptOpen(shouldOpen);
  }, [transcriptOpen, isMobile, setOpen, setOpenMobile]);

  // Handle reply from transcript - close sidebar and prefill input
  const handleReply = useCallback((quotedContent: string) => {
    setReplyPrefill(quotedContent);
    setTranscriptOpen(false);
  }, []);

  const handlePrefillConsumed = useCallback(() => {
    setReplyPrefill('');
  }, []);

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

  // Auto-open/close sidebars during tutorial steps
  useEffect(() => {
    const stepId = tutorial.currentStepData?.id;
    
    // Open transcript when on transcript step
    if (stepId === 'transcript') {
      setTranscriptOpen(true);
    }
    // Close transcript when moving past it
    else if (transcriptOpen && tutorial.isActive && stepId !== 'transcript') {
      setTranscriptOpen(false);
    }
    
    // Open left sidebar when on sidebar step
    if (stepId === 'sidebar' && !open) {
      toggleSidebar();
    }
  }, [tutorial.currentStepData?.id, tutorial.isActive, open, toggleSidebar, transcriptOpen]);

  const handleClearTranscript = useCallback(() => {
    handleNewChat();
  }, [handleNewChat]);

  return (
    <>
      {/* Tutorial System */}
      <TutorialWelcome
        isOpen={tutorial.showWelcome}
        onStart={tutorial.startTutorial}
        onSkip={tutorial.dismissWelcome}
      />
      <TutorialOverlay
        isActive={tutorial.isActive}
        currentStep={tutorial.currentStep}
        totalSteps={tutorial.totalSteps}
        currentStepData={tutorial.currentStepData}
        onNext={tutorial.nextStep}
        onPrev={tutorial.prevStep}
        onSkip={tutorial.skipTutorial}
        onComplete={tutorial.completeTutorial}
      />
      
      <div className="flex h-screen w-full" dir="ltr">
        <ShadcnSidebar>
          <div data-tutorial="sidebar" className="h-full">
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
              onStartTutorial={tutorial.startTutorial}
              isTutorialProfileStep={tutorial.isActive && tutorial.currentStepData?.id === 'profile'}
            />
          </div>
        </ShadcnSidebar>

      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {openMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setOpenMobile(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Menu Button - Desktop only */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className={cn(
          "fixed top-4 left-4 z-50",
          "h-10 w-10 rounded-xl",
          "bg-background/90 backdrop-blur-lg border border-border/60",
          "shadow-lg hover:shadow-xl",
          "hover:bg-background hover:scale-105",
          "active:scale-95",
          "transition-all duration-200",
          // Desktop only - show when sidebar is closed
          "hidden md:flex",
          open && "md:hidden"
        )}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <main 
        dir="ltr"
        className="flex-1 overflow-hidden flex flex-col"
      >
        {/* Mobile header - clean & centered */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-lg">
          {/* Left: Menu button + Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-semibold text-lg text-foreground">AYN AI</span>
          </div>
          
          {/* Right: Transcript toggle with message count */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleTranscript()}
            className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted relative"
          >
            <MessageSquare className="w-5 h-5" />
            {messagesHook.messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-medium">
                {messagesHook.messages.length > 9 ? '9+' : messagesHook.messages.length}
              </span>
            )}
          </Button>
        </header>

        <CenterStageLayout
          messages={messagesHook.messages}
          onSendMessage={handleSendMessage}
          isTyping={messagesHook.isTyping}
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
          transcriptOpen={transcriptOpen}
          modes={modes}
          onModeChange={setSelectedMode}
          prefillValue={replyPrefill}
          onPrefillConsumed={handlePrefillConsumed}
        />
      </main>

      {/* Right Sidebar - Transcript */}
      <TranscriptSidebar
          messages={messagesHook.messages}
          isOpen={transcriptOpen}
          onToggle={handleToggleTranscript}
          onClear={handleClearTranscript}
          currentMode={selectedMode}
          onReply={handleReply}
        />
      </div>
    </>
  );
};
