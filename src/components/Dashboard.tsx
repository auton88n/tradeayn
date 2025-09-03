import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { MaintenanceBanner } from '@/components/MaintenanceBanner';
import { 
  Send, 
  Paperclip, 
  TrendingUp, 
  Target, 
  Search, 
  Rocket,
  Brain,
  LogOut,
  Settings,
  Menu,
  X,
  Shield,
  Plus,
  User as UserIcon
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { TermsModal } from './TermsModal';
import { AdminPanel } from './AdminPanel';
import { TypewriterText } from './TypewriterText';
import { TypingIndicator } from './TypingIndicator';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

import { BusinessProfileSetup } from './BusinessProfileSetup';
import { ProactiveInsights } from './ProactiveInsights';
import { SavedInsights } from './SavedInsights';
import { EnhancedChat } from './EnhancedChat';

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
  metadata?: {
    mood?: string;
    businessType?: string;
    insights?: string[];
    actionItems?: string[];
    followUp?: string;
  };
}

interface DashboardProps {
  user: User;
}

interface ChatHistory {
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  sessionId: string;
}

const templates = [
  { 
    name: 'dashboard.templates.marketAnalysis', 
    prompt: 'dashboard.templates.marketAnalysisPrompt', 
    icon: TrendingUp,
    color: 'text-blue-500'
  },
  { 
    name: 'dashboard.templates.salesFunnel', 
    prompt: 'dashboard.templates.salesFunnelPrompt', 
    icon: Target,
    color: 'text-green-500'
  },
  { 
    name: 'dashboard.templates.competitorResearch', 
    prompt: 'dashboard.templates.competitorResearchPrompt', 
    icon: Search,
    color: 'text-purple-500'
  },
  { 
    name: 'dashboard.templates.growthStrategy', 
    prompt: 'dashboard.templates.growthStrategyPrompt', 
    icon: Rocket,
    color: 'text-orange-500'
  },
];


export default function Dashboard({ user }: DashboardProps) {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'admin'>('chat');
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => crypto.randomUUID());
  const [showBusinessSetup, setShowBusinessSetup] = useState(false);
  const { t, language } = useLanguage();
  
  // Maintenance mode state
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    enableMaintenance: false,
    maintenanceMessage: 'System is currently under maintenance. We apologize for any inconvenience.',
    maintenanceStartTime: '',
    maintenanceEndTime: ''
  });
  
  // Typewriter animation state
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // File attachment state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileTypes, setShowFileTypes] = useState(false);
  const [allowPersonalization, setAllowPersonalization] = useState(false);
  
  const { toast } = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCurrentChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender, attachment_url, attachment_name, attachment_type')
        .eq('user_id', user.id)
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading current chat:', error);
        return;
      }

      if (data && data.length > 0) {
        const chatMessages: Message[] = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as 'user' | 'ayn',
          timestamp: new Date(msg.created_at),
          status: 'sent',
          attachment: msg.attachment_url ? {
            url: msg.attachment_url,
            name: msg.attachment_name || 'Attachment',
            type: msg.attachment_type || 'unknown'
          } : undefined
        }));
        
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error('Error loading current chat history:', error);
    }
  };

  useEffect(() => {
    checkUserAccess();
    checkAdminRole();
    checkMaintenanceStatus();
    loadRecentChats();
    loadUserProfile();
    
    const termsKey = `ayn_terms_accepted_${user.id}`;
    const accepted = localStorage.getItem(termsKey) === 'true';
    setHasAcceptedTerms(accepted);
    
    if (accepted) {
      // Load current chat history instead of setting welcome message
      loadCurrentChatHistory();
    }

    // Set up maintenance status polling
    const maintenanceInterval = setInterval(checkMaintenanceStatus, 5000); // Check every 5 seconds

    return () => clearInterval(maintenanceInterval);
  }, [user.id]);

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

  // Typewriter animation effect
  useEffect(() => {
    if (isInputFocused || inputMessage.length > 0) return;

    const messages = [
      t('dashboard.placeholders.askAyn'),
      t('dashboard.placeholders.increaseRevenue'),
      t('dashboard.placeholders.marketTrends'), 
      t('dashboard.placeholders.competitionStrategy'),
      t('dashboard.placeholders.optimizeSales'),
      t('dashboard.placeholders.growthOpportunities'),
      t('dashboard.placeholders.pricingStrategy'),
      t('dashboard.placeholders.targetMarket')
    ];

    const typeSpeed = 100;
    const deleteSpeed = 50;
    const pauseTime = 2000;

    const timer = setTimeout(() => {
      const currentMessage = messages[currentIndex];
      
      if (!isDeleting) {
        setCurrentText(currentMessage.substring(0, currentText.length + 1));
        
        if (currentText === currentMessage) {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        setCurrentText(currentMessage.substring(0, currentText.length - 1));
        
        if (currentText === '') {
          setIsDeleting(false);
          setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentIndex, isInputFocused, inputMessage]);

  const checkUserAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('is_active, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking access:', error);
        return;
      }

      if (!data) {
        setHasAccess(false);
        return;
      }

      const isActive = data.is_active && (!data.expires_at || new Date(data.expires_at) > new Date());
      setHasAccess(isActive);
    } catch (error) {
      console.error('Access check error:', error);
    }
  };

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking role:', error);
        return;
      }

      if (!data) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data.role === 'admin');
    } catch (error) {
      console.error('Role check error:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('contact_person, company_name, business_type, business_context')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setUserProfile(data);
      
      // Check if business profile is complete
      if (!data?.business_type || !data?.company_name) {
        setShowBusinessSetup(true);
      }
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

      // Convert to ChatHistory format, sorted by most recent session
      const chatHistories: ChatHistory[] = Object.entries(sessionGroups)
        .map(([sessionId, messages]) => {
          // Sort messages chronologically for proper conversation flow
          const sortedMessages = messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          // Find the first user message for the title
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
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) // Sort by most recent
        .slice(0, 10); // Limit to latest 10 sessions

      setRecentChats(chatHistories);
    } catch (error) {
      console.error('Error loading recent chats:', error);
    }
  };

  // Removed setWelcomeMessage function as it's no longer needed

  const handleAcceptTerms = () => {
    const termsKey = `ayn_terms_accepted_${user.id}`;
    localStorage.setItem(termsKey, 'true');
    setHasAcceptedTerms(true);
    loadCurrentChatHistory();
    
    toast({
      title: t('auth.welcomeTitle'),
      description: t('auth.welcomeDesc')
    });
  };

  const handleSendMessage = async (messageContent?: string) => {
    if (!hasAcceptedTerms) {
      toast({
        title: t('auth.termsRequired'),
        description: t('auth.termsRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    if (!hasAccess) {
      toast({
        title: t('auth.accessRequired'),
        description: t('auth.accessRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    // Detect language of the user's input
    const detectLanguage = (text: string): 'ar' | 'en' => {
      const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
      return arabicPattern.test(text) ? 'ar' : 'en';
    };

    const content = messageContent || inputMessage.trim();
    if (!content && !selectedFile) return;

    // Detect the language of user input
    const detectedLanguage = detectLanguage(content);

    // Upload file if selected
    let attachment = null;
    if (selectedFile) {
      attachment = await uploadFile(selectedFile);
      if (!attachment) return; // Upload failed
    }

    // Check and increment usage
    try {
      const { data: canUse, error: usageError } = await supabase.rpc('increment_usage', {
        _user_id: user.id,
        _action_type: 'message',
        _count: 1
      });

      if (usageError) {
        console.error('Usage check error:', usageError);
        toast({
          title: "Usage Error",
          description: "Unable to verify usage limits. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (!canUse) {
        toast({
          title: t('error.usageLimit'),
          description: t('error.usageLimitDesc'),
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error('Usage tracking error:', error);
      toast({
        title: t('error.systemError'),
        description: t('error.systemErrorDesc'),
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content || (attachment ? `📎 ${attachment.name}` : ''),
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
      attachment
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsTyping(true);

    try {
      // Call AYN webhook through edge function
      const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('ayn-webhook', {
        body: { 
          message: content,
          userId: user.id,
          allowPersonalization,
          contactPerson: userProfile?.contact_person || '',
          detectedLanguage: detectedLanguage
        }
      });
      
      setIsTyping(false);

      if (webhookError) {
        throw new Error(webhookError.message || 'Webhook call failed');
      }

      const response = webhookResponse?.response || 'I received your message and I\'m processing it. Please try again if you don\'t see a proper response.';
      const metadata = webhookResponse?.metadata || {};

      const aynMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ayn',
        timestamp: new Date(),
        isTyping: true,
        metadata: metadata
      };

      setMessages(prev => [...prev, aynMessage]);

      // Save user message to database
      await supabase.from('messages').insert({
        user_id: user.id,
        session_id: currentSessionId,
        content: content,
        sender: 'user',
        attachment_url: attachment?.url,
        attachment_name: attachment?.name,
        attachment_type: attachment?.type
      });

      // Save AI response to database
      await supabase.from('messages').insert({
        user_id: user.id,
        session_id: currentSessionId,
        content: response,
        sender: 'ayn'
      });

      // Refresh recent chats
      loadRecentChats();

    } catch (error) {
      setIsTyping(false);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        sender: 'ayn',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "Unable to reach AYN. Please try again.",
        variant: "destructive"
      });
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF, Word document, image, text, or JSON file.",
        variant: "destructive"
      });
      return false;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return false;
    }

    setSelectedFile(file);
    toast({
      title: "File Selected",
      description: `${file.name} is ready to send.`,
    });
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragOver to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!hasAccess || !hasAcceptedTerms) {
      toast({
        title: "Access Required",
        description: "You need active access to upload files.",
        variant: "destructive"
      });
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      toast({
        title: "Multiple Files",
        description: "Please drop only one file at a time.",
        variant: "destructive"
      });
      return;
    }

    const file = files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string; type: string } | null> => {
    try {
      setIsUploading(true);
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:type;base64, prefix
        };
        reader.readAsDataURL(file);
      });

      // Upload via edge function
      const { data, error } = await supabase.functions.invoke('file-upload', {
        body: {
          file: base64,
          fileName: file.name,
          fileType: file.type,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      return {
        url: data.fileUrl,
        name: data.fileName,
        type: data.fileType
      };
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAttachmentClick = () => {
    if (!hasAccess || !hasAcceptedTerms) {
      toast({
        title: "Access Required",
        description: "You need active access to upload files.",
        variant: "destructive"
      });
      return;
    }
    
    fileInputRef.current?.click();
  };

  const handleLoadChat = (chatHistory: ChatHistory) => {
    setCurrentSessionId(chatHistory.sessionId);
    setMessages(chatHistory.messages);
    toast({
      title: "Chat Loaded",
      description: `Loaded conversation: ${chatHistory.title}`,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleNewChat = () => {
    const newSessionId = crypto.randomUUID();
    setCurrentSessionId(newSessionId);
    setMessages([]);
    // Force reload of recent chats to update the sidebar
    loadRecentChats();
    toast({
      title: "New Chat Started", 
      description: "You can now start a fresh conversation with AYN.",
    });
  };

  const handleDeleteSelectedChats = async () => {
    if (selectedChats.size === 0) return;

    try {
      const chatIndicesToDelete = Array.from(selectedChats);
      const messageIdsToDelete: string[] = [];

      // Collect message IDs from selected chats
      chatIndicesToDelete.forEach(index => {
        if (recentChats[index]) {
          messageIdsToDelete.push(...recentChats[index].messages.map(m => m.id));
        }
      });

      // Delete messages from database
      if (messageIdsToDelete.length > 0) {
        const { error } = await supabase
          .from('messages')
          .delete()
          .in('id', messageIdsToDelete);

        if (error) {
          console.error('Error deleting messages:', error);
          toast({
            title: "Error",
            description: "Failed to delete some chat messages.",
            variant: "destructive"
          });
          return;
        }
      }

      // Update local state
      const updatedChats = recentChats.filter((_, index) => !selectedChats.has(index));
      setRecentChats(updatedChats);
      setSelectedChats(new Set());
      setShowChatSelection(false);

      toast({
        title: "Chats Deleted",
        description: `Successfully deleted ${selectedChats.size} conversation(s).`,
      });
    } catch (error) {
      console.error('Error deleting chats:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected chats.",
        variant: "destructive"
      });
    }
  };

  const toggleChatSelection = (index: number) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedChats(newSelected);
  };

  const selectAllChats = () => {
    if (selectedChats.size === recentChats.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(recentChats.map((_, index) => index)));
    }
  };

  const handleQuickAction = (action: string, message: Message) => {
    const actionPrompts = {
      elaborate: `Tell me more about: "${message.content.slice(0, 100)}..."`,
      disagree: `I disagree with this assessment: "${message.content.slice(0, 100)}..." Can you explain your reasoning?`,
      implement: `How do I implement this advice: "${message.content.slice(0, 100)}..."`,
      examples: `Can you show me specific examples for: "${message.content.slice(0, 100)}..."`,
      roi: `What's the ROI on this strategy: "${message.content.slice(0, 100)}..."`
    };
    
    const prompt = actionPrompts[action as keyof typeof actionPrompts] || `Follow up on: "${message.content.slice(0, 100)}..."`;
    handleSendMessage(prompt);
  };

  const handleReplyToText = (selectedText: string, originalMessage: Message) => {
    const replyPrompt = `Regarding your point about "${selectedText}" - can you elaborate on this?`;
    handleSendMessage(replyPrompt);
  };

  const handleInsightAction = (insight: any) => {
    const insightPrompts = {
      opportunity: `Tell me more about this business opportunity: ${insight.title}`,
      risk: `How can I mitigate this risk: ${insight.title}`,
      trend: `How does this trend affect my business: ${insight.title}`,
      action: `Help me implement this action: ${insight.title}`
    };
    
    const prompt = insightPrompts[insight.type as keyof typeof insightPrompts] || `Tell me more about: ${insight.title}`;
    handleSendMessage(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if business profile setup is needed
  if (showBusinessSetup) {
    return (
      <BusinessProfileSetup 
        userId={user.id}
        onComplete={() => {
          setShowBusinessSetup(false);
          loadUserProfile();
          toast({
            title: "🎉 Welcome to AYN!",
            description: "Your business profile is set up. Let's start optimizing your business!"
          });
        }}
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <Sidebar collapsible="offcanvas" className="w-64">
          <SidebarHeader className="p-4">
            {/* User Profile */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-primary text-white font-semibold text-sm">
                  {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="font-semibold truncate text-sm">{user?.user_metadata?.name || t('common.user')}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* AYN Status */}
            <div className={`flex items-center gap-3 px-3 py-2 mt-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Brain className="w-5 h-5 text-foreground" />
              </div>
              <div className={`flex-1 min-w-0 group-data-[collapsible=icon]:hidden ${language === 'ar' ? 'text-right' : ''}`}>
                <p className="font-medium text-xs text-foreground">AYN AI</p>
                <p className={`text-xs ${isTyping ? 'text-muted-foreground' : (hasAccess ? 'text-green-500 font-medium' : 'text-muted-foreground')}`}>
                  {isTyping ? t('common.thinking') : (hasAccess ? t('common.active') : t('common.inactive'))}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {/* New Chat Button */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleNewChat}
                      className="w-full justify-start font-medium"
                    >
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{t('common.newChat')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Quick Start */}
            <SidebarGroup dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className={`w-full flex px-4 py-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                <SidebarGroupLabel className={language === 'ar' ? 'text-right ml-auto' : 'text-left'}>{t('common.quickStart')}</SidebarGroupLabel>
              </div>
              <SidebarGroupContent className={language === 'ar' ? 'text-right' : ''}>
                <SidebarMenu>
                   {templates.map((template) => (
                    <SidebarMenuItem key={template.name}>
                      <SidebarMenuButton
                        onClick={() => handleSendMessage(t(template.prompt))}
                        disabled={!hasAccess || !hasAcceptedTerms}
                        tooltip={t(template.name)}
                        className={language === 'ar' ? 'flex-row-reverse justify-start' : ''}
                      >
                        <template.icon className={`w-4 h-4 flex-shrink-0 ${template.color} ${language === 'ar' ? 'ml-0 mr-2' : ''}`} />
                        <span className={`group-data-[collapsible=icon]:hidden ${language === 'ar' ? 'text-right' : ''}`}>{t(template.name)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Recent Chats */}
            <SidebarGroup>
              <div className={`flex items-center justify-between px-4 py-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                {language === 'ar' ? (
                  <>
                    <div className="flex items-center gap-1">
                      {!showChatSelection ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowChatSelection(true)}
                          className="h-6 px-2 text-xs"
                        >
                          {t('common.select')}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={selectAllChats}
                            className="h-6 px-2 text-xs"
                          >
                            {selectedChats.size === recentChats.length ? t('common.none') : t('common.all')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowChatSelection(false);
                              setSelectedChats(new Set());
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            {t('common.cancel')}
                          </Button>
                        </>
                      )}
                    </div>
                    <SidebarGroupLabel className="text-right">{t('common.recentChats')}</SidebarGroupLabel>
                  </>
                ) : (
                  <>
                    <SidebarGroupLabel>{t('common.recentChats')}</SidebarGroupLabel>
                    {recentChats.length > 0 && (
                      <div className="flex items-center gap-1">
                        {!showChatSelection ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowChatSelection(true)}
                            className="h-6 px-2 text-xs"
                          >
                            {t('common.select')}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={selectAllChats}
                              className="h-6 px-2 text-xs"
                            >
                              {selectedChats.size === recentChats.length ? t('common.none') : t('common.all')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowChatSelection(false);
                                setSelectedChats(new Set());
                              }}
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
              
              {showChatSelection && selectedChats.size > 0 && (
                <div className="px-4 pb-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelectedChats}
                    className="w-full h-8 text-xs"
                  >
                    {t('common.delete')} {selectedChats.size} {selectedChats.size > 1 ? t('common.deleteChats').split(' ')[1] : t('common.deleteChat').split(' ')[1]}
                  </Button>
                </div>
              )}
              
              <SidebarGroupContent>
                <SidebarMenu>
                  {recentChats.length > 0 ? (
                    recentChats.map((chat, index) => (
                      <SidebarMenuItem key={index} className="mb-2">
                        <div className="flex items-center gap-2 px-3">
                          {showChatSelection && (
                            <Checkbox
                              checked={selectedChats.has(index)}
                              onCheckedChange={() => toggleChatSelection(index)}
                              className="flex-shrink-0"
                            />
                          )}
                          <SidebarMenuButton
                            onClick={() => !showChatSelection && handleLoadChat(chat)}
                            tooltip={chat.title}
                            className={`py-4 px-3 h-auto flex-1 ${showChatSelection ? 'cursor-default' : ''} ${language === 'ar' ? 'flex-row-reverse justify-start' : ''}`}
                            disabled={showChatSelection}
                          >
                            <div className={`w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-medium ${language === 'ar' ? 'ml-0 mr-3' : 'mr-3'}`}>
                              {chat.title.charAt(0).toUpperCase()}
                            </div>
                            <div className={`flex flex-col min-w-0 gap-1 ${language === 'ar' ? 'text-right' : ''}`}>
                              <span className="font-medium truncate text-sm group-data-[collapsible=icon]:hidden">{chat.title}</span>
                              <span className="text-xs text-muted-foreground truncate group-data-[collapsible=icon]:hidden leading-relaxed">{chat.lastMessage}</span>
                            </div>
                          </SidebarMenuButton>
                        </div>
                      </SidebarMenuItem>
                    ))
                  ) : (
                     <SidebarMenuItem>
                       <div className={`py-4 px-3 ${language === 'ar' ? 'text-right' : 'text-center'}`} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                         <p className={`text-xs text-muted-foreground group-data-[collapsible=icon]:hidden`}>
                           {t('common.noConversations')}
                         </p>
                       </div>
                     </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Chat Area */}
        <SidebarInset>
          {/* Header */}
          <header className="h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between px-3 sm:px-4 lg:px-6 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <SidebarTrigger />
              
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <h1 className="font-bold text-sm sm:text-lg truncate">AYN Business Console</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              
            {/* Personalization Toggle */}
            <div className="flex items-center gap-2 border border-border rounded-lg px-2 py-1">
              <UserIcon className="w-3 h-3 text-muted-foreground" />
              <Switch 
                checked={allowPersonalization}
                onCheckedChange={setAllowPersonalization}
                disabled={!hasAccess}
                size="sm"
                rtl={language === 'ar'}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted"
              />
              <Label htmlFor="personalization" className="text-xs text-muted-foreground cursor-pointer sr-only">
                Use my name
              </Label>
            </div>

            {/* Admin Tab Switcher */}
            {isAdmin && (
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Chat</span>
                  <span className="sm:hidden">💬</span>
                </Button>
                <Button
                  variant={activeTab === 'admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('admin')}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Shield className="w-3 h-3 mr-0 sm:mr-1" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Maintenance Banner */}
            <MaintenanceBanner 
              isEnabled={maintenanceConfig.enableMaintenance}
              message={maintenanceConfig.maintenanceMessage}
              startTime={maintenanceConfig.maintenanceStartTime}
              endTime={maintenanceConfig.maintenanceEndTime}
            />

            {/* Terms Modal */}
            <TermsModal 
              open={hasAccess && !hasAcceptedTerms} 
              onAccept={handleAcceptTerms}
            />

            {/* Admin Panel */}
            {isAdmin && activeTab === 'admin' && (
              <div className="flex-1 overflow-y-auto p-6">
                <AdminPanel />
              </div>
            )}

            {/* Chat Interface */}
            {(activeTab === 'chat' || !isAdmin) && (
              <div className="flex flex-1 min-h-0">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 px-3 sm:px-4 lg:px-6 pb-20 sm:pb-24">
                    <div className="max-w-4xl mx-auto py-4 sm:py-6">
                      <EnhancedChat
                        messages={messages}
                        onReplyToText={handleReplyToText}
                        onQuickAction={handleQuickAction}
                        userProfile={userProfile}
                        userId={user.id}
                      />
                      
                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex gap-2 sm:gap-3 justify-start mt-4">
                          <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <TypingIndicator />
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>

                {/* Business Intelligence Sidebar */}
                <div className="w-80 bg-card border-l border-border p-6 space-y-6 overflow-y-auto flex-shrink-0 hidden lg:block">
                  <ProactiveInsights 
                    userProfile={userProfile}
                    onActionClick={handleInsightAction}
                  />
                  <SavedInsights userId={user.id} />
                </div>
              </div>
            )}

            {/* Mobile-Style Floating Input Bar */}
            <div 
              className={`input-area ${messages.length > 1 ? 'bottom-position' : 'center-position'}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className={`input-container relative flex items-center bg-background border border-border rounded-2xl sm:rounded-3xl p-3 sm:p-4 gap-3 sm:gap-4 shadow-lg backdrop-blur-lg ${isDragOver ? 'drag-over border-primary bg-primary/5' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.json"
                />
                
                <button 
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted hover:bg-muted-foreground/10 transition-colors flex-shrink-0 ${language === 'ar' ? 'order-3' : 'order-1'}`}
                  onClick={handleAttachmentClick}
                  disabled={!hasAccess || !hasAcceptedTerms || isUploading}
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isInputFocused || inputMessage.length > 0 ? t('common.typeMessage') : currentText}
                  disabled={!hasAccess || !hasAcceptedTerms || isUploading}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className={`flex-1 bg-transparent border-0 focus-visible:ring-0 text-sm sm:text-base placeholder:text-muted-foreground/60 ${language === 'ar' ? 'order-2 text-right' : 'order-2 text-left'}`}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputMessage.trim() && !selectedFile) || !hasAccess || !hasAcceptedTerms || isUploading}
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${language === 'ar' ? 'order-1' : 'order-3'}`}
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}