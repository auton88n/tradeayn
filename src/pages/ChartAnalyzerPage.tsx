import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, MessageSquare, Activity, History, PanelLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChartUnifiedChat from '@/components/dashboard/ChartUnifiedChat';
import PerformanceDashboard from '@/components/trading/PerformanceDashboard';
import ChartHistoryTab from '@/components/dashboard/ChartHistoryTab';
import ChartAnalysisSidebar from '@/components/dashboard/ChartAnalysisSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChartHistory } from '@/hooks/useChartHistory';

const ChartAnalyzerPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'performance'>('chat');

  // Sidebar state — persisted to localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('chart-sidebar-open');
      if (stored !== null) return stored === 'true';
    } catch {}
    return window.innerWidth >= 1024;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Lifted chat state — persists across tab switches
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any>(null);

  // Shared history state — used by both sidebar and History tab
  const history = useChartHistory();

  useEffect(() => {
    try { localStorage.setItem('chart-sidebar-open', String(sidebarOpen)); } catch {}
  }, [sidebarOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      setIsCheckingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !userId) navigate('/');
  }, [isCheckingAuth, userId, navigate]);

  if (isCheckingAuth || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <BarChart3 className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>
    );
  }

  const handleSidebarSelect = (item: any) => {
    history.setSelectedItem(item);
    setActiveTab('history');
    setMobileSidebarOpen(false);
  };

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  // Determine max-width for the top bar based on active tab
  const topBarMax = activeTab === 'performance' ? 'max-w-5xl' : activeTab === 'chat' ? 'max-w-6xl' : 'max-w-5xl';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_hsl(36_80%_50%_/_0.06)_0%,_transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,_hsl(25_80%_45%_/_0.04)_0%,_transparent_70%)]" />
      </div>

      <div className="relative pt-4 px-4 h-screen flex flex-col">
        {/* Top bar: Back + Tabs + Sidebar Toggle */}
        <div className={`flex items-center gap-3 mb-2 shrink-0 mx-auto w-full ${topBarMax}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex bg-muted/50 backdrop-blur-sm rounded-full p-1 border border-border/50">
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                activeTab === 'chat'
                  ? "bg-amber-500/90 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                activeTab === 'history'
                  ? "bg-amber-500/90 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="h-3.5 w-3.5" />
              History
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                activeTab === 'performance'
                  ? "bg-amber-500/90 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              Performance
            </button>
          </div>

          {/* Sidebar toggle — only in Chat tab */}
          {activeTab === 'chat' && (
            <div className="flex items-center gap-1.5 ml-auto">
              {/* Mobile sidebar trigger */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden gap-1.5 bg-muted/50 backdrop-blur-sm rounded-full px-3 hover:bg-muted"
              >
                <History className="h-3.5 w-3.5" />
                History
              </Button>
              {/* Desktop sidebar toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(o => !o)}
                className="hidden lg:flex gap-1.5 bg-muted/50 backdrop-blur-sm rounded-full px-3 hover:bg-muted"
                title={sidebarOpen ? 'Hide history sidebar' : 'Show history sidebar'}
              >
                <PanelLeft className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'chat' && (
            <div className={`max-w-6xl mx-auto h-full flex gap-0 overflow-hidden rounded-xl`}>
              {/* Desktop sidebar */}
              {sidebarOpen && (
                <div className="hidden lg:block h-full border border-border/50 rounded-l-xl overflow-hidden bg-background/50">
                  <ChartAnalysisSidebar
                    items={history.items}
                    loading={history.loading}
                    selectedItem={history.selectedItem}
                    onSelect={handleSidebarSelect}
                    onViewAll={() => setActiveTab('history')}
                    onClose={() => setSidebarOpen(false)}
                  />
                </div>
              )}

              {/* Mobile sidebar (Sheet) */}
              <ChartAnalysisSidebar
                items={history.items}
                loading={history.loading}
                selectedItem={history.selectedItem}
                onSelect={handleSidebarSelect}
                onViewAll={() => setActiveTab('history')}
                onClose={() => setMobileSidebarOpen(false)}
                mobileMode
                open={mobileSidebarOpen}
              />

              {/* Chat pane */}
              <div className="flex-1 min-w-0 h-full">
                <ChartUnifiedChat
                  messages={chatMessages}
                  onMessagesChange={setChatMessages}
                  latestResult={latestResult}
                  onLatestResultChange={setLatestResult}
                />
              </div>
            </div>
          )}
          {activeTab === 'history' && (
            <ScrollArea className="h-full">
              <div className="max-w-5xl mx-auto">
                <ChartHistoryTab externalHistory={history} />
              </div>
            </ScrollArea>
          )}
          {activeTab === 'performance' && (
            <ScrollArea className="h-full">
              <div className="max-w-5xl mx-auto py-2 px-1">
                <PerformanceDashboard onNavigateToHistory={() => {
                  setActiveTab('history');
                }} />
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartAnalyzerPage;
