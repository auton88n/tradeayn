import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/secureLogger';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  
  SidebarTrigger,
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
  FileText,
  Eye,
  Coins,
  Menu,
  X,
  Shield,
  Plus,
  User as UserIcon,
  Copy,
  Reply,
  MessageSquare,
  Download,
  Heart
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { TermsModal } from './TermsModal';
import { AdminPanel } from './AdminPanel';
import { TypewriterText } from './TypewriterText';
import { TypingIndicator } from './TypingIndicator';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MessageFormatter } from './MessageFormatter';
import { ChatActions } from './dashboard/ChatActions';

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

// Mode definitions with translated names
const getModes = (t: (key: string) => string) => [
  { 
    name: 'General', 
    translatedName: t('modes.general'),
    description: 'General AI assistant for all your needs',
    icon: MessageSquare,
    color: 'text-slate-500',
    webhookUrl: '' // Will be set by user
  },
  { 
    name: 'Nen Mode ⚡', 
    translatedName: t('modes.nenMode') + ' ⚡',
    description: 'Ultra-fast AI responses for quick insights',
    icon: TrendingUp,
    color: 'text-blue-500',
    webhookUrl: '' // Will be set by user
  },
  { 
    name: 'Research Pro', 
    translatedName: t('modes.researchPro'),
    description: 'Deep research and comprehensive analysis',
    icon: Search,
    color: 'text-green-500',
    webhookUrl: '' // Will be set by user
  },
  { 
    name: 'PDF Analyst', 
    translatedName: t('modes.pdfAnalyst'),
    description: 'Specialized document analysis and insights',
    icon: FileText,
    color: 'text-purple-500',
    webhookUrl: '' // Will be set by user
  },
  { 
    name: 'Vision Lab', 
    translatedName: t('modes.visionLab'),
    description: 'Advanced image and visual content analysis',
    icon: Eye,
    color: 'text-orange-500',
    webhookUrl: '' // Will be set by user
  },
  { 
    name: 'Crypto', 
    translatedName: t('modes.crypto'),
    description: 'Cryptocurrency analysis and blockchain insights',
    icon: Coins,
    color: 'text-yellow-500',
    webhookUrl: 'https://n8n.srv846714.hstgr.cloud/webhook/5a05ee2a-4be3-4952-ae3f-c23dd8dc8fe5'
  },
];


// Helper function to get send button class based on mode
const getSendButtonClass = (mode: string) => {
  const modeName = mode.toLowerCase();
  if (modeName.includes('nen')) return 'mode-blue';
  if (modeName.includes('research')) return 'mode-green';
  if (modeName.includes('pdf')) return 'mode-purple';
  if (modeName.includes('vision')) return 'mode-orange';
  return 'mode-default';
};

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
  const { t, language, direction, setLanguage } = useLanguage();
  
  // State for AI modes and webhooks
  const [selectedMode, setSelectedMode] = useState<string>('Nen Mode ⚡');
  const [modeWebhooks, setModeWebhooks] = useState<Record<string, string>>({
    'Nen Mode ⚡': '',
    'Research Pro': '',
    'PDF Analyst': '',
    'Vision Lab': '',
    'Crypto': 'https://n8n.srv846714.hstgr.cloud/webhook/5a05ee2a-4be3-4952-ae3f-c23dd8dc8fe5'
  });

  // Maintenance mode state
  const [maintenanceConfig, setMaintenanceConfig] = useState({
    enableMaintenance: false,
    maintenanceMessage: 'System is currently under maintenance. We apologize for any inconvenience.',
    maintenanceStartTime: '',
    maintenanceEndTime: ''
  });
  
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // File attachment state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileTypes, setShowFileTypes] = useState(false);
  const [allowPersonalization, setAllowPersonalization] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  
  // Dialog states
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showFavoritesDialog, setShowFavoritesDialog] = useState(false);
  
  // Favorite chats state
  const [favoritedChats, setFavoritedChats] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get modes with translations
  const modes = getModes(t);
  
  // Get mode-specific placeholder texts
  const getPlaceholderTexts = () => {
    try {
      const placeholders = t(`placeholders.${selectedMode}`);
      if (Array.isArray(placeholders)) {
        return placeholders;
      }
      // Fallback to parsed array if it's stored as a string
      if (typeof placeholders === 'string') {
        return JSON.parse(placeholders);
      }
    } catch (error) {
      log.error('Error getting placeholders', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    // Fallback to legacy placeholders
    return [
      t('dashboard.placeholders.askAyn'),
      t('dashboard.placeholders.increaseRevenue'),
      t('dashboard.placeholders.marketTrends'),
      t('dashboard.placeholders.competitionStrategy'),
      t('dashboard.placeholders.optimizeSales'),
      t('dashboard.placeholders.growthOpportunities'),
      t('dashboard.placeholders.pricingStrategy'),
      t('dashboard.placeholders.targetMarket')
    ];
  };
  
  const placeholderTexts = getPlaceholderTexts();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (inputMessage === '' && inputRef.current) {
      inputRef.current.style.height = '40px';
      inputRef.current.style.overflowY = 'hidden';
    }
  }, [inputMessage]);

  // Manage animated placeholder rotation
  useEffect(() => {
    if (!inputMessage.trim()) {
      setShowPlaceholder(true);
    } else {
      setShowPlaceholder(false);
    }
  }, [inputMessage]);

  // Rotate placeholder texts every few seconds
  useEffect(() => {
    if (!showPlaceholder || inputMessage.trim()) return;
    
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholderTexts.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [showPlaceholder, inputMessage, placeholderTexts.length]);

  const loadCurrentChatHistory = async (sessionId?: string) => {
    const targetSessionId = sessionId || currentSessionId;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender, attachment_url, attachment_name, attachment_type')
        .eq('user_id', user.id)
        .eq('session_id', targetSessionId)
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
      } else {
        setMessages([]);
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
    loadFavoritedChats();
    
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

  const loadFavoritedChats = async () => {
    try {
      const { data, error } = await supabase
        .from('favorite_chats')
        .select('session_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading favorited chats:', error);
        return;
      }

      const favoritedSessionIds = new Set(data?.map(item => item.session_id) || []);
      setFavoritedChats(favoritedSessionIds);
    } catch (error) {
      console.error('Error loading favorited chats:', error);
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

  const handleModeClick = (modeName: string) => {
    setSelectedMode(modeName);
    // Optional: Show a toast or indication that the mode was selected
    toast({
      title: `${modeName} Selected`,
      description: `Now using ${modeName} for AI responses`,
    });
  };
  
  // Handle message selection from search dialog
  const handleMessageSelect = (message: Message) => {
    // Scroll to the message or highlight it
    // For now, just show a toast with the message
    toast({
      title: 'Message found',
      description: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
    });
  };
  
  // Handle saving message to favorites
  const handleSaveToFavorites = async (message: Message) => {
    try {
      const { error } = await supabase
        .from('saved_insights')
        .insert({
          user_id: user.id,
          category: 'Chat Message',
          insight_text: message.content,
          tags: ['chat', 'favorite']
        });

      if (error) throw error;

      toast({
        title: 'Message saved',
        description: 'Message added to your favorites.',
      });
    } catch (error) {
      console.error('Error saving to favorites:', error);
      toast({
        title: 'Error saving message',
        description: 'Failed to save message to favorites.',
        variant: 'destructive'
      });
    }
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
    
    // Auto-switch UI language if user types in different language
    if (detectedLanguage !== language) {
      setLanguage(detectedLanguage);
    }

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
    
    // Immediately reset textarea height with smooth transition
    if (inputRef.current) {
      inputRef.current.style.height = '40px';
      inputRef.current.style.overflowY = 'hidden';
    }
    
    setIsTyping(true);

    try {
      // Enhanced payload with user context for n8n
      const payload = { 
        message: content,
        userId: user.id,
        userEmail: user.email,
        mode: selectedMode,
        sessionId: currentSessionId,
        conversationHistory: messages.slice(-5), // Last 5 messages for context
        userProfile: {
          companyName: userProfile?.company_name || '',
          contactPerson: userProfile?.contact_person || '',
          businessType: userProfile?.business_type || '',
          businessContext: userProfile?.business_context || ''
        },
        allowPersonalization,
        detectedLanguage: detectedLanguage,
        concise: true,
        timestamp: new Date().toISOString()
      };

      // Create timeout controller for AYN response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 second timeout

      try {
        // Call AYN webhook through edge function with timeout
        const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('ayn-webhook', {
          body: payload,
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
        });
        
        clearTimeout(timeoutId);
        
        if (webhookError) {
          throw new Error(webhookError.message || 'Webhook call failed');
        }
        
        setIsTyping(false);

        const response = webhookResponse?.response || 'I received your message and I\'m processing it. Please try again if you don\'t see a proper response.';

        const aynMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          sender: 'ayn',
          timestamp: new Date(),
          isTyping: true,
        };

        setMessages(prev => [...prev, aynMessage]);

        // Save user message to database
        await supabase.from('messages').insert({
          user_id: user.id,
          session_id: currentSessionId,
          content: content,
          sender: 'user',
          mode_used: selectedMode,
          attachment_url: attachment?.url,
          attachment_name: attachment?.name,
          attachment_type: attachment?.type
        });

        // Save AI response to database
        await supabase.from('messages').insert({
          user_id: user.id,
          session_id: currentSessionId,
          content: response,
          sender: 'ayn',
          mode_used: selectedMode
        });

        // Refresh recent chats
        loadRecentChats();
        
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (controller.signal.aborted) {
          console.log('Request timed out after 30 seconds');
          setIsTyping(false);
          toast({
            title: "Response Timeout", 
            description: "AYN took too long to respond. Please try again.",
            variant: "destructive"
          });
          return;
        }
        throw abortError;
      }

    } catch (error) {
      setIsTyping(false);
      const errorMsg = error instanceof Error ? error.message : "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMsg,
        sender: 'ayn',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: errorMsg.includes('timed out') ? 'AYN response timed out. Please try again.' : "Unable to reach AYN. Please try again.",
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

  // Copy message to clipboard
  const handleCopyMessage = async (content: string) => {
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
  };

  // Reply to message
  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
    setInputMessage(`@${message.sender}: "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"\n\n`);
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

  const handleFavoriteChat = async (chat: ChatHistory, index: number) => {
    const isCurrentlyFavorited = favoritedChats.has(chat.sessionId);
    
    try {
      if (isCurrentlyFavorited) {
        // Unfavorite the chat
        const { error } = await supabase
          .from('favorite_chats')
          .delete()
          .eq('user_id', user.id)
          .eq('session_id', chat.sessionId);

        if (error) {
          console.error('Error unfavoriting chat:', error);
          toast({
            title: "Error",
            description: "Failed to remove chat from favorites.",
            variant: "destructive"
          });
          return;
        }

        // Update local state
        setFavoritedChats(prev => {
          const newSet = new Set(prev);
          newSet.delete(chat.sessionId);
          return newSet;
        });

        toast({
          title: "Chat Unfavorited",
          description: `"${chat.title}" has been removed from your favorites.`,
        });
      } else {
        // Favorite the chat
        const { error } = await supabase
          .from('favorite_chats')
          .insert({
            user_id: user.id,
            session_id: chat.sessionId,
            chat_title: chat.title,
            chat_data: JSON.parse(JSON.stringify({
              messages: chat.messages,
              lastMessage: chat.lastMessage,
              timestamp: chat.timestamp.toISOString()
            }))
          });

        if (error) {
          console.error('Error favoriting chat:', error);
          toast({
            title: "Error",
            description: "Failed to favorite chat.",
            variant: "destructive"
          });
          return;
        }

        // Update local state
        setFavoritedChats(prev => {
          const newSet = new Set(prev);
          newSet.add(chat.sessionId);
          return newSet;
        });

        toast({
          title: "Chat Favorited",
          description: `"${chat.title}" has been added to your favorites.`,
        });
      }
    } catch (error) {
      console.error('Error toggling favorite chat:', error);
      toast({
        title: "Error", 
        description: "Failed to update chat favorites.",
        variant: "destructive"
      });
    }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden sidebar-edge-to-edge [--sidebar-width:14rem] lg:[--sidebar-width:16rem]">
        {/* Sidebar */}
        <Sidebar collapsible="offcanvas" className="border-r-0">
          <SidebarHeader className="p-4">
            {/* User Profile */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
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

            {/* Quick Actions */}
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="flex gap-2 px-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowSearchDialog(true)}
                    className="flex-1 h-8"
                    title="Search messages"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowFavoritesDialog(true)}
                    className="flex-1 h-8"
                    title="Favorite messages"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowExportDialog(true)}
                    className="flex-1 h-8"
                    title="Export chat"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Quick Start */}
            <SidebarGroup dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className={`w-full flex px-4 py-2 ${language === 'ar' ? 'justify-end' : 'justify-start'}`} style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                <SidebarGroupLabel className={language === 'ar' ? 'text-right ml-auto' : 'text-left'}>{t('common.quickStart')}</SidebarGroupLabel>
              </div>
              <SidebarGroupContent className={language === 'ar' ? 'text-right' : ''}>
                <SidebarMenu>
                   {modes.map((mode) => (
                    <SidebarMenuItem key={mode.name}>
                       <SidebarMenuButton
                         onClick={() => handleModeClick(mode.name)}
                         disabled={!hasAccess || !hasAcceptedTerms}
                         tooltip={mode.description}
                         className={`${selectedMode === mode.name ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                       >
                         <mode.icon className={`w-4 h-4 flex-shrink-0 ${mode.color} mr-2`} />
                         <span className={`group-data-[collapsible=icon]:hidden ${language === 'ar' ? 'text-right' : ''}`}>{mode.translatedName}</span>
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
                          {!showChatSelection && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFavoriteChat(chat, index);
                              }}
                              className={`flex-shrink-0 w-8 h-8 p-0 transition-colors ${
                                favoritedChats.has(chat.sessionId) 
                                  ? 'hover:bg-red-50 text-red-600 hover:text-red-700' 
                                  : 'hover:bg-red-50 hover:text-red-600'
                              }`}
                              title={favoritedChats.has(chat.sessionId) ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Heart className={`w-4 h-4 ${favoritedChats.has(chat.sessionId) ? 'fill-current' : ''}`} />
                            </Button>
                          )}
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
        <SidebarInset className="border-l-0 -ml-px">
          {/* Header */}
          <header className="h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between px-3 sm:px-4 lg:px-6 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Menu Button */}
              <SidebarTrigger />
              
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <h1 className="font-bold text-sm sm:text-lg truncate">{t('header.aynBusinessConsole')}</h1>
                <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                  {modes.find(mode => mode.name === selectedMode)?.translatedName || selectedMode}
                </Badge>
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
                  <span className="hidden sm:inline">{t('header.chat')}</span>
                  <span className="sm:hidden">💬</span>
                </Button>
                <Button
                  variant={activeTab === 'admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('admin')}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <Shield className="w-3 h-3 mr-0 sm:mr-1" />
                  <span className="hidden sm:inline">{t('header.admin')}</span>
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
            <>
              {/* Messages Area */}
              <ScrollArea className="flex-1 px-3 sm:px-4 lg:px-6 pb-20 sm:pb-24">
                <div className="max-w-4xl mx-auto py-4 sm:py-6 space-y-3 sm:space-y-4">
                  {messages.map((message) => (
                     <div
                       key={message.id}
                       className={`flex gap-2 sm:gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group relative`}
                     >
                      {message.sender === 'ayn' && (
                        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </AvatarFallback>
                         </Avatar>
                       )}
                       
                        <div className={`message-bubble rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 ${
                          message.sender === 'user' 
                            ? 'user-message bg-muted/50 border border-border text-foreground' 
                            : 'ai-message bg-muted text-foreground'
                        }`}>
                          {message.sender === 'user' && (
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              You
                            </div>
                          )}
                          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words group cursor-default select-text">
                            {message.sender === 'ayn' && message.isTyping ? (
                              <TypewriterText
                                text={message.content}
                                speed={2}
                                className="inline-block text-foreground"
                                onComplete={() => {
                                  setMessages(prev => 
                                    prev.map(msg => 
                                      msg.id === message.id 
                                        ? { ...msg, isTyping: false }
                                        : msg
                                    )
                                  );
                                }}
                              />
                            ) : (
                              <MessageFormatter
                                content={message.content}
                                className="text-foreground"
                              />
                            )}
                          </div>
                         {message.attachment && (
                           <div className="mt-2 p-2 bg-muted/50 rounded-lg flex items-center gap-2">
                             <Paperclip className="w-3 h-3" />
                             <span className="text-xs">{message.attachment.name}</span>
                           </div>
                         )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-start gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleCopyMessage(message.content)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy message"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReplyToMessage(message)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Reply to message"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        {message.sender === 'user' && (
                         <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                           <AvatarImage src="" />
                           <AvatarFallback className="text-xs">
                             {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                           </AvatarFallback>
                         </Avatar>
                       )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex gap-2 sm:gap-3 justify-start">
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

              {/* Mobile-Style Floating Input Bar */}
              <div 
                dir="ltr"
                className={`input-area ${messages.length > 0 ? 'bottom-position' : 'center-position'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Reply indicator */}
                {replyingTo && (
                  <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Reply className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Replying to: "{replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}"
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setInputMessage('');
                      }}
                      className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {/* Drag Overlay */}
                {isDragOver && (
                  <div className="fixed inset-0 z-[60] bg-background/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-background border-2 border-dashed border-primary rounded-2xl p-8 text-center max-w-sm mx-4">
                      <Paperclip className="w-12 h-12 mx-auto mb-4 text-primary" />
                      <p className="text-lg font-medium text-primary mb-2">Drop your file here</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Images, PDFs, Word docs, text, or JSON files (max 10MB)
                      </p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>• Images: JPG, PNG, GIF, WebP</div>
                        <div>• Documents: PDF, DOC, DOCX</div>
                        <div>• Text: TXT files</div>
                        <div>• Data: JSON files</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Selected File Preview */}
                {selectedFile && (
                  <div className="mb-2 p-3 bg-muted rounded-xl border flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={removeSelectedFile}
                      className="w-6 h-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className={`input-container ${isDragOver ? 'drag-over' : ''}`}>
                  {/* Attachment Button with File Types Dropdown */}
                  {(selectedMode.toLowerCase().includes('pdf') || selectedMode.toLowerCase().includes('vision') || selectedMode.toLowerCase().includes('general')) ? (
                    <div className="relative">
                      <button 
                        className="attachment-button group"
                        onClick={handleAttachmentClick}
                        onMouseEnter={() => setShowFileTypes(true)}
                        onMouseLeave={() => setShowFileTypes(false)}
                        disabled={!hasAccess || !hasAcceptedTerms || isUploading}
                        title="Attach file"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      
                      {/* File Types Dropdown */}
                      {showFileTypes && !isDragOver && (
                        <div className="absolute bottom-full left-0 mb-2 bg-background border border-border rounded-lg shadow-lg p-3 min-w-[220px] z-50">
                          <div className="text-xs font-semibold text-foreground mb-2">📎 Accepted file types:</div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-muted-foreground">Images:</span>
                              <span className="text-foreground font-medium">JPG, PNG, GIF, WebP</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-muted-foreground">Documents:</span>
                              <span className="text-foreground font-medium">PDF, DOC, DOCX</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-muted-foreground">Text:</span>
                              <span className="text-foreground font-medium">TXT files</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-muted-foreground">Data:</span>
                              <span className="text-foreground font-medium">JSON files</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-2 border-t border-border">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span>Maximum file size: <strong>10MB</strong></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                  
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {/* Input Field */}
                  <div className="flex-1 relative">
                    <Textarea
                      ref={inputRef}
                      unstyled={true}
                      className="message-input resize-none min-h-[40px] max-h-[200px] overflow-hidden"
                      value={inputMessage}
                      onChange={(e) => {
                        setInputMessage(e.target.value);
                        // Auto-resize textarea
                        const textarea = e.target as HTMLTextAreaElement;
                        textarea.style.height = 'auto';
                        const newHeight = Math.min(textarea.scrollHeight, 200);
                        textarea.style.height = newHeight + 'px';
                        
                        // Show scrollbar only when content exceeds max height
                        if (textarea.scrollHeight > 200) {
                          textarea.style.overflowY = 'auto';
                        } else {
                          textarea.style.overflowY = 'hidden';
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder=""
                      disabled={!hasAccess || !hasAcceptedTerms || isUploading}
                      rows={1}
                    />
                    
                    {/* Typewriter Animation Placeholder */}
                    {showPlaceholder && !inputMessage.trim() && !isInputFocused && (
                      <div className={`absolute ${direction === 'rtl' ? 'right-[var(--input-left-offset)]' : 'left-[var(--input-left-offset)]'} top-[var(--input-vertical-offset)] pointer-events-none z-10 ${direction === 'rtl' ? 'text-right' : 'text-left'} transition-all duration-300 ease-in-out`}>
                        <TypewriterText
                          key={`${placeholderIndex}-${language}-${direction}`}
                          text={placeholderTexts[placeholderIndex]}
                          speed={50}
                          className="typewriter-text text-muted-foreground"
                          showCursor={true}
                        />
                      </div>
                    )}
                    
                    {/* File Selected Indicator */}
                    {selectedFile && (
                      <div className="absolute -top-12 left-0 bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm flex items-center gap-2">
                        <Paperclip className="w-3 h-3" />
                        <span>{selectedFile.name}</span>
                        <button 
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-primary-foreground hover:text-primary-foreground/80"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Send Button */}
                  <button
                    className={`send-button ${getSendButtonClass(selectedMode)}`}
                    onClick={() => handleSendMessage()}
                    disabled={(!inputMessage.trim() && !selectedFile) || !hasAccess || !hasAcceptedTerms || isTyping || isUploading}
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" style={{ transform: 'scaleX(1)' }} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </SidebarInset>
        
        {/* Chat Actions Dialogs */}
        <ChatActions
          user={user}
          showExportDialog={showExportDialog}
          showSearchDialog={showSearchDialog}
          showFavoritesDialog={showFavoritesDialog}
          onExportClose={() => setShowExportDialog(false)}
          onSearchClose={() => setShowSearchDialog(false)}
          onFavoritesClose={() => setShowFavoritesDialog(false)}
          onMessageSelect={handleMessageSelect}
          onSessionLoad={(sessionId: string) => {
            setCurrentSessionId(sessionId);
            loadCurrentChatHistory(sessionId);
            toast({
              title: 'Session loaded',
              description: 'Switched to selected conversation.',
            });
          }}
        />
      </div>
  );
}