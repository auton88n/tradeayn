import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
  
  const { toast } = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hello! I'm AYN, your AI business consultant. I can help you with:\n\n🔍 **Market Research** - Comprehensive analysis and competitive intelligence\n📈 **Sales Optimization** - Improve conversions and revenue\n📊 **Trend Analysis** - Identify emerging opportunities\n🎯 **Strategic Planning** - Business strategy and growth planning\n\nWhat would you like to explore first?`,
      sender: 'ayn',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
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
    if (!content) return;

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
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
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

  const handleLoadChat = (chatHistory: ChatHistory) => {
    setMessages(chatHistory.messages);
    setIsSidebarOpen(false);
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
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-0
        w-72 lg:w-80 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full p-6">
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 mb-6">
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
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">AYN AI Consultant</p>
              <p className="text-xs text-muted-foreground">
                {isTyping ? 'Thinking...' : 'Ready to help'}
              </p>
            </div>
          </div>

          {/* Quick Start */}
          <div className="mb-6">
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Quick Start
            </h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <Button
                  key={template.name}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSendMessage(template.prompt)}
                  className="w-full justify-start h-auto p-3 text-left hover:bg-muted hover:text-foreground transition-colors duration-200"
                  disabled={!hasAccess || !hasAcceptedTerms}
                >
                  <template.icon className={`w-4 h-4 mr-3 flex-shrink-0 ${template.color}`} />
                  <span className="text-sm font-medium">{template.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Recent Chats */}
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Recent Chats
            </h3>
            <div className="space-y-1">
              {recentChats.map((chat, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLoadChat(chat)}
                  className="w-full justify-start text-sm text-muted-foreground hover:text-foreground hover:bg-muted h-auto p-3 text-left transition-colors duration-200"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                    <p className="text-xs text-muted-foreground">
                      {chat.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              <h1 className="font-bold text-lg">AYN Business Console</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Access Status Badge */}
            <Badge variant={hasAccess ? "default" : "secondary"} className="hidden sm:inline-flex">
              <div className={`w-2 h-2 rounded-full mr-2 ${hasAccess ? 'bg-green-500' : 'bg-gray-400'}`} />
              {hasAccess ? 'Active' : 'Inactive'}
            </Badge>

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
                      
                      <div className={`
                        max-w-xs lg:max-w-md xl:max-w-lg rounded-lg px-4 py-3
                        ${message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground ml-12' 
                          : 'bg-muted text-foreground mr-12'
                        }
                      `}>
                        <div className="text-sm whitespace-normal break-words">
                          {message.content}
                        </div>
                        <div className={`
                          text-xs mt-2 opacity-70
                          ${message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}
                        `}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {message.status === 'sending' && ' • Sending...'}
                          {message.status === 'error' && ' • Failed'}
                        </div>
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
              <div className="input-area">
                <div className="input-container">
                  {/* Attachment Button */}
                  <button 
                    className="attachment-button"
                    disabled={!hasAccess || !hasAcceptedTerms}
                    title="Attach file (coming soon)"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  
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
                      disabled={!hasAccess || !hasAcceptedTerms || isTyping}
                    />
                    
                    {/* Typewriter Animation Placeholder */}
                    {!inputMessage && !isInputFocused && (
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
                    disabled={!inputMessage.trim() || !hasAccess || !hasAcceptedTerms || isTyping}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}