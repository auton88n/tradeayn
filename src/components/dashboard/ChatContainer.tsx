import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { ChatInterface } from './ChatInterface';
import { ChatSidebar } from './ChatSidebar';
import { 
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { MaintenanceBanner } from '@/components/MaintenanceBanner';
import { ThemeToggle } from '../theme-toggle';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

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

interface ChatHistory {
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  sessionId: string;
}

interface ChatContainerProps {
  user: User;
  isAdmin: boolean;
  activeTab: 'chat' | 'admin';
  onTabChange: (tab: 'chat' | 'admin') => void;
}

export default function ChatContainer({ user, isAdmin, activeTab, onTabChange }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => crypto.randomUUID());
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<string>('Nen Mode ⚡');
  const [modeWebhooks, setModeWebhooks] = useState<Record<string, string>>({});
  const [allowPersonalization, setAllowPersonalization] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    enableMaintenance: false,
    maintenanceMessage: 'System is currently under maintenance. We apologize for any inconvenience.',
  });
  
  const { t } = useLanguage();

  // Load user profile and chat history
  useEffect(() => {
    loadUserProfile();
    loadRecentChats();
    checkMaintenanceStatus();
  }, [user.id]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('contact_person, company_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Profile loading error:', error);
    }
  };

  const loadRecentChats = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender, session_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading recent chats:', error);
        return;
      }

      if (!data || data.length === 0) {
        setRecentChats([]);
        return;
      }

      // Group messages by session_id
      const sessionGroups: { [key: string]: any[] } = {};
      
      data.forEach(message => {
        const sessionId = message.session_id;
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

      // Convert to ChatHistory format
      const chatHistories: ChatHistory[] = Object.entries(sessionGroups)
        .map(([sessionId, messages]) => {
          const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          const firstUserMessage = sortedMessages.find(msg => msg.sender === 'user');
          const lastMessage = sortedMessages[sortedMessages.length - 1];
          
          return {
            title: firstUserMessage ? (
              firstUserMessage.content.length > 30 
                ? firstUserMessage.content.substring(0, 30) + '...'
                : firstUserMessage.content
            ) : 'Chat Session',
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

      setRecentChats(chatHistories);
    } catch (error) {
      console.error('Error loading recent chats:', error);
    }
  };

  const checkMaintenanceStatus = () => {
    try {
      const storedConfig = localStorage.getItem('ayn_maintenance_config');
      if (storedConfig) {
        const config = JSON.parse(storedConfig);
        setMaintenanceConfig(config);
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    }
  };

  const handleLoadChat = (chatIndex: number) => {
    const selectedChat = recentChats[chatIndex];
    if (selectedChat) {
      setMessages(selectedChat.messages);
      setCurrentSessionId(selectedChat.sessionId);
    }
  };

  const handleDeleteSelectedChats = async () => {
    if (selectedChats.size === 0) return;

    try {
      const chatIndexes = Array.from(selectedChats);
      const sessionIds = chatIndexes.map(index => recentChats[index].sessionId);

      const { error } = await supabase
        .from('messages')
        .delete()
        .in('session_id', sessionIds)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh chat history
      await loadRecentChats();
      setSelectedChats(new Set());
      setShowChatSelection(false);
      
      // If current session was deleted, start new session
      if (sessionIds.includes(currentSessionId)) {
        setMessages([]);
        setCurrentSessionId(crypto.randomUUID());
      }
    } catch (error) {
      console.error('Error deleting chats:', error);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(crypto.randomUUID());
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const memoizedSidebar = useMemo(() => (
    <ChatSidebar
      user={user}
      selectedMode={selectedMode}
      onModeChange={setSelectedMode}
      recentChats={recentChats}
      onChatLoad={(sessionId) => {
        const chat = recentChats.find(c => c.sessionId === sessionId);
        if (chat) {
          setMessages(chat.messages);
          setCurrentSessionId(sessionId);
        }
      }}
      onNewChat={handleNewChat}
      allowPersonalization={allowPersonalization}
      onPersonalizationChange={setAllowPersonalization}
      userProfile={userProfile}
      onSignOut={handleSignOut}
    />
  ), [user, selectedMode, recentChats, allowPersonalization, userProfile]);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar className="w-80">{memoizedSidebar}</Sidebar>
      <SidebarInset className="flex-1">
        {maintenanceConfig.enableMaintenance && (
          <MaintenanceBanner 
            isEnabled={maintenanceConfig.enableMaintenance}
            message={maintenanceConfig.maintenanceMessage} 
          />
        )}
        
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <ChatInterface
            user={user}
            messages={messages}
            onMessagesChange={setMessages}
            selectedMode={selectedMode}
            modeWebhooks={modeWebhooks}
            currentSessionId={currentSessionId}
            hasAccess={true}
            hasAcceptedTerms={true}
          />
        </main>
      </SidebarInset>
    </div>
  );
}