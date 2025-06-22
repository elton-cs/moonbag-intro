/**
 * Wallet service for managing Cartridge Controller connection
 * Based on working client implementation patterns
 */

import Controller from "@cartridge/controller";
import { controllerOptions } from "./controller-config";
import type { CartridgeAccount, Call, WalletConnectionState } from "./types";
import { ConnectionStatus, Direction } from "./types";
import manifest from "../../../contracts/manifest_dev.json";

export class WalletService {
  private controller: Controller;
  private state: WalletConnectionState;
  private connectionCallbacks: Set<(state: WalletConnectionState) => void> =
    new Set();

  constructor() {
    this.controller = new Controller(controllerOptions);
    this.state = {
      status: ConnectionStatus.Disconnected,
    };
  }

  /**
   * Get current connection state
   */
  public getState(): WalletConnectionState {
    return { ...this.state };
  }

  /**
   * Check if wallet is connected
   */
  public isConnected(): boolean {
    return this.state.status === ConnectionStatus.Connected;
  }

  /**
   * Get the connected account
   */
  public getAccount(): CartridgeAccount | undefined {
    return this.state.account;
  }

  /**
   * Get user identification string (username or shortened address)
   */
  public getUserDisplayName(): string | undefined {
    if (!this.state.account) return undefined;

    const account = this.state.account as unknown as Record<string, unknown>;

    // Try to get username/name first
    const username =
      account.username || account.name || account.displayName || account.id;
    if (username && typeof username === "string") {
      return username;
    }

    // Fallback to shortened address
    if (account.address && typeof account.address === "string") {
      return `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
    }

    return undefined;
  }

  /**
   * Subscribe to connection state changes
   */
  public onConnectionChange(
    callback: (state: WalletConnectionState) => void,
  ): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  /**
   * Connect to Cartridge Controller wallet
   */
  public async connect(): Promise<CartridgeAccount> {
    if (this.state.status === ConnectionStatus.Connecting) {
      throw new Error("Connection already in progress");
    }

    this.updateState({
      status: ConnectionStatus.Connecting,
      error: undefined,
    });

    try {
      const account = await this.controller.connect();

      // Debug: Log all available properties on the account object
      console.log("Connected account object:", account);
      console.log("Account properties:", Object.keys(account || {}));
      console.log("Account address:", account?.address);

      // Check for common username/identity properties
      const possibleUsernameFields = [
        "username",
        "name",
        "displayName",
        "id",
        "userId",
      ];
      possibleUsernameFields.forEach((field) => {
        if ((account as unknown as Record<string, unknown>)?.[field]) {
          console.log(
            `Found ${field}:`,
            (account as unknown as Record<string, unknown>)[field],
          );
        }
      });

      this.updateState({
        status: ConnectionStatus.Connected,
        account,
        address: account?.address,
        error: undefined,
      });

      console.log("Wallet connected successfully:", account?.address);
      return account as CartridgeAccount;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect wallet";

      this.updateState({
        status: ConnectionStatus.Error,
        account: undefined,
        address: undefined,
        error: errorMessage,
      });

      console.error("Wallet connection failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  public disconnect(): void {
    this.updateState({
      status: ConnectionStatus.Disconnected,
      account: undefined,
      address: undefined,
      error: undefined,
    });

    console.log("Wallet disconnected");
  }

  /**
   * Execute a transaction using the connected account
   */
  public async executeTransaction(
    call: Call,
  ): Promise<{ transaction_hash: string }> {
    if (!this.isConnected() || !this.state.account) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await this.state.account.execute(call);
      console.log("Transaction executed:", result);
      return result;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  }

  /**
   * Execute multiple transactions in a single call
   */
  public async executeMultiCall(
    calls: Call[],
  ): Promise<{ transaction_hash: string }> {
    if (!this.isConnected() || !this.state.account) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await this.state.account.execute(calls);
      console.log("Multi-call transaction executed:", result);
      return result;
    } catch (error) {
      console.error("Multi-call transaction failed:", error);
      throw error;
    }
  }

  // Game-specific transaction methods (based on client/game.js)

  /**
   * Spawn player in the game
   */
  public async spawn(): Promise<{ transaction_hash: string }> {
    const actionsContract = manifest.contracts.find(
      (contract: { tag: string; address: string }) =>
        contract.tag === "di-actions",
    );

    if (!actionsContract) {
      throw new Error("Actions contract not found in manifest");
    }

    return this.executeTransaction({
      contractAddress: actionsContract.address,
      entrypoint: "spawn",
      calldata: [],
    });
  }

  /**
   * Move player in specified direction
   */
  public async move(
    direction: Direction,
  ): Promise<{ transaction_hash: string }> {
    const actionsContract = manifest.contracts.find(
      (contract: { tag: string; address: string }) =>
        contract.tag === "di-actions",
    );

    if (!actionsContract) {
      throw new Error("Actions contract not found in manifest");
    }

    return this.executeTransaction({
      contractAddress: actionsContract.address,
      entrypoint: "move",
      calldata: [direction.toString()],
    });
  }

  /**
   * Move player randomly using VRF
   */
  public async moveRandom(): Promise<{ transaction_hash: string }> {
    const actionsContract = manifest.contracts.find(
      (contract: { tag: string; address: string }) =>
        contract.tag === "di-actions",
    );

    if (!actionsContract) {
      throw new Error("Actions contract not found in manifest");
    }

    const VRF_PROVIDER_ADDRESS =
      "0x15f542e25a4ce31481f986888c179b6e57412be340b8095f72f75a328fbb27b";

    if (!this.state.account) {
      throw new Error("Account not available");
    }

    // VRF sandwich pattern: request_random -> move_random
    return this.executeMultiCall([
      {
        contractAddress: VRF_PROVIDER_ADDRESS,
        entrypoint: "request_random",
        calldata: [actionsContract.address, "0", this.state.account.address],
      },
      {
        contractAddress: actionsContract.address,
        entrypoint: "move_random",
        calldata: [],
      },
    ]);
  }

  /**
   * Spawn a new game
   */
  public async spawnGame(): Promise<{ transaction_hash: string }> {
    const actionsContract = manifest.contracts.find(
      (contract: { tag: string; address: string }) =>
        contract.tag === "di-actions",
    );

    if (!actionsContract) {
      throw new Error("Actions contract not found in manifest");
    }

    return this.executeTransaction({
      contractAddress: actionsContract.address,
      entrypoint: "spawn_game",
      calldata: [],
    });
  }

  /**
   * Pull an orb from the bag
   */
  public async pullOrb(): Promise<{ transaction_hash: string }> {
    const actionsContract = manifest.contracts.find(
      (contract: { tag: string; address: string }) =>
        contract.tag === "di-actions",
    );

    if (!actionsContract) {
      throw new Error("Actions contract not found in manifest");
    }

    return this.executeTransaction({
      contractAddress: actionsContract.address,
      entrypoint: "pull_orb",
      calldata: [],
    });
  }

  /**
   * Gift moon rocks to new players
   */
  public async giftMoonRocks(): Promise<{ transaction_hash: string }> {
    const actionsContract = manifest.contracts.find(
      (contract: { tag: string; address: string }) =>
        contract.tag === "di-actions",
    );

    if (!actionsContract) {
      throw new Error("Actions contract not found in manifest");
    }

    return this.executeTransaction({
      contractAddress: actionsContract.address,
      entrypoint: "gift_moonrocks",
      calldata: [],
    });
  }

  /**
   * Advance to the next level after completing current milestone
   */
  public async advanceToNextLevel(): Promise<{ transaction_hash: string }> {
    const actionsContract = manifest.contracts.find(
      (contract: { tag: string; address: string }) =>
        contract.tag === "di-actions",
    );

    if (!actionsContract) {
      throw new Error("Actions contract not found in manifest");
    }

    return this.executeTransaction({
      contractAddress: actionsContract.address,
      entrypoint: "advance_to_next_level",
      calldata: [],
    });
  }

  /**
   * Quit the current game and cash out points to Moon Rocks
   */
  public async quitGame(): Promise<{ transaction_hash: string }> {
    const actionsContract = manifest.contracts.find(
      (contract: { tag: string; address: string }) =>
        contract.tag === "di-actions",
    );

    if (!actionsContract) {
      throw new Error("Actions contract not found in manifest");
    }

    return this.executeTransaction({
      contractAddress: actionsContract.address,
      entrypoint: "quit_game",
      calldata: [],
    });
  }

  /**
   * Update internal state and notify subscribers
   */
  private updateState(newState: Partial<WalletConnectionState>): void {
    this.state = { ...this.state, ...newState };
    this.connectionCallbacks.forEach((callback) => callback(this.getState()));
  }
}
