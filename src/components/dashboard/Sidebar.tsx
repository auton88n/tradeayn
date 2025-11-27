import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Plus, LogOut, Trash2, Camera, Settings, X, MessageSquare, Search, Star, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { ProfileAvatarUpload } from './ProfileAvatarUpload';
import { useNavigate } from 'react-router-dom';
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
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = recentChats.filter(chat => 
        chat.title.toLowerCase().includes(query) ||
        chat.lastMessage.toLowerCase().includes(query)
      );
    }
    
    // Sort: pinned first, then by timestamp
    return [...filtered].sort((a, b) => {
      const aPinned = pinnedChats.has(a.sessionId);
      const bPinned = pinnedChats.has(b.sessionId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [recentChats, searchQuery, pinnedChats]);
  return <>
      <SidebarHeader>
        <div className="flex items-center justify-between p-4 border-b gap-3">
          {/* Left: AYN Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">AYN AI</span>
            <Badge variant={hasAccess ? "default" : "secondary"} className="text-xs">
              {isTyping ? t('common.thinking') : hasAccess ? t('common.active') : t('common.inactive')}
            </Badge>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button 
              onClick={toggleSidebar} 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col overflow-hidden">
        {/* Fixed: New Chat Button */}
        <SidebarGroup className="flex-shrink-0">
          <SidebarGroupContent>
            <Button onClick={onNewChat} className="w-full" variant="outline" disabled={!hasAccess}>
              <Plus className="w-4 h-4 mr-2" />
              {t('common.newChat')}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Fixed: Search Input */}
        <div className="px-2 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'البحث في المحادثات...' : 'Search chats...'}
              className="pl-8"
            />
          </div>
        </div>

        {/* Fixed: Recent Chats Label and Actions */}
        <div className="flex-shrink-0">
          <div className={`flex items-center justify-between px-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            {direction === 'rtl' ? <>
                <div className="flex gap-1">
                  {!showChatSelection ? <Button onClick={() => onShowChatSelection(true)} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      {t('common.select')}
                    </Button> : <>
                      <Button onClick={onSelectAllChats} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        {selectedChats.size === recentChats.length ? t('common.none') : t('common.all')}
                      </Button>
                      <Button onClick={() => onShowChatSelection(false)} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        {t('common.cancel')}
                      </Button>
                    </>}
                </div>
                <SidebarGroupLabel>{t('common.recentChats')}</SidebarGroupLabel>
              </> : <>
                <SidebarGroupLabel>{t('common.recentChats')}</SidebarGroupLabel>
                {recentChats.length > 0 && <div className="flex gap-1">
                    {!showChatSelection ? <Button onClick={() => onShowChatSelection(true)} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        {t('common.select')}
                      </Button> : <>
                        <Button onClick={onSelectAllChats} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          {selectedChats.size === recentChats.length ? t('common.none') : t('common.all')}
                        </Button>
                        <Button onClick={() => onShowChatSelection(false)} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          {t('common.cancel')}
                        </Button>
                      </>}
                  </div>}
              </>}
          </div>
        </div>

        {/* Scrollable: Chat List Only */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <SidebarMenu className="px-2">
              {filteredAndSortedChats.length === 0 ? <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? (language === 'ar' ? 'لم يتم العثور على محادثات' : 'No chats found') : t('common.noRecentChats')}
                </div> : <>
                  {filteredAndSortedChats.map((chat) => {
                    const isPinned = pinnedChats.has(chat.sessionId);
                    const originalIndex = recentChats.findIndex(c => c.sessionId === chat.sessionId);
                    return (
                      <SidebarMenuItem key={chat.sessionId}>
                        <div className="flex items-center gap-2 w-full border-b last:border-b-0">
                          {showChatSelection && <Checkbox checked={selectedChats.has(originalIndex)} onCheckedChange={() => onToggleChatSelection(originalIndex)} className="mr-2" />}
                            <SidebarMenuButton 
                              onClick={() => !showChatSelection && onLoadChat(chat)} 
                              className="flex-1 h-auto py-3 px-2 hover:bg-muted/50 rounded-lg group !overflow-visible"
                            >
                            <div className="w-full space-y-1">
                              {/* Title row - single flex with proper spacing */}
                              <div className="flex items-center gap-1.5 w-full">
                                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium truncate flex-1 min-w-0">{chat.title}</span>
                                <button
                                  onClick={(e) => togglePin(chat.sessionId, e)}
                                  className={`${isPinned ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity p-0.5 hover:bg-accent rounded flex-shrink-0`}
                                >
                                  <Star className={`w-3 h-3 ${isPinned ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                                </button>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatCompactTime(new Date(chat.timestamp))}
                                </span>
                              </div>
                              {/* Preview text */}
                              <p className="text-xs text-muted-foreground truncate pl-5">{chat.lastMessage}</p>
                            </div>
                          </SidebarMenuButton>
                        </div>
                      </SidebarMenuItem>
                    );
                  })}
                  
                  {/* Delete Selected Button */}
                  {showChatSelection && selectedChats.size > 0 && <div className="px-2 pt-2">
                      <Button onClick={onDeleteSelected} variant="destructive" size="sm" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.deleteSelected')} ({selectedChats.size})
                      </Button>
                    </div>}
                </>}
            </SidebarMenu>
          </ScrollArea>
        </div>
      </SidebarContent>

      <SidebarFooter>
        {/* User Profile with Logout */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3 px-4 pb-4 w-full hover:bg-muted/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer rounded-lg">
              <Avatar className="w-10 h-10 transition-transform duration-300 hover:scale-110">
                <AvatarImage src={userAvatar} alt={userName || 'User'} />
                <AvatarFallback>
                  {userName?.charAt(0) || userEmail?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">
                  {userName || t('common.user')}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 p-1 animate-in slide-in-from-bottom-2 fade-in-0 duration-300 z-50 bg-background border shadow-xl" 
            align="start" 
            side="top"
            sideOffset={8}
          >
            <Button 
              onClick={() => setShowAvatarUpload(true)}
              variant="ghost" 
              className="w-full justify-start h-9 px-2 rounded-sm hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <Camera className="w-4 h-4 mr-2" />
              {t('profile.changePhoto')}
            </Button>
            <Button 
              onClick={() => navigate('/settings')}
              variant="ghost" 
              className="w-full justify-start h-9 px-2 rounded-sm hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <Settings className="w-4 h-4 mr-2" />
              {t('settings.title')}
            </Button>
            {isAdmin && (
              <Button 
                onClick={onAdminPanelClick}
                variant="ghost" 
                className="w-full justify-start h-9 px-2 rounded-sm hover:bg-accent focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Shield className="w-4 h-4 mr-2" />
                {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
              </Button>
            )}
            <Button 
              onClick={onLogout} 
              variant="ghost" 
              className="w-full justify-start h-9 px-2 rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10 focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <LogOut className="w-4 h-4 mr-2" />
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

        {/* Copyright */}
        
      </SidebarFooter>
    </>;
};