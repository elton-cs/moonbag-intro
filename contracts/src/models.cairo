use starknet::ContractAddress;
use core::num::traits::{SaturatingAdd, SaturatingSub};

#[derive(Serde, Copy, Drop, Introspect)]
pub enum Direction {
    // Serialized as 0.
    Left,
    // Serialized as 1.
    Right,
    // Serialized as 2.
    Up,
    // Serialized as 3.
    Down,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Position {
    #[key]
    pub player: ContractAddress,
    pub x: u32,
    pub y: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Moves {
    #[key]
    pub player: ContractAddress,
    pub remaining: u8,
}

// Moon Rocks currency model - separate from game instances
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct MoonRocks {
    #[key]
    pub player: ContractAddress,
    pub amount: u32,
}

// Game model for Moon Bag - represents a single playable game instance
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Game {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub game_id: u32,
    pub health: u8,
    pub points: u32,
    pub multiplier: u32,  // stored as fixed point (100 = 1.0x)
    pub cheddah: u32,
    pub current_level: u8,
    pub is_active: bool,
    pub game_state: GameState,        // Current game state for progression
    pub orb_bag_size: u32,            // Number of orbs currently in bag
    pub orbs_drawn_count: u32,        // Number of orbs drawn this level
}

// Counter model to track next game ID for each player
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameCounter {
    #[key]
    pub player: ContractAddress,
    pub next_game_id: u32,
}

// Track active game per player for single-game restriction
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ActiveGame {
    #[key]
    pub player: ContractAddress,
    pub game_id: u32,  // 0 = no active game
}

// Orb types for Moon Bag game - simple enum for array storage
#[derive(Serde, Copy, Drop, Introspect, PartialEq)]
pub enum OrbType {
    SingleBomb,    // -1 health
    FivePoints,    // +5 points  
    Health,        // +1 health
}

// Game state enum for win/lose logic and level progression
#[derive(Serde, Copy, Drop, Introspect, PartialEq)]
pub enum GameState {
    Active,        // Game in progress
    LevelComplete, // Level completed, awaiting player choice
    GameWon,       // All 7 levels completed
    GameLost,      // Health = 0 or bag empty before milestone
}

// Orb bag slot model - represents individual orb slots in the bag
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct OrbBagSlot {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub game_id: u32,
    #[key]
    pub slot_index: u32,
    pub orb_type: OrbType,
    pub is_active: bool,  // false means slot is empty/orb was drawn
}

// Drawn orb model - tracks orbs that have been drawn from the bag
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct DrawnOrb {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub game_id: u32,
    #[key]
    pub draw_index: u32,
    pub orb_type: OrbType,
}

#[generate_trait]
pub impl PositionImpl of PositionTrait {
    fn apply_direction(ref self: Position, direction: Direction) {
        match direction {
            Direction::Left => { self.x = self.x.saturating_sub(1) },
            Direction::Right => { self.x = self.x.saturating_add(1) },
            Direction::Up => { self.y = self.y.saturating_add(1) },
            Direction::Down => { self.y = self.y.saturating_sub(1) },
        }
    }
}
