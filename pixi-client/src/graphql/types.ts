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
