import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, MessageSquare, Activity, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChartUnifiedChat from '@/components/dashboard/ChartUnifiedChat';
import PerformanceDashboard from '@/components/trading/PerformanceDashboard';
import ChartHistoryTab from '@/components/dashboard/ChartHistoryTab';
import { ScrollArea } from '@/components/ui/scroll-area';

const ChartAnalyzerPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'performance'>('chat');

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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_hsl(36_80%_50%_/_0.06)_0%,_transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,_hsl(25_80%_45%_/_0.04)_0%,_transparent_70%)]" />
      </div>

      <div className="relative max-w-3xl mx-auto pt-4 px-4 h-screen flex flex-col">
        {/* Top bar: Back + Tabs */}
        <div className="flex items-center gap-3 mb-2 shrink-0">
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
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'chat' && <ChartUnifiedChat />}
          {activeTab === 'history' && (
            <ScrollArea className="h-full">
              <ChartHistoryTab />
            </ScrollArea>
          )}
          {activeTab === 'performance' && (
            <ScrollArea className="h-full">
              <div className="py-2">
                <PerformanceDashboard />
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartAnalyzerPage;
