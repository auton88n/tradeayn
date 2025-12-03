import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Plus, LogOut, Trash2, Camera, Settings, X, MessageSquare, Search, Star, Shield, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { ProfileAvatarUpload } from './ProfileAvatarUpload';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SidebarProps } from '@/types/dashboard.types';

export const Sidebar = ({
  userName,
  userEmail,
  userAvatar,
  isTyping,
  hasAccess,
  selectedMode,
  modes,
  recentChats,
  showChatSelection,
  selectedChats,
  onModeSelect,
  onNewChat,
  onLoadChat,
  onToggleChatSelection,
  onSelectAllChats,
  onDeleteSelected,
  onShowChatSelection,
  onLogout,
  onAvatarUpdated,
  isAdmin,
  onAdminPanelClick
}: SidebarProps) => {
  const { t, language, direction } = useLanguage();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('pinnedChats');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const formatCompactTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Now';
    if (diffMins < 60) return `${diffMins}${language === 'ar' ? 'د' : 'm'}`;
    if (diffHours < 24) return `${diffHours}${language === 'ar' ? 'س' : 'h'}`;
    if (diffDays === 1) return language === 'ar' ? 'أمس' : 'Yesterday';
    return format(date, 'MMM d');
  };

  const togglePin = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedChats(prev => {
      const newPinned = new Set(prev);
      if (newPinned.has(sessionId)) {
        newPinned.delete(sessionId);
      } else {
        newPinned.add(sessionId);
      }
      localStorage.setItem('pinnedChats', JSON.stringify([...newPinned]));
      return newPinned;
    });
  };

  const filteredAndSortedChats = React.useMemo(() => {
    let filtered = recentChats;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = recentChats.filter(chat => 
        chat.title.toLowerCase().includes(query) ||
        chat.lastMessage.toLowerCase().includes(query)
      );
    }
    
    return [...filtered].sort((a, b) => {
      const aPinned = pinnedChats.has(a.sessionId);
      const bPinned = pinnedChats.has(b.sessionId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [recentChats, searchQuery, pinnedChats]);

  return (
    <div className="h-full flex flex-col bg-background backdrop-blur-2xl">
      <SidebarHeader>
        {/* Premium Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            {/* Left: AYN Brand with Brain icon */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-black dark:bg-white flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white dark:text-black" />
                </div>
                {/* Status dot */}
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                  hasAccess ? "bg-green-500" : "bg-foreground/30"
                )}>
                  {isTyping && (
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-foreground">AYN AI</h1>
                <p className="text-xs text-foreground/60">
                  {isTyping ? t('common.thinking') : hasAccess ? t('common.active') : t('common.inactive')}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              <LanguageSwitcher />
              <ThemeToggle />
              <Button 
                onClick={toggleSidebar} 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-foreground hover:text-background transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="h-px bg-border" />
      </SidebarHeader>

      <SidebarContent className="flex flex-col overflow-hidden">
        {/* New Chat Button */}
        <SidebarGroup className="flex-shrink-0 p-4 pb-2">
          <SidebarGroupContent>
            <Button 
              onClick={onNewChat} 
              className={cn(
                "w-full h-10 rounded-xl",
                "bg-foreground text-background",
                "hover:bg-foreground/90",
                "transition-all duration-300",
                "disabled:opacity-40"
              )}
              disabled={!hasAccess}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('common.newChat')}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Search Input */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className={cn(
            "relative transition-all duration-300",
            isSearchFocused && "transform scale-[1.02]"
          )}>
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
              isSearchFocused ? "text-foreground" : "text-foreground/50"
            )} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={language === 'ar' ? 'البحث في المحادثات...' : 'Search chats...'}
              className={cn(
                "pl-9 h-9 text-sm rounded-xl",
                "bg-transparent border border-border",
                "placeholder:text-foreground/40",
                "focus:bg-background focus:border-foreground/50",
                "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                "focus:outline-none focus-visible:outline-none",
                "transition-all duration-300"
              )}
            />
          </div>
        </div>

        {/* Recent Chats Label and Actions */}
        <div className="flex-shrink-0 px-4 pb-2">
          <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">
              {t('common.recentChats')}
            </span>
            {recentChats.length > 0 && (
              <div className="flex gap-1">
                {!showChatSelection ? (
                  <Button 
                    onClick={() => onShowChatSelection(true)} 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs text-foreground/60 hover:text-background hover:bg-foreground"
                  >
                    {t('common.select')}
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={onSelectAllChats} 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs hover:bg-foreground hover:text-background"
                    >
                      {selectedChats.size === recentChats.length ? t('common.none') : t('common.all')}
                    </Button>
                    <Button 
                      onClick={() => onShowChatSelection(false)} 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs hover:bg-foreground hover:text-background"
                    >
                      {t('common.cancel')}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Chat List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-2">
            <SidebarMenu className="space-y-1">
              {filteredAndSortedChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-12 h-12 rounded-xl bg-foreground/5 border border-border flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-foreground/30" />
                  </div>
                  <p className="text-sm text-foreground/50 text-center">
                    {searchQuery 
                      ? (language === 'ar' ? 'لم يتم العثور على محادثات' : 'No chats found') 
                      : t('common.noRecentChats')}
                  </p>
                </div>
              ) : (
                <>
                  {filteredAndSortedChats.map((chat, index) => {
                    const isPinned = pinnedChats.has(chat.sessionId);
                    const originalIndex = recentChats.findIndex(c => c.sessionId === chat.sessionId);
                    return (
                      <SidebarMenuItem 
                        key={chat.sessionId}
                        className="animate-in fade-in-0 slide-in-from-left-2 duration-300"
                        style={{ 
                          animationDelay: `${index * 30}ms`,
                          animationFillMode: 'backwards'
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {showChatSelection && (
                            <Checkbox 
                              checked={selectedChats.has(originalIndex)} 
                              onCheckedChange={() => onToggleChatSelection(originalIndex)} 
                              className="ml-2"
                            />
                          )}
                          <SidebarMenuButton 
                            onClick={() => !showChatSelection && onLoadChat(chat)} 
                            tooltip={undefined}
                            title=""
                            className={cn(
                              "flex-1 h-auto py-3 px-3 rounded-xl group",
                              "hover:bg-foreground hover:text-background active:scale-[0.98]",
                              "transition-all duration-200",
                              isPinned && "bg-foreground/5 border border-border"
                            )}
                            style={{ overflow: 'visible' }}
                          >
                            <div className="w-full space-y-1.5">
                              {/* Title row */}
                              <div className="flex items-center gap-2 w-full">
                                <div className="w-6 h-6 rounded-lg bg-black dark:bg-white group-hover:bg-background flex items-center justify-center flex-shrink-0 transition-colors">
                                  <MessageSquare className="w-3 h-3 text-white dark:text-black group-hover:text-foreground" />
                                </div>
                                <span className="text-sm font-medium truncate flex-1 min-w-0 text-foreground group-hover:text-background transition-colors">
                                  {chat.title}
                                </span>
                                <button
                                  onClick={(e) => togglePin(chat.sessionId, e)}
                                  className={cn(
                                    "p-1 rounded-md transition-all duration-200 flex-shrink-0",
                                    isPinned 
                                      ? "opacity-100" 
                                      : "opacity-0 group-hover:opacity-100",
                                    "hover:bg-background/20"
                                  )}
                                >
                                  <Star className={cn(
                                    "w-3 h-3",
                                    isPinned ? "fill-amber-400 text-amber-400" : "text-muted-foreground group-hover:text-background"
                                  )} />
                                </button>
                                <span className="text-[10px] text-muted-foreground group-hover:text-background/70 flex-shrink-0 transition-colors">
                                  {formatCompactTime(new Date(chat.timestamp))}
                                </span>
                              </div>
                              {/* Preview text - using CSS truncate */}
                              <p className="text-xs text-muted-foreground group-hover:text-background/70 truncate pl-8 transition-colors">
                                {chat.lastMessage}
                              </p>
                            </div>
                          </SidebarMenuButton>
                        </div>
                      </SidebarMenuItem>
                    );
                  })}
                  
                  {/* Delete Selected Button */}
                  {showChatSelection && selectedChats.size > 0 && (
                    <div className="px-2 pt-3">
                      <Button 
                        onClick={onDeleteSelected} 
                        variant="destructive" 
                        size="sm" 
                        className="w-full h-9 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.deleteSelected')} ({selectedChats.size})
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SidebarMenu>
          </ScrollArea>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className="h-px bg-border" />
        
        {/* User Profile */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 p-4 w-full",
              "hover:bg-foreground hover:text-background transition-all duration-300",
              "cursor-pointer rounded-xl m-2 mb-3",
              "group"
            )}>
              <div className="relative">
                <Avatar className={cn(
                  "w-10 h-10 ring-2 ring-border",
                  "transition-all duration-300",
                  "group-hover:ring-background/30 group-hover:scale-105"
                )}>
                  <AvatarImage src={userAvatar} alt={userName || 'User'} />
                  <AvatarFallback className="bg-foreground/10 text-foreground font-medium group-hover:bg-background/20 group-hover:text-background">
                    {userName?.charAt(0) || userEmail?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate text-foreground group-hover:text-background transition-colors">
                  {userName || t('common.user')}
                </p>
                <p className="text-xs text-foreground/60 group-hover:text-background/70 truncate">
                  {userEmail}
                </p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className={cn(
              "w-52 p-1.5 rounded-xl",
              "bg-background backdrop-blur-xl",
              "border-border shadow-xl",
              "animate-in slide-in-from-bottom-2 fade-in-0 duration-200"
            )}
            align="start" 
            side="top"
            sideOffset={8}
          >
            <Button 
              onClick={() => setShowAvatarUpload(true)}
              variant="ghost" 
              className="w-full justify-start h-9 px-3 rounded-lg hover:bg-foreground hover:text-background"
            >
              <Camera className="w-4 h-4 mr-2.5" />
              {t('profile.changePhoto')}
            </Button>
            <Button 
              onClick={() => navigate('/settings')}
              variant="ghost" 
              className="w-full justify-start h-9 px-3 rounded-lg hover:bg-foreground hover:text-background"
            >
              <Settings className="w-4 h-4 mr-2.5" />
              {t('settings.title')}
            </Button>
            {isAdmin && (
              <Button 
                onClick={onAdminPanelClick}
                variant="ghost" 
                className="w-full justify-start h-9 px-3 rounded-lg hover:bg-foreground hover:text-background"
              >
                <Shield className="w-4 h-4 mr-2.5" />
                {t('admin.panel')}
              </Button>
            )}
            <div className="h-px bg-border my-1" />
            <Button 
              onClick={onLogout}
              variant="ghost" 
              className="w-full justify-start h-9 px-3 rounded-lg text-destructive hover:bg-destructive hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2.5" />
              {t('auth.signOut')}
            </Button>
          </PopoverContent>
        </Popover>

        {/* Avatar Upload Dialog */}
        <ProfileAvatarUpload
          open={showAvatarUpload}
          onOpenChange={setShowAvatarUpload}
          onAvatarUpdated={onAvatarUpdated ?? (() => {})}
          currentAvatarUrl={userAvatar}
          userName={userName}
        />
      </SidebarFooter>
    </div>
  );
};