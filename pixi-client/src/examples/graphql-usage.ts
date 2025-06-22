// Example usage of the GraphQL client for Dojo game data

import { engine } from "../app/getEngine";
import type { GetPlayerStateResult } from "../graphql";

/**
 * Example function showing how to fetch player data using GraphQL
 */
export async function fetchPlayerData(playerAddress: string): Promise<void> {
  try {
    // Get player state (position and moves)
    const playerState: GetPlayerStateResult =
      await engine().gameData.getPlayerState(playerAddress);

    if (playerState.position) {
      console.log(
        `Player Position: (${playerState.position.x}, ${playerState.position.y})`,
      );
    }

    if (playerState.moves) {
      console.log(`Remaining Moves: ${playerState.moves.remaining}`);
    }
  } catch (error) {
    console.error("Failed to fetch player data:", error);
  }
}

/**
 * Example function showing how to watch for real-time player state changes
 */
export function watchPlayerState(playerAddress: string): () => void {
  console.log(`Starting to watch player state for: ${playerAddress}`);

  // Set up real-time subscription to player state changes
  const unsubscribe = engine().gameData.watchPlayerState(
    playerAddress,
    (state: GetPlayerStateResult) => {
      console.log("Player state updated:", state);

      // Update your UI here based on the new state
      if (state.position) {
        updatePlayerPosition(state.position.x, state.position.y);
      }

      if (state.moves) {
        updateMovesDisplay(state.moves.remaining);
      }
    },
  );

  // Return unsubscribe function so caller can clean up
  return unsubscribe;
}

/**
 * Example function showing how to fetch all player positions
 */
export async function fetchAllPlayers(): Promise<void> {
  try {
    const positions = await engine().gameData.getAllPositions();
    console.log(`Found ${positions.length} players:`);

    positions.forEach((position) => {
      console.log(`Player ${position.player}: (${position.x}, ${position.y})`);
    });
  } catch (error) {
    console.error("Failed to fetch all players:", error);
  }
}

// Mock UI update functions (replace with your actual UI logic)
function updatePlayerPosition(x: number, y: number): void {
  console.log(`UI: Update player position to (${x}, ${y})`);
  // Your PixiJS sprite positioning code here
}

function updateMovesDisplay(moves: number): void {
  console.log(`UI: Update moves display to ${moves}`);
  // Your UI text update code here
}

/**
 * Example integration with PixiJS screen
 * You would call this from your MainScreen or other game screens
 */
export class GameDataExample {
  private unsubscribeCallbacks: (() => void)[] = [];

  async initialize(playerAddress: string): Promise<void> {
    // Fetch initial data
    await fetchPlayerData(playerAddress);

    // Start watching for updates
    const unsubscribe = watchPlayerState(playerAddress);
    this.unsubscribeCallbacks.push(unsubscribe);

    // Fetch all players for multiplayer features
    await fetchAllPlayers();
  }

  cleanup(): void {
    // Clean up all subscriptions when screen is destroyed
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = [];
  }
}
