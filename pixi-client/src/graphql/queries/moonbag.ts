import { gql } from "@apollo/client";

// Individual query constants for each Moon Bag data type
export const GET_GAME_MODELS = gql`
  query GetGameModels($player: String) {
    diGameModels(where: { player: $player }) {
      edges {
        node {
          player
          game_id
          health
          points
          multiplier
          cheddah
          current_level
          is_active
          game_state
        }
      }
    }
  }
`;

export const GET_MOON_ROCKS_MODELS = gql`
  query GetMoonRocksModels($player: String) {
    diMoonRocksModels(where: { player: $player }) {
      edges {
        node {
          player
          amount
        }
      }
    }
  }
`;

export const GET_ACTIVE_GAME_MODELS = gql`
  query GetActiveGameModels($player: String) {
    diActiveGameModels(where: { player: $player }) {
      edges {
        node {
          player
          game_id
        }
      }
    }
  }
`;

export const GET_GAME_COUNTER_MODELS = gql`
  query GetGameCounterModels($player: String) {
    diGameCounterModels(where: { player: $player }) {
      edges {
        node {
          player
          next_game_id
        }
      }
    }
  }
`;

// Combined query for fetching all Moon Bag data in one request
export const GET_ALL_MOON_BAG_DATA = gql`
  query GetAllMoonBagData($player: String) {
    diGameModels(where: { player: $player }) {
      edges {
        node {
          player
          game_id
          health
          points
          multiplier
          cheddah
          current_level
          is_active
          game_state
        }
      }
    }
    diMoonRocksModels(where: { player: $player }) {
      edges {
        node {
          player
          amount
        }
      }
    }
    diActiveGameModels(where: { player: $player }) {
      edges {
        node {
          player
          game_id
        }
      }
    }
    diGameCounterModels(where: { player: $player }) {
      edges {
        node {
          player
          next_game_id
        }
      }
    }
  }
`;

// Query for getting all data without player filter (for debugging/admin)
export const GET_ALL_MOON_BAG_DATA_GLOBAL = gql`
  query GetAllMoonBagDataGlobal {
    diGameModels {
      edges {
        node {
          player
          game_id
          health
          points
          multiplier
          cheddah
          current_level
          is_active
          game_state
        }
      }
    }
    diMoonRocksModels {
      edges {
        node {
          player
          amount
        }
      }
    }
    diActiveGameModels {
      edges {
        node {
          player
          game_id
        }
      }
    }
    diGameCounterModels {
      edges {
        node {
          player
          next_game_id
        }
      }
    }
  }
`;

// Subscription for real-time Moon Bag data updates
export const SUBSCRIBE_MOON_BAG_UPDATES = gql`
  subscription SubscribeMoonBagUpdates {
    entityUpdated {
      id
      keys
      eventId
      createdAt
      updatedAt
    }
  }
`;