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
#[derive(Drop, Serde)]
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
    pub orb_bag: Array<OrbType>,      // All orbs currently in bag
    pub orbs_drawn: Array<OrbType>,   // Track drawn orbs for bomb counter
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
