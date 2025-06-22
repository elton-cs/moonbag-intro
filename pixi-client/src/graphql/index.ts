// Main GraphQL exports for easy importing
export { apolloClient, setupGlobalClient } from "./apollo-client";
export { GameDataService } from "./services/GameDataService";

// Export Moon Bag types
export type {
  SubscriptionData,
  GameModel,
  MoonRocksModel,
  ActiveGameModel,
  GameCounterModel,
  OrbBagSlotModel,
  MoonBagData,
  GetMoonBagDataResult,
  GetGameModelsResult,
  GetMoonRocksModelsResult,
  GetActiveGameModelsResult,
  GetGameCounterModelsResult,
  GetOrbBagSlotModelsResult,
} from "./types";

// Export Moon Bag queries
export {
  GET_GAME_MODELS,
  GET_MOON_ROCKS_MODELS,
  GET_ACTIVE_GAME_MODELS,
  GET_GAME_COUNTER_MODELS,
  GET_ORB_BAG_SLOT_MODELS,
  GET_ALL_MOON_BAG_DATA,
  GET_ALL_MOON_BAG_DATA_GLOBAL,
  SUBSCRIBE_MOON_BAG_PLAYER_UPDATES,
  SUBSCRIBE_MOON_ROCKS_UPDATES,
  SUBSCRIBE_GAME_UPDATES,
  SUBSCRIBE_ORB_BAG_UPDATES,
  SUBSCRIBE_ACTIVE_GAME_UPDATES,
} from "./queries/moonbag";
