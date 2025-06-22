// TypeScript types for Dojo Moon Bag models and GraphQL responses

export interface SubscriptionData<T> {
  data: T;
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

export interface OrbBagSlotModel {
  player: string;
  game_id: number;
  slot_index: number;
  orb_type: string;
  is_active: boolean;
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

export interface OrbBagSlotEntity extends OrbBagSlotModel {
  __typename: "OrbBagSlotModel";
  id: string;
}

// Combined data result types
export interface MoonBagData {
  games: GameModel[];
  moonRocks?: MoonRocksModel;
  activeGame?: ActiveGameModel;
  gameCounter?: GameCounterModel;
  orbBagSlots?: OrbBagSlotModel[];
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
  diOrbBagSlotModels?: {
    edges: Array<{ node: OrbBagSlotEntity }>;
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

export interface GetOrbBagSlotModelsResult {
  diOrbBagSlotModels?: {
    edges: Array<{ node: OrbBagSlotEntity }>;
  };
}
