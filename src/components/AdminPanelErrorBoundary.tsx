import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminPanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminPanel failed to load:', error, errorInfo);
    
    // Notify parent component about the error
    this.props.onError?.();
  }

  handleRetry = () => {
    // Clear any cached modules by forcing a full page reload
    // This ensures we get fresh module versions
    window.location.reload();
  };

  handleClearCacheAndRetry = () => {
    // Try to clear service worker caches if available
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage module cache markers
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('vite-') || key.includes('module')) {
        localStorage.removeItem(key);
      }
    });
    
    // Force reload to get fresh modules
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isModuleError = this.state.error?.message?.includes('dynamically imported module') ||
                           this.state.error?.message?.includes('Failed to fetch');

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6">
          <div className="p-4 rounded-full bg-destructive/10">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          
          <div className="text-center space-y-2 max-w-md">
            <h2 className="text-xl font-semibold text-foreground">
              Failed to load Admin Panel
            </h2>
            <p className="text-muted-foreground">
              {isModuleError 
                ? 'This is likely due to a cached file issue. Try clearing the cache and reloading.'
                : 'An unexpected error occurred while loading the admin panel.'
              }
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground/70 font-mono mt-2 break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <Button onClick={this.handleClearCacheAndRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Clear Cache & Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
