import { Brain, Shield } from 'lucide-react';

export const AYNLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      {/* Eye container with glow */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        
        {/* Main eye circle */}
        <div className="relative w-24 h-24 rounded-full bg-background shadow-xl border border-border/50 flex items-center justify-center">
          {/* Inner ring */}
          <div className="absolute inset-3 rounded-full border border-border/30" />
          
          {/* Emotional ring */}
          <div className="absolute inset-[15%] rounded-full bg-muted/50 animate-pulse" />
          
          {/* Brain icon */}
          <Brain className="w-8 h-8 text-primary animate-spin-slow" />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="text-center animate-fade-in">
        <p className="text-muted-foreground font-medium">Loading AYN...</p>
      </div>
    </div>
  </div>
);

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-lg animate-pulse" />
        <div className="relative w-16 h-16 rounded-full bg-background shadow-lg border border-border/50 flex items-center justify-center">
          <div className="absolute inset-2 rounded-full border border-border/20" />
          <Brain className="w-6 h-6 text-primary animate-spin-slow" />
        </div>
      </div>
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

export const DashboardLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-background shadow-xl border border-border/50 flex items-center justify-center">
          <div className="absolute inset-3 rounded-full border border-border/30" />
          <div className="absolute inset-[18%] rounded-full bg-muted/40 animate-pulse" />
          <Brain className="w-7 h-7 text-primary animate-spin-slow" />
        </div>
      </div>
      <p className="text-muted-foreground font-medium">Loading Dashboard...</p>
    </div>
  </div>
);

export const AdminLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-background shadow-xl border border-border/50 flex items-center justify-center">
          <div className="absolute inset-3 rounded-full border border-purple-500/30" />
          <div className="absolute inset-[18%] rounded-full bg-purple-500/10 animate-pulse" />
          <Shield className="w-7 h-7 text-purple-500 animate-spin-slow" />
        </div>
      </div>
      <p className="text-muted-foreground font-medium">Loading Admin Panel...</p>
    </div>
  </div>
);
