import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Building, User, Shield, Wallet, 
  AlertTriangle, CheckCircle2, Eye, EyeOff 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateDeviceFingerprint, collectDeviceInfo, validateDeviceInfo } from '@/lib/deviceFingerprint';
import { reportThreatEvent, checkIPBlocked } from '@/lib/threatDetection';

interface EnhancedAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnhancedAuthModal = ({ open, onOpenChange }: EnhancedAuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');
  const [deviceTrusted, setDeviceTrusted] = useState(false);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [authMethod, setAuthMethod] = useState<'email' | 'solana'>('email');
  const [solanaWallet, setSolanaWallet] = useState<any>(null);
  
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (open) {
      initializeSecurity();
    }
  }, [open]);

  const initializeSecurity = async () => {
    try {
      // Check if IP is blocked
      const blocked = await checkIPBlocked();
      setIpBlocked(blocked);
      
      if (blocked) {
        toast({
          title: 'Access Blocked',
          description: 'Your IP address has been temporarily blocked due to suspicious activity.',
          variant: 'destructive'
        });
        return;
      }

      // Generate device fingerprint
      const fingerprint = await generateDeviceFingerprint();
      setDeviceFingerprint(fingerprint);
      
      // Check if device is trusted (you could implement this check)
      // For now, we'll assume new devices are untrusted
      setDeviceTrusted(false);
      
    } catch (error) {
      console.error('Security initialization failed:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ipBlocked) {
      toast({
        title: 'Access Denied',
        description: 'Your IP is currently blocked.',
        variant: 'destructive'
      });
      return;
    }

    if (!email || !password) {
      toast({
        title: t('auth.missingInfo'),
        description: t('auth.missingInfoDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFailedAttempts(prev => prev + 1);
        
        // Report failed login attempt
        await reportThreatEvent({
          type: 'failed_login',
          severity: failedAttempts >= 3 ? 'high' : 'medium',
          details: {
            email,
            attempt_count: failedAttempts + 1,
            device_fingerprint: deviceFingerprint,
            error_message: error.message
          }
        });

        if (error.code === 'email_not_confirmed') {
          try {
            await supabase.auth.resend({
              type: 'signup',
              email,
              options: { emailRedirectTo: `${window.location.origin}/` }
            });
            toast({
              title: t('auth.verifyEmail'),
              description: t('auth.verifyEmailDesc'),
            });
          } catch (e) {
            toast({ 
              title: t('auth.verificationError'), 
              description: t('auth.verificationErrorDesc'), 
              variant: 'destructive'
            });
          }
        } else {
          toast({
            title: t('auth.authError'),
            description: error.message,
            variant: 'destructive'
          });
        }
      } else {
        // Record successful device fingerprint
        if (deviceFingerprint) {
          const deviceInfo = await collectDeviceInfo();
          await supabase.rpc('record_device_fingerprint', {
            _user_id: (await supabase.auth.getUser()).data.user?.id,
            _fingerprint_hash: deviceFingerprint,
            _device_info: deviceInfo as any
          });
        }

        toast({
          title: t('auth.welcomeBack'),
          description: t('auth.welcomeBackDesc')
        });
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      toast({
        title: t('error.systemError'),
        description: t('error.systemErrorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (ipBlocked) {
      toast({
        title: 'Access Denied',
        description: 'Your IP is currently blocked.',
        variant: 'destructive'
      });
      return;
    }

    if (!email || !password || !fullName || !companyName) {
      toast({
        title: t('auth.missingInfo'),
        description: t('auth.missingInfoDesc'),
        variant: "destructive"
      });
      return;
    }

    // Validate device for suspicious characteristics
    const deviceInfo = await collectDeviceInfo();
    const validation = validateDeviceInfo(deviceInfo);
    
    if (!validation.isValid) {
      await reportThreatEvent({
        type: 'suspicious_request',
        severity: 'medium',
        details: {
          validation_risks: validation.risks,
          device_info: deviceInfo,
          action: 'signup_attempt'
        }
      });
      
      toast({
        title: 'Security Check Failed',
        description: 'Your device failed security validation. Please try again from a different browser.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            company_name: companyName,
            phone: phone,
            device_fingerprint: deviceFingerprint
          }
        }
      });

      if (error) {
        await reportThreatEvent({
          type: 'failed_login',
          severity: 'low',
          details: {
            email,
            action: 'signup_failed',
            error_message: error.message
          }
        });

        toast({
          title: t('auth.registrationError'),
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: t('auth.registrationSuccess'),
          description: t('auth.registrationSuccessDesc')
        });
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      toast({
        title: t('error.systemError'),
        description: t('error.systemErrorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolanaAuth = async () => {
    try {
      if (typeof window === 'undefined' || !(window as any).solana) {
        toast({
          title: 'Solana Wallet Not Found',
          description: 'Please install Phantom or another Solana wallet.',
          variant: 'destructive'
        });
        return;
      }

      const solana = (window as any).solana;
      if (!solana.isPhantom) {
        toast({
          title: 'Phantom Wallet Required',
          description: 'Please install Phantom wallet to connect with Solana.',
          variant: 'destructive'
        });
        return;
      }

      setIsLoading(true);
      const response = await solana.connect();
      const publicKey = response.publicKey.toString();
      setSolanaWallet(response);
      
      // Check if wallet is already linked to an account
      const { data: existingWallet } = await supabase
        .from('wallet_addresses')
        .select('user_id')
        .eq('wallet_address', publicKey)
        .single();

      if (existingWallet) {
        // Wallet already linked, need to sign in the user
        // For now, show success and let auth state handle the redirect
        toast({
          title: 'Wallet Connected',
          description: 'Successfully connected your Solana wallet!',
        });
        onOpenChange(false);
        return;
      }

      // Create new user account with Solana wallet
      const tempEmail = `${publicKey.slice(0, 12)}@solana.wallet`;
      const tempPassword = publicKey + Date.now(); 
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: `Solana User ${publicKey.slice(0, 8)}`,
            company_name: 'Solana Wallet User',
            wallet_address: publicKey,
            auth_method: 'solana'
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (authData.user) {
        // Link wallet to the new user account
        const { error: walletError } = await supabase
          .from('wallet_addresses')
          .insert({
            user_id: authData.user.id,
            wallet_address: publicKey,
            wallet_type: 'solana',
            verified: true,
            is_primary: true
          });

        if (walletError) {
          console.error('Error linking wallet:', walletError);
        }

        toast({
          title: 'Wallet Connected & Account Created',
          description: 'Successfully created account and signed in with Solana wallet!',
        });
        
        // Reset form and close modal
        resetForm();
        onOpenChange(false);
      }
      
    } catch (error: any) {
      console.error('Solana auth error:', error);
      toast({
        title: 'Wallet Connection Failed',
        description: error.message || 'Failed to connect to Solana wallet.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your email for password reset instructions.',
      });
    } catch (error: any) {
      toast({
        title: 'Reset Failed',
        description: error.message || 'Failed to send password reset email.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setCompanyName('');
    setPhone('');
    setFailedAttempts(0);
  };

  const getSecurityStatus = () => {
    if (ipBlocked) return { color: 'red', text: 'Blocked' };
    if (!deviceTrusted) return { color: 'yellow', text: 'New Device' };
    return { color: 'green', text: 'Trusted' };
  };

  const securityStatus = getSecurityStatus();

  if (ipBlocked) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-red-600 text-2xl flex items-center justify-center gap-2">
              <Shield className="w-6 h-6" />
              Access Blocked
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 p-4">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
            <p className="text-muted-foreground">
              Your IP address has been temporarily blocked due to suspicious activity.
              Please contact support if you believe this is an error.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-white text-2xl">
            {t('auth.welcomeToAyn')}
          </DialogTitle>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className={`text-${securityStatus.color}-600`}>
              <Shield className="w-3 h-3 mr-1" />
              {securityStatus.text}
            </Badge>
            {deviceFingerprint && (
              <Badge variant="outline">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verified Device
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Auth Method Selection */}
        <div className="flex gap-2 mb-4">
          <Button 
            variant={authMethod === 'email' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAuthMethod('email')}
            className="flex-1"
          >
            <User className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button 
            variant={authMethod === 'solana' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAuthMethod('solana')}
            className="flex-1"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Solana Wallet
          </Button>
        </div>

        {authMethod === 'solana' ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Connect your Solana wallet for secure, decentralized authentication
              </p>
              <Button onClick={handleSolanaAuth} disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect Solana Wallet
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.requestAccess')}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="auth-label">{t('auth.email')}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder={t('auth.enterEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="glass auth-input-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="auth-label">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.enterPassword')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="glass auth-input-text pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {failedAttempts > 0 && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Failed attempts: {failedAttempts}/5
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm text-primary hover:text-primary/80"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.signIn')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <div className="text-center text-sm text-muted-foreground mb-4">
                {t('auth.requestAccessDesc')}
              </div>
              
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="auth-label">{t('auth.fullName')} *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading}
                        className="glass pl-10 auth-input-text"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-company" className="auth-label">{t('auth.company')} *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={isLoading}
                        className="glass pl-10 auth-input-text"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="auth-label">{t('auth.businessEmail')} *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="john@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="glass auth-input-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="auth-label">{t('auth.phoneNumber')}</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                    className="glass auth-input-text"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="auth-label">{t('auth.password')} *</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.createPassword')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="glass auth-input-text pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.requestAccess')}
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  {t('auth.accessReviewDesc')}
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};