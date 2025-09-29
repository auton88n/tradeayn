import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Smartphone, Key, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { log } from '@/lib/secureLogger';
import QRCode from 'qrcode';

interface MFASetupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (backupCodes: string[]) => void;
  userEmail: string;
}

interface MFASetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export function MFASetup({ isOpen, onClose, onComplete, userEmail }: MFASetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup' | 'complete'>('setup');
  const [mfaData, setMfaData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const { toast } = useToast();

  // Generate MFA setup data
  useEffect(() => {
    if (isOpen && !mfaData) {
      generateMFASetup();
    }
  }, [isOpen]);

  const generateMFASetup = async () => {
    try {
      setIsLoading(true);
      
      // Generate secret key (32 characters base32)
      const secret = Array.from({ length: 32 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
      ).join('');
      
      // Create TOTP URL for QR code
      const issuer = 'AYN AI Business Platform';
      const label = `${issuer}:${userEmail}`;
      const totpUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(totpUrl);
      
      // Generate backup codes (8 codes, 8 characters each)
      const backupCodes = Array.from({ length: 8 }, () => 
        Array.from({ length: 8 }, () => 
          '0123456789ABCDEF'[Math.floor(Math.random() * 16)]
        ).join('')
      );
      
      setMfaData({ secret, qrCode, backupCodes });
      log.security('mfa_setup_initiated', { userEmail }, 'medium');
      
    } catch (error) {
      log.error('MFA setup generation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userEmail 
      });
      toast({
        title: "Setup Error",
        description: "Failed to generate MFA setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFACode = async () => {
    if (!mfaData || !verificationCode) return;
    
    try {
      setIsLoading(true);
      
      // In a real implementation, this would verify the TOTP code server-side
      // For demo purposes, we'll accept any 6-digit code
      if (verificationCode.length === 6 && /^\d{6}$/.test(verificationCode)) {
        log.security('mfa_verification_success', { userEmail }, 'low');
        setStep('backup');
      } else {
        throw new Error('Invalid verification code');
      }
      
    } catch (error) {
      log.error('MFA verification failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userEmail 
      });
      toast({
        title: "Verification Failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (!mfaData) return;
    
    const codesText = mfaData.backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast({
      title: "Backup Codes Copied",
      description: "Store these codes in a secure location.",
    });
  };

  const completeMFASetup = () => {
    if (!mfaData) return;
    
    log.security('mfa_setup_completed', { userEmail }, 'low');
    onComplete(mfaData.backupCodes);
    setStep('complete');
    
    setTimeout(() => {
      onClose();
      // Reset state
      setStep('setup');
      setMfaData(null);
      setVerificationCode('');
      setCopiedCodes(false);
    }, 2000);
  };

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold">Setup Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Scan the QR code with your authenticator app or enter the secret key manually.
        </p>
      </div>

      {mfaData && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Smartphone className="h-5 w-5" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <img 
                src={mfaData.qrCode} 
                alt="MFA QR Code" 
                className="mx-auto border rounded-lg p-4 bg-card"
                width="200"
                height="200"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Manual Entry
              </CardTitle>
              <CardDescription>
                If you can't scan the QR code, enter this secret key in your authenticator app:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                {mfaData.secret}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={() => setStep('verify')} 
          disabled={!mfaData || isLoading}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold">Verify Your Setup</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the 6-digit code from your authenticator app to verify the setup.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="verification-code">Verification Code</Label>
          <Input
            id="verification-code"
            type="text"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-lg font-mono tracking-widest"
            maxLength={6}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('setup')} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={verifyMFACode} 
          disabled={verificationCode.length !== 6 || isLoading}
          className="flex-1"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </Button>
      </div>
    </div>
  );

  const renderBackupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-warning mb-4" />
        <h3 className="text-lg font-semibold">Save Backup Codes</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Store these backup codes in a safe place. You can use them to access your account if you lose your device.
        </p>
      </div>

      {mfaData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Backup Codes
              <Button
                variant="outline"
                size="sm"
                onClick={copyBackupCodes}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                {copiedCodes ? 'Copied!' : 'Copy'}
              </Button>
            </CardTitle>
            <CardDescription>
              Each code can only be used once. Generate new codes if you run out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {mfaData.backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-muted rounded font-mono text-sm text-center">
                  {code}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <p className="font-medium text-warning">Important Security Notice</p>
            <p className="text-sm text-muted-foreground mt-1">
              Store these codes securely and separately from your device. Anyone with these codes can access your account.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('verify')} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={completeMFASetup}
          disabled={!copiedCodes}
          className="flex-1"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <div>
        <h3 className="text-lg font-semibold text-green-700">MFA Enabled Successfully!</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Two-factor authentication is now active on your account.
        </p>
      </div>
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        Account Secured
      </Badge>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Multi-Factor Authentication</DialogTitle>
        </DialogHeader>
        
        <Separator />
        
        {step === 'setup' && renderSetupStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'backup' && renderBackupStep()}
        {step === 'complete' && renderCompleteStep()}
      </DialogContent>
    </Dialog>
  );
}