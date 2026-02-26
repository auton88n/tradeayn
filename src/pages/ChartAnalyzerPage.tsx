import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, LogOut, User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ChartUnifiedChat from '@/components/dashboard/ChartUnifiedChat';
import ChartCoachSidebar from '@/components/dashboard/ChartCoachSidebar';
import { useChartCoach } from '@/hooks/useChartCoach';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ChartAnalyzerPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('chart-sidebar-open');
      if (stored !== null) return stored === 'true';
    } catch {}
    return window.innerWidth >= 1024;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const coach = useChartCoach();

  useEffect(() => {
    try { localStorage.setItem('chart-sidebar-open', String(sidebarOpen)); } catch {}
  }, [sidebarOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUserId(user.id); setUserEmail(user.email); }
      setIsCheckingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
      setUserEmail(session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate('/');
  };

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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_hsl(36_80%_50%_/_0.06)_0%,_transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,_hsl(25_80%_45%_/_0.04)_0%,_transparent_70%)]" />
      </div>

      <div className="relative pt-4 px-4 h-screen flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-2 shrink-0 mx-auto w-full max-w-6xl">
          <div className="flex items-center gap-1.5 mr-1">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span className="font-display font-bold text-sm hidden sm:block">AYN Trade</span>
          </div>

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center hover:bg-amber-500/20 transition-colors">
                  <User className="w-4 h-4 text-amber-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-medium truncate">{userEmail}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <div className="max-w-6xl mx-auto h-full flex gap-0 overflow-hidden rounded-xl">
            {/* Desktop sidebar */}
            {sidebarOpen && (
              <div className="hidden lg:block h-full border border-border/50 rounded-l-xl overflow-hidden bg-background/50">
                <ChartCoachSidebar
                  sessions={coach.sessions}
                  activeSessionId={coach.activeSessionId}
                  onSwitchSession={coach.switchSession}
                  onNewChat={() => coach.newChat()}
                  onDeleteSession={coach.deleteSession}
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
            )}

            {/* Mobile sidebar */}
            <ChartCoachSidebar
              sessions={coach.sessions}
              activeSessionId={coach.activeSessionId}
              onSwitchSession={(id) => { coach.switchSession(id); setMobileSidebarOpen(false); }}
              onNewChat={() => { coach.newChat(); setMobileSidebarOpen(false); }}
              onDeleteSession={coach.deleteSession}
              onClose={() => setMobileSidebarOpen(false)}
              mobileMode
              open={mobileSidebarOpen}
            />

            {/* Chat pane */}
            <div className="flex-1 min-w-0 h-full">
              <ChartUnifiedChat
                coach={coach}
                onToggleSidebar={() => {
                  if (window.innerWidth >= 1024) setSidebarOpen(o => !o);
                  else setMobileSidebarOpen(o => !o);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartAnalyzerPage;
