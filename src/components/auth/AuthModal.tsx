import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: t('auth.emailRequired'),
        description: t('auth.emailRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: t('auth.checkEmail'),
          description: t('auth.passwordResetSent'),
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('error.systemErrorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // Special handling: email not confirmed
        const code = (error as { code?: string }).code;
        if (code === 'email_not_confirmed' || /email not confirmed/i.test(error.message)) {
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
            toast({ title: t('auth.verificationError'), description: t('auth.verificationErrorDesc') , variant: 'destructive'});
          }
        } else {
          toast({
            title: t('auth.authError'),
            description: error.message,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: t('auth.welcomeBack'),
          description: t('auth.welcomeBackDesc')
        });
        onOpenChange(false);
        // Reset form
        setEmail('');
        setPassword('');
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
    if (!email || !password || !fullName || !companyName) {
      toast({
        title: t('auth.missingInfo'),
        description: t('auth.missingInfoDesc'),
        variant: "destructive"
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: t('auth.termsRequired'),
        description: t('auth.termsRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            company_name: companyName
          }
        }
      });

      if (error) {
        toast({
          title: t('auth.registrationError'),
          description: error.message,
          variant: "destructive"
        });
      } else if (data.user?.identities?.length === 0) {
        // User already exists - Supabase doesn't return error for security
        toast({
          title: t('auth.emailAlreadyRegistered'),
          description: t('auth.emailAlreadyRegisteredDesc'),
          variant: "destructive"
        });
      } else {
        // Send welcome email (async, don't block signup)
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: email,
              emailType: 'welcome',
              data: { userName: fullName || 'there' }
            }
          });
          console.log('[AuthModal] Welcome email sent');
        } catch (emailError) {
          console.warn('[AuthModal] Welcome email failed:', emailError);
          // Don't block signup if email fails
        }

        toast({
          title: t('auth.registrationSuccess'),
          description: t('auth.registrationSuccessDesc')
        });
        onOpenChange(false);
        // Reset form
        setEmail('');
        setPassword('');
        setFullName('');
        setCompanyName('');
        setAcceptedTerms(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-950 border border-white/20 backdrop-blur-xl shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center gradient-text-hero text-2xl">
            {t('auth.welcomeToAyn')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-neutral-900/80 border border-white/10">
            <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
            <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
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
                  className="bg-neutral-900/80 border-white/15 placeholder:text-gray-400 auth-input-text"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rtl:flex-row-reverse">
                  <Label htmlFor="signin-password" className="auth-label">{t('auth.password')}</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isResettingPassword}
                    className="text-sm text-white/70 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isResettingPassword ? t('auth.forgotPasswordSending') : t('auth.forgotPassword')}
                  </button>
                </div>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder={t('auth.enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-neutral-900/80 border-white/15 placeholder:text-gray-400 auth-input-text"
                />
              </div>

              <Button
                type="submit"
                variant="default"
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
              {t('auth.signUpDesc')}
            </div>
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className="bg-neutral-900/80 border-white/15 placeholder:text-gray-400 pl-10 auth-input-text"
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
                      className="bg-neutral-900/80 border-white/15 placeholder:text-gray-400 pl-10 auth-input-text"
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
                  className="bg-neutral-900/80 border-white/15 placeholder:text-gray-400 auth-input-text"
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="signup-password" className="auth-label">{t('auth.password')} *</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder={t('auth.createPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-neutral-900/80 border-white/15 placeholder:text-gray-400 auth-input-text"
                />
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-checkbox"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  disabled={isLoading}
                  className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label 
                  htmlFor="terms-checkbox" 
                  className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none"
                >
                  {t('auth.termsCheckboxLabel')}{' '}
                  <a 
                    href="/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('auth.termsLink')}
                  </a>
                  {' '}{t('auth.termsAnd')}{' '}
                  <a 
                    href="/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('auth.privacyLink')}
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                variant="default"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.signUp')}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};