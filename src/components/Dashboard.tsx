import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  SidebarProvider,
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
  Menu,
  X,
  Shield
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { TermsModal } from './TermsModal';
import { AdminPanel } from './AdminPanel';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
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
}

const templates = [
  { 
    name: 'Market Analysis', 
    prompt: 'Analyze the current market trends and opportunities in my industry', 
    icon: TrendingUp,
    color: 'text-blue-500'
  },
  { 
    name: 'Sales Funnel Audit', 
    prompt: 'Review my sales process and identify conversion bottlenecks', 
    icon: Target,
    color: 'text-green-500'
  },
  { 
    name: 'Competitor Research', 
    prompt: 'Research my main competitors and their strategies', 
    icon: Search,
    color: 'text-purple-500'
  },
  { 
    name: 'Growth Strategy', 
    prompt: 'Develop a comprehensive growth strategy for scaling my business', 
    icon: Rocket,
    color: 'text-orange-500'
  },
];

const recentChats: ChatHistory[] = [
  { 
    title: 'Q3 Revenue Analysis',
    lastMessage: 'Based on your Q3 data, I recommend focusing on...',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    messages: [
      {
        id: '1',
        content: 'Can you analyze my Q3 revenue performance?',
        sender: 'user',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        content: 'Based on your Q3 data, I recommend focusing on customer retention strategies. Your revenue grew 15% but customer acquisition costs increased by 23%.',
        sender: 'ayn',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ]
  },
  { 
    title: 'Customer Acquisition Strategy',
    lastMessage: 'Your CAC has improved by 23% with the new...',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    messages: [
      {
        id: '3',
        content: 'How can I improve my customer acquisition strategy?',
        sender: 'user',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: '4',
        content: 'Your CAC has improved by 23% with the new digital marketing campaigns. I recommend expanding your social media presence and implementing referral programs.',
        sender: 'ayn',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ]
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

  useEffect(() => {
    checkUserAccess();
    checkAdminRole();
    checkMaintenanceStatus();
    
    const termsKey = `ayn_terms_accepted_${user.id}`;
    const accepted = localStorage.getItem(termsKey) === 'true';
    setHasAcceptedTerms(accepted);
    
    if (accepted) {
      setWelcomeMessage();
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
      "Ask AYN anything about your business...",
      "How can I increase my revenue?",
      "What are the latest market trends?", 
      "Analyze my competition strategy...",
      "How do I optimize my sales funnel?",
      "What growth opportunities exist?",
      "Help me with pricing strategy...",
      "Research my target market..."
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
        .single();

      if (error) {
        console.error('Error checking access:', error);
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
        .single();

      if (error) {
        console.error('Error checking role:', error);
        return;
      }

      setIsAdmin(data.role === 'admin');
    } catch (error) {
      console.error('Role check error:', error);
    }
  };

  const setWelcomeMessage = () => {
    // No welcome message - start with empty chat
    setMessages([]);
  };

  const handleAcceptTerms = () => {
    const termsKey = `ayn_terms_accepted_${user.id}`;
    localStorage.setItem(termsKey, 'true');
    setHasAcceptedTerms(true);
    setWelcomeMessage();
    
    toast({
      title: "Welcome to AYN!",
      description: "You can now start using AYN AI Business Consulting services."
    });
  };

  const handleSendMessage = async (messageContent?: string) => {
    if (!hasAcceptedTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions before using AYN AI.",
        variant: "destructive"
      });
      return;
    }

    if (!hasAccess) {
      toast({
        title: "Access Required",
        description: "You need active access to use AYN. Please contact our team.",
        variant: "destructive"
      });
      return;
    }

    const content = messageContent || inputMessage.trim();
    if (!content && !selectedFile) return;

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
          title: "Usage Limit Reached",
          description: "You've reached your monthly message limit. Please contact support or wait for next month's reset.",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error('Usage tracking error:', error);
      toast({
        title: "System Error",
        description: "Unable to process your request. Please try again.",
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
          userId: user.id 
        }
      });
      
      setIsTyping(false);

      if (webhookError) {
        throw new Error(webhookError.message || 'Webhook call failed');
      }

      const response = webhookResponse?.response || 'I received your message and I\'m processing it. Please try again if you don\'t see a proper response.';

      const aynMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ayn',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aynMessage]);

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
    setMessages(chatHistory.messages);
    toast({
      title: "Chat Loaded",
      description: `Loaded conversation: ${chatHistory.title}`,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="w-60" collapsible="icon">
          <SidebarHeader className="p-6">
            {/* User Profile */}
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                  {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{user?.user_metadata?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* AYN Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 mt-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">AYN AI Consultant</p>
                <p className={`text-xs ${isTyping ? 'text-muted-foreground' : (hasAccess ? 'text-green-500 font-medium' : 'text-muted-foreground')}`}>
                  {isTyping ? 'Thinking...' : (hasAccess ? 'Active' : 'Inactive')}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-6">
            {/* Quick Start */}
            <SidebarGroup>
              <SidebarGroupLabel>Quick Start</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {templates.map((template) => (
                    <SidebarMenuItem key={template.name}>
                      <SidebarMenuButton
                        onClick={() => handleSendMessage(template.prompt)}
                        className="h-auto p-3 text-left"
                        disabled={!hasAccess || !hasAcceptedTerms}
                      >
                        <template.icon className={`w-4 h-4 mr-3 flex-shrink-0 ${template.color}`} />
                        <span className="text-sm font-medium">{template.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Recent Chats */}
            <SidebarGroup>
              <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {recentChats.map((chat, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton
                        onClick={() => handleLoadChat(chat)}
                        className="h-auto p-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{chat.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                          <p className="text-xs text-muted-foreground">
                            {chat.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <SidebarTrigger />
              
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                <h1 className="font-bold text-lg">AYN Business Console</h1>
              </div>
            </div>

          <div className="flex items-center gap-3">

            {/* Admin Tab Switcher */}
            {isAdmin && (
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                  className="h-8 px-3"
                >
                  Chat
                </Button>
                <Button
                  variant={activeTab === 'admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('admin')}
                  className="h-8 px-3"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Button>
              </div>
            )}

            <ThemeToggle />
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
              <ScrollArea className="flex-1 px-4 lg:px-6 pb-24">
                <div className="max-w-4xl mx-auto py-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender === 'ayn' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            <Brain className="w-4 h-4" />
                          </AvatarFallback>
                         </Avatar>
                       )}
                       
                       <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                         message.sender === 'user' 
                           ? 'bg-primary text-primary-foreground' 
                           : 'bg-muted text-foreground'
                       }`}>
                         <p className="text-sm whitespace-pre-wrap break-words">
                           {message.content}
                         </p>
                         {message.attachment && (
                           <div className="mt-2 p-2 bg-muted/50 rounded-lg flex items-center gap-2">
                             <Paperclip className="w-3 h-3" />
                             <span className="text-xs">{message.attachment.name}</span>
                           </div>
                         )}
                       </div>
                       
                       {message.sender === 'user' && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
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
                    <div className="flex gap-3 justify-start">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          <Brain className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted text-foreground rounded-lg px-4 py-3 mr-12">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                          <span className="ml-2 text-sm text-muted-foreground">AYN is typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Mobile-Style Floating Input Bar */}
              <div 
                className={`input-area ${messages.length > 1 ? 'bottom-position' : 'center-position'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Drag Overlay */}
                {isDragOver && (
                  <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex items-center justify-center">
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
                    <input
                      ref={inputRef}
                      type="text"
                      className="message-input"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder=""
                      disabled={!hasAccess || !hasAcceptedTerms || isTyping || isUploading}
                    />
                    
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
                    
                    {/* Typewriter Animation Placeholder */}
                    {!inputMessage && !isInputFocused && !selectedFile && (
                      <div className="absolute inset-0 flex items-center pointer-events-none">
                        <span className="text-muted-foreground select-none typewriter-text">
                          {!hasAccess 
                            ? "Access required to send messages..."
                            : !hasAcceptedTerms 
                              ? "Please accept terms to start chatting..."
                              : currentText
                          }
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Send Button */}
                  <button
                    className="send-button"
                    onClick={() => handleSendMessage()}
                    disabled={(!inputMessage.trim() && !selectedFile) || !hasAccess || !hasAcceptedTerms || isTyping || isUploading}
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}