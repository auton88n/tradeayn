import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="glass text-center p-12 max-w-lg">
        <div className="w-24 h-24 rounded-full bg-gradient-primary mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
          <Brain className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-6xl font-bold mb-4 gradient-text-hero">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Oops! It seems like AYN couldn't locate the page you're looking for. 
          Let's get you back to exploring business insights.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="glass glass-hover"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          
          <Button 
            onClick={() => window.location.href = "/"}
            className="bg-gradient-primary hover:scale-105 transition-all neon-purple"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Need help? AYN is always ready to assist with your business questions.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
