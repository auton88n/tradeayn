import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Copy, Check } from 'lucide-react';

interface EnrollMFAProps {
  onEnrolled: () => void;
  onCancel: () => void;
}

export const EnrollMFA = ({ onEnrolled, onCancel }: EnrollMFAProps) => {
  const [factorId, setFactorId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'AYN Authenticator'
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    } catch (error) {
      toast({
        title: 'Enrollment Failed',
        description: error instanceof Error ? error.message : 'Failed to start MFA enrollment',
        variant: 'destructive'
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit verification code',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode
      });

      if (verifyError) throw verifyError;

      toast({
        title: 'MFA Enabled',
        description: 'Two-factor authentication has been successfully enabled for your account.'
      });

      onEnrolled();
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: error instanceof Error ? error.message : 'Invalid verification code',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!qrCode) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Enable Two-Factor Authentication</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add an extra layer of security to your admin account using an authenticator app.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={isEnrolling} className="flex-1">
            {isEnrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Start Setup'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Scan QR Code</h3>
        <p className="text-sm text-muted-foreground">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
        </div>
      </div>

      {/* Manual Entry Secret */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Can't scan? Enter this code manually:</Label>
        <div className="flex items-center gap-2">
          <code className="flex-1 p-2 bg-muted rounded-md text-xs font-mono break-all">
            {secret}
          </code>
          <Button variant="outline" size="icon" onClick={copySecret}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Verification Code Input */}
      <div className="space-y-2">
        <Label htmlFor="verify-code">Enter verification code from your app</Label>
        <Input
          id="verify-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
          className="text-center text-2xl tracking-[0.5em] font-mono"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleVerify} 
          disabled={isLoading || verifyCode.length !== 6}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify & Enable'
          )}
        </Button>
      </div>
    </div>
  );
};
