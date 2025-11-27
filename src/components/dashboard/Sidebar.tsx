import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Plus, LogOut, Trash2, Camera, Settings, X, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
  onAvatarUpdated
}: SidebarProps) => {
  const {
    t,
    language,
    direction
  } = useLanguage();
  const {
    toggleSidebar
  } = useSidebar();
  const navigate = useNavigate();
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
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

      <SidebarContent>
        {/* New Chat Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <Button onClick={onNewChat} className="w-full" variant="outline" disabled={!hasAccess}>
              <Plus className="w-4 h-4 mr-2" />
              {t('common.newChat')}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Chats */}
        <SidebarGroup>
          <div className={`flex items-center justify-between px-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            {direction === 'rtl' ? <>
                <div className="flex gap-1">
                  {!showChatSelection ? <Button onClick={() => onShowChatSelection(true)} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      {t('common.select')}
                    </Button> : <>
                      <Button onClick={onSelectAllChats} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        {selectedChats.size === recentChats.length ? t('common.none') : t('common.all')}
                      </Button>
                      <Button onClick={() => {
                  onShowChatSelection(false);
                }} variant="ghost" size="sm" className="h-6 px-2 text-xs">
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

          <SidebarGroupContent>
            <SidebarMenu>
              {recentChats.length === 0 ? <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('common.noRecentChats')}
                </div> : <>
                  {recentChats.map((chat, index) => <SidebarMenuItem key={chat.sessionId}>
                      <div className="flex items-center gap-2 w-full border-b last:border-b-0">
                        {showChatSelection && <Checkbox checked={selectedChats.has(index)} onCheckedChange={() => onToggleChatSelection(index)} className="mr-2" />}
                        <SidebarMenuButton 
                          onClick={() => !showChatSelection && onLoadChat(chat)} 
                          className="flex-1 h-auto py-3 px-3 hover:bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            {/* Title row with icon and timestamp */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <p className="text-sm font-medium truncate">{chat.title}</p>
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatDistanceToNow(new Date(chat.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                            {/* Preview text */}
                            <p className="text-xs text-muted-foreground truncate pl-6">{chat.lastMessage}</p>
                          </div>
                        </SidebarMenuButton>
                      </div>
                    </SidebarMenuItem>)}
                  
                  {/* Delete Selected Button */}
                  {showChatSelection && selectedChats.size > 0 && <div className="px-2 pt-2">
                      <Button onClick={onDeleteSelected} variant="destructive" size="sm" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.deleteSelected')} ({selectedChats.size})
                      </Button>
                    </div>}
                </>}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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