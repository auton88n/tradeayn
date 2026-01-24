import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Home, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="glass text-center p-12 max-w-lg bg-neutral-900/90 backdrop-blur-xl border border-white/20">
        <div className="w-24 h-24 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
          <Brain className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-6xl font-bold mb-4 gradient-text-hero">404</h1>
        <h2 className="text-2xl font-semibold mb-4 text-white">{t('notFound.pageNotFound')}</h2>
        <p className="text-white/70 mb-8 leading-relaxed">
          {t('notFound.description')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="glass glass-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('notFound.goBack')}
          </Button>
          
          <Button 
            onClick={() => window.location.href = "/"}
            className="bg-gradient-primary hover:scale-105 transition-all neon-purple"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('notFound.returnHome')}
          </Button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/20">
          <p className="text-sm text-white/50">
            {t('notFound.needHelp')}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
