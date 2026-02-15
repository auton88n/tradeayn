import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ChartAnalyzer from '@/components/dashboard/ChartAnalyzer';
import ChartCoachChat from '@/components/dashboard/ChartCoachChat';
import type { ChartAnalysisResult } from '@/types/chartAnalyzer.types';

const ChartAnalyzerPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<ChartAnalysisResult | null>(null);

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

      <div className="relative max-w-3xl mx-auto pt-6 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4 gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-4 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <ChartAnalyzer onResult={setAnalysisResult} />
      </div>

      <ChartCoachChat result={analysisResult} />
    </div>
  );
};

export default ChartAnalyzerPage;
