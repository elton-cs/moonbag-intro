import { gql } from "@apollo/client";

// Note: These are not actual GraphQL mutations since Dojo actions
// are executed through contract calls, not GraphQL mutations.
// These are placeholder structures for potential future use.

// Mutation to spawn a player (would be handled by contract call)
export const SPAWN_PLAYER = gql`
  mutation SpawnPlayer($player: String!) {
    # This would be handled by contract interaction
    # Placeholder for potential future GraphQL mutation support
    spawn(player: $player) {
      success
      transactionHash
    }
  }
`;

// Mutation to move a player (would be handled by contract call)
export const MOVE_PLAYER = gql`
  mutation MovePlayer($player: String!, $direction: Direction!) {
    # This would be handled by contract interaction
    # Placeholder for potential future GraphQL mutation support
    move(player: $player, direction: $direction) {
      success
      transactionHash
    }
  }
`;

// Mutation for random move (would be handled by contract call)
export const MOVE_RANDOM = gql`
  mutation MoveRandom($player: String!) {
    # This would be handled by contract interaction
    # Placeholder for potential future GraphQL mutation support
    moveRandom(player: $player) {
      success
      transactionHash
    }
  }
`;
