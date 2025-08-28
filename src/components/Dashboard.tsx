import { useState, useEffect } from 'react';
import { Brain, MessageCircle, Clock, TrendingUp, FileText, Settings, LogOut, Send, Paperclip, Mic, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sidebar, SidebarContent, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AccessStatusCard } from '@/components/AccessStatusCard';
import { AdminPanel } from '@/components/AdminPanel';
import { TermsModal } from '@/components/TermsModal';
import { ThemeToggle } from '@/components/theme-toggle';
import type { User } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  status?: 'researching' | 'analyzing' | 'optimizing' | 'strategizing' | 'complete';
}

interface DashboardProps {
  user: User;
}

const Dashboard = ({ user }: DashboardProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'admin'>('chat');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkUserAccess();
    checkAdminRole();

    // Check if user has accepted terms
    const termsKey = `ayn_terms_accepted_${user.id}`;
    const acceptedTerms = localStorage.getItem(termsKey);
    setHasAcceptedTerms(acceptedTerms === 'true');

    // Welcome message (only set after terms are accepted)
    if (acceptedTerms === 'true') {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Hello! I'm AYN, your AI business consultant. I can help you with:\n\n🔍 **Market Research** - Comprehensive analysis and competitive intelligence\n📈 **Sales Optimization** - Improve conversions and revenue\n📊 **Trend Analysis** - Identify emerging opportunities\n🎯 **Strategic Planning** - Business strategy and growth planning\n\nWhat would you like to explore first?`,
        sender: 'ayn',
        timestamp: new Date(),
        status: 'complete'
      };
      setMessages([welcomeMessage]);
    }
  }, [user.id, hasAcceptedTerms]);

  const checkUserAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select('is_active, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
        return;
      }

      if (!data) {
        setHasAccess(false);
        return;
      }

      const isActive = data.is_active;
      const isNotExpired = !data.expires_at || new Date(data.expires_at) > new Date();
      
      setHasAccess(isActive && isNotExpired);
    } catch (error) {
      console.error('Unexpected error checking access:', error);
      setHasAccess(false);
    }
  };

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  const templates = [
    {
      title: "Market Analysis",
      description: "Market insights & competition",
      icon: TrendingUp,
      prompt: "I need a comprehensive market analysis for my industry. Can you help me understand the market size, key competitors, and emerging opportunities?"
    },
    {
      title: "Sales Funnel Audit",
      description: "Optimize sales process",
      icon: FileText,
      prompt: "I'd like you to audit my current sales funnel and suggest optimizations to improve conversion rates."
    },
    {
      title: "Competitor Research",
      description: "Competitor analysis",
      icon: Brain,
      prompt: "Can you research my top 3 competitors and analyze their strategies, strengths, and weaknesses?"
    },
    {
      title: "Growth Strategy",
      description: "Growth planning",
      icon: MessageCircle,
      prompt: "Help me develop a comprehensive growth strategy for the next 12 months, including market expansion and revenue targets."
    }
  ];

  const recentChats = [
    { id: '1', title: 'Market Analysis - Tech Startup', lastMessage: '2 hours ago' },
    { id: '2', title: 'Sales Optimization Strategy', lastMessage: '1 day ago' },
    { id: '3', title: 'Competitor Analysis Report', lastMessage: '3 days ago' },
  ];

  const handleAcceptTerms = () => {
    const termsKey = `ayn_terms_accepted_${user.id}`;
    localStorage.setItem(termsKey, 'true');
    setHasAcceptedTerms(true);
    
    // Set welcome message after accepting terms
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hello! I'm AYN, your AI business consultant. I can help you with:\n\n🔍 **Market Research** - Comprehensive analysis and competitive intelligence\n📈 **Sales Optimization** - Improve conversions and revenue\n📊 **Trend Analysis** - Identify emerging opportunities\n🎯 **Strategic Planning** - Business strategy and growth planning\n\nWhat would you like to explore first?`,
      sender: 'ayn',
      timestamp: new Date(),
      status: 'complete'
    };
    setMessages([welcomeMessage]);
    
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
      status: 'complete'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AYN thinking/processing
    const statuses = ['researching', 'analyzing', 'optimizing', 'strategizing'];
    let statusIndex = 0;
    
    const statusInterval = setInterval(() => {
      setCurrentStatus(statuses[statusIndex]);
      statusIndex = (statusIndex + 1) % statuses.length;
    }, 1000);

    try {
      // Call AYN webhook through edge function
      const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('ayn-webhook', {
        body: { 
          message: content,
          userId: user.id 
        }
      });
      
      clearInterval(statusInterval);
      setCurrentStatus('');
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
        status: 'complete'
      };

      setMessages(prev => [...prev, aynMessage]);

    } catch (error) {
      clearInterval(statusInterval);
      setIsTyping(false);
      setCurrentStatus('');
      
      toast({
        title: "Connection Error",
        description: "Unable to reach AYN. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateAYNResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('market') || lowerMessage.includes('analysis') || lowerMessage.includes('research')) {
      return `Market Analysis Results:

TAM: $2.3B (12% growth)
SAM: $450M in your region
Current penetration: 3.2%

Top competitors: MarketLeader Corp (23%), InnovateTech (18%), NextGen (12%)

Key opportunities: AI integration (+340%), sustainability focus (+67%), mobile-first (+45%)

Recommendation: Target mid-market segment with AI-powered sustainable solutions.`;
    }
    
    if (lowerMessage.includes('sales') || lowerMessage.includes('conversion') || lowerMessage.includes('funnel')) {
      return `Sales Funnel Analysis:

Current performance vs industry avg:
• Visitors to leads: 2.1% vs 2.5%
• Leads to opportunities: 13% vs 15%  
• Opportunities to customers: 22% vs 20%

Quick wins: Exit-intent popups (+35%), progressive profiling (+28%), behavioral emails (+40%)

Revenue impact: +$280K ARR potential

Next steps: A/B test landing pages, implement lead scoring, create nurture sequences.`;
    }
    
    if (lowerMessage.includes('competitor') || lowerMessage.includes('competition')) {
      return `Competitive Analysis:

IndustryLeader Co: Strong brand, slow innovation, high pricing
TechInnovator Inc: Modern tech, limited presence, funding issues  
EstablishedPlayer Ltd: Market share, legacy tech, customer churn

Your advantage: Position as modern alternative, target churning customers, develop unique features

Strategy: Better go-to-market execution and superior customer experience.`;
    }

    // Default response for other queries
    return `Analysis complete. I've processed your request using business intelligence capabilities.

Key insights: Strategic considerations identified, multiple factors analyzed, data-driven approach recommended.

Next steps: Gather additional context, analyze risks/opportunities, develop actionable plan, set success metrics.

Please provide more details about your specific goals, timeline, and success criteria for targeted recommendations.`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'researching': return 'bg-blue-500';
      case 'analyzing': return 'bg-accent';
      case 'optimizing': return 'bg-warning';
      case 'strategizing': return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'researching': return 'Researching market data...';
      case 'analyzing': return 'Analyzing trends...';
      case 'optimizing': return 'Optimizing strategies...';
      case 'strategizing': return 'Developing recommendations...';
      default: return '';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar className="w-80 bg-card border-r border-border">
          <SidebarContent className="p-8">
            {/* User Profile */}
            <div className="flex items-center gap-3 mb-8">
              <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                  {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{user?.user_metadata?.name || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            {/* AYN Status */}
            <Card className="p-6 mb-8 bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full brain-container flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">AYN AI Consultant</p>
                  {isTyping ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(currentStatus)} animate-pulse`} />
                      <p className="text-xs text-muted-foreground">{getStatusText(currentStatus)}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground">Ready to help</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Templates */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Quick Start</h3>
                <div className="space-y-3">
                {templates.map((template, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start glass-hover p-3 h-auto"
                    onClick={() => handleSendMessage(template.prompt)}
                  >
                    <template.icon className="w-4 h-4 mr-3 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{template.title}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Recent Chats */}
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Chats
              </h3>
              <div className="space-y-2">
                {recentChats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className="w-full justify-start glass-hover p-3 h-auto"
                  >
                    <MessageCircle className="w-4 h-4 mr-3 text-muted-foreground" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-sm truncate">{chat.title}</p>
                      <p className="text-xs text-muted-foreground">{chat.lastMessage}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main Chat Area */}
        <SidebarInset>
          {/* Header */}
          <header className="border-b border-border bg-background/80 backdrop-blur-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg brain-container flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
              <div>
                <h1 className="text-xl font-bold">AYN Business Console</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Business Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Messages */}
          <ScrollArea className="flex-1 p-8">
            {/* Terms Modal */}
            <TermsModal 
              open={hasAccess && !hasAcceptedTerms} 
              onAccept={handleAcceptTerms}
            />

            {/* Access Status Card */}
            <AccessStatusCard user={user} />

            {/* Admin Panel */}
            {isAdmin && (
              <div className="mb-8">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={activeTab === 'chat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('chat')}
                  >
                    Chat
                  </Button>
                  <Button
                    variant={activeTab === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('admin')}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </div>
                
                {activeTab === 'admin' && <AdminPanel />}
              </div>
            )}

            {/* Chat Interface - only show if not admin panel */}
            {(activeTab === 'chat' || !isAdmin) && (
              <div className="max-w-4xl mx-auto space-y-8">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'ayn' && (
                      <div className="w-8 h-8 rounded-full brain-container flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    
                    <Card className={`max-w-2xl p-4 ${
                      message.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card border border-border'
                    }`}>
                      <div className="text-sm leading-relaxed">
                        {message.content}
                      </div>
                      
                      <div className={`flex items-center justify-between mt-3 pt-3 border-t ${
                        message.sender === 'user' ? 'border-primary-foreground/20' : 'border-border/50'
                      }`}>
                        <span className={`text-xs ${
                          message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        
                        {message.sender === 'ayn' && message.status && (
                          <Badge variant="outline" className="text-xs">
                            AYN Analysis
                          </Badge>
                        )}
                      </div>
                    </Card>
                    
                    {message.sender === 'user' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-muted text-xs">
                          {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full brain-container flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-primary-foreground" />
                    </div>
                    
                    <Card className="bg-card border border-border p-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>  
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        {currentStatus && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {getStatusText(currentStatus)}
                          </span>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Message Input - only show for chat and if user has access */}
          {(activeTab === 'chat' || !isAdmin) && (
            <div className="border-t border-border bg-background p-6">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={hasAccess ? "Ask AYN anything about your business..." : "Access required to send messages"}
                      disabled={isTyping || !hasAccess}
                      className="bg-input border-border"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <Button type="button" variant="ghost" size="sm" disabled={!hasAccess}>
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" disabled={!hasAccess}>
                        <Mic className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    variant="hero" 
                    disabled={isTyping || !inputMessage.trim() || !hasAccess}
                    className="px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                
                {!hasAccess && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Contact our team to get access to AYN AI Business Consulting
                  </p>
                )}
              </div>
            </div>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;