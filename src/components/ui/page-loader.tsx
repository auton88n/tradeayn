// Keep in sync with EmotionalEye dark mode colors
import { Brain, Shield } from 'lucide-react';

export const AYNLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-24 h-24 animate-eye-breathe">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
        <div className="relative w-full h-full rounded-full bg-card shadow-xl">
          <div className="absolute inset-3 rounded-full bg-muted/80 shadow-inner" />
          <div className="absolute inset-[15%] rounded-full bg-muted blur-sm animate-pulse" />
          <div className="absolute inset-[30%] rounded-full bg-foreground flex items-center justify-center">
            <Brain className="w-1/2 h-1/2 text-background" />
          </div>
        </div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Loading AYN...</p>
    </div>
  </div>
);

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16 animate-eye-breathe">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-lg animate-pulse" />
        <div className="relative w-full h-full rounded-full bg-card shadow-lg">
          <div className="absolute inset-2 rounded-full bg-muted/80 shadow-inner" />
          <div className="absolute inset-[18%] rounded-full bg-muted blur-sm animate-pulse" />
          <div className="absolute inset-[32%] rounded-full bg-foreground flex items-center justify-center">
            <Brain className="w-1/2 h-1/2 text-background" />
          </div>
        </div>
      </div>
      <p className="text-muted-foreground text-sm animate-pulse">Loading...</p>
    </div>
  </div>
);

export const DashboardLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-20 h-20 animate-eye-breathe">
        <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl animate-pulse" />
        <div className="relative w-full h-full rounded-full bg-card shadow-xl">
          <div className="absolute inset-3 rounded-full bg-muted/80 shadow-inner" />
          <div className="absolute inset-[18%] rounded-full bg-muted blur-sm animate-pulse" />
          <div className="absolute inset-[32%] rounded-full bg-foreground flex items-center justify-center">
            <Brain className="w-1/2 h-1/2 text-background" />
          </div>
        </div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Loading Dashboard...</p>
    </div>
  </div>
);

export const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-20 h-20 animate-eye-breathe">
        <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
        <div className="relative w-full h-full rounded-full bg-card shadow-xl">
          <div className="absolute inset-3 rounded-full bg-muted/80 shadow-inner" />
          <div className="absolute inset-[18%] rounded-full bg-muted blur-sm animate-pulse" />
          <div className="absolute inset-[32%] rounded-full bg-foreground flex items-center justify-center">
            <Shield className="w-1/2 h-1/2 text-background" />
          </div>
        </div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Loading Admin Panel...</p>
    </div>
  </div>
);
