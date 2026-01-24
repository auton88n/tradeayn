import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Loader2, Eye, EyeOff, AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [linkExpired, setLinkExpired] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let validationTimeout: NodeJS.Timeout | null = null;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth event:', event, 'Session:', !!currentSession);
        
        if (!isMounted) return;
        
        if (event === 'PASSWORD_RECOVERY') {
          console.log('PASSWORD_RECOVERY event received');
          setSession(currentSession);
          setLinkExpired(false);
          setIsValidating(false);
          if (validationTimeout) clearTimeout(validationTimeout);
        } else if (event === 'SIGNED_IN' && currentSession) {
          // User may have been redirected with a valid recovery session
          console.log('SIGNED_IN event with session');
          setSession(currentSession);
          setLinkExpired(false);
          setIsValidating(false);
          if (validationTimeout) clearTimeout(validationTimeout);
        }
      }
    );

    // Check URL for error parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const urlError = urlParams.get('error') || hashParams.get('error');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
    
    // Check if we have a recovery token in the URL (hash fragment)
    const accessToken = hashParams.get('access_token');
    const tokenType = hashParams.get('type');
    const hasRecoveryToken = accessToken && tokenType === 'recovery';
    
    console.log('URL check - error:', urlError, 'hasRecoveryToken:', hasRecoveryToken);
    
    if (urlError || errorDescription?.includes('expired')) {
      console.log('URL contains error, marking as expired');
      setLinkExpired(true);
      setIsValidating(false);
      return () => {
        isMounted = false;
        subscription.unsubscribe();
        if (validationTimeout) clearTimeout(validationTimeout);
      };
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession }, error }) => {
      if (!isMounted) return;
      
      if (error) {
        console.error('Session check error:', error);
        setLinkExpired(true);
        setIsValidating(false);
        return;
      }
      
      if (existingSession) {
        console.log('Found existing session');
        setSession(existingSession);
        setIsValidating(false);
      } else if (hasRecoveryToken) {
        // We have a recovery token but no session yet - wait for auth event
        console.log('Has recovery token, waiting for auth event...');
        validationTimeout = setTimeout(() => {
          if (isMounted) {
            console.log('Timeout waiting for auth event');
            // Check session one more time
            supabase.auth.getSession().then(({ data: { session: finalCheck } }) => {
              if (isMounted) {
                if (finalCheck) {
                  setSession(finalCheck);
                  setIsValidating(false);
                } else {
                  setLinkExpired(true);
                  setIsValidating(false);
                }
              }
            });
          }
        }, 3000);
      } else {
        // No session and no recovery token - definitely expired/invalid
        console.log('No session and no recovery token');
        setLinkExpired(true);
        setIsValidating(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (validationTimeout) clearTimeout(validationTimeout);
    };
  }, []);

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

      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
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
    // Navigate to home and show toast to request new link
    toast({
      title: 'Request New Link',
      description: 'Please use the "Forgot Password" option to request a new reset link.',
    });
    navigate('/');
  };

  // Loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl text-center">Validating Reset Link</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your password reset link...
            </CardDescription>
          </CardHeader>
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
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
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
