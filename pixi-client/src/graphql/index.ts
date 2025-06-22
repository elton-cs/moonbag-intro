// Main GraphQL exports for easy importing
export { apolloClient, setupGlobalClient } from "./apollo-client";
export { GameDataService } from "./services/GameDataService";

// Export types
export type {
  Position,
  Moves,
  Direction,
  PositionEntity,
  MovesEntity,
  GetPlayerStateResult,
  SubscriptionData,
  EntityUpdate,
} from "./types";

// Export queries and mutations
export {
  GET_PLAYER_STATE,
  SUBSCRIBE_ENTITY_UPDATES,
  GET_ALL_POSITIONS,
  GET_ALL_MOVES,
} from "./queries/player";

export { SPAWN_PLAYER, MOVE_PLAYER, MOVE_RANDOM } from "./mutations/actions";
