// TypeScript types for Dojo models and GraphQL responses

export interface Position {
  player: string;
  x: number;
  y: number;
}

export interface Moves {
  player: string;
  remaining: number;
}

export enum Direction {
  Left = 0,
  Right = 1,
  Up = 2,
  Down = 3,
}

// GraphQL response types
export interface PositionEntity {
  __typename: "Position";
  id: string;
  player: string;
  x: number;
  y: number;
}

export interface MovesEntity {
  __typename: "Moves";
  id: string;
  player: string;
  remaining: number;
}

// Query result types
export interface GetPlayerStateResult {
  position?: PositionEntity;
  moves?: MovesEntity;
}

export interface SubscriptionData<T> {
  data: T;
}

// Subscription types
export interface EntityUpdate {
  id: string;
  keys: string[];
  data: Record<string, unknown>;
}

// Moon Bag Model Types
export interface GameModel {
  player: string;
  game_id: number;
  health: number;
  points: number;
  multiplier: number;
  cheddah: number;
  current_level: number;
  is_active: boolean;
  game_state: string;
}

export interface MoonRocksModel {
  player: string;
  amount: number;
}

export interface ActiveGameModel {
  player: string;
  game_id: number;
}

export interface GameCounterModel {
  player: string;
  next_game_id: number;
}

// GraphQL Entity Types (with __typename and id)
export interface GameEntity extends GameModel {
  __typename: "GameModel";
  id: string;
}

export interface MoonRocksEntity extends MoonRocksModel {
  __typename: "MoonRocksModel";
  id: string;
}

export interface ActiveGameEntity extends ActiveGameModel {
  __typename: "ActiveGameModel";
  id: string;
}

export interface GameCounterEntity extends GameCounterModel {
  __typename: "GameCounterModel";
  id: string;
}

// Combined data result types
export interface MoonBagData {
  games: GameModel[];
  moonRocks?: MoonRocksModel;
  activeGame?: ActiveGameModel;
  gameCounter?: GameCounterModel;
}

export interface GetMoonBagDataResult {
  diGameModels?: {
    edges: Array<{ node: GameEntity }>;
  };
  diMoonRocksModels?: {
    edges: Array<{ node: MoonRocksEntity }>;
  };
  diActiveGameModels?: {
    edges: Array<{ node: ActiveGameEntity }>;
  };
  diGameCounterModels?: {
    edges: Array<{ node: GameCounterEntity }>;
  };
}

// Individual query result types
export interface GetGameModelsResult {
  diGameModels?: {
    edges: Array<{ node: GameEntity }>;
  };
}

export interface GetMoonRocksModelsResult {
  diMoonRocksModels?: {
    edges: Array<{ node: MoonRocksEntity }>;
  };
}

export interface GetActiveGameModelsResult {
  diActiveGameModels?: {
    edges: Array<{ node: ActiveGameEntity }>;
  };
}

export interface GetGameCounterModelsResult {
  diGameCounterModels?: {
    edges: Array<{ node: GameCounterEntity }>;
  };
}
