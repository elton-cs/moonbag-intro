import { apolloClient } from "../apollo-client";
import {
  GET_PLAYER_STATE,
  GET_ALL_POSITIONS,
  GET_ALL_MOVES,
  SUBSCRIBE_ENTITY_UPDATES,
} from "../queries/player";
import {
  GET_GAME_MODELS,
  GET_MOON_ROCKS_MODELS,
  GET_ACTIVE_GAME_MODELS,
  GET_GAME_COUNTER_MODELS,
  GET_ALL_MOON_BAG_DATA,
  GET_ALL_MOON_BAG_DATA_GLOBAL,
  SUBSCRIBE_MOON_BAG_UPDATES,
} from "../queries/moonbag";
import type {
  GetPlayerStateResult,
  PositionEntity,
  MovesEntity,
  EntityUpdate,
  MoonBagData,
  GameModel,
  MoonRocksModel,
  ActiveGameModel,
  GameCounterModel,
  GetMoonBagDataResult,
  GetGameModelsResult,
  GetMoonRocksModelsResult,
  GetActiveGameModelsResult,
  GetGameCounterModelsResult,
} from "../types";

export class GameDataService {
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();

  /**
   * Get player state (position and moves) by player address
   */
  async getPlayerState(playerAddress: string): Promise<GetPlayerStateResult> {
    try {
      const result = await apolloClient.query({
        query: GET_PLAYER_STATE,
        variables: { player: playerAddress },
        fetchPolicy: "cache-first",
      });

      const position = result.data.position?.edges[0]?.node;
      const moves = result.data.moves?.edges[0]?.node;

      return {
        position,
        moves,
      };
    } catch (error) {
      console.error("Error fetching player state:", error);
      throw error;
    }
  }

  /**
   * Get all player positions
   */
  async getAllPositions(): Promise<PositionEntity[]> {
    try {
      const result = await apolloClient.query({
        query: GET_ALL_POSITIONS,
        fetchPolicy: "cache-first",
      });

      return (
        result.data.positionModels?.edges?.map(
          (edge: { node: PositionEntity }) => edge.node,
        ) || []
      );
    } catch (error) {
      console.error("Error fetching all positions:", error);
      throw error;
    }
  }

  /**
   * Get all player moves
   */
  async getAllMoves(): Promise<MovesEntity[]> {
    try {
      const result = await apolloClient.query({
        query: GET_ALL_MOVES,
        fetchPolicy: "cache-first",
      });

      return (
        result.data.movesModels?.edges?.map(
          (edge: { node: MovesEntity }) => edge.node,
        ) || []
      );
    } catch (error) {
      console.error("Error fetching all moves:", error);
      throw error;
    }
  }

  /**
   * Subscribe to entity updates for real-time data
   */
  subscribeToEntityUpdates(
    callback: (update: EntityUpdate) => void,
    subscriptionId: string = "default",
  ): () => void {
    try {
      const subscription = apolloClient
        .subscribe({
          query: SUBSCRIBE_ENTITY_UPDATES,
        })
        .subscribe({
          next: (result) => {
            if (result.data?.entityUpdated) {
              callback(result.data.entityUpdated);
            }
          },
          error: (error) => {
            console.error("Subscription error:", error);
          },
        });

      this.subscriptions.set(subscriptionId, subscription);

      // Return unsubscribe function
      return () => {
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionId);
      };
    } catch (error) {
      console.error("Error setting up subscription:", error);
      throw error;
    }
  }

  /**
   * Watch player state changes with real-time updates
   */
  watchPlayerState(
    playerAddress: string,
    callback: (state: GetPlayerStateResult) => void,
    subscriptionId?: string,
  ): () => void {
    // First, get initial data
    this.getPlayerState(playerAddress).then(callback).catch(console.error);

    // Then subscribe to updates
    return this.subscribeToEntityUpdates(
      async () => {
        // Re-fetch player state when entities are updated
        // This is a simple approach - could be optimized to parse the update directly
        try {
          const newState = await this.getPlayerState(playerAddress);
          callback(newState);
        } catch (error) {
          console.error("Error updating player state:", error);
        }
      },
      subscriptionId || `player-${playerAddress}`,
    );
  }

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
      result.data.diGameModels?.edges.forEach((edge: any) => {
        const game = edge.node;
        if (!playerDataMap.has(game.player)) {
          playerDataMap.set(game.player, { games: [], moonRocks: undefined, activeGame: undefined, gameCounter: undefined });
        }
        playerDataMap.get(game.player)!.games.push(game);
      });

      // Process moon rocks
      result.data.diMoonRocksModels?.edges.forEach((edge: any) => {
        const moonRocks = edge.node;
        if (!playerDataMap.has(moonRocks.player)) {
          playerDataMap.set(moonRocks.player, { games: [], moonRocks: undefined, activeGame: undefined, gameCounter: undefined });
        }
        playerDataMap.get(moonRocks.player)!.moonRocks = moonRocks;
      });

      // Process active games
      result.data.diActiveGameModels?.edges.forEach((edge: any) => {
        const activeGame = edge.node;
        if (!playerDataMap.has(activeGame.player)) {
          playerDataMap.set(activeGame.player, { games: [], moonRocks: undefined, activeGame: undefined, gameCounter: undefined });
        }
        playerDataMap.get(activeGame.player)!.activeGame = activeGame;
      });

      // Process game counters
      result.data.diGameCounterModels?.edges.forEach((edge: any) => {
        const gameCounter = edge.node;
        if (!playerDataMap.has(gameCounter.player)) {
          playerDataMap.set(gameCounter.player, { games: [], moonRocks: undefined, activeGame: undefined, gameCounter: undefined });
        }
        playerDataMap.get(gameCounter.player)!.gameCounter = gameCounter;
      });

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
  async getPlayerMoonRocks(playerAddress: string): Promise<MoonRocksModel | undefined> {
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
  async getPlayerActiveGame(playerAddress: string): Promise<ActiveGameModel | undefined> {
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

      const games = result.data.diGameModels?.edges?.map((edge: any) => edge.node) || [];
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
  async getPlayerGameCounter(playerAddress: string): Promise<GameCounterModel | undefined> {
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
   * Watch Moon Bag data changes with real-time updates
   */
  watchMoonBagData(
    playerAddress: string,
    callback: (data: MoonBagData) => void,
    subscriptionId?: string,
  ): () => void {
    // First, get initial data
    this.getMoonBagData(playerAddress).then(callback).catch(console.error);

    // Then subscribe to updates
    return this.subscribeToEntityUpdates(
      async () => {
        try {
          const newData = await this.getMoonBagData(playerAddress);
          callback(newData);
        } catch (error) {
          console.error("Error updating Moon Bag data:", error);
        }
      },
      subscriptionId || `moonbag-${playerAddress}`,
    );
  }

  /**
   * Refresh Moon Bag data with fresh network fetch
   */
  async refetchMoonBagData(playerAddress: string): Promise<MoonBagData> {
    try {
      const result = await apolloClient.query({
        query: GET_ALL_MOON_BAG_DATA,
        variables: { player: playerAddress },
        fetchPolicy: "network-only",
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
   * Helper method to parse GraphQL response into MoonBagData format
   */
  private parseMoonBagData(data: GetMoonBagDataResult): MoonBagData {
    const games = data.diGameModels?.edges?.map((edge) => edge.node) || [];
    const moonRocks = data.diMoonRocksModels?.edges[0]?.node;
    const activeGame = data.diActiveGameModels?.edges[0]?.node;
    const gameCounter = data.diGameCounterModels?.edges[0]?.node;

    return {
      games,
      moonRocks,
      activeGame,
      gameCounter,
    };
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

  /**
   * Refresh cache for a specific query
   */
  async refetchPlayerState(
    playerAddress: string,
  ): Promise<GetPlayerStateResult> {
    try {
      const result = await apolloClient.query({
        query: GET_PLAYER_STATE,
        variables: { player: playerAddress },
        fetchPolicy: "network-only",
      });

      const position = result.data.position?.edges[0]?.node;
      const moves = result.data.moves?.edges[0]?.node;

      return {
        position,
        moves,
      };
    } catch (error) {
      console.error("Error refetching player state:", error);
      throw error;
    }
  }
}
