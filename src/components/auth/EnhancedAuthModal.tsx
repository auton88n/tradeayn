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
  Loader2, Building, User, Shield, 
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

              <Tabs defaultValue="signin" className="mt-4 space-y-4">
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
            </>
          )}
        </DialogContent>
      </Dialog>
  );
};
