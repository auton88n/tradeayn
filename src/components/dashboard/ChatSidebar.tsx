import { useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  MessageSquare, TrendingUp, Search, FileText, Eye,
  LogOut, Settings, Plus, X, Trash2, Download, Heart
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatHistory {
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: any[];
  sessionId: string;
}

interface ChatSidebarProps {
  user: User;
  selectedMode: string;
  onModeChange: (mode: string) => void;
  recentChats: ChatHistory[];
  onChatLoad: (sessionId: string) => void;
  onNewChat: () => void;
  allowPersonalization: boolean;
  onPersonalizationChange: (enabled: boolean) => void;
  userProfile: any;
  onSignOut: () => void;
  onSearchClick: () => void;
  onFavoritesClick: () => void;
  onExportClick: () => void;
}

export const ChatSidebar = ({
  user,
  selectedMode,
  onModeChange,
  recentChats,
  onChatLoad,
  onNewChat,
  allowPersonalization,
  onPersonalizationChange,
  userProfile,
  onSignOut,
  onSearchClick,
  onFavoritesClick,
  onExportClick
}: ChatSidebarProps) => {
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());
  const [showChatSelection, setShowChatSelection] = useState(false);
  
  const { toast } = useToast();
  const { t, language } = useLanguage();

  // Mode definitions with icons
  const modes = useMemo(() => [
    {
      name: 'General',
      translatedName: t('modes.general'),
      description: 'General AI assistant for all your needs',
      icon: MessageSquare,
      color: 'text-slate-500',
    },
    {
      name: 'Nen Mode ⚡',
      translatedName: t('modes.nenMode') + ' ⚡',
      description: 'Ultra-fast AI responses for quick insights',
      icon: TrendingUp,
      color: 'text-blue-500',
    },
    {
      name: 'Research Pro',
      translatedName: t('modes.researchPro'),
      description: 'Deep research and comprehensive analysis',
      icon: Search,
      color: 'text-green-500',
    },
    {
      name: 'PDF Analyst',
      translatedName: t('modes.pdfAnalyst'),
      description: 'Specialized document analysis and insights',
      icon: FileText,
      color: 'text-purple-500',
    },
    {
      name: 'Vision Lab',
      translatedName: t('modes.visionLab'),
      description: 'Advanced image and visual content analysis',
      icon: Eye,
      color: 'text-orange-500',
    },
  ], [t]);

  const handleModeClick = (modeName: string) => {
    onModeChange(modeName);
    toast({
      title: `${modeName} Selected`,
      description: `Now using ${modeName} for AI responses`,
    });
  };

  const handleDeleteSelectedChats = async () => {
    if (selectedChats.size === 0) return;

    try {
      const sessionIds = Array.from(selectedChats).map(index => 
        recentChats[index]?.sessionId
      ).filter(Boolean);

      const { data, error } = await supabase.rpc('delete_user_chat_sessions', {
        _user_id: user.id,
        _session_ids: sessionIds
      });

      if (error) throw error;

      if (data) {
        toast({
          title: t('dashboard.chatsDeleted'),
          description: `${selectedChats.size} chat sessions deleted`
        });
        
        // Reload chats (you might want to pass a reload function from parent)
        setSelectedChats(new Set());
        setShowChatSelection(false);
      } else {
        toast({
          title: 'Delete Failed',
          description: 'Some chats could not be deleted',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting chats:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete selected chats',
        variant: 'destructive'
      });
    }
  };

  return (
    <TooltipProvider>
      <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AYN</span>
          </div>
          <div>
            <h2 className="font-semibold text-sm">
              {userProfile?.contact_person || user.email?.split('@')[0]}
            </h2>
            <p className="text-xs text-muted-foreground">
              {userProfile?.company_name || 'User'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        {/* New Chat Button & Quick Actions */}
        <div className="mb-6 space-y-3">
          <Button onClick={onNewChat} className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            {t('dashboard.newChat')}
          </Button>
          
          {/* Quick Action Buttons */}
          <TooltipProvider>
            <div className="grid grid-cols-3 gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onSearchClick}
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2 px-1"
                  >
                    <Search className="w-4 h-4" />
                    <span className="text-xs">Search</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search chat history (Ctrl+K)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onFavoritesClick}
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2 px-1"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-xs">Saved</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View saved messages & chats</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onExportClick}
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2 px-1"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-xs">Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export chat sessions</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* AI Modes */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('dashboard.aiModes')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.name;
                
                return (
                  <SidebarMenuItem key={mode.name}>
                    <SidebarMenuButton
                      onClick={() => handleModeClick(mode.name)}
                      className={`w-full ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      <Icon className={`w-4 h-4 mr-3 ${isSelected ? '' : mode.color}`} />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{mode.translatedName}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {mode.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Chats */}
        {recentChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>{t('dashboard.recentChats')}</span>
              <div className="flex items-center gap-1">
                {showChatSelection && selectedChats.size > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeleteSelectedChats}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowChatSelection(!showChatSelection);
                    if (showChatSelection) setSelectedChats(new Set());
                  }}
                  className="h-6 w-6 p-0"
                >
                  {showChatSelection ? <X className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                </Button>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-1">
                {recentChats.slice(0, 10).map((chat, index) => (
                  <div key={chat.sessionId} className="flex items-center gap-2 group">
                    {showChatSelection && (
                      <Checkbox
                        checked={selectedChats.has(index)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedChats);
                          if (checked) {
                            newSelected.add(index);
                          } else {
                            newSelected.delete(index);
                          }
                          setSelectedChats(newSelected);
                        }}
                        className="shrink-0"
                      />
                    )}
                    <div className="flex-1 flex items-center gap-2">
                      <button
                        onClick={() => onChatLoad(chat.sessionId)}
                        className="flex-1 text-left p-2 rounded-md hover:bg-muted/50 transition-colors"
                        disabled={showChatSelection}
                      >
                        <div className="font-medium text-sm line-clamp-1">
                          {chat.title}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {chat.lastMessage}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {chat.timestamp.toLocaleDateString()}
                        </div>
                      </button>
                      {!showChatSelection && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const { error } = await supabase
                                    .from('saved_insights')
                                    .insert({
                                      user_id: user.id,
                                      insight_text: `Chat: ${chat.title}\n\nLast message: ${chat.lastMessage}`,
                                      category: 'chat_session',
                                      tags: ['chat', 'conversation', chat.sessionId]
                                    });

                                  if (error) {
                                    console.error('Error saving to favorites:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to save chat to favorites",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  toast({
                                    title: "Chat saved",
                                    description: `"${chat.title}" saved to your collection`,
                                  });
                                } catch (error) {
                                  console.error('Error saving to favorites:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to save chat to favorites",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="h-8 w-8 p-0 hover:bg-muted transition-colors"
                            >
                              <Heart className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Save this entire chat session</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Personalization Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('dashboard.settings')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="personalization" className="text-sm">
                  {t('dashboard.personalization')}
                </Label>
                <Switch
                  id="personalization"
                  checked={allowPersonalization}
                  onCheckedChange={onPersonalizationChange}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('dashboard.theme')}</Label>
                <ThemeToggle />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('dashboard.language')}</Label>
                <LanguageSwitcher />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          onClick={onSignOut}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('dashboard.signOut')}
        </Button>
      </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
};