import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Auto-reload on dynamic import failures (stale chunk errors)
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      window.location.reload();
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;

      return (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-foreground">
              <div className="p-2 rounded-full bg-primary/10">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              Oops! AYN hit a snag
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Something unexpected happened, but don't worry - we've got this. Let's get you back on track.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isDev && this.state.error && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded font-mono">
                  {this.state.error.message}
                </div>
              )}
              <Button 
                onClick={() => this.setState({ hasError: false, error: undefined })}
                variant="default"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Let's Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}