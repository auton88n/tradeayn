import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Plus, LogOut, Trash2, Camera, Settings, X, MessageSquare, Search, Star, Shield, Sparkles } from 'lucide-react';
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
    <div className="h-full flex flex-col bg-background/60 backdrop-blur-2xl">
      <SidebarHeader>
        {/* Premium Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            {/* Left: AYN Brand */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                {/* Status dot */}
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                  hasAccess ? "bg-green-500" : "bg-muted"
                )}>
                  {isTyping && (
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight">AYN AI</h1>
                <p className="text-xs text-muted-foreground">
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
                className="h-8 w-8 rounded-lg hover:bg-muted/80"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </SidebarHeader>

      <SidebarContent className="flex flex-col overflow-hidden">
        {/* New Chat Button - Premium */}
        <SidebarGroup className="flex-shrink-0 p-4 pb-2">
          <SidebarGroupContent>
            <Button 
              onClick={onNewChat} 
              className={cn(
                "w-full h-10 rounded-xl",
                "bg-primary/10 hover:bg-primary/20 text-primary",
                "border border-primary/20 hover:border-primary/30",
                "transition-all duration-300",
                "disabled:opacity-40"
              )}
              variant="ghost"
              disabled={!hasAccess}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('common.newChat')}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Search Input - Premium floating design */}
        <div className="px-4 pb-3 flex-shrink-0">
          <div className={cn(
            "relative transition-all duration-300",
            isSearchFocused && "transform scale-[1.02]"
          )}>
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
              isSearchFocused ? "text-primary" : "text-muted-foreground"
            )} />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={language === 'ar' ? 'البحث في المحادثات...' : 'Search chats...'}
              className={cn(
                "pl-9 h-9 text-sm rounded-xl",
                "bg-muted/50 border-transparent",
                "placeholder:text-muted-foreground/60",
                "focus:bg-background focus:border-primary/20 focus:ring-2 focus:ring-primary/10",
                "transition-all duration-300"
              )}
            />
          </div>
        </div>

        {/* Recent Chats Label and Actions */}
        <div className="flex-shrink-0 px-4 pb-2">
          <div className={`flex items-center justify-between ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('common.recentChats')}
            </span>
            {recentChats.length > 0 && (
              <div className="flex gap-1">
                {!showChatSelection ? (
                  <Button 
                    onClick={() => onShowChatSelection(true)} 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t('common.select')}
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={onSelectAllChats} 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                    >
                      {selectedChats.size === recentChats.length ? t('common.none') : t('common.all')}
                    </Button>
                    <Button 
                      onClick={() => onShowChatSelection(false)} 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
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
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground/60 text-center">
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
                            className={cn(
                              "flex-1 h-auto py-3 px-3 rounded-xl group !overflow-visible",
                              "hover:bg-muted/60 active:scale-[0.98]",
                              "transition-all duration-200",
                              isPinned && "bg-primary/5"
                            )}
                          >
                            <div className="w-full space-y-1.5">
                              {/* Title row */}
                              <div className="flex items-center gap-2 w-full">
                                <div className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                                  <MessageSquare className="w-3 h-3 text-muted-foreground" />
                                </div>
                                <span className="text-sm font-medium truncate flex-1 min-w-0">
                                  {chat.title}
                                </span>
                                <button
                                  onClick={(e) => togglePin(chat.sessionId, e)}
                                  className={cn(
                                    "p-1 rounded-md transition-all duration-200 flex-shrink-0",
                                    isPinned 
                                      ? "opacity-100" 
                                      : "opacity-0 group-hover:opacity-100",
                                    "hover:bg-accent"
                                  )}
                                >
                                  <Star className={cn(
                                    "w-3 h-3",
                                    isPinned ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                                  )} />
                                </button>
                                <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                                  {formatCompactTime(new Date(chat.timestamp))}
                                </span>
                              </div>
                              {/* Preview text */}
                              <p className="text-xs text-muted-foreground/60 truncate pl-8">
                                {chat.lastMessage.length > 50 
                                  ? `${chat.lastMessage.substring(0, 50)}...` 
                                  : chat.lastMessage}
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
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        
        {/* User Profile - Premium card design */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 p-4 w-full",
              "hover:bg-muted/50 transition-all duration-300",
              "cursor-pointer rounded-xl m-2 mb-3",
              "group"
            )}>
              <div className="relative">
                <Avatar className={cn(
                  "w-10 h-10 ring-2 ring-border/50",
                  "transition-all duration-300",
                  "group-hover:ring-primary/30 group-hover:scale-105"
                )}>
                  <AvatarImage src={userAvatar} alt={userName || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {userName?.charAt(0) || userEmail?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">
                  {userName || t('common.user')}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate">
                  {userEmail}
                </p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className={cn(
              "w-52 p-1.5 rounded-xl",
              "bg-background/95 backdrop-blur-xl",
              "border-border/50 shadow-xl",
              "animate-in slide-in-from-bottom-2 fade-in-0 duration-200"
            )}
            align="start" 
            side="top"
            sideOffset={8}
          >
            <Button 
              onClick={() => setShowAvatarUpload(true)}
              variant="ghost" 
              className="w-full justify-start h-9 px-3 rounded-lg hover:bg-muted/80"
            >
              <Camera className="w-4 h-4 mr-2.5" />
              {t('profile.changePhoto')}
            </Button>
            <Button 
              onClick={() => navigate('/settings')}
              variant="ghost" 
              className="w-full justify-start h-9 px-3 rounded-lg hover:bg-muted/80"
            >
              <Settings className="w-4 h-4 mr-2.5" />
              {t('settings.title')}
            </Button>
            {isAdmin && (
              <Button 
                onClick={onAdminPanelClick}
                variant="ghost" 
                className="w-full justify-start h-9 px-3 rounded-lg hover:bg-muted/80"
              >
                <Shield className="w-4 h-4 mr-2.5" />
                {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
              </Button>
            )}
            <div className="h-px bg-border/50 my-1" />
            <Button 
              onClick={onLogout} 
              variant="ghost" 
              className={cn(
                "w-full justify-start h-9 px-3 rounded-lg",
                "text-destructive hover:text-destructive hover:bg-destructive/10"
              )}
            >
              <LogOut className="w-4 h-4 mr-2.5" />
              {t('common.signOut')}
            </Button>
          </PopoverContent>
        </Popover>

        {/* Avatar Upload Dialog */}
        <ProfileAvatarUpload
          currentAvatarUrl={userAvatar}
          userName={userName}
          onAvatarUpdated={() => {
            setShowAvatarUpload(false);
            onAvatarUpdated?.();
          }}
          open={showAvatarUpload}
          onOpenChange={setShowAvatarUpload}
        />
      </SidebarFooter>
    </div>
  );
};
