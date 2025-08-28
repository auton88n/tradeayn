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

    // Listen for maintenance config changes from admin panel
    const handleMaintenanceConfigChange = (event: CustomEvent) => {
      setMaintenanceConfig(event.detail);
    };

    window.addEventListener('maintenanceConfigChanged', handleMaintenanceConfigChange as EventListener);

    return () => {
      clearInterval(maintenanceInterval);
      window.removeEventListener('maintenanceConfigChanged', handleMaintenanceConfigChange as EventListener);
    };
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
      // Reset to default if there's an error
      setMaintenanceConfig({
        enableMaintenance: false,
        maintenanceMessage: 'System is currently under maintenance. We apologize for any inconvenience.',
        maintenanceStartTime: '',
        maintenanceEndTime: ''
      });
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
    <div className="main-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="flex flex-col h-full p-5">
          {/* User Profile */}
          <div className="user-profile flex items-center gap-3 mb-6 p-3 rounded-lg bg-gray-50">
            <div className="user-avatar">
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="user-info flex-1 min-w-0">
              <div className="user-name font-semibold text-sm truncate">{user?.user_metadata?.name || 'User'}</div>
              <div className="user-email text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* AYN Status */}
          <div className="ayn-consultant-card flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 mb-6">
            <div className="ayn-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M9.5 2C7.01 2 5 4.01 5 6.5c0 1.11.41 2.12 1.09 2.89-.67.36-1.09 1.06-1.09 1.86 0 1.17.95 2.12 2.12 2.12.2 0 .39-.03.57-.08C8.48 14.48 10.15 15.5 12 15.5s3.52-1.02 4.31-2.21c.18.05.37.08.57.08 1.17 0 2.12-.95 2.12-2.12 0-.8-.42-1.5-1.09-1.86C18.59 8.62 19 7.61 19 6.5 19 4.01 16.99 2 14.5 2c-1.24 0-2.36.5-3.17 1.31C10.53 2.5 9.41 2 8.17 2H9.5z"/>
                <path d="M12 4c3.31 0 6 2.69 6 6 0 1.66-.67 3.16-1.76 4.24-.72-.42-1.56-.74-2.49-.74-1.38 0-2.64.56-3.54 1.46C9.31 13.06 8.05 12.5 6.67 12.5c-.93 0-1.77.32-2.49.74C3.09 12.16 2.42 10.66 2.42 9c0-3.31 2.69-6 6-6H12z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900">AYN AI Consultant</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-xs text-gray-500">Online & Ready</p>
              </div>
            </div>
          </div>

          {/* Quick Start Templates */}
          <div className="quick-start mb-6">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Quick Start</h3>
            <div className="space-y-2">
              {templates.map((template, index) => (
                <div 
                  key={index} 
                  className="quick-item p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSendMessage(template.prompt)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <template.icon className={`w-4 h-4 ${template.color}`} />
                    <span className="font-medium text-sm text-gray-900">{template.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{template.prompt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Chats */}
          <div className="recent-chats">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Recent Chats</h3>
            <div className="space-y-2">
              {recentChats.map((chat, index) => (
                <div 
                  key={index} 
                  className="chat-item p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleLoadChat(chat)}
                >
                  <div className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">{chat.title}</div>
                  <div className="text-xs text-gray-500 line-clamp-2 mb-1">{chat.lastMessage}</div>
                  <div className="text-xs text-gray-400">
                    {chat.timestamp.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {/* Header */}
        <header className="header">
          <div className="logo-section">
            <div className="flex items-center gap-3">
              <div className="ayn-message-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M9.5 2C7.01 2 5 4.01 5 6.5c0 1.11.41 2.12 1.09 2.89-.67.36-1.09 1.06-1.09 1.86 0 1.17.95 2.12 2.12 2.12.2 0 .39-.03.57-.08C8.48 14.48 10.15 15.5 12 15.5s3.52-1.02 4.31-2.21c.18.05.37.08.57.08 1.17 0 2.12-.95 2.12-2.12 0-.8-.42-1.5-1.09-1.86C18.59 8.62 19 7.61 19 6.5 19 4.01 16.99 2 14.5 2c-1.24 0-2.36.5-3.17 1.31C10.53 2.5 9.41 2 8.17 2H9.5z"/>
                  <path d="M12 4c3.31 0 6 2.69 6 6 0 1.66-.67 3.16-1.76 4.24-.72-.42-1.56-.74-2.49-.74-1.38 0-2.64.56-3.54 1.46C9.31 13.06 8.05 12.5 6.67 12.5c-.93 0-1.77.32-2.49.74C3.09 12.16 2.42 10.66 2.42 9c0-3.31 2.69-6 6-6H12z"/>
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">AYN AI Business Consultant</h1>
                <p className="text-xs text-gray-500">Your AI-powered business advisor</p>
              </div>
            </div>
          </div>

          <div className="nav-buttons">
            <Badge variant={hasAccess ? "default" : "secondary"} className="hidden sm:inline-flex">
              <div className={`w-2 h-2 rounded-full mr-2 ${hasAccess ? 'bg-green-500' : 'bg-gray-400'}`} />
              {hasAccess ? 'Active' : 'Inactive'}
            </Badge>

            {isAdmin && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeTab === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('chat')}
                  className="h-8 px-3 rounded-md"
                >
                  Chat
                </Button>
                <Button
                  variant={activeTab === 'admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('admin')}
                  className="h-8 px-3 rounded-md"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Button>
              </div>
            )}

            <ThemeToggle />
          </div>
        </header>

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
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="message-bubble">
                    {message.sender === 'ayn' ? (
                      <>
                        <div className="message-header">
                          <div className="ayn-message-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                              <path d="M9.5 2C7.01 2 5 4.01 5 6.5c0 1.11.41 2.12 1.09 2.89-.67.36-1.09 1.06-1.09 1.86 0 1.17.95 2.12 2.12 2.12.2 0 .39-.03.57-.08C8.48 14.48 10.15 15.5 12 15.5s3.52-1.02 4.31-2.21c.18.05.37.08.57.08 1.17 0 2.12-.95 2.12-2.12 0-.8-.42-1.5-1.09-1.86C18.59 8.62 19 7.61 19 6.5 19 4.01 16.99 2 14.5 2c-1.24 0-2.36.5-3.17 1.31C10.53 2.5 9.41 2 8.17 2H9.5z"/>
                              <path d="M12 4c3.31 0 6 2.69 6 6 0 1.66-.67 3.16-1.76 4.24-.72-.42-1.56-.74-2.49-.74-1.38 0-2.64.56-3.54 1.46C9.31 13.06 8.05 12.5 6.67 12.5c-.93 0-1.77.32-2.49.74C3.09 12.16 2.42 10.66 2.42 9c0-3.31 2.69-6 6-6H12z"/>
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">AYN AI Consultant</div>
                            <div className="text-xs text-gray-500">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="message-content">
                          {message.content.split('\n').map((line, i) => {
                            if (line.trim() === '') return <br key={i} />;
                            
                            // Handle bold text
                            if (line.includes('**')) {
                              return (
                                <div key={i}>
                                  <span dangerouslySetInnerHTML={{
                                    __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="capability-title">$1</strong>')
                                  }} />
                                </div>
                              );
                            }
                            
                            // Handle bullet points
                            if (line.trim().match(/^[🔍📈📊🎯]/)) {
                              return (
                                <div key={i} className="capability-item">
                                  <span className="capability-title">{line.split(' - ')[0]}</span>
                                  {line.split(' - ')[1] && (
                                    <span className="capability-description"> - {line.split(' - ')[1]}</span>
                                  )}
                                </div>
                              );
                            }
                            
                            return <div key={i}>{line}</div>;
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="message-header justify-end">
                          <div>
                            <div className="font-semibold text-gray-900 text-sm text-right">You</div>
                            <div className="text-xs text-gray-500 text-right">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {message.status === 'sending' && ' • Sending...'}
                              {message.status === 'error' && ' • Failed'}
                            </div>
                          </div>
                          <div className="avatar bg-gray-600">
                            {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div className="message-content text-right">
                          {message.content}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="message-bubble">
                    <div className="message-header">
                      <div className="ayn-message-avatar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <path d="M9.5 2C7.01 2 5 4.01 5 6.5c0 1.11.41 2.12 1.09 2.89-.67.36-1.09 1.06-1.09 1.86 0 1.17.95 2.12 2.12 2.12.2 0 .39-.03.57-.08C8.48 14.48 10.15 15.5 12 15.5s3.52-1.02 4.31-2.21c.18.05.37.08.57.08 1.17 0 2.12-.95 2.12-2.12 0-.8-.42-1.5-1.09-1.86C18.59 8.62 19 7.61 19 6.5 19 4.01 16.99 2 14.5 2c-1.24 0-2.36.5-3.17 1.31C10.53 2.5 9.41 2 8.17 2H9.5z"/>
                          <path d="M12 4c3.31 0 6 2.69 6 6 0 1.66-.67 3.16-1.76 4.24-.72-.42-1.56-.74-2.49-.74-1.38 0-2.64.56-3.54 1.46C9.31 13.06 8.05 12.5 6.67 12.5c-.93 0-1.77.32-2.49.74C3.09 12.16 2.42 10.66 2.42 9c0-3.31 2.69-6 6-6H12z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">AYN AI Consultant</div>
                        <div className="text-xs text-gray-500">typing...</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-gray-500 text-sm ml-2">AYN is analyzing your request...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Mobile-Style Floating Input Bar */}
            <div className="input-area">
              <div className="input-container">
                <button className="attachment-button">
                  <Paperclip className="w-4 h-4" />
                </button>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={
                    !hasAccess 
                      ? "Access required to send messages..."
                      : !hasAcceptedTerms 
                        ? "Please accept terms to start chatting..."
                        : inputMessage || isInputFocused ? "Type your message..." : currentText
                  }
                  disabled={!hasAccess || !hasAcceptedTerms || isTyping}
                  className="message-input"
                />
                
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || !hasAccess || !hasAcceptedTerms || isTyping}
                  className="send-button"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}