import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';

interface SolanaWalletContextType {
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  walletName: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

const SolanaWalletContext = createContext<SolanaWalletContextType | undefined>(undefined);

export function useSolanaWallet() {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }
  return context;
}

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);

  // Check for available wallets
  const getWallet = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Check for Phantom
      if (window.phantom?.solana) {
        return { wallet: window.phantom.solana, name: 'Phantom' };
      }
      // Check for Solflare
      if (window.solflare) {
        return { wallet: window.solflare, name: 'Solflare' };
      }
      // Check for other wallets
      if (window.solana) {
        return { wallet: window.solana, name: 'Unknown' };
      }
    }
    return null;
  }, []);

  const connect = useCallback(async () => {
    const walletInfo = getWallet();
    if (!walletInfo) {
      throw new Error('No Solana wallet found. Please install Phantom or Solflare.');
    }

    setConnecting(true);
    try {
      const response = await walletInfo.wallet.connect();
      setPublicKey(response.publicKey);
      setWalletName(walletInfo.name);
      setConnected(true);
    } catch (error: any) {
      throw new Error(`Failed to connect wallet: ${error.message}`);
    } finally {
      setConnecting(false);
    }
  }, [getWallet]);

  const disconnect = useCallback(async () => {
    const walletInfo = getWallet();
    if (walletInfo && connected) {
      try {
        await walletInfo.wallet.disconnect();
      } catch (error) {
        console.warn('Error disconnecting wallet:', error);
      }
    }
    setConnected(false);
    setPublicKey(null);
    setWalletName(null);
  }, [getWallet, connected]);

  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    const walletInfo = getWallet();
    if (!walletInfo || !connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const signedMessage = await walletInfo.wallet.signMessage(message, 'utf8');
      return signedMessage.signature;
    } catch (error: any) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }, [getWallet, connected]);

  // Listen for wallet events
  useEffect(() => {
    const walletInfo = getWallet();
    if (walletInfo?.wallet) {
      const handleDisconnect = () => {
        setConnected(false);
        setPublicKey(null);
        setWalletName(null);
      };

      walletInfo.wallet.on('disconnect', handleDisconnect);

      // Check if already connected
      if (walletInfo.wallet.isConnected) {
        setConnected(true);
        setPublicKey(walletInfo.wallet.publicKey);
        setWalletName(walletInfo.name);
      }

      return () => {
        walletInfo.wallet.off('disconnect', handleDisconnect);
      };
    }
  }, [getWallet]);

  const value = {
    connected,
    connecting,
    publicKey,
    walletName,
    connect,
    disconnect,
    signMessage,
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
}