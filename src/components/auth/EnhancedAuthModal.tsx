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
import { Mail } from 'lucide-react';

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
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [pendingWalletAddress, setPendingWalletAddress] = useState('');
  
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
      
      // HOO Token Verification
      setIsVerifyingToken(true);
      toast({
        title: 'Verifying HOO Token Holdings...',
        description: 'Checking your wallet balance...',
      });

      let verificationData: any = null;
      try {
        const { data, error: verifyError } = await supabase.functions.invoke(
          'verify-solana-token',
          {
            body: { walletAddress: publicKey }
          }
        );

        if (verifyError) {
          console.error('Token verification error:', verifyError);
          throw new Error(verifyError.message || 'Failed to verify token holdings');
        }

        verificationData = data;
        setTokenBalance(verificationData.balance);

        if (!verificationData.verified) {
          setIsVerifyingToken(false);
          setIsLoading(false);
          toast({
            title: 'Insufficient HOO Tokens',
            description: `You need 10,000,000 HOO tokens. Your balance: ${verificationData.balance.toLocaleString()} HOO`,
            variant: 'destructive'
          });
          return;
        }

        setTokenVerified(true);
        toast({
          title: 'Token Verification Successful! ✅',
          description: `Verified ${verificationData.balance.toLocaleString()} HOO tokens`,
        });
      } catch (tokenError: any) {
        setIsVerifyingToken(false);
        setIsLoading(false);
        toast({
          title: 'Verification Failed',
          description: tokenError.message || 'Unable to verify token holdings. Please try again.',
          variant: 'destructive'
        });
        return;
      } finally {
        setIsVerifyingToken(false);
      }
      
      // Check if wallet is already linked to an account
      const { data: existingWallet, error: walletCheckError } = await supabase
        .from('wallet_addresses')
        .select('user_id')
        .eq('wallet_address', publicKey)
        .maybeSingle();

      if (walletCheckError) {
        console.error('Error checking existing wallet:', walletCheckError);
      }

      if (existingWallet) {
        toast({
          title: 'Wallet Already Connected',
          description: 'This wallet is already linked to an account. Signing you in...',
        });
        setIsLoading(false);
        onOpenChange(false);
        return;
      }

      // New wallet - show username prompt
      setPendingWalletAddress(publicKey);
      setShowUsernamePrompt(true);
      setIsLoading(false);
      
    } catch (error: any) {
      console.error('Solana auth error:', error);
      toast({
        title: 'Wallet Connection Failed',
        description: error.message || 'Failed to connect Solana wallet. Please try again.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  const handleUsernameSubmit = async () => {
    if (!displayName.trim() || !pendingWalletAddress) {
      toast({
        title: 'Display Name Required',
        description: 'Please enter a display name to continue.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Add random delay to avoid rate limits (500-2000ms)
      const delay = Math.floor(Math.random() * 1500) + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Create deterministic email based on wallet address (prevents duplicates)
      const tempEmail = `solana-${pendingWalletAddress.slice(0, 8)}@ayn.wallet`;
      const tempPassword = pendingWalletAddress + Date.now() + Math.random().toString(36);
      
      console.log('Creating new user with Solana wallet:', {
        email: tempEmail,
        walletAddress: pendingWalletAddress,
        displayName: displayName
      });

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: displayName,
            company_name: 'Solana Wallet User',
            wallet_address: pendingWalletAddress,
            auth_method: 'solana',
            hoo_token_balance: tokenBalance
          }
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw new Error(`Account creation failed: ${signUpError.message}`);
      }

      if (!authData.user) {
        throw new Error('User account was not created properly');
      }

      console.log('User created successfully:', authData.user.id);

      // Link wallet to user account
      const { error: walletError } = await supabase
        .from('wallet_addresses')
        .insert({
          user_id: authData.user.id,
          wallet_address: pendingWalletAddress,
          wallet_type: 'solana',
          verified: true,
          is_primary: true
        });

      if (walletError) {
        console.error('Wallet linking error:', walletError);
        toast({
          title: 'Warning',
          description: 'Account created but wallet linking needs admin review.',
          variant: 'destructive'
        });
      }

      toast({
        title: 'Account Created! 🎉',
        description: 'Your account is pending admin approval. You will be notified once approved.',
      });
      
      setShowUsernamePrompt(false);
      onOpenChange(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast({
        title: 'Account Creation Failed',
        description: error.message || 'Failed to create account. Please try again.',
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
    setIsLoading(false);
    setFailedAttempts(0);
    setSolanaWallet(null);
    setIsVerifyingToken(false);
    setTokenVerified(false);
    setTokenBalance(null);
    setShowUsernamePrompt(false);
    setDisplayName('');
    setPendingWalletAddress('');
  };

  const getSecurityStatus = () => {
    if (ipBlocked) {
      return { icon: AlertTriangle, text: 'Blocked', variant: 'destructive' as const };
    }
    if (!deviceTrusted) {
      return { icon: Shield, text: 'New Device', variant: 'secondary' as const };
    }
    return { icon: CheckCircle2, text: 'Trusted', variant: 'default' as const };
  };

  const securityStatus = getSecurityStatus();
  const SecurityIcon = securityStatus.icon;

  return (
    <>
      {/* Username Prompt Dialog */}
      <Dialog open={showUsernamePrompt} onOpenChange={setShowUsernamePrompt}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Choose Your Display Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please choose a display name for your account. This will be visible to administrators during the approval process.
            </p>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                maxLength={50}
              />
            </div>
            <Button 
              onClick={handleUsernameSubmit}
              disabled={isLoading || !displayName.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Auth Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          {ipBlocked ? (
            <div className="space-y-4 text-center py-8">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Access Blocked</h2>
              <p className="text-muted-foreground">
                Your IP address has been temporarily blocked due to suspicious activity.
                Please contact support if you believe this is an error.
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{t('auth.welcome')}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={securityStatus.variant} className="flex items-center gap-1">
                    <SecurityIcon className="w-3 h-3" />
                    {securityStatus.text}
                  </Badge>
                </div>
              </DialogHeader>

              <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'solana')} className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="solana" className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Solana Wallet
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="solana" className="space-y-4">
                  <div className="space-y-4 py-4">
                    <div className="text-center space-y-2">
                      <Wallet className="w-12 h-12 mx-auto text-primary" />
                      <h3 className="font-semibold">Connect with Solana</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect your Phantom wallet to access AYN. Requires 10,000,000 HOO tokens.
                      </p>
                    </div>
                    
                    {tokenVerified && (
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">Token Verification Complete</p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {tokenBalance?.toLocaleString()} HOO tokens verified
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSolanaAuth}
                      disabled={isLoading || isVerifyingToken}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading || isVerifyingToken ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isVerifyingToken ? 'Verifying Tokens...' : 'Connecting...'}
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Connect Phantom Wallet
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="email">
                  <Tabs defaultValue="signin" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
                      <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('auth.email')}</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">{t('auth.password')}</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              disabled={isLoading}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('auth.signingIn')}
                            </>
                          ) : (
                            t('auth.signIn')
                          )}
                        </Button>
                        <Button 
                          type="button"
                          variant="link" 
                          className="w-full text-sm" 
                          onClick={handleForgotPassword}
                          disabled={isLoading}
                        >
                          {t('auth.forgotPassword')}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-fullname">
                            <User className="w-4 h-4 inline mr-1" />
                            {t('auth.fullName')}
                          </Label>
                          <Input
                            id="signup-fullname"
                            type="text"
                            placeholder={t('auth.fullNamePlaceholder')}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-company">
                            <Building className="w-4 h-4 inline mr-1" />
                            {t('auth.companyName')}
                          </Label>
                          <Input
                            id="signup-company"
                            type="text"
                            placeholder={t('auth.companyNamePlaceholder')}
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-phone">{t('auth.phone')} ({t('auth.optional')})</Label>
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder={t('auth.phonePlaceholder')}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">{t('auth.email')}</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">{t('auth.password')}</Label>
                          <div className="relative">
                            <Input
                              id="signup-password"
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              disabled={isLoading}
                              required
                              minLength={6}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('auth.creatingAccount')}
                            </>
                          ) : (
                            t('auth.createAccount')
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
