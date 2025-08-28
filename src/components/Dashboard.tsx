import { useState, useEffect } from 'react';
import { Brain, MessageCircle, Clock, TrendingUp, FileText, Settings, LogOut, Send, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sidebar, SidebarContent, SidebarProvider } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  const { toast } = useToast();

  useEffect(() => {

    // Welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      content: `Hello! I'm AYN, your AI business consultant. I can help you with:\n\n🔍 **Market Research** - Comprehensive analysis and competitive intelligence\n📈 **Sales Optimization** - Improve conversions and revenue\n📊 **Trend Analysis** - Identify emerging opportunities\n🎯 **Strategic Planning** - Business strategy and growth planning\n\nWhat would you like to explore first?`,
      sender: 'ayn',
      timestamp: new Date(),
      status: 'complete'
    };
    setMessages([welcomeMessage]);
  }, []);

  const templates = [
    {
      title: "Market Analysis",
      description: "Analyze market size, competition, and opportunities",
      icon: TrendingUp,
      prompt: "I need a comprehensive market analysis for my industry. Can you help me understand the market size, key competitors, and emerging opportunities?"
    },
    {
      title: "Sales Funnel Audit",
      description: "Review and optimize your sales process",
      icon: FileText,
      prompt: "I'd like you to audit my current sales funnel and suggest optimizations to improve conversion rates."
    },
    {
      title: "Competitor Research",
      description: "Deep dive into competitor strategies",
      icon: Brain,
      prompt: "Can you research my top 3 competitors and analyze their strategies, strengths, and weaknesses?"
    },
    {
      title: "Growth Strategy",
      description: "Plan your next growth phase",
      icon: MessageCircle,
      prompt: "Help me develop a comprehensive growth strategy for the next 12 months, including market expansion and revenue targets."
    }
  ];

  const recentChats = [
    { id: '1', title: 'Market Analysis - Tech Startup', lastMessage: '2 hours ago' },
    { id: '2', title: 'Sales Optimization Strategy', lastMessage: '1 day ago' },
    { id: '3', title: 'Competitor Analysis Report', lastMessage: '3 days ago' },
  ];

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content) return;

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
      // Simulate API call to N8N webhook
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      clearInterval(statusInterval);
      setCurrentStatus('');
      setIsTyping(false);

      // Generate a realistic AYN response based on the message content
      let response = generateAYNResponse(content);

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
      return `📊 **Market Analysis Complete**

Based on my research, here are the key insights for your market:

**Market Size & Growth**
• Total Addressable Market (TAM): $2.3B with 12% CAGR
• Serviceable Available Market (SAM): $450M in your target region
• Current penetration rate: 3.2% indicating significant opportunity

**Key Competitors**
1. **MarketLeader Corp** - 23% market share, strong in enterprise
2. **InnovateTech** - 18% share, focused on SMB segment  
3. **NextGen Solutions** - 12% share, emerging in mobile-first approach

**Emerging Opportunities**
🎯 AI integration demand up 340% YoY
🎯 Sustainable/green solutions showing 67% preference increase
🎯 Mobile-first experiences driving 45% higher engagement

**Recommended Actions**
1. Target the underserved mid-market segment (25-500 employees)
2. Develop AI-powered features to differentiate
3. Consider strategic partnerships with sustainability-focused brands

Would you like me to dive deeper into any of these areas?`;
    }
    
    if (lowerMessage.includes('sales') || lowerMessage.includes('conversion') || lowerMessage.includes('funnel')) {
      return `📈 **Sales Optimization Analysis**

I've analyzed typical conversion patterns in your industry. Here's what I found:

**Current Funnel Performance (Industry Benchmarks)**
• Website visitors to leads: 2.1% (Industry avg: 2.5%)
• Leads to opportunities: 13% (Industry avg: 15%)
• Opportunities to customers: 22% (Industry avg: 20%)

**Key Optimization Areas**
1. **Lead Capture** - Implement exit-intent popups (+35% lead increase)
2. **Qualification** - Add progressive profiling (+28% qualification rate)
3. **Nurturing** - Deploy behavioral email sequences (+40% engagement)

**Revenue Impact Projections**
📊 Optimizing lead capture alone could generate +$67K ARR
📊 Full funnel optimization: +$280K ARR potential

**Next Steps**
1. A/B test new landing page designs
2. Implement lead scoring system
3. Create personalized nurture sequences

Want me to create detailed implementation plans for any of these optimizations?`;
    }
    
    if (lowerMessage.includes('competitor') || lowerMessage.includes('competition')) {
      return `🕵️ **Competitive Intelligence Report**

I've conducted a comprehensive analysis of your competitive landscape:

**Top 3 Competitors Deep Dive**

**1. IndustryLeader Co.**
• Strengths: Brand recognition, enterprise relationships
• Weaknesses: Slow innovation, high pricing
• Strategy: Premium positioning, account-based marketing
• Opportunity: Undercut on mid-market pricing

**2. TechInnovator Inc.**
• Strengths: Modern tech stack, agile development
• Weaknesses: Limited market presence, funding constraints
• Strategy: Feature-first approach, developer-focused
• Opportunity: Better go-to-market execution

**3. EstablishedPlayer Ltd.**
• Strengths: Market share, distribution network
• Weaknesses: Legacy technology, customer churn
• Strategy: Acquisition-based growth, vertical expansion
• Opportunity: Superior customer experience

**Strategic Recommendations**
🎯 Position as the "modern alternative" to legacy solutions
🎯 Target their churning customers with migration incentives
🎯 Develop features they can't quickly replicate

Shall I create a competitive battle card or go deeper into any specific competitor?`;
    }

    // Default response for other queries
    return `🧠 **AYN Analysis Complete**

Thank you for your question! I've processed your request using my business intelligence capabilities.

Based on the information provided, here are my insights:

**Key Observations**
• Your query touches on important strategic considerations
• Multiple factors need to be analyzed for optimal results
• Data-driven approach will yield the best outcomes

**Recommended Approach**
1. Gather additional market data and context
2. Analyze potential risks and opportunities  
3. Develop actionable implementation plan
4. Set measurable success metrics

**Next Steps**
I'd be happy to dive deeper into specific aspects of your question. Could you provide more context about:
• Your current business situation
• Specific goals you're trying to achieve  
• Timeline and resource constraints
• Success metrics that matter most

This will help me provide more targeted and valuable insights for your business.`;
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
        <Sidebar className="w-80 glass border-r border-border/50">
          <SidebarContent className="p-6">
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
            <Card className="glass p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">AYN AI Consultant</p>
                  {isTyping ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(currentStatus)} animate-pulse`} />
                      <p className="text-xs text-muted-foreground">{getStatusText(currentStatus)}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-accent">Ready to help</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Templates */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide">Quick Start</h3>
              <div className="space-y-2">
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
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="glass border-b border-border/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text-hero">AYN Business Console</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Business Intelligence</p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </header>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'ayn' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 animate-pulse-glow">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <Card className={`max-w-2xl p-4 ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'glass'
                  }`}>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
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
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <Card className="glass p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">
                        {getStatusText(currentStatus) || 'AYN is thinking...'}
                      </span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="glass border-t border-border/50 p-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask AYN about market research, sales optimization, trends, or business strategy..."
                    className="glass border-primary/20 focus:border-primary/40 pr-20"
                    disabled={isTyping}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={!inputMessage.trim() || isTyping}
                  variant="hero"
                  className="px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;