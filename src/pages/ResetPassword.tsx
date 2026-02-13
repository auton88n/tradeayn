import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Loader2, Eye, EyeOff, AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { SEO } from '@/components/shared/SEO';

// Helper: race a promise against a timeout
const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ]);
};

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [linkExpired, setLinkExpired] = useState(false);
  const [slowValidation, setSlowValidation] = useState(false);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let slowTimer: NodeJS.Timeout | null = null;
    
    // Set a flag indicating recovery flow is in progress
    localStorage.setItem('password_recovery_in_progress', 'true');
    
    const validateSession = async () => {
      // Start slow validation timer (8 seconds)
      slowTimer = setTimeout(() => {
        if (isMounted && isValidating) {
          setSlowValidation(true);
        }
      }, 8000);

      // Check URL for error parameters first
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const urlError = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      
      if (urlError || errorDescription?.includes('expired')) {
        console.log('[ResetPassword] URL contains error, marking as expired');
        if (isMounted) {
          setLinkExpired(true);
          setIsValidating(false);
        }
        return;
      }

      // Check for recovery token in URL hash
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const tokenType = hashParams.get('type');
      const hasRecoveryToken = accessToken && tokenType === 'recovery';

      console.log('[ResetPassword] Has recovery token:', hasRecoveryToken);

      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          console.log('[ResetPassword] Auth event:', event);
          
          if (!isMounted) return;
          
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && currentSession)) {
            setSession(currentSession);
            setLinkExpired(false);
            setIsValidating(false);
            if (slowTimer) clearTimeout(slowTimer);
            
            // Clean URL hash for security
            if (window.location.hash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }
        }
      );

      try {
        // Try to get existing session with timeout (5 seconds)
        const { data: { session: existingSession }, error } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'Session fetch timeout'
        );

        if (!isMounted) {
          subscription.unsubscribe();
          return;
        }

        if (error) {
          console.error('[ResetPassword] Session check error:', error);
          setLinkExpired(true);
          setIsValidating(false);
          subscription.unsubscribe();
          return;
        }

        if (existingSession) {
          console.log('[ResetPassword] Found existing session');
          setSession(existingSession);
          setIsValidating(false);
          if (slowTimer) clearTimeout(slowTimer);
          subscription.unsubscribe();
          return;
        }

        // If we have recovery tokens but no session, try to set session manually
        if (hasRecoveryToken && refreshToken) {
          console.log('[ResetPassword] Attempting manual session set...');
          try {
            const { data: sessionData, error: setError } = await withTimeout(
              supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }),
              5000,
              'Set session timeout'
            );

            if (!isMounted) {
              subscription.unsubscribe();
              return;
            }

            if (setError) {
              console.error('[ResetPassword] Failed to set session:', setError);
              setLinkExpired(true);
              setIsValidating(false);
            } else if (sessionData.session) {
              console.log('[ResetPassword] Session set successfully');
              setSession(sessionData.session);
              setIsValidating(false);
              
              // Clean URL hash for security
              window.history.replaceState(null, '', window.location.pathname);
            } else {
              setLinkExpired(true);
              setIsValidating(false);
            }
          } catch (e) {
            console.error('[ResetPassword] Manual session set failed:', e);
            if (isMounted) {
              setLinkExpired(true);
              setIsValidating(false);
            }
          }
          subscription.unsubscribe();
          return;
        }

        // No session and no recovery token - wait briefly for auth event
        console.log('[ResetPassword] Waiting for auth event...');
        setTimeout(() => {
          if (isMounted && isValidating) {
            console.log('[ResetPassword] Timeout waiting for auth event');
            setLinkExpired(true);
            setIsValidating(false);
          }
          subscription.unsubscribe();
        }, 3000);

      } catch (e) {
        console.error('[ResetPassword] Validation error:', e);
        if (isMounted) {
          setLinkExpired(true);
          setIsValidating(false);
        }
      }
    };

    validateSession();

    return () => {
      isMounted = false;
      if (slowTimer) clearTimeout(slowTimer);
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
      // Clear recovery flag on unmount if validation failed
      if (linkExpired) {
        localStorage.removeItem('password_recovery_in_progress');
      }
    };
  }, [linkExpired]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your password has been updated successfully',
      });

      // Clear recovery flag and redirect to home after 2 seconds
      localStorage.removeItem('password_recovery_in_progress');
      navigateTimerRef.current = setTimeout(() => {
        navigate('/');
        navigateTimerRef.current = null;
      }, 2000);
      
    } catch (error) {
      toast({
        title: 'Password Reset Failed',
        description: "We couldn't update your password. Please try again or request a new reset link.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    toast({
      title: 'Request New Link',
      description: 'Please use the "Forgot Password" option to request a new reset link.',
    });
    navigate('/');
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Loading state while validating
  if (isValidating) {
    return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <SEO title="Reset Password - AYN" description="Reset your AYN account password." noIndex={true} />
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl text-center">Validating Reset Link</CardTitle>
            <CardDescription className="text-center">
              {slowValidation 
                ? "This is taking longer than expected..."
                : "Please wait while we verify your password reset link..."
              }
            </CardDescription>
          </CardHeader>
          {slowValidation && (
            <CardContent className="space-y-4">
              <Button 
                onClick={handleReload} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button 
                onClick={handleRequestNewLink} 
                className="w-full"
                variant="outline"
              >
                Request New Link
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Expired or invalid link state
  if (linkExpired || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-center">Reset Link Expired</CardTitle>
            <CardDescription className="text-center">
              This password reset link has expired or is invalid.
              Reset links are valid for 1 hour after they are sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleRequestNewLink} 
              className="w-full"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Request New Link
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid session - show password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Password must be at least 6 characters
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
