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

// Query for orb bag slot data
export const GET_ORB_BAG_SLOT_MODELS = gql`
  query GetOrbBagSlotModels($player: String) {
    diOrbBagSlotModels(where: { player: $player }) {
      edges {
        node {
          player
          game_id
          slot_index
          orb_type
          is_active
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
          orb_bag_size
          orbs_drawn_count
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
    diOrbBagSlotModels(where: { player: $player }) {
      edges {
        node {
          player
          game_id
          slot_index
          orb_type
          is_active
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
          orb_bag_size
          orbs_drawn_count
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
    diOrbBagSlotModels {
      edges {
        node {
          player
          game_id
          slot_index
          orb_type
          is_active
        }
      }
    }
  }
`;

// Real-time subscription for all Moon Bag data changes for a specific player
export const SUBSCRIBE_MOON_BAG_PLAYER_UPDATES = gql`
  subscription SubscribeMoonBagPlayerUpdates($player: String!) {
    diMoonRocksModels(where: { player: $player }) {
      edges {
        node {
          player
          amount
        }
      }
    }
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
          orb_bag_size
          orbs_drawn_count
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
    diOrbBagSlotModels(where: { player: $player }) {
      edges {
        node {
          player
          game_id
          slot_index
          orb_type
          is_active
        }
      }
    }
  }
`;

// Individual subscriptions for specific data types (if needed for targeted listening)
export const SUBSCRIBE_MOON_ROCKS_UPDATES = gql`
  subscription SubscribeMoonRocksUpdates($player: String!) {
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

export const SUBSCRIBE_GAME_UPDATES = gql`
  subscription SubscribeGameUpdates($player: String!) {
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
          orb_bag_size
          orbs_drawn_count
        }
      }
    }
  }
`;

export const SUBSCRIBE_ORB_BAG_UPDATES = gql`
  subscription SubscribeOrbBagUpdates($player: String!) {
    diOrbBagSlotModels(where: { player: $player }) {
      edges {
        node {
          player
          game_id
          slot_index
          orb_type
          is_active
        }
      }
    }
  }
`;

export const SUBSCRIBE_ACTIVE_GAME_UPDATES = gql`
  subscription SubscribeActiveGameUpdates($player: String!) {
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

// Legacy subscription (keeping for compatibility)
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