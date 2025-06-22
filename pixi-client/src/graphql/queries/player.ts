import { gql } from "@apollo/client";

// Query to get player position and moves
export const GET_PLAYER_STATE = gql`
  query GetPlayerState($player: String!) {
    position: positionModels(where: { player: $player }) {
      edges {
        node {
          id
          player
          x
          y
        }
      }
    }
    moves: movesModels(where: { player: $player }) {
      edges {
        node {
          id
          player
          remaining
        }
      }
    }
  }
`;

// Subscription to watch for entity updates
export const SUBSCRIBE_ENTITY_UPDATES = gql`
  subscription SubscribeEntityUpdates {
    entityUpdated {
      id
      keys
      eventId
      createdAt
      updatedAt
    }
  }
`;

// Query to get all positions
export const GET_ALL_POSITIONS = gql`
  query GetAllPositions {
    positionModels {
      edges {
        node {
          id
          player
          x
          y
        }
      }
    }
  }
`;

// Query to get all moves
export const GET_ALL_MOVES = gql`
  query GetAllMoves {
    movesModels {
      edges {
        node {
          id
          player
          remaining
        }
      }
    }
  }
`;
