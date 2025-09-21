import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import { logSecurityEvent } from '@/lib/security';

interface SolanaWalletAuthProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function SolanaWalletAuth({ onSuccess, onError }: SolanaWalletAuthProps) {
  const { t } = useLanguage();
  const { connected, connecting, publicKey, walletName, connect, disconnect } = useSolanaWallet();
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWalletConnect = async () => {
    setError(null);
    try {
      if (!connected) {
        await connect();
      }
      await handleWalletAuth();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect wallet';
      setError(errorMessage);
      onError(errorMessage);
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleWalletAuth = async () => {
    if (!connected || !publicKey) return;

    setAuthenticating(true);
    setError(null);

    try {
      // Generate device fingerprint for security
      const deviceFingerprint = await generateDeviceFingerprint();
      
      // Create nonce message for signing
      const nonce = `AYN Auth: ${Date.now()}`;
      const encoder = new TextEncoder();
      const messageBytes = encoder.encode(nonce);

      // Request wallet signature
      const signedMessage = await useSolanaWallet().signMessage(messageBytes);

      // Authenticate with Supabase using the signed message
      const { data, error } = await supabase.functions.invoke('solana-auth', {
        body: {
          publicKey: publicKey.toBase58(),
          message: nonce,
          signature: Array.from(signedMessage),
          deviceFingerprint,
          walletName,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Log successful wallet authentication
      await logSecurityEvent('wallet_auth_success', {
        wallet_type: 'solana',
        wallet_name: walletName,
        public_key: publicKey.toBase58(),
      });

      toast({
        title: t('auth.walletConnected'),
        description: `Connected with ${walletName}`,
      });

      onSuccess();
    } catch (error: any) {
      const errorMessage = error.message || 'Wallet authentication failed';
      setError(errorMessage);
      onError(errorMessage);
      
      // Log failed authentication attempt
      await logSecurityEvent('wallet_auth_failed', {
        error: errorMessage,
        wallet_type: 'solana',
        wallet_name: walletName,
        public_key: publicKey?.toBase58(),
      });

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: t('auth.walletDisconnected'),
        description: "Wallet disconnected successfully",
      });
    } catch (error: any) {
      console.warn('Error disconnecting wallet:', error);
    }
  };

  const isWalletInstalled = typeof window !== 'undefined' && (
    window.phantom?.solana || window.solflare || window.solana
  );

  if (!isWalletInstalled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Solana Wallet Required
          </CardTitle>
          <CardDescription>
            Please install a Solana wallet to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('https://phantom.app', '_blank')}
              className="justify-between"
            >
              Install Phantom Wallet
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://solflare.com', '_blank')}
              className="justify-between"
            >
              Install Solflare Wallet
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {t('auth.connectWithSolana')}
        </CardTitle>
        <CardDescription>
          Connect your Solana wallet to authenticate securely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {connected && publicKey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1 text-sm">
                <div className="font-medium">Connected to {walletName}</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleWalletAuth}
                disabled={authenticating}
                className="flex-1"
              >
                {authenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Authenticate'
                )}
              </Button>
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleWalletConnect}
            disabled={connecting}
            className="w-full"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                {t('auth.connectWallet')}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}