declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        publicKey: any;
        isConnected: boolean;
        connect: () => Promise<{ publicKey: any }>;
        disconnect: () => Promise<void>;
        signMessage: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array }>;
        on: (event: string, handler: Function) => void;
        off: (event: string, handler: Function) => void;
      };
    };
    solflare?: {
      isConnected: boolean;
      publicKey: any;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      signMessage: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array }>;
      on: (event: string, handler: Function) => void;
      off: (event: string, handler: Function) => void;
    };
    solana?: {
      isConnected: boolean;
      publicKey: any;
      connect: () => Promise<{ publicKey: any }>;
      disconnect: () => Promise<void>;
      signMessage: (message: Uint8Array, display?: string) => Promise<{ signature: Uint8Array }>;
      on: (event: string, handler: Function) => void;
      off: (event: string, handler: Function) => void;
    };
  }
}

export {};