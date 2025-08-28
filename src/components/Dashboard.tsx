import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  TrendingUp, 
  Target, 
  Search, 
  Rocket,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setWelcomeMessage();
  }, []);

  const setWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hello! I'm AYN, your AI business consultant. I can help you with:\n\n🔍 **Market Research** - Comprehensive analysis and competitive intelligence\n📈 **Sales Optimization** - Improve conversions and revenue\n📊 **Trend Analysis** - Identify emerging opportunities\n🎯 **Strategic Planning** - Business strategy and growth planning\n\nWhat would you like to explore first?`,
      sender: 'ayn',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content) return;

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={handleCloseSidebar}
      />

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="flex justify-between items-center mb-4 px-6 pt-4">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button 
            className="hamburger-button"
            onClick={handleCloseSidebar}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="user-profile-section">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{user?.user_metadata?.name || 'User'}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
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
          
          <div className="ayn-consultant-status">
            <div className="flex items-center gap-3">
              <div className="ayn-avatar">
                <img src="/lovable-uploads/636eb1d6-bee9-4ea8-a6bf-748bd267d05f.png" alt="Brain" width="16" height="16" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">AYN AI Consultant</div>
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <div className="status-dot"></div>
                  Ready to help
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="quick-start-section">
          <h3 className="section-header">QUICK START</h3>
          <div className="space-y-1">
            {templates.map((template, index) => (
              <div 
                key={index} 
                className="quick-start-item"
                onClick={() => {
                  handleSendMessage(template.prompt);
                  handleCloseSidebar();
                }}
              >
                <template.icon className={`w-4 h-4 ${template.color}`} />
                <span className="text-sm">{template.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Chats Section */}
        <div className="recent-chats-section">
          <h3 className="section-header">RECENT CHATS</h3>
          <div className="space-y-3">
            {recentChats.map((chat, index) => (
              <div 
                key={index} 
                className="recent-chat-item"
                onClick={() => {
                  handleLoadChat(chat);
                  handleCloseSidebar();
                }}
              >
                <div className="chat-title">{chat.title}</div>
                <div className="chat-preview">{chat.lastMessage}</div>
                <div className="chat-date">{chat.timestamp.toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button 
              className="hamburger-button"
              onClick={toggleSidebar}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="header-brain-icon">
              <img src="/lovable-uploads/636eb1d6-bee9-4ea8-a6bf-748bd267d05f.png" alt="Brain" width="16" height="16" />
            </div>
            <div>
              <h1 className="app-title">AYN Business Console</h1>
              <p className="app-subtitle">Your AI-powered business advisor</p>
            </div>
          </div>
          
          <div className="nav-buttons">
            <div className="status-badge">
              <div className="status-dot"></div>
              Active
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Chat Area */}
        <div className="chat-area">
          <div className="message-container">
            {messages.map((message) => (
              <div key={message.id} className="chat-message">
                {message.sender === 'ayn' ? (
                  <>
                    <div className="message-header">
                      <div className="message-brain-icon">
                        <img src="/lovable-uploads/636eb1d6-bee9-4ea8-a6bf-748bd267d05f.png" alt="Brain" width="12" height="12" />
                      </div>
                      <div>
                        <div className="sender-name">AYN AI Consultant</div>
                        <div className="message-time">
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
                              <span>{line.split(' - ')[0]}</span>
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
                        <div className="sender-name text-right">You</div>
                        <div className="message-time text-right">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {message.status === 'sending' && ' • Sending...'}
                          {message.status === 'error' && ' • Failed'}
                        </div>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
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
              <div className="chat-message">
                <div className="message-header">
                  <div className="message-brain-icon">
                    <img src="/lovable-uploads/636eb1d6-bee9-4ea8-a6bf-748bd267d05f.png" alt="Brain" width="12" height="12" />
                  </div>
                  <div>
                    <div className="sender-name">AYN AI Consultant</div>
                    <div className="message-time">typing...</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-muted-foreground text-sm ml-2">AYN is analyzing your request...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask AYN anything about your business..."
              disabled={isTyping}
              className="message-input"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className="send-button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}