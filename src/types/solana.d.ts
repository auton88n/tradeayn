// Solana wallet type declarations
interface Window {
  solana?: {
    isPhantom?: boolean;
    connect(): Promise<{ publicKey: { toString(): string } }>;
    disconnect(): Promise<void>;
    on(event: string, callback: () => void): void;
    request(method: string, params?: any): Promise<any>;
  };
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect(): Promise<{ publicKey: { toString(): string } }>;
      disconnect(): Promise<void>;
      on(event: string, callback: () => void): void;
      request(method: string, params?: any): Promise<any>;
    };
  }
}

export {};