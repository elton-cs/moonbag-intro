import { apolloClient } from "../apollo-client";
import {
  GET_GAME_MODELS,
  GET_MOON_ROCKS_MODELS,
  GET_ACTIVE_GAME_MODELS,
  GET_GAME_COUNTER_MODELS,
  GET_ORB_BAG_SLOT_MODELS,
  GET_DRAWN_ORB_MODELS,
  GET_SHOP_INVENTORY_MODELS,
  GET_PURCHASE_HISTORY_MODELS,
  GET_ALL_MOON_BAG_DATA,
  GET_ALL_MOON_BAG_DATA_GLOBAL,
  SUBSCRIBE_MOON_BAG_PLAYER_UPDATES,
  SUBSCRIBE_MOON_ROCKS_UPDATES,
  SUBSCRIBE_GAME_UPDATES,
  SUBSCRIBE_DRAWN_ORB_UPDATES,
} from "../queries/moonbag";
import type {
  MoonBagData,
  GameModel,
  MoonRocksModel,
  ActiveGameModel,
  GameCounterModel,
  OrbBagSlotModel,
  DrawnOrbModel,
  ShopInventoryModel,
  PurchaseHistoryModel,
  GetMoonBagDataResult,
  GameEntity,
  MoonRocksEntity,
  ActiveGameEntity,
  GameCounterEntity,
  DrawnOrbEntity,
} from "../types";

export class GameDataService {
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  // Moon Bag specific methods

  /**
   * Get all Moon Bag data for a specific player
   */
  async getMoonBagData(playerAddress: string): Promise<MoonBagData> {
    try {
      const result = await apolloClient.query({
        query: GET_ALL_MOON_BAG_DATA,
        variables: { player: playerAddress },
        fetchPolicy: "cache-first",
      });

      console.log("🌙 Moon Bag Data (Raw GraphQL):", result.data);

      const parsedData = this.parseMoonBagData(result.data);
      console.log("🌙 Moon Bag Data (Parsed):", parsedData);

      return parsedData;
    } catch (error) {
      console.error("Error fetching Moon Bag data:", error);
      throw error;
    }
  }

  /**
   * Get all Moon Bag data globally (for debugging)
   */
  async getAllMoonBagDataGlobal(): Promise<MoonBagData[]> {
    try {
      const result = await apolloClient.query({
        query: GET_ALL_MOON_BAG_DATA_GLOBAL,
        fetchPolicy: "cache-first",
      });

      console.log("🌍 Global Moon Bag Data (Raw GraphQL):", result.data);

      // Group data by player
      const playerDataMap = new Map<string, MoonBagData>();

      // Process games
      result.data.diGameModels?.edges.forEach((edge: { node: GameEntity }) => {
        const game = edge.node;
        if (!playerDataMap.has(game.player)) {
          playerDataMap.set(game.player, {
            games: [],
            moonRocks: undefined,
            activeGame: undefined,
            gameCounter: undefined,
          });
        }
        playerDataMap.get(game.player)!.games.push(game);
      });

      // Process moon rocks
      result.data.diMoonRocksModels?.edges.forEach(
        (edge: { node: MoonRocksEntity }) => {
          const moonRocks = edge.node;
          if (!playerDataMap.has(moonRocks.player)) {
            playerDataMap.set(moonRocks.player, {
              games: [],
              moonRocks: undefined,
              activeGame: undefined,
              gameCounter: undefined,
            });
          }
          playerDataMap.get(moonRocks.player)!.moonRocks = moonRocks;
        },
      );

      // Process active games
      result.data.diActiveGameModels?.edges.forEach(
        (edge: { node: ActiveGameEntity }) => {
          const activeGame = edge.node;
          if (!playerDataMap.has(activeGame.player)) {
            playerDataMap.set(activeGame.player, {
              games: [],
              moonRocks: undefined,
              activeGame: undefined,
              gameCounter: undefined,
            });
          }
          playerDataMap.get(activeGame.player)!.activeGame = activeGame;
        },
      );

      // Process game counters
      result.data.diGameCounterModels?.edges.forEach(
        (edge: { node: GameCounterEntity }) => {
          const gameCounter = edge.node;
          if (!playerDataMap.has(gameCounter.player)) {
            playerDataMap.set(gameCounter.player, {
              games: [],
              moonRocks: undefined,
              activeGame: undefined,
              gameCounter: undefined,
            });
          }
          playerDataMap.get(gameCounter.player)!.gameCounter = gameCounter;
        },
      );

      const allPlayerData = Array.from(playerDataMap.values());
      console.log("🌍 Global Moon Bag Data (Parsed by Player):", allPlayerData);

      return allPlayerData;
    } catch (error) {
      console.error("Error fetching global Moon Bag data:", error);
      throw error;
    }
  }

  /**
   * Get player's moon rocks
   */
  async getPlayerMoonRocks(
    playerAddress: string,
  ): Promise<MoonRocksModel | undefined> {
    try {
      const result = await apolloClient.query({
        query: GET_MOON_ROCKS_MODELS,
        variables: { player: playerAddress },
        fetchPolicy: "cache-first",
      });

      console.log("💎 Moon Rocks Data (Raw):", result.data);

      const moonRocks = result.data.diMoonRocksModels?.edges[0]?.node;
      console.log("💎 Moon Rocks Data (Parsed):", moonRocks);

      return moonRocks;
    } catch (error) {
      console.error("Error fetching moon rocks:", error);
      throw error;
    }
  }

  /**
   * Get player's active game
   */
  async getPlayerActiveGame(
    playerAddress: string,
  ): Promise<ActiveGameModel | undefined> {
    try {
      const result = await apolloClient.query({
        query: GET_ACTIVE_GAME_MODELS,
        variables: { player: playerAddress },
        fetchPolicy: "cache-first",
      });

      console.log("🎮 Active Game Data (Raw):", result.data);

      const activeGame = result.data.diActiveGameModels?.edges[0]?.node;
      console.log("🎮 Active Game Data (Parsed):", activeGame);

      return activeGame;
    } catch (error) {
      console.error("Error fetching active game:", error);
      throw error;
    }
  }

  /**
   * Get player's game history
   */
  async getPlayerGameHistory(playerAddress: string): Promise<GameModel[]> {
    try {
      const result = await apolloClient.query({
        query: GET_GAME_MODELS,
        variables: { player: playerAddress },
        fetchPolicy: "cache-first",
      });

      console.log("🎯 Game History Data (Raw):", result.data);

      const games =
        result.data.diGameModels?.edges?.map(
          (edge: { node: GameEntity }) => edge.node,
        ) || [];
      console.log("🎯 Game History Data (Parsed):", games);

      return games;
    } catch (error) {
      console.error("Error fetching game history:", error);
      throw error;
    }
  }

  /**
   * Get player's game counter
   */
  async getPlayerGameCounter(
    playerAddress: string,
  ): Promise<GameCounterModel | undefined> {
    try {
      const result = await apolloClient.query({
        query: GET_GAME_COUNTER_MODELS,
        variables: { player: playerAddress },
        fetchPolicy: "cache-first",
      });

      console.log("🔢 Game Counter Data (Raw):", result.data);

      const gameCounter = result.data.diGameCounterModels?.edges[0]?.node;
      console.log("🔢 Game Counter Data (Parsed):", gameCounter);

      return gameCounter;
    } catch (error) {
      console.error("Error fetching game counter:", error);
      throw error;
    }
  }

  /**
   * Get player's orb bag slots
   */
  async getPlayerOrbBagSlots(
    playerAddress: string,
  ): Promise<OrbBagSlotModel[]> {
    try {
      const result = await apolloClient.query({
        query: GET_ORB_BAG_SLOT_MODELS,
        variables: { player: playerAddress },
        fetchPolicy: "cache-first",
      });

      console.log("🎒 Orb Bag Slots Data (Raw):", result.data);

      const orbBagSlots =
        result.data.diOrbBagSlotModels?.edges?.map(
          (edge: { node: OrbBagSlotModel }) => edge.node,
        ) || [];
      console.log("🎒 Orb Bag Slots Data (Parsed):", orbBagSlots);

      return orbBagSlots;
    } catch (error) {
      console.error("Error fetching orb bag slots:", error);
      throw error;
    }
  }

  /**
   * Get player's drawn orbs
   */
  async getPlayerDrawnOrbs(playerAddress: string): Promise<DrawnOrbModel[]> {
    try {
      const result = await apolloClient.query({
        query: GET_DRAWN_ORB_MODELS,
        variables: { player: playerAddress },
        fetchPolicy: "cache-first",
      });

      console.log("🎯 Drawn Orbs Data (Raw):", result.data);

      const drawnOrbs =
        result.data.diDrawnOrbModels?.edges?.map(
          (edge: { node: DrawnOrbModel }) => edge.node,
        ) || [];
      console.log("🎯 Drawn Orbs Data (Parsed):", drawnOrbs);

      return drawnOrbs;
    } catch (error) {
      console.error("Error fetching drawn orbs:", error);
      throw error;
    }
  }

  /**
   * Get player's shop inventory for a specific level
   */
  async getPlayerShopInventory(
    playerAddress: string,
    gameId: number,
    level: number,
  ): Promise<ShopInventoryModel[]> {
    try {
      const result = await apolloClient.query({
        query: GET_SHOP_INVENTORY_MODELS,
        variables: { player: playerAddress, game_id: gameId, level: level },
        fetchPolicy: "cache-first",
      });

      console.log("🛒 Shop Inventory Data (Raw):", result.data);

      const shopInventory =
        result.data.diShopInventoryModels?.edges?.map(
          (edge: { node: ShopInventoryModel }) => edge.node,
        ) || [];
      console.log("🛒 Shop Inventory Data (Parsed):", shopInventory);

      // Enhanced debugging - check slot coverage
      if (shopInventory.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slots = shopInventory.map((item: any) => item.slot_index).sort();
        const expectedSlots = [0, 1, 2, 3, 4, 5];
        const missingSlots = expectedSlots.filter(
          (slot) => !slots.includes(slot),
        );

        console.log(
          `🛒 DEBUG: Found ${shopInventory.length} shop items for level ${level}`,
        );
        console.log(`🛒 DEBUG: Slot indices present: [${slots.join(", ")}]`);
        if (missingSlots.length > 0) {
          console.warn(
            `🛒 WARNING: Missing slots: [${missingSlots.join(", ")}]`,
          );
          console.warn(
            `🛒 WARNING: Expected 6 slots (0-5), but only found ${shopInventory.length}`,
          );
        }

        // Log each item for detailed inspection
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        shopInventory.forEach((item: any, index: number) => {
          console.log(
            `🛒 ITEM ${index}: Slot ${item.slot_index} - ${item.orb_type} (${item.rarity}) - ${item.base_price} cheddah`,
          );
        });
      } else {
        console.error(
          `🛒 ERROR: No shop inventory found for player ${playerAddress}, game ${gameId}, level ${level}`,
        );
      }

      return shopInventory;
    } catch (error) {
      console.error("Error fetching shop inventory:", error);
      throw error;
    }
  }

  /**
   * Get player's purchase history for a specific game
   */
  async getPlayerPurchaseHistory(
    playerAddress: string,
    gameId: number,
  ): Promise<PurchaseHistoryModel[]> {
    try {
      const result = await apolloClient.query({
        query: GET_PURCHASE_HISTORY_MODELS,
        variables: { player: playerAddress, game_id: gameId },
        fetchPolicy: "cache-first",
      });

      console.log("💰 Purchase History Data (Raw):", result.data);

      const purchaseHistory =
        result.data.diPurchaseHistoryModels?.edges?.map(
          (edge: { node: PurchaseHistoryModel }) => edge.node,
        ) || [];
      console.log("💰 Purchase History Data (Parsed):", purchaseHistory);

      return purchaseHistory;
    } catch (error) {
      console.error("Error fetching purchase history:", error);
      throw error;
    }
  }

  /**
   * Get complete shop data for a specific game and level
   * This is a convenience method for the shop screen
   */
  async getShopData(
    playerAddress: string,
    gameId: number,
    level: number,
  ): Promise<{
    shopInventory: ShopInventoryModel[];
    purchaseHistory: PurchaseHistoryModel[];
  }> {
    try {
      console.log(
        `🛒 Fetching shop data for player ${playerAddress}, game ${gameId}, level ${level}`,
      );

      // Fetch both shop inventory and purchase history in parallel
      const [shopInventory, purchaseHistory] = await Promise.all([
        this.getPlayerShopInventory(playerAddress, gameId, level),
        this.getPlayerPurchaseHistory(playerAddress, gameId),
      ]);

      console.log("🛒 Complete shop data:", { shopInventory, purchaseHistory });

      return {
        shopInventory,
        purchaseHistory,
      };
    } catch (error) {
      console.error("Error fetching complete shop data:", error);
      throw error;
    }
  }

  /**
   * Refresh shop data with fresh network fetch
   * Useful after a purchase to get updated inventory and history
   */
  async refetchShopData(
    playerAddress: string,
    gameId: number,
    level: number,
  ): Promise<{
    shopInventory: ShopInventoryModel[];
    purchaseHistory: PurchaseHistoryModel[];
  }> {
    try {
      console.log(
        `🔄 Refetching shop data for player ${playerAddress}, game ${gameId}, level ${level}`,
      );

      // Use network-only fetch policy to get fresh data
      const [shopResult, historyResult] = await Promise.all([
        apolloClient.query({
          query: GET_SHOP_INVENTORY_MODELS,
          variables: { player: playerAddress, game_id: gameId, level: level },
          fetchPolicy: "network-only",
        }),
        apolloClient.query({
          query: GET_PURCHASE_HISTORY_MODELS,
          variables: { player: playerAddress, game_id: gameId },
          fetchPolicy: "network-only",
        }),
      ]);

      const shopInventory =
        shopResult.data.diShopInventoryModels?.edges?.map(
          (edge: { node: ShopInventoryModel }) => edge.node,
        ) || [];

      const purchaseHistory =
        historyResult.data.diPurchaseHistoryModels?.edges?.map(
          (edge: { node: PurchaseHistoryModel }) => edge.node,
        ) || [];

      console.log("🔄 Refetched shop data:", {
        shopInventory,
        purchaseHistory,
      });

      return {
        shopInventory,
        purchaseHistory,
      };
    } catch (error) {
      console.error("Error refetching shop data:", error);
      throw error;
    }
  }

  /**
   * Watch Moon Bag data changes with real-time WebSocket updates
   */
  watchMoonBagData(
    playerAddress: string,
    callback: (data: MoonBagData) => void,
    subscriptionId?: string,
  ): () => void {
    // First, get initial data
    this.getMoonBagData(playerAddress).then(callback).catch(console.error);

    // Set up targeted Moon Bag subscription
    return this.subscribeMoonBagPlayerUpdates(
      playerAddress,
      callback,
      subscriptionId || `moonbag-${playerAddress}`,
    );
  }

  /**
   * Subscribe to Moon Bag player updates using WebSocket
   */
  subscribeMoonBagPlayerUpdates(
    playerAddress: string,
    callback: (data: MoonBagData) => void,
    subscriptionId: string = "default",
  ): () => void {
    try {
      console.log(
        `🔔 Setting up Moon Bag WebSocket subscription for player: ${playerAddress}`,
      );

      const subscription = apolloClient
        .subscribe({
          query: SUBSCRIBE_MOON_BAG_PLAYER_UPDATES,
          variables: { player: playerAddress },
        })
        .subscribe({
          next: (result) => {
            if (result.data) {
              console.log(
                "🔔 REAL-TIME UPDATE - Raw Moon Bag Data:",
                result.data,
              );

              // Parse the subscription data
              const parsedData = this.parseMoonBagData(result.data);
              console.log(
                "🔔 REAL-TIME UPDATE - Parsed Moon Bag Data:",
                parsedData,
              );

              // Log individual data types for detailed tracking
              if (parsedData.moonRocks) {
                console.log(
                  "🔔 REAL-TIME UPDATE - Moon Rocks:",
                  parsedData.moonRocks,
                );
              }
              if (parsedData.activeGame) {
                console.log(
                  "🔔 REAL-TIME UPDATE - Active Game:",
                  parsedData.activeGame,
                );
              }
              if (parsedData.games.length > 0) {
                console.log(
                  "🔔 REAL-TIME UPDATE - Game History:",
                  parsedData.games,
                );
              }
              if (parsedData.gameCounter) {
                console.log(
                  "🔔 REAL-TIME UPDATE - Game Counter:",
                  parsedData.gameCounter,
                );
              }

              callback(parsedData);
            }
          },
          error: (error) => {
            console.error("🔔 Moon Bag subscription error:", error);
          },
        });

      this.subscriptions.set(subscriptionId, subscription);

      // Return unsubscribe function
      return () => {
        console.log(
          `🔕 Unsubscribing from Moon Bag updates: ${subscriptionId}`,
        );
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error("Error setting up Moon Bag subscription:", error);
      throw error;
    }
  }

  /**
   * Subscribe to specific Moon Rocks updates only
   */
  subscribeMoonRocksUpdates(
    playerAddress: string,
    callback: (moonRocks: MoonRocksModel | undefined) => void,
    subscriptionId: string = "moon-rocks",
  ): () => void {
    try {
      console.log(
        `🔔 Setting up Moon Rocks WebSocket subscription for player: ${playerAddress}`,
      );

      const subscription = apolloClient
        .subscribe({
          query: SUBSCRIBE_MOON_ROCKS_UPDATES,
          variables: { player: playerAddress },
        })
        .subscribe({
          next: (result) => {
            if (result.data?.diMoonRocksModels) {
              const moonRocks = result.data.diMoonRocksModels?.edges[0]?.node;
              console.log("🔔 REAL-TIME UPDATE - Moon Rocks Only:", moonRocks);
              callback(moonRocks);
            }
          },
          error: (error) => {
            console.error("🔔 Moon Rocks subscription error:", error);
          },
        });

      this.subscriptions.set(subscriptionId, subscription);

      return () => {
        console.log(
          `🔕 Unsubscribing from Moon Rocks updates: ${subscriptionId}`,
        );
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error("Error setting up Moon Rocks subscription:", error);
      throw error;
    }
  }

  /**
   * Subscribe to game state updates only
   */
  subscribeGameUpdates(
    playerAddress: string,
    callback: (games: GameModel[]) => void,
    subscriptionId: string = "games",
  ): () => void {
    try {
      console.log(
        `🔔 Setting up Game Updates WebSocket subscription for player: ${playerAddress}`,
      );

      const subscription = apolloClient
        .subscribe({
          query: SUBSCRIBE_GAME_UPDATES,
          variables: { player: playerAddress },
        })
        .subscribe({
          next: (result) => {
            if (result.data?.diGameModels) {
              const games =
                result.data.diGameModels?.edges?.map(
                  (edge: { node: GameEntity }) => edge.node,
                ) || [];
              console.log("🔔 REAL-TIME UPDATE - Game History Only:", games);
              callback(games);
            }
          },
          error: (error) => {
            console.error("🔔 Game updates subscription error:", error);
          },
        });

      this.subscriptions.set(subscriptionId, subscription);

      return () => {
        console.log(`🔕 Unsubscribing from Game updates: ${subscriptionId}`);
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error("Error setting up Game subscription:", error);
      throw error;
    }
  }

  /**
   * Refresh Moon Bag data with fresh network fetch
   */
  async refetchMoonBagData(playerAddress: string): Promise<MoonBagData> {
    try {
      // Clear Apollo cache for this player's data to ensure fresh fetch
      await apolloClient.clearStore();

      const result = await apolloClient.query({
        query: GET_ALL_MOON_BAG_DATA,
        variables: { player: playerAddress },
        fetchPolicy: "network-only",
        errorPolicy: "all",
      });

      console.log("🔄 Refetched Moon Bag Data (Raw):", result.data);

      const parsedData = this.parseMoonBagData(result.data);
      console.log("🔄 Refetched Moon Bag Data (Parsed):", parsedData);

      return parsedData;
    } catch (error) {
      console.error("Error refetching Moon Bag data:", error);
      throw error;
    }
  }

  /**
   * Poll for Moon Bag data updates with retry mechanism
   */
  async pollForUpdates(
    playerAddress: string,
    callback: (data: MoonBagData) => void,
    maxAttempts: number = 20, // 10 seconds at 500ms intervals
    intervalMs: number = 500,
  ): Promise<void> {
    console.log(
      `🔄 Starting polling for ${maxAttempts} attempts every ${intervalMs}ms`,
    );

    let attempts = 0;
    let lastDataHash: string | null = null;

    const poll = async (): Promise<void> => {
      attempts++;

      try {
        const freshData = await this.refetchMoonBagData(playerAddress);

        // Create a simple hash of the data to detect changes
        const currentDataHash = JSON.stringify({
          moonRocks: freshData.moonRocks?.amount || 0,
          gameId: freshData.activeGame?.game_id || 0,
          health: freshData.games[0]?.health || 0,
          points: freshData.games[0]?.points || 0,
          cheddah: freshData.games[0]?.cheddah || 0,
          orbCount: freshData.orbBagSlots?.length || 0,
        });

        // If this is the first poll or data has changed, update UI
        if (lastDataHash === null || currentDataHash !== lastDataHash) {
          console.log(`🔄 Data changed on attempt ${attempts}, updating UI`);
          callback(freshData);
          lastDataHash = currentDataHash;

          // Stop polling if we detect meaningful changes
          if (lastDataHash !== null && attempts > 1) {
            console.log("✅ Polling stopped - data changes detected");
            return;
          }
        }

        // Continue polling if we haven't reached max attempts
        if (attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
        } else {
          console.log("⏱️ Polling stopped - max attempts reached");
        }
      } catch (error) {
        console.error(`❌ Polling attempt ${attempts} failed:`, error);

        // Continue polling on error unless we've reached max attempts
        if (attempts < maxAttempts) {
          setTimeout(poll, intervalMs);
        }
      }
    };

    // Start first poll immediately
    poll();
  }

  /**
   * Helper method to parse GraphQL response into MoonBagData format
   */
  private parseMoonBagData(data: GetMoonBagDataResult): MoonBagData {
    const games = data.diGameModels?.edges?.map((edge) => edge.node) || [];
    const moonRocks = data.diMoonRocksModels?.edges[0]?.node;
    const activeGame = data.diActiveGameModels?.edges[0]?.node;
    const gameCounter = data.diGameCounterModels?.edges[0]?.node;
    const orbBagSlots =
      data.diOrbBagSlotModels?.edges?.map((edge) => edge.node) || [];
    const drawnOrbs =
      data.diDrawnOrbModels?.edges?.map((edge) => edge.node) || [];
    const shopInventory =
      data.diShopInventoryModels?.edges?.map((edge) => edge.node) || [];
    const purchaseHistory =
      data.diPurchaseHistoryModels?.edges?.map((edge) => edge.node) || [];

    return {
      games,
      moonRocks,
      activeGame,
      gameCounter,
      orbBagSlots,
      drawnOrbs,
      shopInventory,
      purchaseHistory,
    };
  }

  /**
   * Subscribe to drawn orb updates only
   */
  subscribeDrawnOrbUpdates(
    playerAddress: string,
    callback: (drawnOrbs: DrawnOrbModel[]) => void,
    subscriptionId: string = "drawn-orbs",
  ): () => void {
    try {
      console.log(
        `🔔 Setting up Drawn Orb WebSocket subscription for player: ${playerAddress}`,
      );

      const subscription = apolloClient
        .subscribe({
          query: SUBSCRIBE_DRAWN_ORB_UPDATES,
          variables: { player: playerAddress },
        })
        .subscribe({
          next: (result) => {
            if (result.data?.diDrawnOrbModels) {
              const drawnOrbs =
                result.data.diDrawnOrbModels?.edges?.map(
                  (edge: { node: DrawnOrbEntity }) => edge.node,
                ) || [];
              console.log("🔔 REAL-TIME UPDATE - Drawn Orbs Only:", drawnOrbs);
              callback(drawnOrbs);
            }
          },
          error: (error) => {
            console.error("🔔 Drawn Orb subscription error:", error);
          },
        });

      this.subscriptions.set(subscriptionId, subscription);

      return () => {
        console.log(
          `🔕 Unsubscribing from Drawn Orb updates: ${subscriptionId}`,
        );
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error("Error setting up Drawn Orb subscription:", error);
      throw error;
    }
  }

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}
