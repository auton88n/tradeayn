import { Loader2, Brain, Shield } from 'lucide-react';

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export const DashboardLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center animate-pulse-glow">
        <Brain className="w-8 h-8 text-white" />
      </div>
      <p className="text-muted-foreground">Loading Dashboard...</p>
    </div>
  </div>
);

export const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-purple-500/10 mx-auto mb-4 flex items-center justify-center animate-pulse">
        <Shield className="w-8 h-8 text-purple-500" />
      </div>
      <p className="text-muted-foreground">Loading Admin Panel...</p>
    </div>
  </div>
);
