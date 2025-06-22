import { apolloClient } from "../apollo-client";
import {
  GET_PLAYER_STATE,
  GET_ALL_POSITIONS,
  GET_ALL_MOVES,
  SUBSCRIBE_ENTITY_UPDATES,
} from "../queries/player";
import type {
  GetPlayerStateResult,
  PositionEntity,
  MovesEntity,
  EntityUpdate,
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
