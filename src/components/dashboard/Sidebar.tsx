import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Plus, LogOut, Trash2, Camera, Settings, X, MessageSquare, Search, Star, Shield, Brain, ChevronDown, GraduationCap, Loader2, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { ProfileAvatarUpload } from './ProfileAvatarUpload';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SidebarProps } from '@/types/dashboard.types';
import { useSoundContextOptional } from '@/contexts/SoundContext';

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
  onAdminPanelClick,
  onStartTutorial,
  isTutorialProfileStep
}: SidebarProps) => {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const soundContext = useSoundContextOptional();
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('pinnedChats');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Control profile popover during tutorial
  useEffect(() => {
    if (isTutorialProfileStep) {
      setProfilePopoverOpen(true);
    } else if (profilePopoverOpen) {
      setProfilePopoverOpen(false);
    }
  }, [isTutorialProfileStep]);

  const formatCompactTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
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
                  {isTyping ? 'Thinking...' : hasAccess ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {soundContext && (
                <Button
                  onClick={() => soundContext.toggleEnabled()}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-foreground hover:text-background transition-colors"
                  title={soundContext.enabled ? 'Mute sounds' : 'Enable sounds'}
                >
                  {soundContext.enabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
              )}
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
              New Chat
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
              placeholder="Search chats..."
              className={cn(
                "pl-9 h-9 text-sm rounded-xl",
                "bg-transparent",
                "!border !border-border/60",
                "placeholder:text-foreground/40",
                "focus:bg-background focus:!border-foreground/40",
                "!ring-0 !outline-none",
                "focus:!ring-0 focus-visible:!ring-0 focus-visible:!ring-offset-0",
                "transition-all duration-300"
              )}
            />
          </div>
        </div>

        {/* Recent Chats Label and Actions */}
        <div className="flex-shrink-0 px-4 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.08em]">
              Recent Chats
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
                    Select
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={onSelectAllChats} 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs hover:bg-foreground hover:text-background"
                    >
                      {selectedChats.size === recentChats.length ? 'None' : 'All'}
                    </Button>
                    <Button 
                      onClick={() => onShowChatSelection(false)} 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs hover:bg-foreground hover:text-background"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delete Selected Button - At Top */}
        {showChatSelection && selectedChats.size > 0 && (
          <div className="px-4 pb-2">
            <Button 
              onClick={onDeleteSelected} 
              variant="destructive" 
              size="sm" 
              className="w-full h-9 rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedChats.size})
            </Button>
          </div>
        )}

        {/* Scrollable Chat List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-3">
            <SidebarMenu className="space-y-0.5">
              {filteredAndSortedChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {searchQuery ? 'No chats found' : 'No conversations yet'}
                  </p>
                  <p className="text-xs text-muted-foreground/60 text-center">
                    Start a new chat to begin
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
                        className={cn(
                          "relative animate-in fade-in-0 slide-in-from-left-2 duration-300",
                          index > 0 && "before:absolute before:top-0 before:left-4 before:right-4 before:h-px before:bg-border/30"
                        )}
                        style={{ 
                          animationDelay: `${index * 30}ms`,
                          animationFillMode: 'backwards'
                        }}
                      >
                        <div className="flex items-center gap-2 w-full group">
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
                              "flex-1 h-auto py-3.5 px-3 rounded-xl overflow-hidden",
                              "hover:bg-muted/50 hover:shadow-sm",
                              "border border-transparent hover:border-border/40",
                              "active:scale-[0.98]",
                              "transition-all duration-200 ease-out",
                              isPinned && "bg-muted/30 border-border/30"
                            )}
                          >
                            <div className="w-full min-w-0 overflow-hidden space-y-2">
                              {/* Row 1: Icon + Title + Time + Star */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare className="w-4 h-4 text-foreground/50" />
                                  </div>
                                  <span className="text-sm font-medium truncate text-foreground">
                                    {chat.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-[11px] text-muted-foreground">
                                    {formatCompactTime(new Date(chat.timestamp))}
                                  </span>
                                  <button
                                    onClick={(e) => togglePin(chat.sessionId, e)}
                                    className={cn(
                                      "p-1 rounded-md transition-all duration-200",
                                      "opacity-0 group-hover:opacity-100",
                                      isPinned && "opacity-100",
                                      isPinned 
                                        ? "text-amber-500 hover:text-amber-600" 
                                        : "text-muted-foreground/40 hover:text-muted-foreground"
                                    )}
                                  >
                                    <Star className={cn(
                                      "w-3.5 h-3.5",
                                      isPinned && "fill-amber-500"
                                    )} />
                                  </button>
                                </div>
                              </div>
                              {/* Row 2: Preview only */}
                              <div className="pl-[42px]">
                                <p className="text-xs text-muted-foreground line-clamp-2 text-left leading-relaxed">
                                  {chat.lastMessage}
                                </p>
                              </div>
                            </div>
                          </SidebarMenuButton>
                        </div>
                      </SidebarMenuItem>
                    );
                  })}
                </>
              )}
            </SidebarMenu>
          </ScrollArea>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {/* User Profile - Premium Glassmorphism Card */}
        <Popover open={profilePopoverOpen} onOpenChange={setProfilePopoverOpen}>
          <PopoverTrigger asChild>
            <button 
              data-tutorial="profile"
              className={cn(
                "flex items-center gap-3 p-3 w-full",
                "cursor-pointer rounded-xl",
                "bg-muted/40 backdrop-blur-sm",
                "border border-border/50",
                "shadow-sm hover:shadow-md",
                "hover:bg-muted/60 hover:border-border/70",
                "hover:-translate-y-0.5",
                "transition-all duration-200 ease-out",
                "active:scale-[0.98]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              )}>
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10 ring-2 ring-background shadow-sm">
                  <AvatarImage src={userAvatar} alt={userName || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {userName?.charAt(0) || userEmail?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold truncate text-foreground">
                  {userName || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background/80 shadow-sm">
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className={cn(
              "w-64 p-0 rounded-2xl overflow-hidden",
              "bg-background/95 backdrop-blur-xl",
              "border border-border/60 shadow-2xl",
              "animate-in slide-in-from-bottom-2 fade-in-0 duration-200"
            )}
            align="start" 
            side="top"
            sideOffset={8}
          >
            {/* User Info Header */}
            <div className="px-4 py-3 bg-muted/30">
              <p className="text-sm font-semibold text-foreground truncate">{userName || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            
            {/* Gradient Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            
            {/* Menu Items */}
            <div className="p-2 space-y-0.5">
              <Button 
                onClick={() => setShowAvatarUpload(true)}
                variant="ghost" 
                className="w-full justify-start h-11 px-3 gap-3 rounded-xl hover:bg-muted/60 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-muted group-hover:scale-105 transition-all duration-200">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Change Photo</span>
                  <span className="text-[10px] text-muted-foreground/70">Update your avatar</span>
                </div>
              </Button>
              
              <Button 
                onClick={() => navigate('/settings')}
                variant="ghost" 
                className="w-full justify-start h-11 px-3 gap-3 rounded-xl hover:bg-muted/60 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-muted group-hover:scale-105 transition-all duration-200">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Settings</span>
                  <span className="text-[10px] text-muted-foreground/70">Preferences & account</span>
                </div>
              </Button>
              
              <Button 
                onClick={() => {
                  setProfilePopoverOpen(false);
                  onStartTutorial?.();
                }}
                variant="ghost" 
                className="w-full justify-start h-11 px-3 gap-3 rounded-xl hover:bg-muted/60 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-muted group-hover:scale-105 transition-all duration-200">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Tutorial</span>
                  <span className="text-[10px] text-muted-foreground/70">Learn how to use AYN</span>
                </div>
              </Button>
              
              {isAdmin && (
                <Button 
                  onClick={onAdminPanelClick}
                  variant="ghost" 
                  className="w-full justify-start h-11 px-3 gap-3 rounded-xl hover:bg-muted/60 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-muted group-hover:scale-105 transition-all duration-200">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Admin Panel</span>
                    <span className="text-[10px] text-muted-foreground/70">Manage system</span>
                  </div>
                </Button>
              )}
            </div>
            
            {/* Gradient Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            
            {/* Sign Out */}
            <div className="p-2">
              <Button 
                onClick={async () => {
                  setIsSigningOut(true);
                  setProfilePopoverOpen(false);
                  try {
                    await onLogout();
                  } catch (error) {
                    // Force logout on error
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                  }
                }}
                disabled={isSigningOut}
                variant="ghost" 
                className="w-full justify-start h-11 px-3 gap-3 rounded-xl text-destructive/80 hover:text-destructive hover:bg-destructive/8 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/15 transition-all duration-200">
                  {isSigningOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm font-medium">
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </span>
              </Button>
            </div>
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