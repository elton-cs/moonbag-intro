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
  temp_multiplier_active: boolean;
  temp_multiplier_value: number;
  bombs_drawn_count: number;
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

export interface DrawnOrbModel {
  player: string;
  game_id: number;
  draw_index: number;
  orb_type: string;
}

export interface ShopInventoryModel {
  player: string;
  game_id: number;
  level: number;
  slot_index: number;
  orb_type: string;
  base_price: number;
  rarity: string;
}

export interface PurchaseHistoryModel {
  player: string;
  game_id: number;
  orb_type: string;
  purchase_count: number;
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

export interface DrawnOrbEntity extends DrawnOrbModel {
  __typename: "DrawnOrbModel";
  id: string;
}

export interface ShopInventoryEntity extends ShopInventoryModel {
  __typename: "ShopInventoryModel";
  id: string;
}

export interface PurchaseHistoryEntity extends PurchaseHistoryModel {
  __typename: "PurchaseHistoryModel";
  id: string;
}

// Combined data result types
export interface MoonBagData {
  games: GameModel[];
  moonRocks?: MoonRocksModel;
  activeGame?: ActiveGameModel;
  gameCounter?: GameCounterModel;
  orbBagSlots?: OrbBagSlotModel[];
  drawnOrbs?: DrawnOrbModel[];
  shopInventory?: ShopInventoryModel[];
  purchaseHistory?: PurchaseHistoryModel[];
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
  diDrawnOrbModels?: {
    edges: Array<{ node: DrawnOrbEntity }>;
  };
  diShopInventoryModels?: {
    edges: Array<{ node: ShopInventoryEntity }>;
  };
  diPurchaseHistoryModels?: {
    edges: Array<{ node: PurchaseHistoryEntity }>;
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

export interface GetDrawnOrbModelsResult {
  diDrawnOrbModels?: {
    edges: Array<{ node: DrawnOrbEntity }>;
  };
}

export interface GetShopInventoryModelsResult {
  diShopInventoryModels?: {
    edges: Array<{ node: ShopInventoryEntity }>;
  };
}

export interface GetPurchaseHistoryModelsResult {
  diPurchaseHistoryModels?: {
    edges: Array<{ node: PurchaseHistoryEntity }>;
  };
}
