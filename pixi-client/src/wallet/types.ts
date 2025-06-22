// Wallet-related TypeScript types

export interface CartridgeAccount {
  address: string;
  execute: (calls: Call | Call[]) => Promise<{ transaction_hash: string }>;
}

export interface Call {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export enum ConnectionStatus {
  Disconnected = "disconnected",
  Connecting = "connecting",
  Connected = "connected",
  Error = "error",
}

export interface WalletConnectionState {
  status: ConnectionStatus;
  account?: CartridgeAccount;
  address?: string;
  error?: string;
}

// Direction enum for game moves (matches Dojo contract)
export enum Direction {
  Left = 0,
  Right = 1,
  Up = 2,
  Down = 3,
}
