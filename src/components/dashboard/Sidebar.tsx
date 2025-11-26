import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
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
import { Plus, LogOut, Trash2, X } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme-toggle';
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
  onLogout
}: SidebarProps) => {
  const { t, language, direction } = useLanguage();
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <SidebarHeader>
        {/* User Profile with Close Button */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {userName?.charAt(0) || userEmail?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {userName || t('common.user')}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </div>
          {/* Close button inside sidebar - desktop only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex ml-2 hover:bg-muted h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* AYN Status */}
        <div className="px-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">AYN AI</span>
            <Badge variant={hasAccess ? "default" : "secondary"} className="text-xs">
              {isTyping ? t('common.thinking') : (hasAccess ? t('common.active') : t('common.inactive'))}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* New Chat Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <Button
              onClick={onNewChat}
              className="w-full"
              variant="outline"
              disabled={!hasAccess}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('common.newChat')}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Modes */}
        <SidebarGroup>
          <SidebarGroupLabel>{t('common.quickStart')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modes.map((mode) => (
                <SidebarMenuItem key={mode.name}>
                  <SidebarMenuButton
                    onClick={() => onModeSelect(mode.name)}
                    disabled={!hasAccess}
                    tooltip={mode.description}
                    className={selectedMode === mode.name ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                  >
                    <mode.icon className="w-4 h-4" />
                    <span>{mode.translatedName}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Chats */}
        <SidebarGroup>
          <div className={`flex items-center justify-between px-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            {direction === 'rtl' ? (
              <>
                <div className="flex gap-1">
                  {!showChatSelection ? (
                    <Button
                      onClick={() => onShowChatSelection(true)}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
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
                        onClick={() => {
                          onShowChatSelection(false);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        {t('common.cancel')}
                      </Button>
                    </>
                  )}
                </div>
                <SidebarGroupLabel>{t('common.recentChats')}</SidebarGroupLabel>
              </>
            ) : (
              <>
                <SidebarGroupLabel>{t('common.recentChats')}</SidebarGroupLabel>
                {recentChats.length > 0 && (
                  <div className="flex gap-1">
                    {!showChatSelection ? (
                      <Button
                        onClick={() => onShowChatSelection(true)}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
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
              </>
            )}
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {recentChats.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('common.noRecentChats')}
                </div>
              ) : (
                <>
                  {recentChats.map((chat, index) => (
                    <SidebarMenuItem key={chat.sessionId}>
                      <div className="flex items-center gap-2 w-full">
                        {showChatSelection && (
                          <Checkbox
                            checked={selectedChats.has(index)}
                            onCheckedChange={() => onToggleChatSelection(index)}
                            className="mr-2"
                          />
                        )}
                        <SidebarMenuButton
                          onClick={() => !showChatSelection && onLoadChat(chat)}
                          className="flex-1"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{chat.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                          </div>
                        </SidebarMenuButton>
                      </div>
                    </SidebarMenuItem>
                  ))}
                  
                  {/* Delete Selected Button */}
                  {showChatSelection && selectedChats.size > 0 && (
                    <div className="px-2 pt-2">
                      <Button
                        onClick={onDeleteSelected}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('common.deleteSelected')} ({selectedChats.size})
                      </Button>
                    </div>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            title={t('common.signOut')}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-4 pb-4 text-xs text-center text-muted-foreground">
          © 2024 AYN AI
        </div>
      </SidebarFooter>
    </>
  );
};
