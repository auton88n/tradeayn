import { Brain, Shield, RefreshCw } from 'lucide-react';
import { Button } from './button';

export const AYNLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6">
      {/* Eye container */}
      <div className="relative w-24 h-24 animate-eye-breathe">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
        
        {/* Main eye circle */}
        <div className="relative w-full h-full rounded-full bg-background shadow-xl">
          {/* Inner ring */}
          <div className="absolute inset-3 rounded-full bg-background/80 shadow-inner" />
          
          {/* Emotional ring */}
          <div className="absolute inset-[15%] rounded-full bg-muted/50 animate-pulse" />
          
          {/* Black pupil */}
          <div className="absolute inset-[30%] rounded-full bg-foreground flex items-center justify-center">
            {/* White brain icon */}
            <Brain className="w-1/2 h-1/2 text-background" />
          </div>
        </div>
      </div>
      
      {/* Loading text */}
      <p className="text-muted-foreground font-medium animate-pulse">Loading AYN...</p>
    </div>
  </div>
);

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16 animate-eye-breathe">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-lg animate-pulse" />
        <div className="relative w-full h-full rounded-full bg-background shadow-lg">
          <div className="absolute inset-2 rounded-full bg-background/80 shadow-inner" />
          <div className="absolute inset-[18%] rounded-full bg-muted/40 animate-pulse" />
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
        <div className="relative w-full h-full rounded-full bg-background shadow-xl">
          <div className="absolute inset-3 rounded-full bg-background/80 shadow-inner" />
          <div className="absolute inset-[18%] rounded-full bg-muted/50 animate-pulse" />
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
        <div className="relative w-full h-full rounded-full bg-background shadow-xl">
          <div className="absolute inset-3 rounded-full bg-background/80 shadow-inner" />
          <div className="absolute inset-[18%] rounded-full bg-purple-500/20 animate-pulse" />
          <div className="absolute inset-[32%] rounded-full bg-foreground flex items-center justify-center">
            <Shield className="w-1/2 h-1/2 text-background" />
          </div>
        </div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse">Loading Admin Panel...</p>
    </div>
  </div>
);

interface TimeoutErrorProps {
  onRetry: () => void;
}

export const TimeoutError = ({ onRetry }: TimeoutErrorProps) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
      {/* Eye with muted state */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-muted/20 blur-xl" />
        <div className="relative w-full h-full rounded-full bg-background shadow-xl">
          <div className="absolute inset-3 rounded-full bg-background/80 shadow-inner" />
          <div className="absolute inset-[15%] rounded-full bg-muted/30" />
          <div className="absolute inset-[30%] rounded-full bg-muted-foreground/50 flex items-center justify-center">
            <Brain className="w-1/2 h-1/2 text-background/70" />
          </div>
        </div>
      </div>
      
      {/* Error message */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Taking longer than expected</h2>
        <p className="text-muted-foreground text-sm">
          We're having trouble connecting. This might be a temporary issue.
        </p>
      </div>
      
      {/* Retry button */}
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    </div>
  </div>
);
